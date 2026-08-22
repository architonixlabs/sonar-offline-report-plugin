import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = resolve(dirname(scriptPath), "..");

export const BUILD_INPUT_DIGEST_SCOPE = "plugin-build-inputs-v1";
export const BUNDLE_INPUT_DIGEST_SCOPE = "ordered-browser-source-inputs-v1";
export const GENERATED_BUNDLE_PATHS = Object.freeze([
  "src/main/resources/static/report_page.js",
  "src/main/resources/static/portfolio_page.js"
]);
export const COMMON_INPUTS = Object.freeze([
  "core.js", "analytics.js", "xlsx.js", "docx.js", "api.js", "html-report.js", "portfolio-html.js"
]);
export const BUNDLES = Object.freeze([
  Object.freeze({ output: "report_page.js", inputs: Object.freeze([...COMMON_INPUTS, "app.js", "index.js"]) }),
  Object.freeze({ output: "portfolio_page.js", inputs: Object.freeze([...COMMON_INPUTS, "portfolio-app.js", "portfolio-index.js"]) })
]);

const FIXED_BUILD_INPUTS = Object.freeze([
  "LICENSE", "NOTICE", "package.json", "package-lock.json", "pom.xml", "scripts/build.mjs"
]);
const BUILD_INPUT_ROOTS = Object.freeze(["src/main/java", "src/main/js", "src/main/resources"]);

function portablePath(value) {
  return value.replaceAll("\\", "/");
}

async function filesBelow(root, directory) {
  const absolute = resolve(root, directory);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const child = resolve(absolute, entry.name);
    const childRelative = portablePath(relative(root, child));
    if (entry.isDirectory()) files.push(...await filesBelow(root, childRelative));
    else if (entry.isFile()) files.push(childRelative);
    else throw new Error(`Build input must be a regular file: ${childRelative}`);
  }
  return files;
}

export async function collectBuildInputPaths(root = defaultRoot) {
  const paths = [...FIXED_BUILD_INPUTS];
  for (const directory of BUILD_INPUT_ROOTS) paths.push(...await filesBelow(root, directory));
  const generated = new Set(GENERATED_BUNDLE_PATHS);
  const unique = [...new Set(paths.map(portablePath).filter((name) => !generated.has(name)))].sort();
  for (const name of unique) {
    const details = await stat(resolve(root, name));
    if (!details.isFile()) throw new Error(`Build input must be a regular file: ${name}`);
  }
  return unique;
}

export async function digestNamedFiles(root, paths, scope) {
  const hash = createHash("sha256");
  hash.update(`${scope}\0`, "utf8");
  for (const input of paths) {
    const name = portablePath(input);
    const nameBytes = Buffer.from(name, "utf8");
    const contents = await readFile(resolve(root, name));
    hash.update(`${nameBytes.length}:`, "ascii");
    hash.update(nameBytes);
    hash.update(`${contents.length}:`, "ascii");
    hash.update(contents);
  }
  return `sha256:${hash.digest("hex")}`;
}

function statusPath(line) {
  const candidate = line.length > 3 ? line.slice(3) : line;
  const destination = candidate.includes(" -> ") ? candidate.slice(candidate.lastIndexOf(" -> ") + 4) : candidate;
  return portablePath(destination.replace(/^"|"$/g, ""));
}

export async function inspectGitSourceState(root = defaultRoot) {
  try {
    const revision = await execFileAsync("git", ["rev-parse", "--verify", "HEAD"], {
      cwd: root, encoding: "utf8", windowsHide: true
    });
    const status = await execFileAsync("git", [
      "status", "--porcelain=v1", "--untracked-files=all", "--",
      ...FIXED_BUILD_INPUTS,
      ...BUILD_INPUT_ROOTS
    ], { cwd: root, encoding: "utf8", windowsHide: true });
    const generated = new Set(GENERATED_BUNDLE_PATHS);
    const changes = status.stdout.split(/\r?\n/).filter(Boolean).filter((line) => {
      const statusCode = line.slice(0, 2);
      const renameOrCopy = statusCode.includes("R") || statusCode.includes("C");
      return renameOrCopy || !generated.has(statusPath(line));
    });
    return Object.freeze({
      available: true,
      head: revision.stdout.trim().toLowerCase(),
      dirty: changes.length > 0,
      changes: Object.freeze(changes)
    });
  } catch {
    return Object.freeze({ available: false, head: null, dirty: null, changes: Object.freeze([]) });
  }
}

export function resolveSourceRevision({ requestedRevision = null, provenance = false, requireClean = false, gitState }) {
  const requested = requestedRevision ? String(requestedRevision).trim().toLowerCase() : null;
  if (requested && !/^[0-9a-f]{7,64}$/.test(requested)) {
    throw new Error("OFFLINE_REPORT_SOURCE_REVISION must be a hexadecimal source revision.");
  }
  if (requireClean && (!gitState.available || gitState.dirty)) {
    const reason = gitState.available ? "build inputs are dirty" : "Git state is unavailable";
    throw new Error(`A clean, verifiable source revision is required, but ${reason}.`);
  }
  if (requested && gitState.available && requested !== gitState.head) {
    throw new Error(`OFFLINE_REPORT_SOURCE_REVISION ${requested} does not match checked-out HEAD ${gitState.head}.`);
  }

  const shouldStampRevision = provenance || !!requested;
  const baseRevision = requested || (shouldStampRevision ? gitState.head : null);
  if (!shouldStampRevision) {
    return Object.freeze({
      sourceRevision: null,
      sourceRevisionBase: null,
      sourceState: "unstamped",
      sourceDirty: null,
      sourceRevisionVerified: false
    });
  }
  if (gitState.available && gitState.dirty) {
    return Object.freeze({
      sourceRevision: null,
      sourceRevisionBase: baseRevision,
      sourceState: "dirty",
      sourceDirty: true,
      sourceRevisionVerified: false
    });
  }
  if (gitState.available && baseRevision) {
    return Object.freeze({
      sourceRevision: baseRevision,
      sourceRevisionBase: baseRevision,
      sourceState: "clean",
      sourceDirty: false,
      sourceRevisionVerified: true
    });
  }
  if (requested) {
    return Object.freeze({
      sourceRevision: null,
      sourceRevisionBase: requested,
      sourceState: "declared",
      sourceDirty: null,
      sourceRevisionVerified: false
    });
  }
  return Object.freeze({
    sourceRevision: null,
    sourceRevisionBase: null,
    sourceState: "unavailable",
    sourceDirty: null,
    sourceRevisionVerified: false
  });
}

function argumentEnabled(name, argv) {
  return argv.includes(name);
}

export async function build({ root = defaultRoot, argv = process.argv.slice(2), env = process.env } = {}) {
  const pom = await readFile(resolve(root, "pom.xml"), "utf8");
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const packageLock = JSON.parse(await readFile(resolve(root, "package-lock.json"), "utf8"));
  const pluginVersion = pom.match(/<artifactId>sonar-offline-report-plugin<\/artifactId>\s*<version>([^<]+)<\/version>/)?.[1];
  if (!pluginVersion) throw new Error("Could not determine the plugin version from pom.xml.");
  if (packageJson.version !== pluginVersion) throw new Error(`package.json ${packageJson.version} does not match pom.xml ${pluginVersion}.`);
  if (packageLock.version !== pluginVersion || packageLock.packages?.[""]?.version !== pluginVersion) {
    throw new Error(`package-lock.json does not match plugin version ${pluginVersion}.`);
  }

  const buildInputPaths = await collectBuildInputPaths(root);
  const sourceDigest = await digestNamedFiles(root, buildInputPaths, BUILD_INPUT_DIGEST_SCOPE);
  const expectedDigest = env.OFFLINE_REPORT_SOURCE_DIGEST ? String(env.OFFLINE_REPORT_SOURCE_DIGEST).trim().toLowerCase() : null;
  if (expectedDigest && !/^sha256:[0-9a-f]{64}$/.test(expectedDigest)) {
    throw new Error("OFFLINE_REPORT_SOURCE_DIGEST must be a sha256:<hex> source digest.");
  }
  if (expectedDigest && expectedDigest !== sourceDigest) {
    throw new Error(`OFFLINE_REPORT_SOURCE_DIGEST does not match the actual ${BUILD_INPUT_DIGEST_SCOPE} digest ${sourceDigest}.`);
  }

  const gitState = await inspectGitSourceState(root);
  const revision = resolveSourceRevision({
    requestedRevision: env.OFFLINE_REPORT_SOURCE_REVISION || null,
    provenance: argumentEnabled("--provenance", argv),
    requireClean: argumentEnabled("--require-clean", argv),
    gitState
  });
  const commonMetadata = Object.freeze({
    pluginVersion,
    ...revision,
    sourceDigest,
    sourceDigestScope: BUILD_INPUT_DIGEST_SCOPE,
    pluginArtifactDigest: null,
    pluginArtifactDigestState: "not_computed"
  });
  const banner = `/* SonarQube Offline Report Plugin ${pluginVersion} - generated; edit src/main/js and run npm run build. */\n`;
  const check = argumentEnabled("--check", argv);
  const results = [];

  for (const bundle of BUNDLES) {
    const inputPaths = bundle.inputs.map((name) => `src/main/js/${name}`);
    const parts = await Promise.all(inputPaths.map((name) => readFile(resolve(root, name), "utf8")));
    const bundleSourceDigest = await digestNamedFiles(root, inputPaths, BUNDLE_INPUT_DIGEST_SCOPE);
    const metadata = Object.freeze({
      ...commonMetadata,
      bundleName: bundle.output,
      bundleSourceDigest,
      bundleSourceDigestScope: BUNDLE_INPUT_DIGEST_SCOPE
    });
    const buildMetadata = `window.OfflineReportBuild = Object.freeze(${JSON.stringify(metadata)});\n`;
    const normalizedParts = parts.map((part) => part.replace(/(?:\r?\n)+$/, ""));
    const output = `${banner}${buildMetadata}${normalizedParts.join("\n\n")}\n`;
    const outputPath = resolve(root, "src/main/resources/static", bundle.output);
    if (check) {
      const current = await readFile(outputPath, "utf8").catch(() => "");
      if (current !== output) {
        console.error(`Static ${bundle.output} is stale; run npm run build.`);
        process.exitCode = 1;
      }
    } else {
      await writeFile(outputPath, output, "utf8");
      console.log(`Built ${outputPath} (${revision.sourceState}, ${sourceDigest})`);
    }
    results.push(Object.freeze({ output: bundle.output, metadata }));
  }
  const finalBuildInputPaths = await collectBuildInputPaths(root);
  const finalSourceDigest = await digestNamedFiles(root, finalBuildInputPaths, BUILD_INPUT_DIGEST_SCOPE);
  if (JSON.stringify(finalBuildInputPaths) !== JSON.stringify(buildInputPaths) || finalSourceDigest !== sourceDigest) {
    throw new Error("Build inputs changed while browser bundles were being generated; discard the outputs and rebuild.");
  }
  if (argumentEnabled("--require-clean", argv)) {
    const finalGitState = await inspectGitSourceState(root);
    if (!finalGitState.available || finalGitState.dirty || finalGitState.head !== gitState.head) {
      throw new Error("Verified Git source state changed while browser bundles were being generated; discard the outputs and rebuild.");
    }
  }
  return Object.freeze(results);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === scriptPath) await build();
