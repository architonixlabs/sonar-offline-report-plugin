import assert from "node:assert/strict";
import test from "node:test";
import { loadApp, sampleReport } from "./test-helpers.mjs";

function decoded(blob) {
  return blob.arrayBuffer().then((buffer) => new TextDecoder().decode(new Uint8Array(buffer)));
}

test("one portfolio Model v3 fixture reconciles across HTML, XLSX, DOCX, CSV, JSON, and print HTML", async () => {
  const app = await loadApp();
  const make = (key, name, status, issues) => app.deriveProjectAnalytics(sampleReport({
    reportId: `source-${key}`,
    generatedAt: "2026-08-18T12:00:00Z",
    project: { key, name, qualifier: "TRK", version: "1", analysisDate: "2026-08-17T00:00:00Z" },
    qualityGate: { status, conditions: [] },
    issues,
    issuePaging: { expected: issues.length, exported: issues.length, uniqueFetched: issues.length, duplicatesRemoved: 0, limit: 10000 },
    measures: [{ metric: "ncloc", value: "100" }, { metric: "sqale_index", value: "30" }]
  }));
  const alpha = make("alpha", "Alpha Service", "ERROR", [
    { key: "A-1", status: "OPEN", lifecycleStatus: "actionable", rule: "ts:S1", message: "Fix alpha", component: "alpha:a.ts", impacts: ["RELIABILITY:HIGH"], severity: "MAJOR", effort: "1h", creationDate: "2026-08-01T00:00:00Z" },
    { key: "A-2", status: "ACCEPTED", lifecycleStatus: "accepted", rule: "ts:S2", message: "Accepted alpha", component: "alpha:b.ts", impacts: ["MAINTAINABILITY:LOW"], effort: "5min", creationDate: "2026-08-02T00:00:00Z" }
  ]);
  const beta = make("beta", "Beta Web", "OK", [
    { key: "B-1", status: "FIXED", lifecycleStatus: "closed", rule: "js:S1", message: "Closed beta", component: "beta:b.js", impacts: ["SECURITY:MEDIUM"], effort: "10min", creationDate: "2026-07-01T00:00:00Z" },
    { key: "B-2", status: "FUTURE", lifecycleStatus: "unknown", rule: "js:S2", message: "Unknown beta", component: "beta:c.js", effort: "", creationDate: "" }
  ]);
  const report = app.buildPortfolioReport(
    [{ project: alpha.project, state: "complete", report: alpha }, { project: beta.project, state: "complete", report: beta }],
    [alpha.project, beta.project], { rankProjects: true }, "2026-08-18T11:00:00Z", "2026-08-18T12:00:00Z"
  );
  const template = app.BUILTIN_TEMPLATES[4];
  const html = app.buildHtmlReport(report, template);
  const printHtml = app.buildHtmlReport(report, template, { purpose: "print", mode: "register", issueScope: "all" });
  const xlsx = await decoded(app.buildXlsx(report).blob);
  const docx = await decoded(app.buildDocx(report, template, { includeIssueRegister: true, issueScope: "all" }).blob);
  const csv = app.toCsv(app.issueRows(report));
  const json = JSON.stringify({ manifest: app.reportManifest(report), report });

  assert.equal(report.portfolioSummary.projectsSelected, 2);
  assert.equal(report.aggregateIssueSummary.totalCollected, 4);
  assert.deepEqual(
    [report.aggregateIssueSummary.actionable, report.aggregateIssueSummary.accepted, report.aggregateIssueSummary.closed, report.aggregateIssueSummary.unknown],
    [1, 1, 1, 1]
  );
  assert.equal(report.aggregateIssueSummary.reconciles, true);
  assert.equal(report.aggregateRiskConcentrations.topProjectsByReliabilityIssues[0].projectKey, "alpha");
  assert.equal(report.aggregateRiskConcentrations.topProjectsWithFailedQualityGates[0].projectKey, "alpha");
  assert.equal(report.aggregateRiskConcentrations.oldestActionableIssues[0].issueKey, "A-1");
  assert.equal(report.aggregateRiskConcentrations.highestEffortIssues[0].effortMinutes, 60);
  for (const output of [html, printHtml, xlsx, docx, json]) {
    assert.match(output, new RegExp(report.reportId));
    assert.match(output, /Alpha Service/);
    assert.match(output, /Beta Web/);
  }
  assert.match(html, /Total collected issues/);
  assert.match(xlsx, /Collected Issues/);
  assert.match(xlsx, /Actionable Issues/);
  assert.match(docx, /Issue Landscape/);
  assert.match(csv, /"Record Type","Report ID","Report Mode"/);
  assert.match(csv, /"MANIFEST"/);
  assert.match(csv, /"Project","Project Key","Branch \/ Pull Request"/);
  assert.match(csv, /"Alpha Service","alpha"/);
  assert.equal(csv.trimEnd().split("\r\n").length, 6);
  assert.match(json, /"totalCollected":4/);
  assert.match(json, /"actionable":1/);
  assert.match(json, /"complete":true/);
  assert.match(printHtml, /data-purpose="print"/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//i);
});
