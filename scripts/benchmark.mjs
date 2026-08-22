import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { loadApp, sampleReport } from "../test/test-helpers.mjs";

const scenarios = [
  { projects: 1, issues: 100, components: 200 },
  { projects: 10, issues: 1000, components: 10000 },
  { projects: 25, issues: 10000, components: 25000 },
  { projects: 50, issues: 25000, components: 50000 }
];
const generatedAt = "2026-08-22T00:00:00Z";
const app = await loadApp();

function issue(index, projectKey) {
  const lifecycle = index % 4;
  return {
    key: `${projectKey}-I-${index}`,
    rule: `ts:S${index % 25}`,
    status: lifecycle === 0 ? "OPEN" : lifecycle === 1 ? "ACCEPTED" : lifecycle === 2 ? "FIXED" : "FUTURE_STATE",
    lifecycleStatus: lifecycle === 0 ? "actionable" : lifecycle === 1 ? "accepted" : lifecycle === 2 ? "closed" : "unknown",
    message: `Synthetic issue ${index}`,
    component: `${projectKey}:src/file-${index % 200}.ts`,
    line: String(index % 500),
    impacts: [`${index % 3 === 0 ? "SECURITY" : index % 3 === 1 ? "RELIABILITY" : "MAINTAINABILITY"}:${index % 5 === 0 ? "HIGH" : "MEDIUM"}`],
    severity: index % 5 === 0 ? "CRITICAL" : "MAJOR",
    effort: `${(index % 60) + 1}min`,
    creationDate: "2026-07-01T00:00:00Z",
    updateDate: generatedAt,
    tags: ["synthetic"]
  };
}

function component(index, projectKey) {
  return {
    key: `${projectKey}:src/file-${index}.ts`,
    name: `file-${index}.ts`,
    path: `src/file-${index}.ts`,
    qualifier: "FIL",
    language: "ts",
    measures: [
      { metric: "ncloc", value: String(80 + index % 400) },
      { metric: "coverage", value: String(60 + index % 40) },
      { metric: "uncovered_lines", value: String(index % 20) },
      { metric: "duplicated_lines_density", value: String(index % 12) },
      { metric: "complexity", value: String(4 + index % 30) },
      { metric: "cognitive_complexity", value: String(3 + index % 24) }
    ]
  };
}

function sampleMemory() {
  const memory = process.memoryUsage();
  return { heapMiB: memory.heapUsed / 1048576, rssMiB: memory.rss / 1048576 };
}

for (const scenario of scenarios) {
  if (global.gc) global.gc();
  const before = sampleMemory();
  const attempts = [];
  const requested = [];
  const baseCount = Math.floor(scenario.issues / scenario.projects);
  let remainder = scenario.issues % scenario.projects;
  const baseComponents = Math.floor(scenario.components / scenario.projects);
  let componentRemainder = scenario.components % scenario.projects;
  const modelStarted = performance.now();
  for (let projectIndex = 0; projectIndex < scenario.projects; projectIndex += 1) {
    const key = `benchmark-${projectIndex + 1}`;
    const count = baseCount + (remainder > 0 ? 1 : 0);
    remainder -= remainder > 0 ? 1 : 0;
    const componentCount = baseComponents + (componentRemainder > 0 ? 1 : 0);
    componentRemainder -= componentRemainder > 0 ? 1 : 0;
    const project = { key, name: `Benchmark Project ${projectIndex + 1}`, qualifier: "TRK", version: "1", analysisDate: "2026-08-21T00:00:00Z" };
    const issues = Array.from({ length: count }, (_, index) => issue(index, key));
    const components = Array.from({ length: componentCount }, (_, index) => component(index, key));
    const report = app.deriveProjectAnalytics(sampleReport({
      generatedAt, project, issues, components,
      issuePaging: { expected: count, exported: count, uniqueFetched: count, duplicatesRemoved: 0, limit: 10000 },
      componentPaging: { expected: componentCount, exported: componentCount, uniqueFetched: componentCount, duplicatesRemoved: 0, limit: 10000 },
      measures: [
        { metric: "lines_to_cover", value: "1000" }, { metric: "uncovered_lines", value: "150" },
        { metric: "conditions_to_cover", value: "200" }, { metric: "uncovered_conditions", value: "40" },
        { metric: "duplicated_lines", value: "30" }, { metric: "ncloc", value: "1500" },
        { metric: "sqale_index", value: "480" }
      ]
    }));
    requested.push(project);
    attempts.push({ project, state: "complete", report });
  }
  const report = app.buildPortfolioReport(attempts, requested, { rankProjects: true, concurrency: 3 }, generatedAt, generatedAt);
  const modelMs = performance.now() - modelStarted;
  let sampledPeak = sampleMemory();
  const exportStarted = performance.now();
  const html = app.buildHtmlReport(report, app.BUILTIN_TEMPLATES[4]);
  sampledPeak = [sampledPeak, sampleMemory()].sort((a, b) => b.heapMiB - a.heapMiB)[0];
  let xlsx = null;
  let xlsxRefusal = null;
  try {
    xlsx = app.buildXlsx(report);
  } catch (error) {
    if (!/safety limit/i.test(error && error.message || "")) throw error;
    xlsxRefusal = error.message;
  }
  sampledPeak = [sampledPeak, sampleMemory()].sort((a, b) => b.heapMiB - a.heapMiB)[0];
  const csv = app.toCsv(app.issueRows(report));
  const json = JSON.stringify({ manifest: app.reportManifest(report), report });
  const exportMs = performance.now() - exportStarted;
  const after = sampleMemory();
  assert.equal(report.projects.length, scenario.projects, "Portfolio project count must reconcile");
  assert.equal(report.aggregateIssueSummary.totalCollected, scenario.issues, "Portfolio issue count must reconcile");
  assert.ok(Buffer.byteLength(html) > 0, "HTML export must not be empty");
  assert.ok(Buffer.byteLength(csv) > 0, "CSV export must not be empty");
  assert.ok(Buffer.byteLength(json) > 0, "JSON export must not be empty");
  if (scenario.projects === 50) {
    assert.equal(xlsx, null, "The maximum XLSX scenario must refuse before construction");
    assert.match(xlsxRefusal || "", /75 MiB safety limit/, "The maximum XLSX refusal must identify the fixed package budget");
  } else {
    assert.ok(xlsx && xlsx.blob.size > 0, "XLSX must complete below the fixed package budget");
    assert.equal(xlsxRefusal, null, "A below-budget XLSX scenario must not be refused");
  }
  console.log(JSON.stringify({
    scenario: `${scenario.projects} project(s) / ${scenario.issues} issues / ${scenario.components} components`,
    modelMs: Number(modelMs.toFixed(1)),
    exportMs: Number(exportMs.toFixed(1)),
    sampledHeapMiB: Number(sampledPeak.heapMiB.toFixed(1)),
    rssAfterMiB: Number(after.rssMiB.toFixed(1)),
    heapDeltaMiB: Number((after.heapMiB - before.heapMiB).toFixed(1)),
    htmlBytes: Buffer.byteLength(html),
    xlsxBytes: xlsx ? xlsx.blob.size : null,
    xlsxRefusal,
    csvBytes: Buffer.byteLength(csv),
    jsonBytes: Buffer.byteLength(json),
    apiCalls: 0,
    retries: 0,
    assertions: "passed",
    note: "Synthetic model/export benchmark; no SonarQube server collection"
  }));
}
