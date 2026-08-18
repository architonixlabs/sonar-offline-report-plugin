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
  const context = vm.createContext({ window: testWindow, console, TextEncoder, Blob, DOMException, setTimeout, Math, Date });
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
