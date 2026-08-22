import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  BUNDLES,
  BUILD_INPUT_DIGEST_SCOPE,
  BUNDLE_INPUT_DIGEST_SCOPE,
  collectBuildInputPaths,
  digestNamedFiles
} from "./build.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = resolve(dirname(scriptPath), "..");
const SHA256 = /^sha256:[0-9a-f]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

export function parseBuildMetadata(contents, label = "browser bundle") {
  const text = Buffer.isBuffer(contents) ? contents.toString("utf8") : String(contents);
  const match = text.match(/^window\.OfflineReportBuild = Object\.freeze\((\{[^\r\n]+\})\);\r?$/m);
  invariant(match, `${label} does not contain parseable OfflineReportBuild metadata.`);
  const metadata = JSON.parse(match[1]);
  invariant(metadata && typeof metadata === "object" && !Array.isArray(metadata), `${label} build metadata must be an object.`);
  return metadata;
}

function validateSbom(sbom, version) {
  invariant(sbom.bomFormat === "CycloneDX", "Release SBOM must use CycloneDX.");
  invariant(/^1\.[4-9]$/.test(String(sbom.specVersion)), `Unsupported CycloneDX spec version ${sbom.specVersion}.`);
  invariant(sbom.metadata?.component?.version === version, "SBOM root component version does not match the plugin version.");
  invariant(sbom.metadata?.component?.name === "sonar-offline-report-plugin", "SBOM root component identity is incorrect.");
}

async function requireFile(path, label) {
  const details = await stat(path).catch(() => null);
  invariant(details?.isFile() && details.size > 0, `${label} is missing or empty: ${path}`);
  return details;
}

async function exactReleaseFiles(target, version) {
  const expectedJar = `sonar-offline-report-plugin-${version}.jar`;
  const expectedSbom = `sonar-offline-report-plugin-${version}.cdx.json`;
  const names = await readdir(target);
  const jars = names.filter((name) => /^sonar-offline-report-plugin-.*\.jar$/.test(name));
  const sboms = names.filter((name) => /^sonar-offline-report-plugin-.*\.cdx\.json$/.test(name));
  invariant(jars.length === 1 && jars[0] === expectedJar, `Expected exactly ${expectedJar}; found ${jars.join(", ") || "none"}.`);
  invariant(sboms.length === 1 && sboms[0] === expectedSbom, `Expected exactly ${expectedSbom}; found ${sboms.join(", ") || "none"}.`);
  return Object.freeze({
    jar: resolve(target, expectedJar),
    sbom: resolve(target, expectedSbom),
    provenance: resolve(target, `sonar-offline-report-plugin-${version}.provenance.json`),
    validation: resolve(target, `sonar-offline-report-plugin-${version}.validation.tar.gz`)
  });
}

function validateReleaseRevision(metadata, expectedRevision, label) {
  if (!expectedRevision) return;
  invariant(metadata.sourceRevision === expectedRevision, `${label} source revision does not match the release commit.`);
  invariant(metadata.sourceRevisionBase === expectedRevision, `${label} source revision base does not match the release commit.`);
  invariant(metadata.sourceState === "clean", `${label} was not built from a clean source state.`);
  invariant(metadata.sourceDirty === false, `${label} claims dirty release inputs.`);
  invariant(metadata.sourceRevisionVerified === true, `${label} source revision was not verified by the build.`);
}

export async function verifyPackagedRelease({ root = defaultRoot, expectedRevision = null, requireValidation = false } = {}) {
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const version = packageJson.version;
  invariant(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version), `Invalid package version ${version}.`);
  const normalizedRevision = expectedRevision ? String(expectedRevision).trim().toLowerCase() : null;
  if (normalizedRevision) invariant(/^[0-9a-f]{40,64}$/.test(normalizedRevision), "Release source revision must be a full hexadecimal Git object ID.");

  const target = resolve(root, "target");
  const files = await exactReleaseFiles(target, version);
  const jarDetails = await requireFile(files.jar, "Release JAR");
  const sbomDetails = await requireFile(files.sbom, "Release SBOM");
  const sbomBytes = await readFile(files.sbom);
  const sbom = JSON.parse(sbomBytes.toString("utf8"));
  validateSbom(sbom, version);
  const validationDetails = await stat(files.validation).catch(() => null);
  if (requireValidation) {
    invariant(validationDetails?.isFile() && validationDetails.size > 0, `Release validation evidence is missing or empty: ${files.validation}`);
  } else if (validationDetails) {
    invariant(validationDetails.isFile() && validationDetails.size > 0, `Release validation evidence is not a non-empty file: ${files.validation}`);
  }

  const buildInputPaths = await collectBuildInputPaths(root);
  const sourceDigest = await digestNamedFiles(root, buildInputPaths, BUILD_INPUT_DIGEST_SCOPE);
  const temporary = await mkdtemp(join(tmpdir(), "offline-report-release-"));
  try {
    const jarEntries = ["META-INF/MANIFEST.MF", ...BUNDLES.map((bundle) => `static/${bundle.output}`)];
    await execFileAsync("jar", ["--extract", "--file", files.jar, ...jarEntries], {
      cwd: temporary, encoding: "utf8", windowsHide: true
    });
    const manifest = await readFile(resolve(temporary, "META-INF/MANIFEST.MF"), "utf8");
    invariant(new RegExp(`^Plugin-Version: ${version.replaceAll(".", "\\.")}\\r?$`, "m").test(manifest), "JAR manifest plugin version is incorrect.");

    const packagedFrontends = [];
    for (const bundle of BUNDLES) {
      const label = `static/${bundle.output}`;
      const generatedPath = resolve(root, "src/main/resources/static", bundle.output);
      const packagedPath = resolve(temporary, label);
      const generated = await readFile(generatedPath);
      const packaged = await readFile(packagedPath);
      invariant(generated.equals(packaged), `${label} in the JAR differs from the generated frontend asset.`);
      const metadata = parseBuildMetadata(packaged, label);
      const bundleInputPaths = bundle.inputs.map((name) => `src/main/js/${name}`);
      const bundleSourceDigest = await digestNamedFiles(root, bundleInputPaths, BUNDLE_INPUT_DIGEST_SCOPE);
      invariant(metadata.pluginVersion === version, `${label} plugin version is incorrect.`);
      invariant(metadata.bundleName === bundle.output, `${label} bundle identity is incorrect.`);
      invariant(metadata.sourceDigest === sourceDigest && SHA256.test(metadata.sourceDigest), `${label} source digest does not match the actual build inputs.`);
      invariant(metadata.sourceDigestScope === BUILD_INPUT_DIGEST_SCOPE, `${label} source digest scope is incorrect.`);
      invariant(metadata.bundleSourceDigest === bundleSourceDigest && SHA256.test(metadata.bundleSourceDigest), `${label} bundle source digest does not match its ordered JavaScript inputs.`);
      invariant(metadata.bundleSourceDigestScope === BUNDLE_INPUT_DIGEST_SCOPE, `${label} bundle source digest scope is incorrect.`);
      invariant(metadata.pluginArtifactDigest === null && metadata.pluginArtifactDigestState === "not_computed", `${label} must not claim a self-referential plugin artifact digest.`);
      validateReleaseRevision(metadata, normalizedRevision, label);
      packagedFrontends.push(Object.freeze({
        jarEntry: label,
        size: packaged.length,
        digest: Object.freeze({ sha256: sha256(packaged) }),
        bundleSourceDigest: metadata.bundleSourceDigest
      }));
    }

    const jarBytes = await readFile(files.jar);
    const subjects = [
      Object.freeze({ name: basename(files.jar), size: jarDetails.size, digest: Object.freeze({ sha256: sha256(jarBytes) }) }),
      Object.freeze({ name: basename(files.sbom), size: sbomDetails.size, digest: Object.freeze({ sha256: sha256(sbomBytes) }) })
    ];
    if (validationDetails) {
      const validationBytes = await readFile(files.validation);
      subjects.push(Object.freeze({
        name: basename(files.validation),
        size: validationDetails.size,
        digest: Object.freeze({ sha256: sha256(validationBytes) })
      }));
    }
    return Object.freeze({
      version,
      files,
      sourceDigest,
      sourceDigestScope: BUILD_INPUT_DIGEST_SCOPE,
      subjects: Object.freeze(subjects),
      packagedFrontends: Object.freeze(packagedFrontends)
    });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export function releaseManifest(verified, environment) {
  const sourceRevision = String(environment.GITHUB_SHA || "").trim().toLowerCase();
  invariant(/^[0-9a-f]{40,64}$/.test(sourceRevision), "GITHUB_SHA must be a full hexadecimal Git object ID.");
  const sourceRef = String(environment.GITHUB_REF || "");
  invariant(sourceRef === `refs/tags/v${verified.version}`, `Release ref ${sourceRef || "(missing)"} does not match v${verified.version}.`);
  const repository = String(environment.GITHUB_REPOSITORY || "");
  const server = String(environment.GITHUB_SERVER_URL || "").replace(/\/$/, "");
  const runId = String(environment.GITHUB_RUN_ID || "");
  invariant(repository && server && runId, "GitHub repository, server URL, and workflow run ID are required.");
  return {
    schemaVersion: 2,
    artifactVersion: verified.version,
    sourceRepository: `${server}/${repository}`,
    sourceRevision,
    sourceDigest: verified.sourceDigest,
    sourceDigestScope: verified.sourceDigestScope,
    sourceRef,
    workflowRun: `${server}/${repository}/actions/runs/${runId}`,
    subjects: verified.subjects,
    packagedFrontends: verified.packagedFrontends
  };
}

export async function main({ root = defaultRoot, argv = process.argv.slice(2), environment = process.env } = {}) {
  const write = argv.includes("--write");
  const expectedRevision = write ? environment.GITHUB_SHA : environment.RELEASE_SOURCE_REVISION || null;
  const verified = await verifyPackagedRelease({ root, expectedRevision, requireValidation: write });
  if (write) {
    const manifest = releaseManifest(verified, environment);
    await writeFile(verified.files.provenance, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(`Wrote ${verified.files.provenance}`);
  } else {
    console.log(`Verified ${basename(verified.files.jar)} with ${verified.packagedFrontends.length} exact packaged frontend bundles.`);
  }
  return verified;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === scriptPath) await main();
