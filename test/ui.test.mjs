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
  assert.match(markup, /Print \/ Save as PDF/);
  assert.match(markup, /<summary>Data-only formats<\/summary>/);
  assert.match(markup, /Advanced data and appearance/);
  assert.match(markup, /aria-label="Report creation progress"/);
  assert.match(source, /Data needs refresh/);
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
