import assert from "node:assert/strict";
import test from "node:test";
import { loadApp, sampleReport } from "./test-helpers.mjs";

test("built-in profiles declare a persona and the evidence they require", async () => {
  const app = await loadApp(["core.js"]);
  const profiles = new Map(app.BUILTIN_TEMPLATES.map((profile) => [profile.id, app.normalizeTemplate(profile)]));

  for (const id of ["executive", "executive-technical", "technical", "issues", "portfolio", "delivery", "security", "qa-audit"]) {
    assert.ok(profiles.has(id), `missing ${id} profile`);
    assert.notEqual(profiles.get(id).persona, "General", `${id} must identify its intended persona`);
  }

  assert.equal(profiles.get("executive").requiredDatasets.trends, true);
  assert.equal(profiles.get("security").requiredDatasets.issues, true);
  assert.equal(profiles.get("security").requiredDatasets.trends, true);
  assert.equal(profiles.get("qa-audit").requiredDatasets.components, true);
  assert.equal(profiles.get("qa-audit").requiredDatasets.analyses, true);
  assert.equal(profiles.get("issues").requiredDatasets.people, false);
});

test("template persona requirements are bounded and unknown datasets are discarded", async () => {
  const app = await loadApp(["core.js"]);
  const normalized = app.normalizeTemplate({
    schemaVersion: 2,
    persona: "A".repeat(100),
    requiredDatasets: { issues: true, sourceCode: true, people: false }
  });

  assert.equal(normalized.persona.length, 60);
  assert.deepEqual(Object.keys(normalized.requiredDatasets), ["issues", "components", "analyses", "trends", "people"]);
  assert.equal(normalized.requiredDatasets.issues, true);
  assert.equal(normalized.requiredDatasets.people, false);
  assert.equal("sourceCode" in normalized.requiredDatasets, false);
});

test("custom accent colors retain accessible contrast for text and controls", async () => {
  const app = await loadApp(["core.js"]);
  const fallback = app.normalizeTemplate(app.BUILTIN_TEMPLATES.find((profile) => profile.id === "technical"));
  const unsafe = app.normalizeTemplate({ ...fallback, id: "custom", accentColor: "#ffffff" }, fallback);
  const safe = app.normalizeTemplate({ ...fallback, id: "custom", accentColor: "#7a3e00" }, fallback);

  assert.equal(unsafe.accentColor, fallback.accentColor);
  assert.ok(app.colorContrastWithWhite(safe.accentColor) >= 4.5);
  assert.equal(safe.accentColor, "#7a3e00");
});

test("manifest carries collection, artifact, server, and source provenance independently", async () => {
  const app = await loadApp(["core.js"]);
  const report = sampleReport({
    generatedAt: "2026-08-22T10:05:00.000Z",
    collectedAt: "2026-08-22T10:00:00.000Z",
    collectionComplete: true,
    serverBaseUrl: "https://sonar.example.test/sonarqube",
    serverBaseUrlScope: "origin_and_context_path",
    sourceRevision: "0123456789abcdef0123456789abcdef01234567",
    sourceDigest: "a".repeat(64),
    artifact: {
      format: "html",
      exportedAt: "2026-08-22T10:05:00.000Z",
      collectionComplete: true,
      artifactComplete: false,
      artifactDigest: null,
      artifactDigestState: "not_computed",
      warnings: ["Renderer intentionally omitted an unsupported dataset."]
    }
  });
  const manifest = app.reportManifest(report);

  assert.equal(manifest.collectedAt, "2026-08-22T10:00:00.000Z");
  assert.equal(manifest.collectionComplete, true);
  assert.equal(manifest.artifact.artifactComplete, false);
  assert.equal(manifest.serverBaseUrl, "https://sonar.example.test/sonarqube");
  assert.equal(manifest.sourceDigest, "a".repeat(64));
  assert.equal(manifest.artifactDigestState, "not_computed");
  assert.match(manifest.warnings.join("\n"), /intentionally omitted/);
});
