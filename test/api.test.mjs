import assert from "node:assert/strict";
import test from "node:test";
import { loadApp, sampleReport } from "./test-helpers.mjs";

test("API adapter accepts only its fixed same-origin endpoint allowlist", async () => {
  const app = await loadApp();
  assert.doesNotThrow(() => app.assertAllowedPath("/api/issues/search"));
  assert.throws(() => app.assertAllowedPath("https://169.254.169.254/latest/meta-data"), /Blocked/);
  assert.throws(() => app.assertAllowedPath("//attacker.invalid/api"), /Blocked/);
  assert.throws(() => app.assertAllowedPath("/api/issues/search/../../system/status"), /Blocked/);
});

test("pagination stops at the configured hard limit and reports the API total", async () => {
  let calls = 0;
  const files = ["core.js", "api.js"];
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const vm = await import("node:vm");
  const testWindow = {
    SonarRequest: {
      getJSON: async (_path, params) => {
        calls += 1;
        const start = (params.p - 1) * params.ps;
        const count = Math.min(params.ps, Math.max(0, 1200 - start));
        return {
          paging: { total: 1200 },
          issues: Array.from({ length: count }, (_, index) => ({ key: `I-${start + index}` })),
          rules: [{ key: `R-${params.p}`, name: `Rule page ${params.p}` }]
        };
      }
    }
  };
  const context = vm.createContext({ window: testWindow, console, TextEncoder, Blob, DOMException, setTimeout, clearTimeout, Math, Date });
  testWindow.window = testWindow;
  for (const file of files) vm.runInContext(await readFile(resolve(import.meta.dirname, "../src/main/js", file), "utf8"), context);
  const result = await testWindow.OfflineReport.collectPaged("/api/issues/search", {}, "issues", 750, () => {}, null);
  assert.equal(result.items.length, 750);
  assert.equal(result.expected, 1200);
  assert.equal(calls, 2);
  assert.deepEqual(Array.from(result.auxiliary.rules, (rule) => rule.key), ["R-1", "R-2"]);
});

test("paging removes duplicates, continues to the unique target, and records reconciliation", async () => {
  const pages = [
    Array.from({ length: 500 }, (_, index) => ({ key: `I-${index}` })),
    Array.from({ length: 500 }, (_, index) => ({ key: `I-${index + 400}` })),
    Array.from({ length: 200 }, (_, index) => ({ key: `I-${index + 900}` }))
  ];
  const app = await loadApp(["core.js", "api.js"], {
    window: { SonarRequest: { getJSON: async (_path, params) => ({ paging: { total: 1100 }, issues: pages[params.p - 1] || [] }) } }
  });
  const result = await app.collectPaged("/api/issues/search", {}, "issues", 1100, () => {}, null);
  assert.equal(result.items.length, 1100);
  assert.equal(result.paging.rawFetched, 1200);
  assert.equal(result.paging.duplicatesRemoved, 100);
  assert.equal(result.paging.pagesFetched, 3);
  assert.equal(result.paging.reconciled, true);
});

test("changing page totals force an explicit partial reconciliation state", async () => {
  const app = await loadApp(["core.js", "api.js"], {
    window: { SonarRequest: { getJSON: async (_path, params) => ({
      paging: { total: params.p === 1 ? 600 : 601 },
      issues: Array.from({ length: params.p === 1 ? 500 : 101 }, (_, index) => ({ key: `P${params.p}-${index}` }))
    }) } }
  });
  const result = await app.collectPaged("/api/issues/search", {}, "issues", 1000, () => {}, null);
  assert.equal(result.paging.expectedChangedDuringPaging, true);
  assert.equal(result.paging.reconciled, false);
});

test("modern issue status is preferred and lifecycle never treats unknown as actionable", async () => {
  const app = await loadApp(["core.js", "api.js"]);
  const fixed = app.normalizeIssue({ status: "OPEN", issueStatus: "FIXED", resolution: "FIXED" }, false);
  const accepted = app.normalizeIssue({ issueStatus: "ACCEPTED" }, false);
  const unknown = app.normalizeIssue({ issueStatus: "FUTURE_STATE" }, false);
  assert.equal(fixed.status, "FIXED");
  assert.equal(fixed.legacyStatus, "OPEN");
  assert.equal(fixed.lifecycleStatus, "closed");
  assert.equal(accepted.lifecycleStatus, "accepted");
  assert.equal(unknown.lifecycleStatus, "unknown");
});

test("API requests reject promptly on local cancellation and timeout without retrying", async () => {
  let calls = 0;
  const app = await loadApp(["core.js", "api.js"], {
    AbortController,
    window: { SonarRequest: { getJSON: () => { calls += 1; return new Promise(() => {}); } } }
  });
  const controller = new AbortController();
  const cancelled = app.apiGet("/api/system/status", {}, controller.signal, 2, 1000);
  controller.abort();
  await assert.rejects(cancelled, (error) => error.name === "AbortError");

  await assert.rejects(
    app.apiGet("/api/system/status", {}, null, 2, 5),
    (error) => error.name === "TimeoutError" && /within/.test(error.message)
  );
  assert.equal(calls, 2, "a local timeout must not start an overlapping retry");
});

test("Retry-After parsing supports seconds and HTTP dates with a bounded delay", async () => {
  const app = await loadApp(["core.js", "api.js"]);
  assert.equal(app.retryAfterMilliseconds({ response: { headers: { get: () => "2" } } }, 0), 2000);
  assert.equal(app.retryAfterMilliseconds({ headers: { "retry-after": "Thu, 01 Jan 1970 00:00:05 GMT" } }, 1000), 4000);
  assert.equal(app.retryAfterMilliseconds({ headers: { "Retry-After": "invalid" } }, 0), 0);
  assert.ok(app.retryDelayMilliseconds({ headers: { "Retry-After": "999" } }, 0) <= app.MAX_RETRY_DELAY_MS);
});

test("issue paging stops at the 10,000-row API window without requesting page 21", async () => {
  let calls = 0;
  const app = await loadApp(["core.js", "api.js"], {
    window: { SonarRequest: { getJSON: async (_path, params) => {
      calls += 1;
      const start = (params.p - 1) * params.ps;
      return {
        paging: { total: 10001 },
        issues: Array.from({ length: Math.min(500, 10001 - start) }, (_, index) => ({ key: `I-${start + index}` }))
      };
    } } }
  });
  const result = await app.collectPaged("/api/issues/search", {}, "issues", 10000, () => {}, null);
  assert.equal(calls, 20);
  assert.equal(result.items.length, 10000);
  assert.equal(result.paging.truncated, true);
  assert.equal(result.paging.terminationReason, "target_reached");
});

test("duplicates cannot push issue paging beyond the 10,000-row API window", async () => {
  let calls = 0;
  const app = await loadApp(["core.js", "api.js"], {
    window: { SonarRequest: { getJSON: async (_path, params) => {
      calls += 1;
      const start = (params.p - 1) * params.ps;
      const issues = Array.from({ length: 500 }, (_, index) => ({ key: index === 0 && params.p > 1 ? "DUPLICATE" : `I-${start + index}` }));
      return { paging: { total: 12000 }, issues };
    } } }
  });
  const result = await app.collectPaged("/api/issues/search", {}, "issues", 10000, () => {}, null);
  assert.equal(calls, 20);
  assert.equal(result.paging.terminationReason, "api_search_window");
  assert.equal(result.paging.reconciled, false);
  assert.ok(result.paging.duplicatesRemoved > 0);
});

test("collection requests explicit best-effort sorts for issues and components", async () => {
  const calls = [];
  const app = await loadApp(["core.js", "api.js"], {
    window: {
      location: { origin: "https://sonar.example", pathname: "/sonarqube/project/extension/offlinereport/report_page" },
      OfflineReportBuild: { sourceRevision: "0123456789abcdef0123456789abcdef01234567", sourceDigest: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", pluginArtifactDigest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
      SonarRequest: { getJSON: async (path, params) => {
      calls.push({ path, params });
      if (path === "/api/system/status") return { version: "26.6" };
      if (path === "/api/measures/component") return { component: { key: "p", analysisDate: "2026-08-21T00:00:00Z", measures: [] } };
      if (path === "/api/qualitygates/project_status") return { projectStatus: { status: "OK", conditions: [] } };
      if (path === "/api/issues/search") return { paging: { total: 0 }, issues: [] };
      if (path === "/api/components/tree") return { paging: { total: 1 }, components: [{ key: "p:file.js", path: "file.js", qualifier: "FIL", measures: [{ metric: "coverage", value: "91.5" }] }] };
      if (path === "/api/project_analyses/search") return { analyses: [{ key: "a", date: "2026-08-21T00:00:00Z" }] };
      throw new Error(`Unexpected path ${path}`);
    } } }
  });
  const report = await app.collectReport({ key: "p" }, null, {
    includeIssues: true, includeComponents: true, includeAnalyses: false, includePeople: false,
    maxIssues: 10000, maxComponents: 10000
  }, () => {}, null);
  const issueCall = calls.find((call) => call.path === "/api/issues/search");
  const componentCall = calls.find((call) => call.path === "/api/components/tree");
  assert.equal(issueCall.params.s, "CREATION_DATE");
  assert.equal(issueCall.params.asc, true);
  assert.equal(componentCall.params.s, "path");
  assert.equal(componentCall.params.asc, true);
  assert.equal(componentCall.params.metricKeys, app.COMPONENT_METRICS);
  assert.deepEqual(Array.from(report.components[0].measures, (measure) => measure.metric), ["coverage"]);
  assert.equal(report.collectedAt, report.collectionCompletedAt);
  assert.equal(report.collectionComplete, report.complete);
  assert.equal(report.serverBaseUrl, "https://sonar.example/sonarqube");
  assert.equal(report.serverBaseUrlScope, "origin_and_context_path");
  assert.equal(report.sourceRevision, "0123456789abcdef0123456789abcdef01234567");
  assert.equal(report.sourceDigest, "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  assert.equal(report.pluginArtifactDigest, "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
});

test("same-origin fetch is primary, context-path aware, credentialed, and abortable", async () => {
  const calls = [];
  const app = await loadApp(["core.js", "api.js"], {
    AbortController,
    window: {
      AbortController,
      location: { origin: "https://sonar.example", pathname: "/sonarqube/project/extension/offlinereport/report_page" },
      SonarRequest: { getJSON: () => { throw new Error("legacy fallback must not be selected when fetch is available"); } },
      fetch: async (url, options) => {
        calls.push({ url, options });
        return { ok: true, status: 200, json: async () => ({ version: "2026.1" }) };
      }
    }
  });
  const result = await app.apiGet("/api/system/status", { phrase: "a b", empty: "" }, null, 0, 1000);
  assert.equal(result.version, "2026.1");
  assert.equal(calls[0].url, "/sonarqube/api/system/status?phrase=a+b");
  assert.equal(calls[0].options.credentials, "same-origin");
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.headers.Accept, "application/json");
  assert.ok(calls[0].options.signal);
  const provenance = app.serverLocationProvenance();
  assert.equal(provenance.serverBaseUrl, "https://sonar.example/sonarqube");
  assert.equal(provenance.serverBaseUrlScope, "origin_and_context_path");
});

test("fetch cancellation aborts the transport and collection never converts AbortError into a partial report", async () => {
  let transportSignal;
  const app = await loadApp(["core.js", "api.js"], {
    AbortController,
    window: {
      AbortController,
      fetch: (_url, options) => {
        transportSignal = options.signal;
        return new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true }));
      }
    }
  });
  const controller = new AbortController();
  const request = app.apiGet("/api/system/status", {}, controller.signal, 0, 1000);
  controller.abort();
  await assert.rejects(request, (error) => error.name === "AbortError");
  assert.equal(transportSignal.aborted, true);

  const collectionController = new AbortController();
  const fallback = await loadApp(["core.js", "api.js"], {
    AbortController,
    window: { SonarRequest: { getJSON: async (path) => {
      if (path === "/api/system/status") return { version: "2026.1" };
      if (path === "/api/measures/component") return { component: { key: "p", analysisDate: "2026-08-22T00:00:00Z", measures: [] } };
      if (path === "/api/qualitygates/project_status") return { projectStatus: { status: "OK", conditions: [] } };
      if (path === "/api/project_analyses/search") {
        collectionController.abort();
        return { analyses: [{ key: "latest", date: "2026-08-22T00:00:00Z" }] };
      }
      throw new Error(`Unexpected path ${path}`);
    } } }
  });
  await assert.rejects(fallback.collectReport({ key: "p" }, null, {
    includeIssues: false, includeComponents: false, includeAnalyses: false, includeTrends: false,
    includePeople: false, maxIssues: 100, maxComponents: 100
  }, () => {}, collectionController.signal), (error) => error.name === "AbortError");
});

test("artifact context separates collection and export identity without mutating the snapshot", async () => {
  const app = await loadApp(["core.js", "api.js"]);
  const snapshot = sampleReport();
  const first = app.createArtifactReport(snapshot, "html", {
    purpose: "interactive", mode: "full", exportedAt: "2026-08-22T10:00:00.000Z"
  });
  const second = app.createArtifactReport(snapshot, "json", {
    purpose: "data", mode: "full", exportedAt: "2026-08-22T10:05:00.000Z"
  });
  assert.equal(first.reportId, snapshot.reportId);
  assert.equal(second.reportId, snapshot.reportId);
  assert.equal(first.collectedAt, snapshot.collectionCompletedAt);
  assert.equal(first.collectionCompletedAt, snapshot.collectionCompletedAt);
  assert.equal(first.generatedAt, "2026-08-22T10:00:00.000Z");
  assert.equal(first.exportedAt, first.artifact.exportedAt);
  assert.equal(first.artifact.format, "html");
  assert.equal(second.artifact.format, "json");
  assert.equal(first.artifact.collectionComplete, true);
  assert.equal(first.artifact.artifactComplete, true);
  assert.equal(first.artifact.artifactDigest, null);
  assert.equal(first.artifact.artifactDigestState, "not_computed");
  assert.equal(snapshot.generatedAt, "2026-08-18T12:00:00.000Z");
  assert.equal(snapshot.artifact, null);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.artifact), true);
  assert.equal(Object.isFrozen(first.artifact.exportedCounts), true);

  const missing = app.createArtifactReport({ ...snapshot, collectionScope: { ...snapshot.collectionScope, trends: false } }, "html", {
    template: app.normalizeTemplate({ requiredDatasets: { trends: true } }),
    exportedAt: "2026-08-22T10:10:00.000Z"
  });
  assert.equal(missing.artifactComplete, false);
  assert.match(missing.artifact.warnings.join(" "), /requires uncollected datasets: trends/);
  const forcedMissing = app.createArtifactReport({ ...snapshot, collectionScope: { ...snapshot.collectionScope, trends: false } }, "html", {
    template: app.normalizeTemplate({ requiredDatasets: { trends: true } }),
    artifactComplete: true,
    exportedAt: "2026-08-22T10:12:00.000Z"
  });
  assert.equal(forcedMissing.artifactComplete, false, "a caller cannot force an ineligible artifact to complete");

  const trendSnapshot = {
    ...snapshot,
    collectionScope: { ...snapshot.collectionScope, trends: true },
    datasetStates: { ...snapshot.datasetStates, trends: { requested: true, state: "complete" } }
  };
  const summaryTemplate = app.normalizeTemplate({
    requiredDatasets: { trends: true },
    sections: { trends: false }
  });
  const unrepresented = app.createArtifactReport(trendSnapshot, "docx", {
    template: summaryTemplate, mode: "summary", exportedAt: "2026-08-22T10:15:00.000Z"
  });
  assert.equal(unrepresented.artifactComplete, false);
  assert.match(unrepresented.artifact.warnings.join(" "), /does not represent profile-required datasets: trends/);
  const explicitlyScoped = app.createArtifactReport(trendSnapshot, "print", {
    template: summaryTemplate,
    mode: "summary",
    scope: {
      representedDatasets: ["issues"],
      excludedDatasets: ["trends"],
      exclusionReason: "user_selected_print_summary",
      representationByDataset: { issues: "reconciled_aggregates_only", unknown: "discarded" }
    },
    exportedAt: "2026-08-22T10:20:00.000Z"
  });
  assert.equal(explicitlyScoped.artifactComplete, true);
  assert.deepEqual(Array.from(explicitlyScoped.artifact.scope.excludedDatasets), ["trends"]);
  assert.equal(Object.isFrozen(explicitlyScoped.artifact.scope.excludedDatasets), true);
  assert.deepEqual({ ...explicitlyScoped.artifact.scope.representationByDataset }, { issues: "reconciled_aggregates_only" });
  assert.equal(Object.isFrozen(explicitlyScoped.artifact.scope.representationByDataset), true);
  const schemaOnlyCsv = app.createArtifactReport(trendSnapshot, "csv", {
    template: summaryTemplate, mode: "register", exportedAt: "2026-08-22T10:25:00.000Z"
  });
  assert.equal(schemaOnlyCsv.artifactComplete, true);
  assert.deepEqual(Array.from(schemaOnlyCsv.artifact.scope.representedDatasets), ["issues"]);
  assert.equal(schemaOnlyCsv.artifact.exportedCounts.components, 0);
  assert.equal(schemaOnlyCsv.artifact.exportedCounts.analyses, 0);
  assert.equal(schemaOnlyCsv.artifact.exportedCounts.trendObservations, 0);
});

test("project and per-file metric requests include test execution and coverage denominators", async () => {
  const app = await loadApp(["core.js", "api.js"]);
  ["tests", "test_errors", "test_failures", "skipped_tests", "test_execution_time", "test_success_density", "line_coverage", "branch_coverage", "new_lines_to_cover", "new_uncovered_lines", "new_conditions_to_cover", "new_uncovered_conditions"].forEach((metric) => {
    assert.ok(app.METRICS.split(",").includes(metric), `missing project metric ${metric}`);
  });
  ["coverage", "uncovered_lines", "uncovered_conditions", "duplicated_lines", "ncloc", "complexity"].forEach((metric) => {
    assert.ok(app.COMPONENT_METRICS.split(",").includes(metric), `missing component metric ${metric}`);
  });
});

test("branch collection excludes unsupported history and verifies identity through branch-aware measures", async () => {
  const calls = [];
  const app = await loadApp(["core.js", "api.js"], {
    window: { SonarRequest: { getJSON: async (path, params) => {
      calls.push({ path, params });
      if (path === "/api/system/status") return { version: "26.6" };
      if (path === "/api/measures/component") return { component: { key: "p", analysisDate: "2026-08-21T00:00:00Z", measures: [] } };
      if (path === "/api/qualitygates/project_status") return { projectStatus: { status: "OK", conditions: [] } };
      if (path === "/api/project_analyses/search") throw new Error("branch history must not use the main-branch-only endpoint");
      throw new Error(`Unexpected path ${path}`);
    } } }
  });
  const report = await app.collectReport({ key: "p" }, { name: "feature" }, {
    includeIssues: false, includeComponents: false, includeAnalyses: true, includePeople: false,
    maxIssues: 10000, maxComponents: 10000
  }, () => {}, null);
  assert.equal(report.datasetStates.analyses.state, "not_available");
  assert.equal(report.datasetStates.analyses.reason, "branch_history_not_supported");
  assert.equal(report.analysisSnapshotConsistent, true);
  assert.equal(calls.filter((call) => call.path === "/api/measures/component").length, 2);
  assert.ok(calls.filter((call) => call.path === "/api/measures/component").every((call) => call.params.branch === "feature"));
});

test("branch snapshot verification stays complete when measures omit analysisDate", async () => {
  const app = await loadApp(["core.js", "api.js"], {
    window: { SonarRequest: { getJSON: async (path) => {
      if (path === "/api/system/status") return { version: "26.6" };
      if (path === "/api/measures/component") return {
        component: { key: "p", measures: [{ metric: "ncloc", value: "308" }, { metric: "coverage", value: "87.5" }] }
      };
      if (path === "/api/qualitygates/project_status") return { projectStatus: { status: "OK", conditions: [] } };
      if (path === "/api/issues/search") return { paging: { total: 0 }, issues: [] };
      if (path === "/api/components/tree") return { paging: { total: 0 }, components: [] };
      throw new Error(`Unexpected path ${path}`);
    } } }
  });
  const report = await app.collectReport({ key: "p", analysisDate: "2026-08-21T00:00:00Z" }, { name: "main" }, {
    includeIssues: true, includeComponents: true, includeAnalyses: false, includeTrends: false, includePeople: false,
    maxIssues: 10000, maxComponents: 10000
  }, () => {}, null);
  assert.equal(report.complete, true);
  assert.equal(report.analysisSnapshotConsistent, true);
  assert.equal(report.analysisSnapshotMethod, "branch_measure_fingerprint");
  assert.equal(report.warnings.length, 0);
  assert.equal(report.datasetStates.analysisSnapshot.requested, true);
  assert.equal(report.datasetStates.analysisSnapshot.state, "complete");
  assert.equal(report.datasetStates.analysisSnapshot.method, "branch_measure_fingerprint");
});

test("last 100 analysis events are complete for the explicitly selected scope", async () => {
  const app = await loadApp(["core.js", "api.js"], {
    window: { SonarRequest: { getJSON: async (path, params) => {
      if (path === "/api/system/status") return { version: "26.6" };
      if (path === "/api/measures/component") return { component: { key: "p", analysisDate: "2026-08-21T00:00:00Z", measures: [] } };
      if (path === "/api/qualitygates/project_status") return { projectStatus: { status: "OK", conditions: [] } };
      if (path === "/api/project_analyses/search" && params.ps === 100) return {
        paging: { total: 450 }, analyses: Array.from({ length: 100 }, (_, index) => ({ key: `a-${index}`, date: `2026-08-${String(21 - (index % 20)).padStart(2, "0")}T00:00:00Z` }))
      };
      if (path === "/api/project_analyses/search" && params.ps === 1) return { analyses: [{ key: "latest", date: "2026-08-21T00:00:00Z" }] };
      throw new Error(`Unexpected path ${path}`);
    } } }
  });
  const report = await app.collectReport({ key: "p" }, null, {
    includeIssues: false, includeComponents: false, includeAnalyses: true, includeTrends: false, includePeople: false,
    maxIssues: 10000, maxComponents: 10000
  }, () => {}, null);
  assert.equal(report.complete, true);
  assert.equal(report.analyses.length, 100);
  assert.equal(report.analysisPaging.expected, 100);
  assert.equal(report.analysisPaging.serverTotal, 450);
  assert.equal(report.analysisPaging.olderAvailable, true);
  assert.equal(report.analysisPaging.truncated, false);
  assert.equal(report.datasetStates.analyses.state, "complete");
});

test("latest 100 trend observations are complete for the explicitly selected scope", async () => {
  const history = Array.from({ length: 100 }, (_, index) => ({
    date: `2026-08-${String((index % 20) + 1).padStart(2, "0")}T00:00:00Z`,
    value: String(70 + index / 10)
  }));
  const app = await loadApp(["core.js", "analytics.js", "api.js"], {
    window: { SonarRequest: { getJSON: async (path, params) => {
      if (path === "/api/system/status") return { version: "26.6" };
      if (path === "/api/measures/component") return { component: { key: "p", analysisDate: "2026-08-21T00:00:00Z", measures: [] } };
      if (path === "/api/qualitygates/project_status") return { projectStatus: { status: "OK", conditions: [] } };
      if (path === "/api/measures/search_history" && params.p === 1) return { paging: { total: 250 }, measures: [] };
      if (path === "/api/measures/search_history" && params.p === 3) return { paging: { total: 250 }, measures: [{ metric: "coverage", history }] };
      if (path === "/api/project_analyses/search") return { analyses: [{ key: "latest", date: "2026-08-21T00:00:00Z" }] };
      throw new Error(`Unexpected path ${path}`);
    } } }
  });
  const report = await app.collectReport({ key: "p" }, null, {
    includeIssues: false, includeComponents: false, includeAnalyses: false, includeTrends: true, includePeople: false,
    maxIssues: 10000, maxComponents: 10000
  }, () => {}, null);
  assert.equal(report.complete, true);
  assert.equal(report.trendPaging.expected, 100);
  assert.equal(report.trendPaging.serverTotal, 250);
  assert.equal(report.trendPaging.exported, 100);
  assert.equal(report.trendPaging.olderAvailable, true);
  assert.equal(report.trendPaging.truncated, false);
  assert.equal(report.trendPaging.terminationReason, "selected_scope_reached");
  assert.equal(report.datasetStates.trends.state, "complete");
  assert.match(report.warnings[0], /outside the declared report scope/);
});
