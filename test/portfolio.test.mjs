import assert from "node:assert/strict";
import test from "node:test";
import { loadApp } from "./test-helpers.mjs";

function httpError(status, message) {
  const error = new Error(message || `HTTP ${status}`);
  error.status = status;
  return error;
}

test("visible project inventory pages, de-duplicates, and uses the fixed components endpoint", async () => {
  const calls = [];
  const app = await loadApp(["core.js", "analytics.js", "api.js"], { window: { SonarRequest: { getJSON: async (path, params) => {
    calls.push({ path, params });
    return params.p === 1
      ? { paging: { total: 501 }, components: Array.from({ length: 500 }, (_, index) => ({ key: `p-${index}`, name: `Project ${index}`, qualifier: "TRK" })) }
      : { paging: { total: 501 }, components: [{ key: "p-499", name: "Duplicate", qualifier: "TRK" }, { key: "p-500", name: "Project 500", qualifier: "TRK" }] };
  } } } });
  const result = await app.listVisibleProjects(null, () => {});
  assert.equal(result.projects.length, 501);
  assert.equal(result.projects[0].key, "p-0");
  assert.equal(result.projects.at(-1).key, "p-500");
  assert.ok(calls.every((call) => call.path === "/api/components/search"));
  assert.ok(calls.every((call) => call.params.qualifiers === "TRK"));
});

test("portfolio collection preserves mixed outcomes, duplicate selection, and bounded concurrency", async () => {
  let active = 0;
  let maximumActive = 0;
  const requests = [];
  const app = await loadApp(["core.js", "analytics.js", "api.js"], { window: { SonarRequest: { getJSON: async (path, params) => {
    requests.push({ path, params: { ...params } });
    const key = params.component || params.projectKey || params.project;
    if (path === "/api/system/status") return { version: "2026.1" };
    if (path === "/api/measures/component") {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 8));
      active -= 1;
      if (key === "denied") throw httpError(403);
      return { component: { key, name: key.toUpperCase(), qualifier: "TRK", analysisDate: "2026-08-20T00:00:00Z", measures: [
        { metric: "lines_to_cover", value: "10" }, { metric: "uncovered_lines", value: "2" },
        { metric: "duplicated_lines", value: "1" }, { metric: "ncloc", value: "20" }
      ] } };
    }
    if (path === "/api/qualitygates/project_status") {
      if (key === "partial") throw httpError(403);
      return { projectStatus: { status: "OK", conditions: [] } };
    }
    if (path === "/api/project_analyses/search") return { paging: { total: 1 }, analyses: [{ key: `${key}-analysis`, date: "2026-08-20T00:00:00Z" }] };
    throw new Error(`Unexpected endpoint ${path}`);
  } } } });

  const progress = [];
  const selected = [
    { key: "complete", name: "Complete" }, { key: "partial", name: "Partial" },
    { key: "complete", name: "Duplicate Complete" }, { key: "denied", name: "Denied" }
  ];
  const report = await app.collectPortfolio(selected, {
    includeIssues: false, includeComponents: false, includeAnalyses: false, includeTrends: false,
    includePeople: false, maxIssues: 100, maxComponents: 100, concurrency: 2, rankProjects: true
  }, (event) => progress.push(event), null);

  assert.equal(report.portfolioSummary.projectsSelected, 3);
  assert.equal(report.portfolioSummary.projectsAttempted, 3);
  assert.equal(report.portfolioSummary.projectsAnalysed, 2);
  assert.equal(report.portfolioSummary.projectsComplete, 1);
  assert.equal(report.portfolioSummary.projectsPartial, 1);
  assert.equal(report.portfolioSummary.projectsPermissionDenied, 1);
  assert.equal(report.portfolioSummary.projectsFailed, 0);
  assert.equal(report.complete, false);
  assert.equal(report.projects.find((entry) => entry.projectIdentity.key === "denied").collectionState.outcome, "permission_denied");
  assert.ok(maximumActive <= 2, `maximum observed concurrency was ${maximumActive}`);
  assert.equal(progress.at(-1).completed, 3);
  assert.ok(requests.every((request) => Object.values(app.API_PATHS).includes(request.path)));
});

test("portfolio boundaries reject empty and oversized selections and cancellation is responsive", async () => {
  const app = await loadApp(["core.js", "analytics.js", "api.js"], { window: { SonarRequest: { getJSON: async () => ({}) } } });
  await assert.rejects(app.collectPortfolio([], {}, () => {}, null), /Select at least one project/);
  await assert.rejects(app.collectPortfolio(Array.from({ length: 51 }, (_, index) => ({ key: `p-${index}` })), {}, () => {}, null), /at most 50/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(app.collectPortfolio([{ key: "cancelled" }], { concurrency: 1 }, () => {}, controller.signal), (error) => error.name === "AbortError");
});

test("portfolio preflight keeps the 50-project default feasible and applies format-specific limits", async () => {
  const app = await loadApp(["core.js", "api.js", "portfolio-app.js"]);
  const projects = Array.from({ length: 50 }, (_, index) => ({ key: `p-${index}` }));
  const settings = {
    includeIssues: true,
    includeComponents: true,
    includeAnalyses: false,
    includeTrends: false,
    includePeople: false,
    maxIssues: app.DEFAULT_PORTFOLIO_ISSUES_PER_PROJECT,
    maxComponents: app.DEFAULT_PORTFOLIO_COMPONENTS_PER_PROJECT,
    concurrency: 3,
    rankProjects: true
  };
  const html = app.portfolioPreflight("html", projects, settings, { mode: "summary", issueScope: "active" });
  const xlsx = app.portfolioPreflight("xlsx", projects, settings, { mode: "summary", issueScope: "active" });
  assert.equal(html.ok, true);
  assert.equal(xlsx.ok, true);
  assert.equal(html.estimated.issues, app.MAX_PORTFOLIO_TOTAL_ISSUES);
  assert.equal(html.estimated.components, app.MAX_PORTFOLIO_TOTAL_COMPONENTS);

  const register = app.portfolioPreflight("docx", projects, settings, { mode: "register", issueScope: "active" });
  assert.equal(register.ok, false);
  assert.match(register.errors.join(" "), /at most 2,000 issue rows/);

  const boundedProjects = projects.slice(0, 4);
  const boundedRegister = app.portfolioPreflight("docx", boundedProjects, settings, { mode: "register", issueScope: "active" });
  assert.equal(boundedRegister.ok, true);

  const tooManyComponents = app.portfolioPreflight("html", projects, { ...settings, maxComponents: 1001 }, { mode: "summary" });
  assert.equal(tooManyComponents.ok, false);
  assert.match(tooManyComponents.errors.join(" "), /50,000 component rows/);

  const trendProfile = app.normalizeTemplate({ requiredDatasets: { trends: true } });
  const missingProfileData = app.portfolioPreflight("html", projects.slice(0, 1), settings, { mode: "summary", template: trendProfile });
  assert.equal(missingProfileData.ok, false);
  assert.match(missingProfileData.errors.join(" "), /requires trends/);
  const satisfiedProfile = app.portfolioPreflight("html", projects.slice(0, 1), { ...settings, includeTrends: true }, { mode: "summary", template: trendProfile });
  assert.equal(satisfiedProfile.ok, true);
});

test("portfolio snapshot signatures are deterministic and change only with collection inputs", async () => {
  const app = await loadApp(["core.js", "portfolio-app.js"]);
  const settings = {
    includeIssues: true, includeComponents: true, includeAnalyses: false, includeTrends: false,
    includePeople: false, maxIssues: 500, maxComponents: 1000, concurrency: 3, rankProjects: true
  };
  const first = app.portfolioSnapshotSignature([{ key: "b" }, { key: "a" }], settings);
  assert.equal(first, app.portfolioSnapshotSignature([{ key: "a" }, { key: "b" }], { ...settings }));
  assert.notEqual(first, app.portfolioSnapshotSignature([{ key: "a" }, { key: "b" }], { ...settings, includeTrends: true }));
  assert.notEqual(first, app.portfolioSnapshotSignature([{ key: "a" }, { key: "b" }], { ...settings, concurrency: 2 }));
});
