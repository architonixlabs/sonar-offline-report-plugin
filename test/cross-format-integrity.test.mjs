import assert from "node:assert/strict";
import test from "node:test";
import { loadApp, sampleReport } from "./test-helpers.mjs";

async function archiveText(blob) {
  return new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer()));
}

function issue(overrides = {}) {
  return {
    key: "ISSUE-1", rule: "js:S1", type: "BUG", severity: "MAJOR", impacts: ["RELIABILITY:HIGH"],
    status: "OPEN", lifecycleStatus: "actionable", resolution: "", message: "Fix this issue",
    component: "sample:src/app.js", project: "sample", line: 7, effort: "15min", effortMinutes: 15,
    ageDays: 12, ageBucket: "8–30 days", language: "js", tags: [], cleanCodeAttribute: "CONVENTIONAL",
    creationDate: "2026-08-01T10:00:00Z", updateDate: "2026-08-02T11:00:00Z", closeDate: "",
    ...overrides
  };
}

test("CSV is a self-contained manifest envelope even when the issue register is empty", async () => {
  const app = await loadApp(["core.js"]);
  const report = sampleReport({
    serverBaseUrl: "https://sonar.example.test",
    serverBaseUrlScope: "origin",
    sourceRevision: "0123456789abcdef",
    sourceDigest: `sha256:${"b".repeat(64)}`,
    pluginArtifactDigest: null,
    collectedAt: "2026-08-18T12:00:00Z",
    branchLabel: "Branch: release/1",
    artifact: {
      format: "csv", purpose: "data", mode: "register", issueScope: "all-collected",
      collectionComplete: true, artifactComplete: true, exportedCounts: { issues: 0 }, warnings: [],
      artifactDigest: null, artifactDigestState: "not_computed"
    }
  });
  const csv = app.toCsv(app.issueRows(report));
  const lines = csv.trimEnd().split("\r\n");
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^﻿"Record Type","Report ID","Report Mode"/);
  assert.match(lines[1], /^"MANIFEST"/);
  assert.match(lines[1], /"sample"/);
  assert.match(lines[1], /"Branch: release\/1"/);
  assert.match(lines[1], /"https:\/\/sonar\.example\.test"/);
  assert.match(lines[1], /"sha256:bbbbbbbb/);
  assert.match(lines[1], /"not_computed"/);
  const manifest = app.reportManifest(report);
  assert.equal(manifest.sourceDigest, `sha256:${"b".repeat(64)}`);
  assert.equal(manifest.artifactDigestState, "not_computed");

  const withIssue = app.toCsv(app.issueRows({ ...report, issues: [issue({ message: "=1+1" })], issuePaging: { expected: 1, exported: 1, limit: 100 } }));
  assert.equal(withIssue.trimEnd().split("\r\n").length, 3);
  assert.match(withIssue, /\r\n"ISSUE","00000000-0000-4000-8000-000000000001"/);
  assert.match(withIssue, /"'=1\+1"/);
});

test("datasetStates, not contradictory request flags, drive Office availability labels", async () => {
  const app = await loadApp(["core.js", "analytics.js", "xlsx.js", "docx.js"]);
  const report = sampleReport({
    collectionScope: { issues: true, components: true, analyses: true, trends: true, people: true },
    datasetStates: {
      issues: { requested: false, state: "not_requested", reason: "profile_excluded" },
      components: { requested: false, state: "not_requested", reason: "profile_excluded" },
      analyses: { requested: false, state: "not_requested", reason: "profile_excluded" },
      trends: { requested: false, state: "not_requested", reason: "profile_excluded" },
      people: { requested: false, state: "not_requested", reason: "privacy_excluded" }
    },
    components: [{ key: "hidden", name: "Must not render", path: "hidden.js", language: "js" }],
    analyses: [{ key: "hidden", date: "2026-08-01T00:00:00Z" }],
    trends: [{ metric: "coverage", observations: [{ date: "2026-08-01T00:00:00Z", value: "90" }] }]
  });
  const metadata = app.xlsxRows(report).find((sheet) => sheet.name === "Metadata").rows;
  assert.equal(metadata.find((row) => row[0] === "Components dataset")[1], "Not requested");
  assert.equal(metadata.find((row) => row[0] === "Historical metrics dataset")[1], "Not requested");
  const body = app.docxDocumentBody(report, app.normalizeTemplate(app.BUILTIN_TEMPLATES[2]), { includeIssueRegister: true, issueScope: "all" }).xml;
  assert.match(body, /Components:[\s\S]*Not requested/);
  assert.match(body, /Historical metrics:[\s\S]*Not requested/);
  assert.doesNotMatch(body, /Must not render/);
});

test("XLSX preserves numeric and date analytics plus project QA and per-file measures", async () => {
  const app = await loadApp(["core.js", "analytics.js", "xlsx.js"]);
  const report = sampleReport({
    datasetStates: {
      issues: { requested: true, state: "complete" }, components: { requested: true, state: "complete" },
      analyses: { requested: true, state: "complete" }, trends: { requested: true, state: "complete" },
      people: { requested: false, state: "not_requested" }
    },
    issues: [issue()],
    measures: [{ metric: "tests", value: "12" }, { metric: "test_failures", value: "2" }],
    components: [{
      key: "sample:src/app.js", name: "app.js", path: "src/app.js", qualifier: "FIL", language: "js",
      measures: [
        { metric: "ncloc", value: "42" }, { metric: "coverage", value: "87.5" },
        { metric: "uncovered_lines", value: "3" }, { metric: "uncovered_conditions", value: "1" },
        { metric: "duplicated_lines_density", value: "0.5" }, { metric: "complexity", value: "9" },
        { metric: "cognitive_complexity", value: "7" }
      ]
    }],
    trends: [{
      metric: "coverage", current: { value: "87.5" }, previous: { value: "80" }, absoluteChange: 7.5, percentageChange: 9.375,
      source: "history", observations: [{ date: "2026-08-01T00:00:00Z", value: "80" }, { date: "2026-08-18T00:00:00Z", value: "87.5" }]
    }],
    issuePaging: { expected: 1, exported: 1, limit: 100 }
  });
  const sheets = app.xlsxRows(report);
  const issues = sheets.find((sheet) => sheet.name === "Issues").rows;
  const issueHeader = issues[0];
  assert.equal(issues[1][issueHeader.indexOf("Line")].kind, "number");
  assert.equal(issues[1][issueHeader.indexOf("Effort Minutes")].kind, "number");
  assert.equal(issues[1][issueHeader.indexOf("Age Days")].kind, "number");
  assert.equal(issues[1][issueHeader.indexOf("Created At")].kind, "date");

  const measures = sheets.find((sheet) => sheet.name === "Measures").rows;
  const tests = measures.find((row) => row[1] === "Tests");
  assert.equal(tests[4].kind, "number");
  assert.equal(tests[4].value, 12);

  const components = sheets.find((sheet) => sheet.name === "Components").rows;
  const componentHeader = components[0];
  assert.equal(components[1][componentHeader.indexOf("Lines of Code")].kind, "number");
  assert.equal(components[1][componentHeader.indexOf("Coverage")].value, 87.5);
  assert.equal(components[1][componentHeader.indexOf("Uncovered Conditions")].value, 1);

  const trends = sheets.find((sheet) => sheet.name === "Trends").rows;
  assert.equal(trends[1][trends[0].indexOf("Observation Date")].kind, "date");
  assert.equal(trends[1][trends[0].indexOf("Value")].kind, "number");
});

test("XLSX embeds cell truncation disclosure in the workbook and exposes package preflight", async () => {
  const app = await loadApp(["core.js", "analytics.js", "xlsx.js"]);
  const report = sampleReport({
    issues: [issue({ message: "x".repeat(33000) })],
    issuePaging: { expected: 1, exported: 1, limit: 100 }
  });
  const result = app.buildXlsx(report);
  const archive = await archiveText(result.blob);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0], "One or more spreadsheet cells were truncated to Excel's 32,767 character limit.");
  assert.equal(result.artifactComplete, false);
  assert.equal(result.artifact.artifactComplete, false);
  assert.match(archive, /One or more spreadsheet cells were truncated to Excel&apos;s 32,767 character limit\./);
  assert.match(archive, /use CSV or JSON when the full original cell text is required/);
  assert.doesNotMatch(archive, /No export warnings were recorded\./);
  assert.throws(() => app.xlsxAssertPackageSize(app.MAX_XLSX_BYTES + 1), /Excel export requires approximately 76 MiB/);
});

test("DOCX renders issue keys, trends, QA metrics, component measures, and honest provenance", async () => {
  const app = await loadApp(["core.js", "analytics.js", "xlsx.js", "docx.js"]);
  const report = sampleReport({
    serverBaseUrl: "https://sonar.example.test",
    serverBaseUrlScope: "origin",
    sourceRevision: "0123456789abcdef",
    pluginArtifactDigest: `sha256:${"a".repeat(64)}`,
    collectedAt: "2026-08-18T12:00:00Z",
    collectionComplete: true,
    artifact: {
      format: "docx", purpose: "document", mode: "register", issueScope: "all",
      exportedAt: "2026-08-18T12:05:00Z", collectionComplete: true, artifactComplete: true,
      exportedCounts: { projects: 1, issues: 1, components: 1, analyses: 0, trendObservations: 1 },
      scope: { representedDatasets: ["issues", "components", "trends"] }, warnings: []
    },
    datasetStates: {
      issues: { requested: true, state: "complete" }, components: { requested: true, state: "complete" },
      analyses: { requested: false, state: "not_requested" }, trends: { requested: true, state: "complete" },
      people: { requested: false, state: "not_requested" }
    },
    issues: [issue({ key: "VISIBLE-KEY-1" })],
    measures: [{ metric: "tests", value: "10" }, { metric: "test_failures", value: "1" }],
    components: [{ key: "sample:src/app.js", name: "app.js", path: "src/app.js", language: "js", measures: {
      ncloc: "42", coverage: "88", uncovered_lines: "3", uncovered_conditions: "1",
      duplicated_lines_density: "0.5", complexity: "9", cognitive_complexity: "7"
    } }],
    trends: [{ metric: "coverage", current: { value: "88" }, previous: { value: "80" }, absoluteChange: 8, percentageChange: 10, observations: [{ date: "2026-08-18T00:00:00Z", value: "88" }] }],
    issuePaging: { expected: 1, exported: 1, limit: 100 }
  });
  const result = app.buildDocx(report, app.BUILTIN_TEMPLATES[2], { includeIssueRegister: true, issueScope: "all" });
  const archive = await archiveText(result.blob);
  assert.match(archive, /VISIBLE-KEY-1/);
  assert.match(archive, /Historical metric trends/);
  assert.match(archive, /Component quality evidence/);
  assert.match(archive, /Test failures/);
  assert.match(archive, /https:\/\/sonar\.example\.test/);
  assert.match(archive, /sha256:aaaaaaaa/);
  assert.match(archive, /does not claim tamper evidence/);
  assert.ok(result.estimatedBytes > 0);
});

test("portfolio Office outputs retain scope, completeness, server, component, and trend evidence", async () => {
  const app = await loadApp(["core.js", "analytics.js", "xlsx.js", "docx.js"]);
  const projectReport = app.deriveProjectAnalytics(sampleReport({
    reportId: "project-source-id",
    serverVersion: "10.8.1",
    datasetStates: {
      issues: { requested: true, state: "complete" }, components: { requested: true, state: "complete" },
      analyses: { requested: true, state: "complete" }, trends: { requested: true, state: "complete" },
      people: { requested: false, state: "not_requested" }
    },
    project: { key: "alpha", name: "Alpha", qualifier: "TRK", version: "1", analysisDate: "2026-08-17T00:00:00Z" },
    measures: [{ metric: "tests", value: "20" }],
    components: [{ key: "alpha:a.js", name: "a.js", path: "src/a.js", language: "js", measures: [{ metric: "ncloc", value: "8" }] }],
    trends: [{ metric: "coverage", current: { value: "90" }, previous: { value: "80" }, observations: [{ date: "2026-08-18T00:00:00Z", value: "90" }] }]
  }));
  const base = app.buildPortfolioReport(
    [{ project: projectReport.project, state: "complete", report: projectReport }],
    [projectReport.project], { rankProjects: true, includeComponents: true, includeTrends: true },
    "2026-08-18T11:00:00Z", "2026-08-18T12:00:00Z"
  );
  const report = {
    ...base,
    serverBaseUrl: "https://sonar.example.test",
    serverBaseUrlScope: "origin",
    collectedAt: "2026-08-18T12:00:00Z",
    collectionComplete: true,
    sourceRevision: "0123456789abcdef",
    pluginArtifactDigest: null,
    artifact: {
      format: "docx", purpose: "document", mode: "portfolio", issueScope: "active",
      collectionComplete: true, artifactComplete: true, exportedCounts: { projects: 1, components: 1, trendObservations: 1 },
      scope: { representedDatasets: ["components", "trends"] }, warnings: []
    }
  };
  const metadata = app.portfolioWorkbookRows(report).find((sheet) => sheet.name === "Metadata").rows;
  assert.equal(metadata.find((row) => row[0] === "Collection Complete")[1], "Yes");
  assert.equal(metadata.find((row) => row[0] === "SonarQube Version(s)")[1], "10.8.1");
  assert.equal(metadata.find((row) => row[0] === "Requested Project Keys")[1], "alpha");
  assert.equal(metadata.find((row) => row[0] === "Actual Project Keys")[1], "alpha");
  assert.equal(metadata.find((row) => row[0] === "Plugin Artifact Digest")[1], "not_computed");

  const body = app.portfolioDocxBody(report, app.normalizeTemplate(app.BUILTIN_TEMPLATES[4]), { includeIssueRegister: false }).xml;
  assert.match(body, /Complete for selected collection scope/);
  assert.match(body, /Requested project keys/);
  assert.match(body, /Actual project keys/);
  assert.match(body, /10\.8\.1/);
  assert.match(body, /Component Quality Evidence/);
  assert.match(body, /Historical Metric Trends/);
  assert.match(body, /not_computed/);

  const longPortfolio = {
    ...report,
    artifact: { ...report.artifact, format: "xlsx" },
    projects: report.projects.map((entry) => ({
      ...entry,
      components: (entry.components || []).map((component) => ({ ...component, path: "x".repeat(33000) }))
    }))
  };
  const workbook = app.buildXlsx(longPortfolio);
  const archive = await archiveText(workbook.blob);
  assert.equal(workbook.artifactComplete, false);
  assert.match(archive, />Workbook</);
  assert.match(archive, /spreadsheet cells were truncated/);
  assert.doesNotMatch(archive, /No collection warnings were recorded\./);
});

test("DOCX clearly refuses unsupported oversized trend evidence", async () => {
  const app = await loadApp(["core.js", "analytics.js", "xlsx.js", "docx.js"]);
  const observations = Array.from({ length: 5001 }, (_, index) => ({ date: "2026-08-18T00:00:00Z", value: index }));
  const report = sampleReport({
    datasetStates: { trends: { requested: true, state: "complete" } },
    trends: [{ metric: "coverage", observations }]
  });
  assert.throws(
    () => app.buildDocx(report, app.BUILTIN_TEMPLATES[2], { includeIssueRegister: false }),
    /historical-trend evidence contains 5,001 observations/
  );
});
