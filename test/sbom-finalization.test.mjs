import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { finalizeSbom, releaseSbomSerial, uuidV5 } from "../scripts/finalize-sbom.mjs";

const RELEASE = Object.freeze({
  version: "2.0.1",
  repository: "architonixlabs/sonar-offline-report-plugin",
  revision: "0123456789abcdef0123456789abcdef01234567",
  tag: "v2.0.1"
});

function fixture() {
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    version: 1,
    metadata: { component: { type: "application", name: "sonar-offline-report-plugin", version: RELEASE.version } },
    components: []
  };
}

test("UUID v5 generation follows the RFC namespace algorithm", () => {
  assert.equal(uuidV5("https://www.widgets.com"), "42343567-6fc3-5a6a-80a2-83d9a01cadaa");
});

test("release SBOM serial is deterministic and release-bound", () => {
  const serial = releaseSbomSerial(RELEASE);
  assert.match(serial, /^urn:uuid:[0-9a-f-]{36}$/);
  assert.equal(releaseSbomSerial(RELEASE), serial);
  assert.notEqual(releaseSbomSerial({ ...RELEASE, revision: "f".repeat(40) }), serial);
  assert.throws(() => releaseSbomSerial({ ...RELEASE, revision: "short" }), /full hexadecimal Git object ID/);
});

test("CycloneDX finalization is idempotent and refuses a foreign serial", async () => {
  const directory = await mkdtemp(join(tmpdir(), "offline-report-sbom-test-"));
  const path = join(directory, "bom.json");
  try {
    await writeFile(path, `${JSON.stringify(fixture(), null, 2)}\n`, "utf8");
    const first = await finalizeSbom({ path, ...RELEASE });
    const firstBytes = await readFile(path);
    const second = await finalizeSbom({ path, ...RELEASE });
    const secondBytes = await readFile(path);
    const persisted = JSON.parse(firstBytes.toString("utf8"));
    assert.equal(first.serialNumber, releaseSbomSerial(RELEASE));
    assert.match(first.serialNumber, /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.ok(persisted.bomFormat && persisted.specVersion && persisted.serialNumber, "actions/attest CycloneDX discriminator fields must all be present in the finalized file");
    assert.equal(second.serialNumber, first.serialNumber);
    assert.deepEqual(secondBytes, firstBytes);

    await writeFile(path, `${JSON.stringify({ ...fixture(), serialNumber: "urn:uuid:12345678-1234-4123-8123-123456789abc" })}\n`, "utf8");
    await assert.rejects(() => finalizeSbom({ path, ...RELEASE }), /Refusing to replace/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CycloneDX finalization validates release identity", async () => {
  const directory = await mkdtemp(join(tmpdir(), "offline-report-sbom-test-"));
  const path = join(directory, "bom.json");
  try {
    await writeFile(path, `${JSON.stringify(fixture())}\n`, "utf8");
    await assert.rejects(() => finalizeSbom({ path, ...RELEASE, tag: "v2.0.0" }), /does not match/);
    await writeFile(path, `${JSON.stringify({ ...fixture(), bomFormat: "Other" })}\n`, "utf8");
    await assert.rejects(() => finalizeSbom({ path, ...RELEASE }), /must use CycloneDX/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
