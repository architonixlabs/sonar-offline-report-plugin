import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  BUILD_INPUT_DIGEST_SCOPE,
  BUNDLES,
  BUNDLE_INPUT_DIGEST_SCOPE,
  collectBuildInputPaths,
  digestNamedFiles,
  resolveSourceRevision
} from "../scripts/build.mjs";
import { parseBuildMetadata, releaseManifest } from "../scripts/release-provenance.mjs";

const REVISION = "0123456789abcdef0123456789abcdef01234567";

test("build input digest is framed, deterministic, and changes with exact bytes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "offline-report-digest-test-"));
  try {
    await writeFile(join(directory, "a.txt"), "ab", "utf8");
    await writeFile(join(directory, "b.txt"), "c", "utf8");
    const first = await digestNamedFiles(directory, ["a.txt", "b.txt"], "test-v1");
    const repeat = await digestNamedFiles(directory, ["a.txt", "b.txt"], "test-v1");
    const reordered = await digestNamedFiles(directory, ["b.txt", "a.txt"], "test-v1");
    await writeFile(join(directory, "a.txt"), "a", "utf8");
    await writeFile(join(directory, "b.txt"), "bc", "utf8");
    const reframed = await digestNamedFiles(directory, ["a.txt", "b.txt"], "test-v1");
    assert.match(first, /^sha256:[0-9a-f]{64}$/);
    assert.equal(repeat, first);
    assert.notEqual(reordered, first);
    assert.notEqual(reframed, first);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("build input scope includes source inputs and excludes self-referential generated bundles", async () => {
  const paths = await collectBuildInputPaths();
  assert.ok(paths.includes("src/main/js/api.js"));
  assert.ok(paths.includes("src/main/js/portfolio-app.js"));
  assert.ok(paths.includes("src/main/java/com/architonix/sonarqube/offlinereport/OfflineReportPlugin.java"));
  assert.ok(paths.includes("pom.xml"));
  assert.ok(!paths.includes("src/main/resources/static/report_page.js"));
  assert.ok(!paths.includes("src/main/resources/static/portfolio_page.js"));
  assert.equal(BUILD_INPUT_DIGEST_SCOPE, "plugin-build-inputs-v1");
});

test("dirty source provenance never presents the base commit as an exact revision", () => {
  const result = resolveSourceRevision({
    provenance: true,
    gitState: { available: true, head: REVISION, dirty: true, changes: [" M src/main/js/api.js"] }
  });
  assert.deepEqual(result, {
    sourceRevision: null,
    sourceRevisionBase: REVISION,
    sourceState: "dirty",
    sourceDirty: true,
    sourceRevisionVerified: false
  });
});

test("clean release provenance requires and records a verified matching revision", () => {
  const clean = resolveSourceRevision({
    requestedRevision: REVISION.toUpperCase(),
    provenance: true,
    requireClean: true,
    gitState: { available: true, head: REVISION, dirty: false, changes: [] }
  });
  assert.equal(clean.sourceRevision, REVISION);
  assert.equal(clean.sourceState, "clean");
  assert.equal(clean.sourceRevisionVerified, true);
  assert.throws(() => resolveSourceRevision({
    requestedRevision: "f".repeat(40),
    provenance: true,
    requireClean: true,
    gitState: { available: true, head: REVISION, dirty: false, changes: [] }
  }), /does not match checked-out HEAD/);
  assert.throws(() => resolveSourceRevision({
    provenance: true,
    requireClean: true,
    gitState: { available: true, head: REVISION, dirty: true, changes: [" M pom.xml"] }
  }), /build inputs are dirty/);
});

test("an environment revision without Git verification is retained only as an unverified base", () => {
  const declared = resolveSourceRevision({
    requestedRevision: REVISION,
    provenance: true,
    gitState: { available: false, head: null, dirty: null, changes: [] }
  });
  assert.equal(declared.sourceRevision, null);
  assert.equal(declared.sourceRevisionBase, REVISION);
  assert.equal(declared.sourceState, "declared");
  assert.equal(declared.sourceRevisionVerified, false);
});

test("build metadata parser rejects an absent envelope and parses a valid one", () => {
  const valid = `/* banner */\nwindow.OfflineReportBuild = Object.freeze(${JSON.stringify({ pluginVersion: "2.0.0", sourceDigest: `sha256:${"a".repeat(64)}` })});\n`;
  assert.equal(parseBuildMetadata(valid).pluginVersion, "2.0.0");
  assert.throws(() => parseBuildMetadata("window.OfflineReportBuild = {};"), /does not contain parseable/);
});

test("generated browser metadata identifies the exact build and ordered bundle inputs", async () => {
  const sourceDigest = await digestNamedFiles(process.cwd(), await collectBuildInputPaths(), BUILD_INPUT_DIGEST_SCOPE);
  for (const bundle of BUNDLES) {
    const contents = await readFile(join(process.cwd(), "src/main/resources/static", bundle.output));
    const metadata = parseBuildMetadata(contents, bundle.output);
    const bundleDigest = await digestNamedFiles(
      process.cwd(),
      bundle.inputs.map((name) => `src/main/js/${name}`),
      BUNDLE_INPUT_DIGEST_SCOPE
    );
    assert.equal(metadata.pluginVersion, "2.0.0");
    assert.equal(metadata.sourceDigest, sourceDigest);
    assert.equal(metadata.sourceDigestScope, BUILD_INPUT_DIGEST_SCOPE);
    assert.equal(metadata.bundleSourceDigest, bundleDigest);
    assert.equal(metadata.bundleSourceDigestScope, BUNDLE_INPUT_DIGEST_SCOPE);
    assert.equal(metadata.bundleName, bundle.output);
    assert.equal(metadata.sourceRevision, null);
    assert.equal(metadata.sourceState, "unstamped");
    assert.equal(metadata.sourceDirty, null);
    assert.equal(metadata.pluginArtifactDigest, null);
    assert.equal(metadata.pluginArtifactDigestState, "not_computed");
  }
});

test("release manifest binds subjects and packaged frontends to the exact tag and commit", () => {
  const verified = {
    version: "2.0.0",
    sourceDigest: `sha256:${"b".repeat(64)}`,
    sourceDigestScope: BUILD_INPUT_DIGEST_SCOPE,
    subjects: [{ name: "plugin.jar", digest: { sha256: "c".repeat(64) } }],
    packagedFrontends: [{ jarEntry: "static/report_page.js", digest: { sha256: "d".repeat(64) } }]
  };
  const manifest = releaseManifest(verified, {
    GITHUB_SHA: REVISION,
    GITHUB_REF: "refs/tags/v2.0.0",
    GITHUB_REPOSITORY: "architonixlabs/sonar-offline-report-plugin",
    GITHUB_SERVER_URL: "https://github.com/",
    GITHUB_RUN_ID: "123"
  });
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.sourceRevision, REVISION);
  assert.equal(manifest.sourceDigest, verified.sourceDigest);
  assert.equal(manifest.subjects, verified.subjects);
  assert.equal(manifest.packagedFrontends, verified.packagedFrontends);
  assert.equal(manifest.workflowRun, "https://github.com/architonixlabs/sonar-offline-report-plugin/actions/runs/123");
  assert.throws(() => releaseManifest(verified, {
    GITHUB_SHA: REVISION,
    GITHUB_REF: "refs/tags/v1.0.0",
    GITHUB_REPOSITORY: "architonixlabs/sonar-offline-report-plugin",
    GITHUB_SERVER_URL: "https://github.com",
    GITHUB_RUN_ID: "123"
  }), /does not match v2\.0\.0/);
});
