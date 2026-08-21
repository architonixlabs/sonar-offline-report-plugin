import assert from "node:assert/strict";
import test from "node:test";
import { loadApp } from "./test-helpers.mjs";

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
    window: { SonarRequest: { getJSON: async (path, params) => {
      calls.push({ path, params });
      if (path === "/api/system/status") return { version: "26.6" };
      if (path === "/api/measures/component") return { component: { key: "p", analysisDate: "2026-08-21T00:00:00Z", measures: [] } };
      if (path === "/api/qualitygates/project_status") return { projectStatus: { status: "OK", conditions: [] } };
      if (path === "/api/issues/search") return { paging: { total: 0 }, issues: [] };
      if (path === "/api/components/tree") return { paging: { total: 0 }, components: [] };
      if (path === "/api/project_analyses/search") return { analyses: [{ key: "a", date: "2026-08-21T00:00:00Z" }] };
      throw new Error(`Unexpected path ${path}`);
    } } }
  });
  await app.collectReport({ key: "p" }, null, {
    includeIssues: true, includeComponents: true, includeAnalyses: false, includePeople: false,
    maxIssues: 10000, maxComponents: 10000
  }, () => {}, null);
  const issueCall = calls.find((call) => call.path === "/api/issues/search");
  const componentCall = calls.find((call) => call.path === "/api/components/tree");
  assert.equal(issueCall.params.s, "CREATION_DATE");
  assert.equal(issueCall.params.asc, true);
  assert.equal(componentCall.params.s, "path");
  assert.equal(componentCall.params.asc, true);
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
