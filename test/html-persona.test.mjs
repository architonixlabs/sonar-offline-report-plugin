import assert from "node:assert/strict";
import vm from "node:vm";
import test from "node:test";
import { loadApp, sampleReport } from "./test-helpers.mjs";

function portfolioFixture(app) {
  const make = (key, name, gate, issues, measures = []) => app.deriveProjectAnalytics(sampleReport({
    reportId: `source-${key}`,
    generatedAt: "2026-08-22T12:00:00Z",
    project: { key, name, qualifier: "TRK", version: "1", analysisDate: "2026-08-01T00:00:00Z" },
    qualityGate: { status: gate, conditions: [] },
    issues,
    issuePaging: { expected: issues.length, exported: issues.length, uniqueFetched: issues.length, duplicatesRemoved: 0, limit: 10000 },
    measures: [{ metric: "ncloc", value: "100" }, { metric: "sqale_index", value: "30" }, ...measures]
  }));
  const alpha = make("alpha", "Alpha Service", "OK", [
    { key: "A-1", status: "OPEN", lifecycleStatus: "actionable", rule: "ts:S1", message: "Fix alpha security boundary", component: "alpha:a.ts", impacts: ["SECURITY:HIGH"], severity: "CRITICAL", type: "VULNERABILITY", effort: "1h", creationDate: "2026-08-01T00:00:00Z" },
    { key: "A-2", status: "ACCEPTED", lifecycleStatus: "accepted", rule: "ts:S2", message: "Accepted alpha risk", component: "alpha:b.ts", impacts: ["MAINTAINABILITY:LOW"], severity: "MINOR", type: "CODE_SMELL", effort: "5min", creationDate: "2026-08-02T00:00:00Z" }
  ], [
    { metric: "security_rating", value: "3" },
    { metric: "reliability_rating", value: "2" },
    { metric: "security_hotspots", value: "4" },
    { metric: "security_hotspots_reviewed", value: "25" },
    { metric: "vulnerabilities", value: "2" },
    { metric: "coverage", value: "0" }
  ]);
  const beta = make("beta", "Beta Web", "OK", [
    { key: "B-1", status: "FIXED", lifecycleStatus: "closed", rule: "js:S1", message: "Closed beta issue", component: "beta:b.js", impacts: ["RELIABILITY:MEDIUM"], severity: "MAJOR", type: "BUG", effort: "10min", creationDate: "2026-07-01T00:00:00Z" },
    { key: "B-2", status: "FUTURE", lifecycleStatus: "unknown", rule: "js:S2", message: "Unknown beta lifecycle", component: "beta:c.js", effort: "", creationDate: "" }
  ]);
  return app.buildPortfolioReport(
    [{ project: alpha.project, state: "complete", report: alpha }, { project: beta.project, state: "complete", report: beta }],
    [alpha.project, beta.project],
    {
      rankProjects: true,
      includeIssues: true,
      includeComponents: true,
      includeAnalyses: true,
      includeTrends: false,
      includePeople: false
    },
    "2026-08-22T11:00:00Z",
    "2026-08-22T12:00:00Z"
  );
}

test("single HTML exposes an evidence dossier and complete browser-print issue scope", async () => {
  const app = await loadApp();
  const report = sampleReport({
    collectionComplete: true,
    artifactComplete: false,
    artifact: { artifactComplete: false, warnings: ["Required dataset unavailable"] },
    generatedAt: "2026-08-22T12:34:56Z",
    measures: [
      { metric: "coverage", value: "0" },
      { metric: "security_hotspots", value: "7" },
      { metric: "security_hotspots_reviewed", value: "0" },
      { metric: "tests", value: "21" },
      { metric: "test_failures", value: "2" },
      { metric: "test_execution_time", value: "1250" },
      { metric: "test_success_density", value: "90.48" }
    ],
    components: [{ key: "sample:a.ts", name: "a.ts", path: "src/a.ts", measures: [{ metric: "coverage", value: "12.5" }, { metric: "uncovered_lines", value: "14" }, { metric: "lines_to_cover", value: "16" }] }],
    issues: [
      { key: "A", status: "OPEN", lifecycleStatus: "actionable", message: "Act", rule: "ts:S1", component: "sample:a.ts", impacts: ["SECURITY:HIGH"] },
      { key: "B", status: "FIXED", lifecycleStatus: "closed", message: "Done", rule: "ts:S2", component: "sample:b.ts", impacts: ["MAINTAINABILITY:LOW"] }
    ],
    issuePaging: { expected: 2, exported: 2, uniqueFetched: 2, limit: 10000 }
  });
  const template = { ...app.BUILTIN_TEMPLATES[1], persona: "CISO and engineering", requiredDatasets: { issues: true, components: true } };
  const summary = app.buildHtmlReport(report, template, { purpose: "print", mode: "summary", issueScope: "all" });
  const register = app.buildHtmlReport(report, template, { purpose: "print", mode: "register", issueScope: "all" });

  assert.match(summary, /0 exported \/ 2 collected/);
  assert.match(register, /2 exported \/ 2 collected/);
  assert.match(summary, /Profile audience<\/dt><dd>CISO and engineering/);
  assert.match(summary, /Artifact completeness<\/dt><dd>Incomplete - review artifact warnings/);
  assert.match(summary, /2026-08-22 12:34:56 UTC/);
  assert.match(app.REPORT_RUNTIME, /Release readiness/);
  assert.match(app.REPORT_RUNTIME, /SonarQube gate result/);
  assert.match(app.REPORT_RUNTIME, /Unreviewed hotspots/);
  assert.match(app.REPORT_RUNTIME, /QA and test evidence/);
  assert.match(app.REPORT_RUNTIME, /File coverage unavailable/);
  assert.match(app.REPORT_RUNTIME, /Incomplete datasets:/);
  assert.match(app.REPORT_RUNTIME, /beforeprint",function\(\)\{draw\(true\);\}/);
  assert.match(app.REPORT_RUNTIME, /Browser print scope:/);
  assert.match(app.REPORT_RUNTIME, /Actionable.*Accepted.*Closed.*Unknown lifecycle.*All collected/s);
  assert.match(app.professionalStyles(), /\.layout\{grid-template-columns:1fr;padding:1rem\}/);
});

test("audited runtime helpers execute modern impact and lifecycle semantics", async () => {
  const app = await loadApp(["core.js", "html-report.js"]);
  const marker = "try{init();}catch(error){renderFailure(error);}";
  assert.ok(app.REPORT_RUNTIME.includes(marker));
  const inspectable = app.REPORT_RUNTIME.replace(marker, "globalThis.__runtimeAudit={humanize:humanize,lifecycle:lifecycle,impact:impact};");
  const sandbox = {};
  vm.runInNewContext(inspectable, sandbox);
  assert.equal(sandbox.__runtimeAudit.humanize("SECURITY_REVIEW"), "Security Review");
  assert.equal(sandbox.__runtimeAudit.lifecycle({ normalizedLifecycle: "accepted", status: "OPEN" }), "accepted");
  assert.equal(sandbox.__runtimeAudit.impact({ impactSeverities: ["Low", "High"], severity: "MINOR" }), "High");
});

test("single HTML provenance uses exact dataset states instead of requested-scope shorthand", async () => {
  const app = await loadApp(["core.js", "html-report.js"]);
  const marker = "try{init();}catch(error){renderFailure(error);}";
  const inspectable = app.REPORT_RUNTIME.replace(marker, "globalThis.__runtimeAudit={datasetStateLabel:datasetStateLabel,issueEmptyState:issueEmptyState,setReport:function(value){report=value;}};");
  const sandbox = {};
  vm.runInNewContext(inspectable, sandbox);

  sandbox.__runtimeAudit.setReport({
    collectionScope: { issues: true, components: true, analyses: false },
    datasetStates: {
      issues: { requested: true, state: "permission_denied", reason: "browse_permission_required" },
      components: { requested: true, state: "partial_limit", reason: "configured_limit_reached" },
      analyses: { requested: false, state: "not_requested" }
    }
  });

  assert.equal(sandbox.__runtimeAudit.datasetStateLabel("issues"), "Permission denied (Browse Permission Required)");
  assert.deepEqual(
    { ...sandbox.__runtimeAudit.issueEmptyState() },
    {
      title: "Issue data unavailable",
      text: "No issue rows are available because the dataset state is Permission denied (Browse Permission Required). Review collection warnings and provenance before using this report."
    }
  );
  assert.equal(sandbox.__runtimeAudit.datasetStateLabel("components"), "Partial - limit reached (Configured Limit Reached)");
  assert.equal(sandbox.__runtimeAudit.datasetStateLabel("analyses"), "Not requested");
  assert.match(app.REPORT_RUNTIME, /\["Issues",datasetStateLabel\("issues"\)/);
  assert.doesNotMatch(app.REPORT_RUNTIME, /collected\("issues"\)\?"Collected"/);
});

test("portfolio print modes reconcile issue scope with rendered content", async () => {
  const app = await loadApp();
  const report = portfolioFixture(app);
  const template = { ...app.BUILTIN_TEMPLATES[4], persona: "CISO, CTO and engineering leadership" };
  const summary = app.buildHtmlReport(report, template, { purpose: "print", mode: "summary", issueScope: "all" });
  const active = app.buildHtmlReport(report, template, { purpose: "print", mode: "register", issueScope: "active" });
  const all = app.buildHtmlReport(report, template, { purpose: "print", mode: "register", issueScope: "all" });

  assert.match(summary, /0 rendered \/ 0 selected \/ 4 collected/);
  assert.doesNotMatch(summary, /Detailed issue register/);
  assert.match(active, /1 rendered \/ 1 selected \/ 4 collected/);
  assert.match(active, /Fix alpha security boundary/);
  assert.doesNotMatch(active, /Accepted alpha risk/);
  assert.match(all, /4 rendered \/ 4 selected \/ 4 collected/);
  assert.match(all, /Accepted alpha risk/);
  assert.match(all, /Unknown beta lifecycle/);
  assert.match(all, /Modern impact/);
  assert.match(all, /Legacy severity/);
  assert.match(all, /Suggested next action/);
  assert.match(all, /Hotspots reviewed/);
  assert.match(all, /Unreviewed hotspots/);
  assert.match(all, /Release readiness: Not determined/);
  assert.match(all, /Collection: Complete/);
  assert.match(all, /2026-08-22 12:00:00 UTC/);
  assert.match(all, /<th scope="row">/);
  assert.match(all, /class="skip-link"/);
  assert.doesNotMatch(all, /class="rank"/);
  assert.match(all, /style="width:0%"/);
});

test("portfolio renderer envelope reconciles interactive full model and rendered-only print", async () => {
  const app = await loadApp();
  const report = portfolioFixture(app);
  const template = { ...app.BUILTIN_TEMPLATES[4], persona: "Engineering governance", requiredDatasets: { issues: true, components: true, analyses: true, trends: false } };
  const interactiveArtifact = app.createArtifactReport(report, "html", { template, artifactComplete: true, exportedAt: "2026-08-22T13:00:00Z" });
  const printArtifact = app.createArtifactReport(report, "print", { template, artifactComplete: true, purpose: "print", mode: "register", issueScope: "all", exportedAt: "2026-08-22T13:00:00Z" });
  const interactive = app.buildHtmlReport(interactiveArtifact, template);
  const printable = app.buildHtmlReport(printArtifact, template, { purpose: "print", mode: "register", issueScope: "all" });

  assert.match(interactive, /id="portfolio-model-v3"/);
  assert.match(interactive, /Full Model v3 embedded: Yes/);
  assert.equal(interactive.match(/Declared-count mismatches: ([^|<]+)/)?.[1].trim(), "None");
  assert.match(interactive, /Complete for the declared renderer envelope/);
  assert.match(interactive, /all collected issue records embedded/);
  assert.doesNotMatch(printable, /id="portfolio-model-v3"/);
  assert.match(printable, /Rendered print views only; full Model v3 is not embedded/);
  assert.match(printable, /4 rendered \/ 4 selected \/ 4 collected/);
  assert.match(printable, /Declared-count mismatches: None/);
});
