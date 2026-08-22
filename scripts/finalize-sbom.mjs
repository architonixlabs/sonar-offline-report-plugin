import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = resolve(dirname(scriptPath), "..");
const UUID_NAMESPACE_URL = Buffer.from("6ba7b8119dad11d180b400c04fd430c8", "hex");
const FULL_GIT_OBJECT_ID = /^[0-9a-f]{40,64}$/;
const CYCLONEDX_SERIAL = /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function uuidV5(name) {
  const digest = createHash("sha1").update(UUID_NAMESPACE_URL).update(String(name), "utf8").digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function releaseSbomSerial({ repository, revision, tag }) {
  const normalizedRepository = String(repository || "").trim().toLowerCase();
  const normalizedRevision = String(revision || "").trim().toLowerCase();
  const normalizedTag = String(tag || "").trim();
  invariant(/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/.test(normalizedRepository), "GITHUB_REPOSITORY must be an owner/name pair.");
  invariant(FULL_GIT_OBJECT_ID.test(normalizedRevision), "GITHUB_SHA must be a full hexadecimal Git object ID.");
  invariant(/^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(normalizedTag), "GITHUB_REF_NAME must be a semantic release tag.");
  return `urn:uuid:${uuidV5(`https://github.com/${normalizedRepository}/releases/${normalizedTag}@${normalizedRevision}`)}`;
}

export async function finalizeSbom({ path, version, repository, revision, tag }) {
  const contents = await readFile(path, "utf8");
  const sbom = JSON.parse(contents);
  invariant(sbom && typeof sbom === "object" && !Array.isArray(sbom), "Release SBOM must be a JSON object.");
  invariant(sbom.bomFormat === "CycloneDX", "Release SBOM must use CycloneDX.");
  invariant(/^1\.[4-9]$/.test(String(sbom.specVersion)), `Unsupported CycloneDX spec version ${sbom.specVersion}.`);
  invariant(sbom.metadata?.component?.name === "sonar-offline-report-plugin", "SBOM root component identity is incorrect.");
  invariant(sbom.metadata?.component?.version === version, "SBOM root component version does not match the release version.");
  invariant(tag === `v${version}`, `Release tag ${tag || "(missing)"} does not match v${version}.`);

  const serialNumber = releaseSbomSerial({ repository, revision, tag });
  invariant(!sbom.serialNumber || sbom.serialNumber === serialNumber, "Refusing to replace a non-deterministic or foreign SBOM serial number.");
  const finalized = { ...sbom, serialNumber };
  invariant(CYCLONEDX_SERIAL.test(finalized.serialNumber), "Finalized CycloneDX serial number is invalid.");

  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(finalized, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
  return finalized;
}

export async function main({ root = defaultRoot, environment = process.env } = {}) {
  const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const version = packageJson.version;
  const tag = String(environment.GITHUB_REF_NAME || "").trim();
  const path = resolve(root, "target", `sonar-offline-report-plugin-${version}.cdx.json`);
  const finalized = await finalizeSbom({
    path,
    version,
    repository: environment.GITHUB_REPOSITORY,
    revision: environment.GITHUB_SHA,
    tag
  });
  console.log(`Finalized ${path} as ${finalized.serialNumber}`);
  return finalized;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === scriptPath) await main();
