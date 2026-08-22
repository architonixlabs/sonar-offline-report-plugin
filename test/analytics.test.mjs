import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { loadApp, sampleReport } from "./test-helpers.mjs";

function projectReport(app, key, overrides = {}) {
  const report = sampleReport({
    reportId: `report-${key}`,
    project: { key, name: `Project ${key}`, qualifier: "TRK", version: "1.0", analysisDate: "2026-08-01T00:00:00Z" },
    qualityGate: { status: "OK", conditions: [] },
    measures: [
      { metric: "security_rating", value: "1" }, { metric: "reliability_rating", value: "1" },
      { metric: "sqale_rating", value: "1" }, { metric: "sqale_index", value: "60" },
      { metric: "lines_to_cover", value: "100" }, { metric: "uncovered_lines", value: "10" },
      { metric: "conditions_to_cover", value: "0" }, { metric: "uncovered_conditions", value: "0" },
      { metric: "duplicated_lines", value: "5" }, { metric: "ncloc", value: "100" }
    ],
    ...overrides
  });
  return app.deriveProjectAnalytics(report);
}

test("Model v3 lifecycle, age, effort, quality dimensions, and gate reasons reconcile", async () => {
  const app = await loadApp(["core.js", "analytics.js"]);
  const report = app.deriveProjectAnalytics(sampleReport({
    generatedAt: "2026-08-18T12:00:00Z",
    complete: false,
    qualityGate: { status: "ERROR", conditions: [
      { status: "ERROR", metricKey: "new_coverage", comparator: "LT", actualValue: "62", errorThreshold: "80" },
      { status: "OK", metricKey: "coverage", comparator: "LT", actualValue: "82", errorThreshold: "80" }
    ] },
    issues: [
      { key: "A", status: "OPEN", impacts: ["SECURITY:HIGH"], type: "VULNERABILITY", severity: "CRITICAL", creationDate: "2026-08-18T11:00:00Z", effort: "2h", component: "sample:a.ts", tags: ["owasp"] },
      { key: "B", status: "ACCEPTED", impacts: ["RELIABILITY:MEDIUM"], creationDate: "2026-08-10T00:00:00Z", effort: "1d", component: "sample:b.ts" },
      { key: "C", status: "FIXED", impacts: ["MAINTAINABILITY:LOW"], creationDate: "2026-05-01T00:00:00Z", effort: "15min", component: "sample:c.ts" },
      { key: "D", status: "FUTURE_STATE", creationDate: "invalid", effort: "unknown", component: "sample:d.ts" }
    ],
    issuePaging: { expected: 4, exported: 4, uniqueFetched: 4, duplicatesRemoved: 0, limit: 10000 },
    components: [{ key: "sample:a.ts", language: "ts" }]
  }));

  assert.equal(report.modelVersion, 3);
  assert.deepEqual(
    [report.derived.issueSummary.actionable, report.derived.issueSummary.accepted, report.derived.issueSummary.closed, report.derived.issueSummary.unknown],
    [1, 1, 1, 1]
  );
  assert.equal(report.derived.reconciliation.valid, true);
  assert.equal(report.derived.effort.knownMinutes, 615);
  assert.equal(report.issues[0].ageBucket, "0–7 days");
  assert.equal(report.issues[1].ageBucket, "8–30 days");
  assert.equal(report.issues[2].ageBucket, "91–180 days");
  assert.equal(report.issues[3].ageBucket, "Unknown age");
  assert.equal(report.issues[0].language, "ts");
  assert.deepEqual([...report.issues[0].softwareQualities], ["Security"]);
  assert.deepEqual([...report.issues[0].impactSeverities], ["High"]);
  assert.equal(report.derived.qualityGateFailureReasons.length, 1);
  assert.equal(report.derived.qualityGateFailureReasons[0].context, "new_code");
});

test("portfolio aggregates use source-count weighting and preserve missing metrics", async () => {
  const app = await loadApp(["core.js", "analytics.js"]);
  const large = projectReport(app, "large");
  const small = projectReport(app, "small", { measures: [
    { metric: "security_rating", value: "3" }, { metric: "reliability_rating", value: "2" },
    { metric: "sqale_rating", value: "1" }, { metric: "sqale_index", value: "30" },
    { metric: "lines_to_cover", value: "10" }, { metric: "uncovered_lines", value: "8" },
    { metric: "conditions_to_cover", value: "0" }, { metric: "uncovered_conditions", value: "0" },
    { metric: "duplicated_lines", value: "4" }, { metric: "ncloc", value: "10" }
  ], qualityGate: { status: "ERROR", conditions: [] } });
  const missing = projectReport(app, "missing", { measures: [] });
  const portfolio = app.buildPortfolioReport(
    [{ project: large.project, state: "complete", report: large }, { project: small.project, state: "complete", report: small }, { project: missing.project, state: "complete", report: missing }],
    [large.project, small.project, missing.project], { rankProjects: true }, "2026-08-18T11:00:00Z", "2026-08-18T12:00:00Z"
  );

  assert.equal(Number(portfolio.aggregateMetrics.coverage.value.toFixed(4)), 83.6364);
  assert.notEqual(portfolio.aggregateMetrics.coverage.value, 55);
  assert.equal(portfolio.aggregateMetrics.coverage.projectsIncluded, 2);
  assert.equal(Number(portfolio.aggregateMetrics.duplication.value.toFixed(4)), 8.1818);
  assert.equal(portfolio.aggregateMetrics.technicalDebtMinutes, 90);
  assert.equal(portfolio.aggregateMetrics.technicalDebtProjectsIncluded, 2);
  assert.equal(portfolio.portfolioSummary.projectsAnalysed, 3);
  assert.equal(portfolio.aggregateRiskConcentrations.attentionOrder[0].projectKey, "small");
  assert.equal(app.weightedCoverage([{ ...portfolio.projects[2], derived: missing.derived }]).value, null);
  const missingOnly = app.buildPortfolioReport([{ project: missing.project, state: "complete", report: missing }], [missing.project], {}, "2026-08-18T11:00:00Z", "2026-08-18T12:00:00Z");
  assert.equal(missingOnly.aggregateMetrics.technicalDebtMinutes, null);
  assert.equal(missingOnly.aggregateMetrics.technicalDebtProjectsIncluded, 0);
});

test("trend calculations distinguish unavailable percentage change from zero change", async () => {
  const app = await loadApp(["core.js", "analytics.js"]);
  const trend = app.normalizeTrendResponse({ paging: { total: 3 }, measures: [
    { metric: "bugs", history: [{ date: "2026-01-01", value: "0" }, { date: "2026-02-01", value: "5" }] },
    { metric: "coverage", history: [{ date: "2026-01-01", value: "80" }, { date: "2026-02-01", value: "80" }] },
    { metric: "ncloc", history: [{ date: "2026-02-01", value: null }] }
  ] }, ["bugs", "coverage", "ncloc"], 100);
  assert.equal(trend.series[0].absoluteChange, 5);
  assert.equal(trend.series[0].percentageChange, null);
  assert.equal(trend.series[1].absoluteChange, 0);
  assert.equal(trend.series[1].percentageChange, 0);
  assert.equal(trend.series[2].current, null);
});

test("portfolio HTML runtime remains integrity pinned after Model v3 rendering", async () => {
  const app = await loadApp();
  const actual = createHash("sha256").update(app.PORTFOLIO_RUNTIME, "utf8").digest("base64");
  assert.equal(actual, app.PORTFOLIO_RUNTIME_SHA256);
  const missing = app.deriveProjectAnalytics(sampleReport({ project: { key: "missing", name: "Missing", analysisDate: "2026-08-01T00:00:00Z" }, measures: [] }));
  const portfolio = app.buildPortfolioReport([{ project: missing.project, state: "complete", report: missing }], [missing.project], {}, "2026-08-18T11:00:00Z", "2026-08-18T12:00:00Z");
  const html = app.buildHtmlReport(portfolio, app.BUILTIN_TEMPLATES[4]);
  assert.match(html, /Technical debt<\/th><td>Not available<\/td><td>0<\/td><td>Sum of available source/);
});
