import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { loadApp, sampleReport } from "./test-helpers.mjs";

const maliciousIssue = {
  key: "AX-1", rule: "repo:rule", type: "BUG", severity: "HIGH", status: "OPEN", resolution: "",
  message: `</script><img src=x onerror=alert(1)> =WEBSERVICE("https://attacker.invalid")`,
  component: "sample:src/App.java", project: "sample", line: "4", textRange: null,
  effort: "5min", assignee: "+cmd|' /C calc'!A0", author: "@SUM(1,1)", tags: ["security"],
  creationDate: "2026-08-18T10:00:00Z", updateDate: "2026-08-18T11:00:00Z", closeDate: "",
  impacts: ["RELIABILITY:HIGH"], cleanCodeAttribute: "CONVENTIONAL"
};

test("offline HTML has a pinned runtime CSP, no network capability, and inert data", async () => {
  const app = await loadApp();
  const report = sampleReport({ issues: [maliciousIssue], issuePaging: { expected: 1, exported: 1, limit: 10000 } });
  const html = app.buildHtmlReport(report, app.BUILTIN_TEMPLATES[1]);
  const actualHash = createHash("sha256").update(app.REPORT_RUNTIME, "utf8").digest("base64");
  assert.equal(actualHash, app.REPORT_RUNTIME_SHA256, "update REPORT_RUNTIME_SHA256 when the audited runtime changes");
  assert.match(html, /connect-src 'none'/);
  assert.match(html, new RegExp(`script-src 'sha256-${actualHash.replace(/[+]/g, "\\+")}'`));
  assert.doesNotMatch(html, /script-src[^;]*'unsafe-inline'/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+href=/i);
  assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//i);
  assert.match(html, /\\u003c\/script\\u003e\\u003cimg/);
  assert.match(app.REPORT_RUNTIME, /beforeprint/);
  assert.match(app.REPORT_RUNTIME, /hashchange/);
});

test("XLSX types validated numbers and UTC dates while untrusted text stays inert", async () => {
  const app = await loadApp();
  const report = sampleReport({ issues: [maliciousIssue], issuePaging: { expected: 1, exported: 1, limit: 10000 } });
  const result = app.buildXlsx(report);
  const bytes = new Uint8Array(await result.blob.arrayBuffer());
  const archiveText = new TextDecoder().decode(bytes);
  assert.match(archiveText, /inlineStr/);
  assert.match(archiveText, /<c r="B[0-9]+" t="n" s="[034]">/);
  assert.match(archiveText, /yyyy-mm-dd hh:mm:ss &quot;UTC&quot;/);
  assert.doesNotMatch(archiveText, /<f(?:\s|>)/i);
  assert.doesNotMatch(archiveText, /externalLinks|vbaProject|<hyperlink|relationships\/hyperlink/i);
  assert.match(archiveText, /&apos;\+cmd\|&apos; \/C calc&apos;!A0/);
  assert.match(archiveText, /&apos;@SUM\(1,1\)/);
});

test("DOCX uses a fixed macro-free OOXML profile and escaped document text", async () => {
  const app = await loadApp(["core.js", "xlsx.js", "docx.js"]);
  const report = sampleReport({
    reportId: "11111111-2222-4333-8444-555555555555",
    issues: [maliciousIssue],
    issuePaging: { expected: 1, exported: 1, limit: 10000 }
  });
  const result = app.buildDocx(report, app.BUILTIN_TEMPLATES[1], { includeIssueRegister: true, issueScope: "all" });
  const archiveText = new TextDecoder().decode(new Uint8Array(await result.blob.arrayBuffer()));
  assert.match(archiveText, /word\/document\.xml/);
  assert.match(archiveText, /<w:tblHeader\/>/);
  assert.match(archiveText, /&lt;\/script&gt;&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(archiveText, /<w:(?:fldSimple|instrText)|altChunk|TargetMode="External"|vbaProject|activeX|embeddings|oleObject/i);
  assert.doesNotMatch(archiveText, /relationships\/hyperlink|attachedTemplate/i);
  assert.equal(result.issueCount, 1);
});

test("DOCX refuses an oversized issue appendix instead of silently truncating", async () => {
  const app = await loadApp(["core.js", "xlsx.js", "docx.js"]);
  const issues = Array.from({ length: app.MAX_DOCX_ISSUES + 1 }, (_, index) => ({ ...maliciousIssue, key: `I-${index}` }));
  assert.throws(
    () => app.buildDocx(sampleReport({ issues }), app.BUILTIN_TEMPLATES[1], { includeIssueRegister: true, issueScope: "all" }),
    /limited to 2,000 rows/
  );
});

test("Office ZIP writer rejects unsafe paths and over-budget packages before final assembly", async () => {
  const app = await loadApp(["core.js", "xlsx.js"]);
  assert.throws(() => app.zipStore({ "../outside.xml": "x" }, 1024), /unsafe Office package path/);
  assert.throws(() => app.zipStore({ "safe.xml": "x".repeat(1024) }, 128), /configured size limit/);
});

test("XLSX truncation never splits a Unicode surrogate pair", async () => {
  const app = await loadApp(["core.js", "xlsx.js"]);
  const longMessage = `${"a".repeat(32765)}😀tail`;
  const result = app.xlsxSafeCell(longMessage, new Set());
  assert.equal(result.length, 32766);
  assert.doesNotMatch(result, /[\uD800-\uDFFF]$/);
  assert.ok(result.endsWith("…"));
});

test("DOCX actionable scope follows the normalized lifecycle shared by other exporters", async () => {
  const app = await loadApp(["core.js", "xlsx.js", "docx.js"]);
  const report = sampleReport({
    issues: [{ ...maliciousIssue, status: "OPEN", lifecycleStatus: "closed" }],
    issuePaging: { expected: 1, exported: 1, limit: 10000 }
  });
  const result = app.buildDocx(report, app.BUILTIN_TEMPLATES[1], { includeIssueRegister: true, issueScope: "active" });
  assert.equal(result.issueCount, 0);
});

test("print-ready HTML discloses exact mode, scope, count, report ID and completeness", async () => {
  const app = await loadApp();
  const report = sampleReport({
    reportId: "11111111-2222-4333-8444-555555555555",
    issues: [maliciousIssue, { ...maliciousIssue, key: "I-2", status: "FIXED", lifecycleStatus: "closed" }],
    issuePaging: { expected: 2, exported: 2, limit: 10000 }
  });
  const html = app.buildHtmlReport(report, app.BUILTIN_TEMPLATES[1], { purpose: "print", mode: "register", issueScope: "active" });
  assert.match(html, /Print export manifest/);
  assert.match(html, /Summary \+ compact issue register/);
  assert.match(html, /Actionable only/);
  assert.match(html, /1 exported \/ 2 collected/);
  assert.match(html, /11111111-2222-4333-8444-555555555555/);
  assert.match(html, /Complete for selected collection scope/);
  assert.match(html, /id="print-now"/);
  assert.match(html, /choose <strong>Save as PDF<\/strong>/);
  assert.match(html, /\.print-toolbar\{display:none!important\}/);
  assert.match(app.REPORT_RUNTIME, /setupPrintView/);
  assert.match(app.REPORT_RUNTIME, /globalThis\.print\(\)/);
});

test("excluded datasets are labeled not collected instead of zero", async () => {
  const app = await loadApp();
  const report = sampleReport({ collectionScope: { issues: false, components: false, analyses: false, people: false } });
  const result = app.buildXlsx(report);
  const archiveText = new TextDecoder().decode(new Uint8Array(await result.blob.arrayBuffer()));
  assert.match(archiveText, /Complete for selected scope/);
  assert.match(archiveText, /Not requested/);
  const html = app.buildHtmlReport(report, app.BUILTIN_TEMPLATES[1]);
  assert.match(html, /"issues":false/);
  assert.match(app.REPORT_RUNTIME, /Issues not collected/);
  assert.match(app.REPORT_RUNTIME, /Excluded by selection/);
});

test("new-code measures and active-versus-historical issue semantics are explicit", async () => {
  const app = await loadApp();
  const issues = [
    { ...maliciousIssue, key: "OPEN-1", status: "OPEN", severity: "CRITICAL", impacts: ["MAINTAINABILITY:HIGH"] },
    { ...maliciousIssue, key: "CLOSED-1", status: "CLOSED", severity: "MAJOR", impacts: ["MAINTAINABILITY:MEDIUM"] },
    { ...maliciousIssue, key: "RESOLVED-1", status: "RESOLVED", severity: "MINOR", impacts: ["MAINTAINABILITY:LOW"] }
  ];
  const report = sampleReport({
    issues,
    rules: [{ key: "repo:rule", name: "Readable rule" }],
    measures: [
      { metric: "coverage", value: "35.1", bestValue: false },
      { metric: "new_coverage", period: { value: "57.5" }, bestValue: false },
      { metric: "new_duplicated_lines_density", period: { value: "1.98547" }, bestValue: true }
    ],
    qualityGate: { status: "ERROR", conditions: [{ status: "ERROR", metricKey: "new_coverage", comparator: "LT", actualValue: "57.5", errorThreshold: "80" }] },
    issuePaging: { expected: 3, exported: 3, limit: 10000 }
  });
  const html = app.buildHtmlReport(report, app.BUILTIN_TEMPLATES[1]);
  assert.match(app.REPORT_RUNTIME, /Actionable issues/);
  assert.match(app.REPORT_RUNTIME, /SonarQube gate result/);
  assert.match(app.REPORT_RUNTIME, /m\.period\.value/);
  assert.match(html, /"value":"57\.5"/);

  const workbook = app.buildXlsx(report);
  const archiveText = new TextDecoder().decode(new Uint8Array(await workbook.blob.arrayBuffer()));
  assert.match(archiveText, /New Code/);
  assert.match(archiveText, /57\.5/);
  assert.match(archiveText, /1\.99%/);
  assert.match(archiveText, /New Code Coverage/);
  assert.doesNotMatch(archiveText, />new_coverage</);
  assert.match(archiveText, /Software Quality/);
  assert.match(archiveText, />Maintainability</);
  assert.match(archiveText, /Impact Severity/);
  assert.match(archiveText, />High</);
  assert.match(archiveText, />Bug</);
  assert.doesNotMatch(archiveText, />BUG</);
  assert.match(archiveText, /Rule Name/);
  assert.match(archiveText, /Readable rule/);
  assert.match(archiveText, /Clean Code Attribute/);
  assert.match(archiveText, /Text Range/);
  assert.match(archiveText, /showGridLines="0"/);
  assert.match(archiveText, /Aptos Display/);
  assert.match(archiveText, /customWidth="1"/);
});
