import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { loadApp } from "./test-helpers.mjs";

test("plugin page provides a viewport scrollbar, bottom clearance, and a guided export workflow", async () => {
  const source = await readFile(resolve(import.meta.dirname, "../src/main/js/app.js"), "utf8");
  const markup = source.slice(source.indexOf("root.innerHTML"));

  assert.match(markup, /<main class="page page-limited orp">/);
  assert.match(source, /overflow-y:scroll/);
  assert.match(source, /scrollbar-gutter:stable/);
  assert.match(source, /function fitScrollViewport/);
  assert.match(source, /--orp-available-height/);
  assert.match(markup, /class="orp-end-space" aria-hidden="true"/);
  assert.match(source, /height:clamp\(128px,16vh,220px\)/);
  assert.match(markup, /Choose a report/);
  assert.match(markup, /Offline HTML/);
  assert.match(markup, /Excel/);
  assert.match(markup, /Word/);
  assert.match(markup, /<strong>PDF<\/strong>/);
  assert.match(markup, /Opens a print-ready view; choose Save as PDF/);
  assert.match(source, /print-ready HTML file was downloaded/);
  assert.doesNotMatch(source, /printWindow\.print\(\)/);
  assert.match(markup, /<summary>Data-only formats<\/summary>/);
  assert.match(markup, /Data scope and appearance/);
  assert.match(markup, /aria-label="Report creation progress"/);
  assert.match(source, /Data needs refresh/);
  assert.match(source, /createArtifactReport\(collected, format/);
  assert.match(source, /result\.artifactComplete !== undefined/);
  assert.match(source, /controller\.signal\.aborted/);
  assert.match(source, /async function confirmDownloadAllowed\(\)/);
  assert.match(source, /contextPath.*extension\/offlinereport\/portfolio_page/s);
  assert.match(source, /minimum evidence/);
  assert.match(source, /min-height:44px/);
});

test("snapshot signatures distinguish data scope but not presentation choices", async () => {
  const app = await loadApp(["core.js", "app.js"]);
  const component = { key: "project-a" };
  const baseline = { includeIssues: true, includeComponents: true, includeAnalyses: true, includePeople: false, maxIssues: 10000, maxComponents: 10000 };

  assert.equal(app.snapshotSignature(component, null, baseline), app.snapshotSignature(component, null, { ...baseline }));
  assert.notEqual(app.snapshotSignature(component, null, baseline), app.snapshotSignature(component, null, { ...baseline, includePeople: true }));
  assert.notEqual(app.snapshotSignature(component, null, baseline), app.snapshotSignature(component, null, { ...baseline, maxIssues: 500 }));
  const snapshot = app.freezeSnapshot({ issues: [{ key: "I-1" }] });
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.issues), true);
  assert.equal(Object.isFrozen(snapshot.issues[0]), true);
});

test("portfolio page exposes the bounded guided workflow and deeply freezes its export snapshot", async () => {
  const source = await readFile(resolve(import.meta.dirname, "../src/main/js/portfolio-app.js"), "utf8");
  assert.match(source, /Portfolio \/ multi-project/);
  assert.match(source, /Search projects/);
  assert.match(source, /Select all visible/);
  assert.match(source, /Concurrent projects/);
  assert.match(source, /Historical metric trends/);
  assert.match(source, /Complete.*Partial.*Failed.*Denied.*Pending/s);
  assert.match(source, /one-to-four|Math\.min\(4/);
  assert.match(source, /printWindow\.opener = null/);
  assert.match(source, /min-height:44px/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /function ensurePortfolioSnapshot/);
  assert.match(source, /snapshot && preparedSignature === signature/);
  assert.match(source, /createArtifactReport\(collected, format/);
  assert.match(source, /full_model_v3_and_rendered_views/);
  assert.match(source, /rendered_views_only/);
  assert.match(source, /result\.artifactComplete !== undefined/);
  assert.match(source, /contextPath.*\/projects/s);
  assert.match(source, /No report was downloaded/);
  assert.match(source, /async function confirmDownloadAllowed\(\)/);
  assert.match(source, /MAX_PORTFOLIO_TOTAL_ISSUES = 25000/);
  assert.match(source, /@media\(max-width:520px\)/);
  const app = await loadApp(["core.js", "portfolio-app.js"]);
  const snapshot = app.freezePortfolioSnapshot({ projects: [{ issues: [{ key: "I-1" }] }] });
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.projects), true);
  assert.equal(Object.isFrozen(snapshot.projects[0].issues[0]), true);
});
