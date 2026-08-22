import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { loadApp, sampleReport } from "./test-helpers.mjs";

const schemaPath = resolve(import.meta.dirname, "../docs/report-model-v3.schema.json");
const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const exportTime = "2026-08-18T12:05:00.000Z";
const provenance = Object.freeze({
  serverBaseUrl: "https://sonarqube.example.test/sonar",
  serverBaseUrlScope: "origin_and_context_path",
  sourceRevision: "abcdef1234567890",
  sourceDigest: `sha256:${"1".repeat(64)}`,
  pluginArtifactDigest: null
});

function resolveReference(reference) {
  assert.match(reference, /^#\//, `Only local schema references are allowed: ${reference}`);
  return reference.slice(2).split("/").map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce((value, part) => value && value[part], schema);
}

function valueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  if (typeof value === "number") return "number";
  return typeof value;
}

function acceptsType(value, expected) {
  if (expected === "number") return typeof value === "number" && Number.isFinite(value);
  if (expected === "integer") return Number.isInteger(value);
  if (expected === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (expected === "array") return Array.isArray(value);
  if (expected === "null") return value === null;
  return typeof value === expected;
}

function validate(value, rule = schema, path = "$") {
  const errors = [];
  if (!rule || typeof rule !== "object") return [`${path}: invalid schema node`];

  if (rule.$ref) errors.push(...validate(value, resolveReference(rule.$ref), path));
  for (const child of rule.allOf || []) errors.push(...validate(value, child, path));
  if (rule.oneOf) {
    const branchErrors = rule.oneOf.map((child) => validate(value, child, path));
    const matches = branchErrors.filter((items) => items.length === 0).length;
    if (matches !== 1) errors.push(`${path}: oneOf matched ${matches} branches`);
  }

  const expectedTypes = rule.type === undefined ? [] : Array.isArray(rule.type) ? rule.type : [rule.type];
  if (expectedTypes.length && !expectedTypes.some((type) => acceptsType(value, type))) {
    errors.push(`${path}: expected ${expectedTypes.join(" or ")}, received ${valueType(value)}`);
    return errors;
  }
  if (Object.hasOwn(rule, "const") && !Object.is(value, rule.const)) {
    errors.push(`${path}: expected const ${JSON.stringify(rule.const)}`);
  }
  if (rule.enum && !rule.enum.some((entry) => Object.is(entry, value))) {
    errors.push(`${path}: expected one of ${JSON.stringify(rule.enum)}`);
  }

  if (typeof value === "string") {
    if (rule.minLength !== undefined && value.length < rule.minLength) errors.push(`${path}: shorter than minLength`);
    if (rule.maxLength !== undefined && value.length > rule.maxLength) errors.push(`${path}: longer than maxLength`);
    if (rule.pattern && !(new RegExp(rule.pattern)).test(value)) errors.push(`${path}: does not match ${rule.pattern}`);
    if (rule.format === "date-time" && (!/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value)))) {
      errors.push(`${path}: invalid date-time`);
    }
    if (rule.format === "uuid" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      errors.push(`${path}: invalid UUID`);
    }
    if (rule.format === "uri") {
      try {
        const parsed = new URL(value);
        if (!parsed.protocol) errors.push(`${path}: invalid URI`);
      } catch {
        errors.push(`${path}: invalid URI`);
      }
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (rule.minimum !== undefined && value < rule.minimum) errors.push(`${path}: below minimum ${rule.minimum}`);
    if (rule.maximum !== undefined && value > rule.maximum) errors.push(`${path}: above maximum ${rule.maximum}`);
  }

  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems) errors.push(`${path}: fewer than ${rule.minItems} items`);
    if (rule.maxItems !== undefined && value.length > rule.maxItems) errors.push(`${path}: more than ${rule.maxItems} items`);
    if (rule.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(item));
      if (new Set(serialized).size !== serialized.length) errors.push(`${path}: items are not unique`);
    }
    if (rule.items) value.forEach((item, index) => errors.push(...validate(item, rule.items, `${path}[${index}]`)));
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const properties = rule.properties || {};
    for (const property of rule.required || []) {
      if (!Object.hasOwn(value, property)) errors.push(`${path}: missing required property ${property}`);
    }
    for (const [property, child] of Object.entries(properties)) {
      if (Object.hasOwn(value, property)) errors.push(...validate(value[property], child, `${path}.${property}`));
    }
    const additional = Object.keys(value).filter((property) => !Object.hasOwn(properties, property));
    if (rule.additionalProperties === false) {
      additional.forEach((property) => errors.push(`${path}.${property}: additional property is not allowed`));
    } else if (rule.additionalProperties && typeof rule.additionalProperties === "object") {
      additional.forEach((property) => errors.push(...validate(value[property], rule.additionalProperties, `${path}.${property}`)));
    }
  }
  return errors;
}

function allReferences(node, found = []) {
  if (!node || typeof node !== "object") return found;
  if (typeof node.$ref === "string") found.push(node.$ref);
  Object.values(node).forEach((child) => allReferences(child, found));
  return found;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function singleSnapshot(app) {
  const datasetStates = {
    serverMetadata: { requested: true, state: "complete" },
    measures: { requested: true, state: "complete" },
    qualityGate: { requested: true, state: "complete" },
    issues: { requested: true, state: "complete" },
    components: { requested: true, state: "complete" },
    analyses: { requested: true, state: "complete" },
    trends: { requested: true, state: "complete" },
    analysisSnapshot: { requested: true, state: "complete", method: "project_analysis_date_before_after" }
  };
  const paging = { expected: 1, exported: 1, limit: 100, rawFetched: 1, uniqueFetched: 1, duplicatesRemoved: 0, pagesFetched: 1, reconciled: true, truncated: false, terminationReason: "target_reached" };
  return app.deriveProjectAnalytics(sampleReport({
    ...provenance,
    datasetStates,
    collectionScope: { issues: true, components: true, analyses: true, trends: true, people: false },
    analysisDateBeforeCollection: "2026-08-18T11:00:00Z",
    analysisDateAfterCollection: "2026-08-18T11:00:00Z",
    analysisSnapshotConsistent: true,
    analysisSnapshotMethod: "project_analysis_date_before_after",
    qualityGate: {
      status: "ERROR",
      ignoredConditions: false,
      conditions: [{ status: "ERROR", metricKey: "coverage", comparator: "LT", actualValue: "75", errorThreshold: "80" }]
    },
    measures: [
      { metric: "ncloc", value: "120", bestValue: false },
      { metric: "lines_to_cover", value: "100", bestValue: false },
      { metric: "uncovered_lines", value: "25", bestValue: false },
      { metric: "duplicated_lines", value: "6", bestValue: false },
      { metric: "coverage", value: "75", bestValue: false },
      { metric: "duplicated_lines_density", value: "5", bestValue: false },
      { metric: "security_rating", value: "2", bestValue: false },
      { metric: "reliability_rating", value: "1", bestValue: false },
      { metric: "sqale_rating", value: "3", bestValue: false },
      { metric: "sqale_index", value: "90", bestValue: false },
      { metric: "security_hotspots", value: "2", bestValue: false },
      { metric: "security_hotspots_reviewed", value: "50", bestValue: false }
    ],
    issues: [{
      key: "AX-1", rule: "javascript:S100", type: "VULNERABILITY", severity: "HIGH",
      impacts: ["SECURITY:HIGH"], status: "OPEN", issueStatus: "OPEN", legacyStatus: "OPEN",
      lifecycleStatus: "actionable", resolution: "", message: "Validate untrusted input",
      component: "sample:src/app.js", project: "sample", line: "12", textRange: null,
      effort: "2h", assignee: "", author: "", tags: ["security"],
      creationDate: "2026-08-01T08:00:00Z", updateDate: "2026-08-17T08:00:00Z",
      closeDate: "", cleanCodeAttribute: "CONVENTIONAL"
    }],
    rules: [{ key: "javascript:S100", name: "Validate input", lang: "js", status: "READY", type: "VULNERABILITY", severity: "HIGH" }],
    components: [{
      key: "sample:src/app.js", name: "app.js", path: "src/app.js", qualifier: "FIL", language: "js",
      measures: [{ metric: "ncloc", value: "120", bestValue: false }, { metric: "coverage", value: "75", bestValue: false }]
    }],
    analyses: [{ key: "analysis-1", date: "2026-08-18T11:00:00Z", projectVersion: "1.0", revision: "abcdef1", events: [] }],
    trends: [{
      metric: "coverage",
      observations: [{ date: "2026-08-10T11:00:00Z", value: 70 }, { date: "2026-08-18T11:00:00Z", value: 75 }],
      current: { date: "2026-08-18T11:00:00Z", value: 75 },
      previous: { date: "2026-08-10T11:00:00Z", value: 70 },
      absoluteChange: 5, percentageChange: 7.142857142857143,
      period: { from: "2026-08-10T11:00:00Z", to: "2026-08-18T11:00:00Z" },
      source: "/api/measures/search_history"
    }],
    issuePaging: { ...paging, limit: 10000 },
    componentPaging: { ...paging, limit: 10000 },
    analysisPaging: { ...paging, limit: 100 },
    trendPaging: { ...paging, expected: 2, exported: 2, rawFetched: 2, uniqueFetched: 2, limit: 100 }
  }));
}

function artifactReport(app, snapshot) {
  return app.createArtifactReport(snapshot, "json", { exportedAt: exportTime });
}

function assertArtifactInvariants(report) {
  assert.equal(report.generatedAt, report.exportedAt);
  assert.equal(report.exportedAt, report.artifact.exportedAt);
  assert.equal(report.collectionComplete, report.artifact.collectionComplete);
  assert.equal(report.artifactComplete, report.artifact.artifactComplete);
  assert.equal(report.collectionEvidence.reportId, report.reportId);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.artifact), true);
  assert.equal(Object.isFrozen(report.artifact.exportedCounts), true);
  assert.equal(Object.isFrozen(report.artifact.scope), true);
  for (const key of ["requiredDatasets", "representedDatasets", "excludedDatasets"]) {
    const values = Array.from(report.artifact.scope[key]);
    assert.ok(values.length <= 5);
    assert.equal(new Set(values).size, values.length);
  }

  const entries = report.reportMode === "portfolio" ? report.projects.filter((entry) => entry.derived) : [report];
  const counts = report.artifact.exportedCounts;
  assert.equal(counts.projects, report.reportMode === "portfolio" ? report.projects.length : 1);
  assert.equal(counts.issues, entries.reduce((sum, entry) => sum + entry.issues.length, 0));
  assert.equal(counts.components, entries.reduce((sum, entry) => sum + entry.components.length, 0));
  assert.equal(counts.analyses, entries.reduce((sum, entry) => sum + entry.analyses.length, 0));
  assert.equal(counts.trendObservations, entries.reduce((sum, entry) => sum + entry.trends.reduce((total, series) => total + series.observations.length, 0), 0));
}

test("Model v3 schema is a closed, resolvable Draft 2020-12 contract", () => {
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.match(schema.$id, /report-model-v3\.schema\.json$/);
  assert.equal(schema.type, "object");
  assert.equal(schema.readOnly, true);
  assert.equal(schema.unevaluatedProperties, false);
  assert.equal(schema.oneOf.length, 2);
  for (const definition of ["commonEnvelope", "singleReport", "portfolioReport", "artifact", "derived", "collectionEvidence"]) {
    assert.ok(schema.$defs[definition], `Missing $defs/${definition}`);
  }
  const commonRequired = new Set(schema.$defs.commonEnvelope.required);
  for (const property of [
    "schemaVersion", "modelVersion", "reportId", "reportMode", "generatedAt", "exportedAt", "collectedAt",
    "complete", "collectionComplete", "artifactComplete", "artifact", "serverBaseUrl", "serverBaseUrlScope",
    "sourceRevision", "sourceDigest", "pluginArtifactDigest", "datasetStates", "warnings"
  ]) assert.ok(commonRequired.has(property), `Common envelope must require ${property}`);
  const artifactRequired = new Set(schema.$defs.artifact.required);
  for (const property of ["format", "exportedAt", "collectionComplete", "artifactComplete", "exportedCounts", "warnings", "scope", "artifactDigest", "artifactDigestState"]) {
    assert.ok(artifactRequired.has(property), `Artifact must require ${property}`);
  }
  assert.equal(schema.$defs.artifact.additionalProperties, false);
  assert.equal(schema.$defs.artifact.properties.artifactDigest.type, "null");
  assert.equal(schema.$defs.artifact.properties.artifactDigestState.const, "not_computed");
  assert.equal(schema["x-crossFieldInvariants"].length, 7);
  for (const reference of new Set(allReferences(schema))) assert.ok(resolveReference(reference), `Unresolved reference ${reference}`);
});

test("single-project artifact conforms and reconciles Model v3 semantics", async () => {
  const app = await loadApp(["core.js", "analytics.js", "api.js"]);
  const report = artifactReport(app, singleSnapshot(app));
  assert.deepEqual(validate(report), []);
  assertArtifactInvariants(report);
  const summary = report.derived.issueSummary;
  assert.equal(summary.actionable + summary.accepted + summary.closed + summary.unknown, summary.totalCollected);
  assert.equal(report.derived.reconciliation.lifecycleReconciles, true);
  assert.equal(report.derived.reconciliation.valid, true);
  assert.equal(report.artifact.artifactComplete, true);
});

test("portfolio artifact represents successful and failed project attempts", async () => {
  const app = await loadApp(["core.js", "analytics.js", "api.js"]);
  const successful = singleSnapshot(app);
  const requested = [
    { key: "sample", name: "Sample", qualifier: "TRK" },
    { key: "restricted", name: "Restricted", qualifier: "TRK" }
  ];
  const base = app.buildPortfolioReport([
    { project: requested[0], state: "complete", report: successful },
    { project: requested[1], state: "permission_denied", error: new Error("HTTP 403") }
  ], requested, {
    includeIssues: true, includeComponents: true, includeAnalyses: true, includeTrends: true, includePeople: false,
    rankProjects: true
  }, "2026-08-18T11:55:00.000Z", "2026-08-18T12:00:00.000Z");
  const report = artifactReport(app, {
    ...base, ...provenance, collectedAt: base.collectionCompletedAt,
    collectionComplete: base.complete, artifactComplete: null, artifact: null
  });

  assert.deepEqual(validate(report), []);
  assertArtifactInvariants(report);
  const summary = report.portfolioSummary;
  assert.equal(summary.projectsSelected, report.projects.length);
  assert.equal(summary.projectsAttempted + summary.projectsSkipped, summary.projectsSelected);
  assert.equal(summary.projectsAnalysed, report.projects.filter((entry) => entry.derived).length);
  assert.equal(summary.projectsComplete, 1);
  assert.equal(summary.projectsPermissionDenied, 1);
  assert.equal(report.aggregateIssueSummary.actionable + report.aggregateIssueSummary.accepted + report.aggregateIssueSummary.closed + report.aggregateIssueSummary.unknown, report.aggregateIssueSummary.totalCollected);
  assert.equal(report.aggregateIssueSummary.reconciles, true);
  assert.equal(report.artifact.artifactComplete, false);
});

test("schema rejects missing provenance, wrong versions, invalid states and unbounded scope", async () => {
  const app = await loadApp(["core.js", "analytics.js", "api.js"]);
  const report = artifactReport(app, singleSnapshot(app));

  const missingArtifact = clone(report);
  delete missingArtifact.artifact;
  assert.ok(validate(missingArtifact, schema.$defs.singleReport).some((error) => error.includes("missing required property artifact")));

  const wrongVersion = clone(report);
  wrongVersion.schemaVersion = 2;
  assert.ok(validate(wrongVersion, schema.$defs.singleReport).some((error) => error.includes("expected const 3")));

  const invalidState = clone(report);
  invalidState.datasetStates.issues.state = "maybe_complete";
  assert.ok(validate(invalidState, schema.$defs.singleReport).some((error) => error.includes("expected one of")));

  const duplicateScope = clone(report);
  duplicateScope.artifact.scope.requiredDatasets = ["issues", "issues"];
  assert.ok(validate(duplicateScope, schema.$defs.singleReport).some((error) => error.includes("items are not unique")));

  const negativeCount = clone(report);
  negativeCount.artifact.exportedCounts.issues = -1;
  assert.ok(validate(negativeCount, schema.$defs.singleReport).some((error) => error.includes("below minimum")));
});
