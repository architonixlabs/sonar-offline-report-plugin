import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { delimiter, dirname, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadApp, sampleReport } from "../test/test-helpers.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const TARGET_ROOT = resolve(ROOT, "target");
const ARTIFACT_ROOT = resolve(TARGET_ROOT, "browser-regression");
const HTML_ROOT = join(ARTIFACT_ROOT, "html");
const SCREENSHOT_ROOT = join(ARTIFACT_ROOT, "screenshots");
const PRINT_ROOT = join(ARTIFACT_ROOT, "print");
const FIXED_GENERATED_AT = "2026-08-22T12:00:00.000Z";
const PDF_STREAM_CHUNK_BYTES = 256 * 1024;
const MAX_PDF_BYTES = 64 * 1024 * 1024;
const DESKTOP = Object.freeze({ name: "desktop", width: 1440, height: 1000, mobile: false });
const MOBILE = Object.freeze({ name: "mobile-390", width: 390, height: 844, mobile: true });

if (!ARTIFACT_ROOT.startsWith(`${TARGET_ROOT}${sep}`)) {
  throw new Error(`Refusing to use browser artifact path outside target: ${ARTIFACT_ROOT}`);
}
if (typeof WebSocket !== "function") {
  throw new Error("Node's built-in WebSocket is unavailable. Run this harness through `npm run test:browser`.");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function isFile(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function findChrome() {
  const configured = process.env.OFFLINE_REPORT_CHROME;
  const candidates = [];
  if (configured) candidates.push(resolve(configured));

  if (process.platform === "win32") {
    candidates.push(
      process.env.ProgramFiles && join(process.env.ProgramFiles, "Google", "Chrome", "Application", "chrome.exe"),
      process.env["ProgramFiles(x86)"] && join(process.env["ProgramFiles(x86)"], "Google", "Chrome", "Application", "chrome.exe"),
      process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
      process.env.ProgramFiles && join(process.env.ProgramFiles, "Microsoft", "Edge", "Application", "msedge.exe")
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium"
    );
  } else {
    candidates.push("/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser");
  }

  const executableNames = process.platform === "win32"
    ? ["chrome.exe", "msedge.exe"]
    : ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];
  for (const pathEntry of String(process.env.PATH || "").split(delimiter)) {
    if (!pathEntry) continue;
    for (const executableName of executableNames) candidates.push(join(pathEntry, executableName));
  }

  for (const candidate of unique(candidates)) {
    if (await isFile(candidate)) return candidate;
  }
  throw new Error("No Chrome/Chromium executable was found. Set OFFLINE_REPORT_CHROME to an installed browser path.");
}

function launchChrome(executable, profileDirectory) {
  const args = [
    "--headless=new",
    "--remote-debugging-port=0",
    "--remote-allow-origins=*",
    `--user-data-dir=${profileDirectory}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-domain-reliability",
    "--disable-extensions",
    "--disable-gpu",
    "--disable-sync",
    "--force-color-profile=srgb",
    "--font-render-hinting=none",
    "--hide-scrollbars",
    "--metrics-recording-only",
    "--no-proxy-server",
    "--password-store=basic",
    "--window-size=1440,1000",
    "about:blank"
  ];
  if (process.platform === "linux") args.unshift("--disable-dev-shm-usage");
  if (process.platform === "linux" && typeof process.getuid === "function" && process.getuid() === 0) {
    args.unshift("--no-sandbox");
  }

  const browser = spawn(executable, args, { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });
  let diagnostics = "";
  const listening = new Promise((resolveListening, rejectListening) => {
    const timeout = setTimeout(() => {
      rejectListening(new Error(`Chrome did not expose a DevTools endpoint within 20 seconds. ${diagnostics.slice(-2000)}`));
    }, 20000);
    browser.once("error", (error) => {
      clearTimeout(timeout);
      rejectListening(error);
    });
    browser.once("exit", (code) => {
      clearTimeout(timeout);
      rejectListening(new Error(`Chrome exited before DevTools became available (exit ${code}). ${diagnostics.slice(-2000)}`));
    });
    browser.stderr.setEncoding("utf8");
    browser.stderr.on("data", (chunk) => {
      diagnostics += chunk;
      const match = diagnostics.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolveListening(match[1]);
    });
  });
  return { browser, listening, getDiagnostics: () => diagnostics };
}

class CdpClient {
  constructor(url, closeDetails = () => "") {
    this.url = url;
    this.closeDetails = closeDetails;
    this.sequence = 0;
    this.pending = new Map();
    this.events = [];
    this.socket = null;
  }

  async open() {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener("message", (event) => this.handleMessage(event.data));
    this.socket.addEventListener("close", () => {
      const details = String(this.closeDetails() || "").trim();
      const message = details ? `Chrome DevTools connection closed. ${details}` : "Chrome DevTools connection closed.";
      for (const request of this.pending.values()) {
        clearTimeout(request.timeout);
        request.reject(new Error(message));
      }
      this.pending.clear();
    });
    await new Promise((resolveOpen, rejectOpen) => {
      const timeout = setTimeout(() => rejectOpen(new Error("Timed out opening Chrome DevTools WebSocket.")), 10000);
      this.socket.addEventListener("open", () => {
        clearTimeout(timeout);
        resolveOpen();
      }, { once: true });
      this.socket.addEventListener("error", () => {
        clearTimeout(timeout);
        rejectOpen(new Error(`Unable to open Chrome DevTools WebSocket ${this.url}`));
      }, { once: true });
    });
  }

  handleMessage(raw) {
    const message = JSON.parse(typeof raw === "string" ? raw : Buffer.from(raw).toString("utf8"));
    if (message.id && this.pending.has(message.id)) {
      const request = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(request.timeout);
      if (message.error) request.reject(new Error(`${request.method}: ${message.error.message}`));
      else request.resolve(message.result || {});
      return;
    }
    if (message.method) this.events.push(message);
  }

  send(method, params = {}) {
    return new Promise((resolveRequest, rejectRequest) => {
      const id = ++this.sequence;
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        rejectRequest(new Error(`Chrome DevTools command timed out: ${method}`));
      }, 30000);
      this.pending.set(id, { method, resolve: resolveRequest, reject: rejectRequest, timeout });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.socket && this.socket.readyState < WebSocket.CLOSING) this.socket.close();
  }
}

async function connectToPage(browserWebSocketUrl, closeDetails) {
  const browserUrl = new URL(browserWebSocketUrl);
  const targetBase = `http://${browserUrl.host}`;
  let targets = [];
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      targets = await (await fetch(`${targetBase}/json/list`)).json();
      if (targets.some((target) => target.type === "page")) break;
    } catch {
      // Chrome can advertise its WebSocket a fraction before the target list is ready.
    }
    await delay(100);
  }
  const target = targets.find((item) => item.type === "page");
  if (!target || !target.webSocketDebuggerUrl) throw new Error("Chrome exposed no debuggable page target.");
  const client = new CdpClient(target.webSocketDebuggerUrl, closeDetails);
  await client.open();
  return client;
}

function issueFixture(projectKey, index, actionableCount) {
  let lifecycleStatus = "actionable";
  let status = index % 2 ? "OPEN" : "CONFIRMED";
  if (index >= actionableCount && index < actionableCount + 4) {
    lifecycleStatus = "accepted";
    status = "ACCEPTED";
  } else if (index >= actionableCount + 4 && index < actionableCount + 8) {
    lifecycleStatus = "closed";
    status = "FIXED";
  } else if (index >= actionableCount + 8) {
    lifecycleStatus = "unknown";
    status = "FUTURE_STATUS";
  }
  const qualities = ["SECURITY", "RELIABILITY", "MAINTAINABILITY"];
  const severities = ["HIGH", "MEDIUM", "LOW"];
  const legacyTypes = ["VULNERABILITY", "BUG", "CODE_SMELL"];
  const quality = qualities[index % qualities.length];
  const impact = severities[index % severities.length];
  const componentIndex = index % 18;
  return {
    key: `${projectKey.toUpperCase()}-${String(index + 1).padStart(4, "0")}`,
    rule: `fixture:${quality.toLowerCase()}-${index % 6}`,
    message: `${quality} evidence ${index + 1}: validate the boundary, add a regression test, and record the accountable remediation decision.`,
    component: `${projectKey}:src/modules/domain-${componentIndex}/service-${componentIndex}.ts`,
    project: projectKey,
    status,
    lifecycleStatus,
    normalizedLifecycle: lifecycleStatus,
    impacts: [`${quality}:${impact}`],
    impactSeverities: [impact],
    softwareQualities: [quality],
    severity: impact === "HIGH" ? "CRITICAL" : impact === "MEDIUM" ? "MAJOR" : "MINOR",
    type: legacyTypes[index % legacyTypes.length],
    effort: `${(index % 4) + 1}h`,
    creationDate: `2026-0${(index % 7) + 1}-${String((index % 27) + 1).padStart(2, "0")}T09:15:00Z`,
    updateDate: "2026-08-20T10:30:00Z",
    tags: [quality.toLowerCase(), "browser-fixture"],
    textRange: { startLine: 20 + index, endLine: 20 + index, startOffset: 4, endOffset: 24 }
  };
}

function makeProjectReport(app, options = {}) {
  const projectKey = options.key || "avalokh-platform";
  const projectName = options.name || "Avalokh Platform";
  const issueCount = options.issueCount ?? 137;
  const actionableCount = Math.max(0, issueCount - 10);
  const issues = Array.from({ length: issueCount }, (_, index) => issueFixture(projectKey, index, actionableCount));
  const components = Array.from({ length: 18 }, (_, index) => ({
    key: `${projectKey}:src/modules/domain-${index}/service-${index}.ts`,
    name: `service-${index}.ts`,
    path: `src/modules/domain-${index}/service-${index}.ts`,
    language: "ts",
    qualifier: "FIL",
    measures: [
      { metric: "ncloc", value: String(280 + index * 17) },
      { metric: "coverage", value: String(index === 0 ? 0 : 48 + index * 2.3) },
      { metric: "uncovered_lines", value: String(42 - Math.min(index, 30)) },
      { metric: "lines_to_cover", value: String(90 + index * 3) },
      { metric: "duplicated_lines_density", value: String(0.4 + index * 0.17) },
      { metric: "complexity", value: String(12 + index) },
      { metric: "cognitive_complexity", value: String(8 + index) }
    ]
  }));
  const analyses = Array.from({ length: 6 }, (_, index) => ({
    key: `${projectKey}-analysis-${index + 1}`,
    date: `2026-0${8 - index}-20T10:00:00Z`,
    projectVersion: `2.${5 - index}.0`,
    revision: `fixture-revision-${index + 1}`,
    events: index === 0 ? [{ category: "VERSION", name: "2.5.0" }] : []
  }));
  const trends = [
    { metric: "coverage", current: { value: "72.4" }, previous: { value: "69.1" }, absoluteChange: 3.3, percentageChange: 4.7757, period: { from: "2026-07-22T00:00:00Z", to: "2026-08-22T00:00:00Z" }, source: "history", observations: [{ date: "2026-07-22T00:00:00Z", value: "69.1" }, { date: "2026-08-22T00:00:00Z", value: "72.4" }] },
    { metric: "duplicated_lines_density", current: { value: "3.8" }, previous: { value: "4.2" }, absoluteChange: -0.4, percentageChange: -9.5238, period: { from: "2026-07-22T00:00:00Z", to: "2026-08-22T00:00:00Z" }, source: "history", observations: [{ date: "2026-07-22T00:00:00Z", value: "4.2" }, { date: "2026-08-22T00:00:00Z", value: "3.8" }] },
    { metric: "security_hotspots_reviewed", current: { value: "42.11" }, previous: { value: "31.58" }, absoluteChange: 10.53, percentageChange: 33.3439, period: { from: "2026-07-22T00:00:00Z", to: "2026-08-22T00:00:00Z" }, source: "history", observations: [{ date: "2026-07-22T00:00:00Z", value: "31.58" }, { date: "2026-08-22T00:00:00Z", value: "42.11" }] }
  ];
  const measures = [
    { metric: "ncloc", value: "48320" },
    { metric: "coverage", value: "72.4" },
    { metric: "new_coverage", period: { value: "61.8" } },
    { metric: "duplicated_lines_density", value: "3.8" },
    { metric: "new_duplicated_lines_density", period: { value: "6.2" } },
    { metric: "reliability_rating", value: "2" },
    { metric: "security_rating", value: "3" },
    { metric: "sqale_rating", value: "2" },
    { metric: "sqale_index", value: "1840" },
    { metric: "vulnerabilities", value: "7" },
    { metric: "security_hotspots", value: "19" },
    { metric: "security_hotspots_reviewed", value: "42.11" },
    { metric: "security_review_rating", value: "4" },
    { metric: "new_violations", period: { value: "14" } },
    { metric: "tests", value: "1248" },
    { metric: "test_errors", value: "3" },
    { metric: "test_failures", value: "11" },
    { metric: "skipped_tests", value: "27" },
    { metric: "test_execution_time", value: "198450" },
    { metric: "test_success_density", value: "98.88" }
  ];
  const report = sampleReport({
    reportId: options.reportId || "00000000-0000-4000-8000-000000000101",
    generatedAt: FIXED_GENERATED_AT,
    collectedAt: FIXED_GENERATED_AT,
    collectionStartedAt: "2026-08-22T11:58:00.000Z",
    collectionCompletedAt: FIXED_GENERATED_AT,
    project: { key: projectKey, name: projectName, qualifier: "TRK", version: "2.5.0", analysisDate: "2026-08-20T10:00:00Z" },
    branchLabel: "Main branch",
    qualityGate: {
      status: options.gate || "ERROR",
      ignoredConditions: false,
      conditions: [
        { metricKey: "new_coverage", comparator: "LT", status: "ERROR", actualValue: "61.8", errorThreshold: "80" },
        { metricKey: "new_duplicated_lines_density", comparator: "GT", status: "ERROR", actualValue: "6.2", errorThreshold: "3" },
        { metricKey: "security_hotspots_reviewed", comparator: "LT", status: "OK", actualValue: "42.11", errorThreshold: "30" }
      ]
    },
    collectionScope: { issues: true, components: true, analyses: true, trends: true, people: false },
    datasetStates: {
      issues: { requested: true, state: "complete" },
      components: { requested: true, state: "complete" },
      analyses: { requested: true, state: "complete" },
      trends: { requested: true, state: "complete" },
      people: { requested: false, state: "not_requested", reason: "privacy_excluded" }
    },
    measures,
    issues,
    rules: Array.from({ length: 6 }, (_, index) => ({ key: `fixture:security-${index}`, name: `Fixture security rule ${index + 1}`, status: "READY", type: "VULNERABILITY", severity: "CRITICAL" })),
    components,
    analyses,
    trends,
    issuePaging: { expected: issueCount, exported: issueCount, uniqueFetched: issueCount, duplicatesRemoved: 0, limit: 10000 },
    componentPaging: { expected: components.length, exported: components.length, uniqueFetched: components.length, duplicatesRemoved: 0, limit: 10000 },
    analysisPaging: { expected: analyses.length, exported: analyses.length, uniqueFetched: analyses.length, duplicatesRemoved: 0, limit: 100 },
    trendPaging: { expected: trends.length, exported: trends.length, limit: 100, terminationReason: "requested_window_complete" },
    analysisSnapshotConsistent: true,
    warnings: []
  });
  return { report: app.deriveProjectAnalytics(report), actionableCount };
}

async function generateFixtures() {
  const app = await loadApp();
  const { report, actionableCount } = makeProjectReport(app);
  const definitions = app.BUILTIN_TEMPLATES
    .filter((template) => template.id !== "portfolio")
    .map((template) => ({ id: template.id, template }));
  const fixtures = [];
  for (const definition of definitions) {
    const artifact = app.createArtifactReport(report, "html", {
      template: definition.template,
      artifactComplete: true,
      exportedAt: FIXED_GENERATED_AT
    });
    assert.equal(artifact.artifactComplete, true, `${definition.id} fixture must be artifact-complete`);
    const file = join(HTML_ROOT, `${definition.id}.html`);
    await writeFile(file, app.buildHtmlReport(artifact, definition.template), "utf8");
    fixtures.push({ ...definition, file, expectedTitle: definition.template.title });
  }

  const projectDefinitions = [
    { key: "avalokh-api", name: "Avalokh API", issueCount: 36, gate: "ERROR", reportId: "00000000-0000-4000-8000-000000000201" },
    { key: "avalokh-web", name: "Avalokh Web", issueCount: 28, gate: "OK", reportId: "00000000-0000-4000-8000-000000000202" },
    { key: "avalokh-worker", name: "Avalokh Worker", issueCount: 22, gate: "WARN", reportId: "00000000-0000-4000-8000-000000000203" }
  ];
  const projectReports = projectDefinitions.map((definition) => makeProjectReport(app, definition).report);
  const portfolio = app.buildPortfolioReport(
    projectReports.map((projectReport) => ({ project: projectReport.project, state: "complete", report: projectReport })),
    projectReports.map((projectReport) => projectReport.project),
    { rankProjects: true, includeIssues: true, includeComponents: true, includeAnalyses: true, includeTrends: true, includePeople: false },
    "2026-08-22T11:55:00.000Z",
    FIXED_GENERATED_AT
  );
  const portfolioTemplate = app.BUILTIN_TEMPLATES[4];
  const deterministicPortfolio = {
    ...portfolio,
    reportId: "00000000-0000-4000-8000-000000000301",
    collectionEvidence: {
      ...portfolio.collectionEvidence,
      reportId: "00000000-0000-4000-8000-000000000301"
    }
  };
  const portfolioArtifact = app.createArtifactReport(deterministicPortfolio, "html", {
    template: portfolioTemplate,
    artifactComplete: true,
    exportedAt: FIXED_GENERATED_AT
  });
  assert.equal(portfolioArtifact.artifactComplete, true, "portfolio fixture must be artifact-complete");
  const portfolioFile = join(HTML_ROOT, "portfolio.html");
  await writeFile(portfolioFile, app.buildHtmlReport(portfolioArtifact, portfolioTemplate), "utf8");
  fixtures.push({ id: "portfolio", template: portfolioTemplate, file: portfolioFile, expectedTitle: portfolioTemplate.title });

  const profileOrder = Array.from(app.BUILTIN_TEMPLATES, (template) => template.id);
  fixtures.sort((left, right) => profileOrder.indexOf(left.id) - profileOrder.indexOf(right.id));
  assert.deepEqual(fixtures.map((fixture) => fixture.id), profileOrder, "real-browser fixtures must cover every built-in profile ID exactly once");

  const portfolioIssues = deterministicPortfolio.projects.flatMap((entry) => entry.issues || []);
  const portfolioPrintFixtures = [];
  for (const issueScope of ["active", "all"]) {
    const selectedPortfolioIssues = portfolioIssues.filter((issue) => issueScope === "all" || app.issueLifecycle(issue) === "actionable");
    const expectedLifecycle = { actionable: 0, accepted: 0, closed: 0, unknown: 0 };
    for (const issue of selectedPortfolioIssues) {
      const lifecycle = app.issueLifecycle(issue);
      expectedLifecycle[lifecycle in expectedLifecycle ? lifecycle : "unknown"] += 1;
    }
    const expectedSelected = selectedPortfolioIssues.length;
    const representedDatasets = ["issues"];
    const excludedDatasets = app.requiredDatasetKeys(portfolioTemplate).filter((key) => !representedDatasets.includes(key));
    const printOptions = { purpose: "print", mode: "register", issueScope };
    const printArtifact = app.createArtifactReport(deterministicPortfolio, "print", {
      template: portfolioTemplate,
      ...printOptions,
      exportedAt: FIXED_GENERATED_AT,
      exportedCounts: {
        projects: deterministicPortfolio.projects.length,
        issues: expectedSelected,
        components: 0,
        analyses: 0,
        trendObservations: 0
      },
      scope: {
        fullModel: false,
        representedDatasets,
        excludedDatasets,
        exclusionReason: "user_selected_print_register",
        representation: "rendered_views_only",
        representationByDataset: { issues: "raw_rows_and_reconciled_aggregates" }
      }
    });
    assert.equal(printArtifact.artifact.exportedCounts.issues, expectedSelected, `portfolio ${issueScope} print fixture must declare its exact selected issue count`);
    const file = join(HTML_ROOT, `portfolio-print-${issueScope}.html`);
    await writeFile(file, app.buildHtmlReport(printArtifact, portfolioTemplate, printOptions), "utf8");
    portfolioPrintFixtures.push({
      issueScope,
      file,
      expectedSelected,
      expectedLifecycle,
      expectedCollected: portfolioIssues.length,
      expectedProjects: deterministicPortfolio.projects.length
    });
  }
  return { fixtures, actionableCount, portfolioPrintFixtures };
}

async function evaluate(client, expression) {
  const response = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true
  });
  if (response.exceptionDetails) {
    const description = response.exceptionDetails.exception && response.exceptionDetails.exception.description;
    throw new Error(description || response.exceptionDetails.text || "Chrome evaluation failed.");
  }
  return response.result ? response.result.value : undefined;
}

async function waitFor(client, label, expression, timeoutMilliseconds = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMilliseconds) {
    try {
      if (await evaluate(client, expression)) return;
    } catch {
      // A navigation can replace the execution context between polling attempts.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

function diagnostics(events) {
  return events.flatMap((event) => {
    if (event.method === "Runtime.exceptionThrown") {
      return [{ kind: event.method, text: event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text }];
    }
    if (event.method === "Runtime.consoleAPICalled" && event.params.type === "error") {
      return [{ kind: event.method, text: event.params.args.map((argument) => argument.value || argument.description || "").join(" ") }];
    }
    if (event.method === "Log.entryAdded" && event.params.entry.level === "error") {
      return [{ kind: event.method, text: event.params.entry.text }];
    }
    return [];
  });
}

function externalRequests(events) {
  return events
    .filter((event) => event.method === "Network.requestWillBeSent")
    .map((event) => event.params.request.url)
    .filter((url) => /^(?:https?|wss?|ftp):/i.test(url));
}

function verify(evidence, condition, name, details = undefined) {
  evidence.checks.push({ name, passed: Boolean(condition), ...(details === undefined ? {} : { details }) });
  assert.ok(condition, details === undefined ? name : `${name}: ${JSON.stringify(details)}`);
}

async function setViewport(client, viewport) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
    positionX: 0,
    positionY: 0
  });
  await client.send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
}

async function captureDeterministicScreenshot(client, file, viewport, evidence, label) {
  await evaluate(client, "window.scrollTo(0, 0); document.activeElement && document.activeElement.blur(); true");
  await delay(50);
  const options = {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height, scale: 1 }
  };
  const first = Buffer.from((await client.send("Page.captureScreenshot", options)).data, "base64");
  const second = Buffer.from((await client.send("Page.captureScreenshot", options)).data, "base64");
  const firstDigest = sha256(first);
  const secondDigest = sha256(second);
  verify(evidence, firstDigest === secondDigest, `${label}: repeated screenshot bytes are deterministic`, { firstDigest, secondDigest });
  verify(evidence, first.subarray(1, 4).toString("ascii") === "PNG", `${label}: screenshot is a PNG`);
  const dimensions = { width: first.readUInt32BE(16), height: first.readUInt32BE(20) };
  verify(evidence, dimensions.width === viewport.width && dimensions.height === viewport.height, `${label}: screenshot dimensions match viewport`, dimensions);
  await writeFile(file, first);
  return { file: file.slice(ARTIFACT_ROOT.length + 1).split(sep).join("/"), bytes: first.length, sha256: firstDigest, ...dimensions };
}

async function inspectFixture(client, fixture, viewport, evidence) {
  await setViewport(client, viewport);
  const eventOffset = client.events.length;
  await client.send("Page.navigate", { url: pathToFileURL(fixture.file).href });
  await waitFor(client, `${fixture.id} ${viewport.name} report`, `(() => document.readyState === "complete"
    && document.title.includes(${JSON.stringify(fixture.expectedTitle)})
    && document.querySelector("main")
    && document.querySelectorAll("main section").length > 0)()`);
  await evaluate(client, "document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true");
  await evaluate(client, "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))");
  const layout = await evaluate(client, `(() => {
    const root = document.documentElement;
    const body = document.body;
    const layoutNode = document.querySelector(".layout");
    const toc = document.querySelector(".toc");
    const overflowPixels = Math.max(0, root.scrollWidth - root.clientWidth, body.scrollWidth - root.clientWidth);
    const offenders = Array.from(document.querySelectorAll("body *")).flatMap((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) return [];
      return rect.right > root.clientWidth + 1 || rect.left < -1
        ? [{ tag: node.tagName, className: typeof node.className === "string" ? node.className : "", left: Math.round(rect.left), right: Math.round(rect.right) }]
        : [];
    }).slice(0, 10);
    return {
      title: document.title,
      innerWidth,
      innerHeight,
      rootClientWidth: root.clientWidth,
      rootScrollWidth: root.scrollWidth,
      bodyScrollWidth: body.scrollWidth,
      overflowPixels,
      offenders,
      runtimeErrors: document.querySelectorAll(".runtime-error").length,
      sections: document.querySelectorAll("main section").length,
      issueRows: document.querySelectorAll("#issues .issue-list .issue").length,
      gridTemplateColumns: layoutNode ? getComputedStyle(layoutNode).gridTemplateColumns : null,
      tocPosition: toc ? getComputedStyle(toc).position : null,
      policy: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || ""
    };
  })()`);
  const pageEvents = client.events.slice(eventOffset);
  const errors = diagnostics(pageEvents);
  const requestedExternally = externalRequests(pageEvents);
  const label = `${fixture.id} ${viewport.name}`;
  verify(evidence, layout.innerWidth === viewport.width, `${label}: exact viewport width`, layout);
  verify(evidence, layout.overflowPixels === 0, `${label}: zero global horizontal overflow`, layout);
  verify(evidence, layout.runtimeErrors === 0, `${label}: no renderer failure state`, layout);
  verify(evidence, layout.sections > 0, `${label}: rendered report sections are present`, layout);
  verify(evidence, errors.length === 0, `${label}: no browser runtime or console errors`, errors);
  verify(evidence, requestedExternally.length === 0, `${label}: generated report made no external network request`, requestedExternally);
  verify(evidence, /default-src 'none'/.test(layout.policy) && /connect-src 'none'/.test(layout.policy), `${label}: restrictive offline CSP is active`, layout.policy);
  if (viewport.width === 390 && fixture.id !== "portfolio") {
    verify(evidence, layout.gridTemplateColumns === `${layout.rootClientWidth - 32}px` || !layout.gridTemplateColumns.includes(" "), `${label}: report grid reflows to one column`, layout.gridTemplateColumns);
    verify(evidence, layout.tocPosition === "static", `${label}: contents navigation is not sticky`, layout.tocPosition);
  }
  const screenshotFile = join(SCREENSHOT_ROOT, `${fixture.id}-${viewport.name}.png`);
  const screenshot = await captureDeterministicScreenshot(client, screenshotFile, viewport, evidence, label);
  return { viewport, layout, errors, externalRequests: requestedExternally, screenshot };
}

function normalizePdfMetadata(input) {
  const source = input.toString("latin1");
  const normalized = source.replace(/D:\d{14}\+00'00'/g, "D:20260822120000+00'00'");
  const output = Buffer.from(normalized, "latin1");
  assert.equal(output.length, input.length, "PDF metadata normalization must preserve byte offsets");
  return { output, replacements: (source.match(/D:\d{14}\+00'00'/g) || []).length };
}

function pdfPageCount(pdf) {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
}

async function printToPdf(client, options) {
  const response = await client.send("Page.printToPDF", { ...options, transferMode: "ReturnAsStream" });
  if (!response.stream) {
    if (typeof response.data === "string") return Buffer.from(response.data, "base64");
    throw new Error("Chrome returned neither a PDF stream nor inline PDF data.");
  }

  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const page = await client.send("IO.read", { handle: response.stream, size: PDF_STREAM_CHUNK_BYTES });
      const chunk = Buffer.from(page.data || "", page.base64Encoded ? "base64" : "utf8");
      bytes += chunk.length;
      if (bytes > MAX_PDF_BYTES) {
        throw new Error(`Chrome PDF stream exceeded the ${MAX_PDF_BYTES}-byte browser-regression limit.`);
      }
      chunks.push(chunk);
      if (page.eof) break;
    }
  } finally {
    await client.send("IO.close", { handle: response.stream }).catch(() => {});
  }
  return Buffer.concat(chunks, bytes);
}

async function exercisePrint(client, issuesFixture, expectedActionable, evidence) {
  await setViewport(client, DESKTOP);
  await client.send("Page.navigate", { url: pathToFileURL(issuesFixture.file).href });
  await waitFor(client, "issues profile report before print", `document.readyState === "complete" && document.querySelectorAll("#issues .issue-list .issue").length > 0`);
  const screenRows = await evaluate(client, "document.querySelectorAll('#issues .issue-list .issue').length");
  await evaluate(client, `(() => {
    globalThis.__browserPrintEvidence = { screenRows: document.querySelectorAll("#issues .issue-list .issue").length };
    globalThis.addEventListener("beforeprint", () => {
      globalThis.__browserPrintEvidence.before = {
        rows: document.querySelectorAll("#issues .issue-list .issue").length,
        compactRows: document.querySelectorAll("#issues .issue-compact").length,
        manifest: document.querySelector(".browser-print-manifest")?.textContent || "",
        printMedia: matchMedia("print").matches
      };
    }, { once: true });
    globalThis.addEventListener("afterprint", () => {
      globalThis.__browserPrintEvidence.after = {
        rows: document.querySelectorAll("#issues .issue-list .issue").length,
        resultCount: document.querySelector("#issues .result-count")?.textContent || "",
        printMedia: matchMedia("print").matches
      };
    }, { once: true });
    return true;
  })()`);
  const printOptions = {
    printBackground: true,
    preferCSSPageSize: true,
    paperWidth: 8.27,
    paperHeight: 11.69,
    marginTop: 0.35,
    marginBottom: 0.35,
    marginLeft: 0.35,
    marginRight: 0.35
  };
  const firstPdfBytes = await printToPdf(client, printOptions);
  await waitFor(client, "afterprint restoration", "Boolean(globalThis.__browserPrintEvidence && globalThis.__browserPrintEvidence.after)");
  const printEvidence = await evaluate(client, "globalThis.__browserPrintEvidence");
  const firstPdf = normalizePdfMetadata(firstPdfBytes);
  const secondPdf = normalizePdfMetadata(await printToPdf(client, printOptions));
  const pdf = firstPdf.output;
  const pageCount = pdfPageCount(pdf);
  verify(evidence, screenRows === issuesFixture.template.issuePageSize, "print: screen view is paginated before Ctrl+P", { screenRows, pageSize: issuesFixture.template.issuePageSize });
  verify(evidence, printEvidence.before.rows === expectedActionable, "print: beforeprint expands every filtered actionable issue", printEvidence);
  verify(evidence, printEvidence.before.compactRows === expectedActionable, "print: expanded rows use the compact print representation", printEvidence);
  verify(evidence, typeof printEvidence.before.printMedia === "boolean", "print: beforeprint media state was observed", printEvidence);
  verify(evidence, printEvidence.before.manifest.includes(`${expectedActionable} matching issue rows prepared`), "print: browser manifest reconciles the exact prepared row count", printEvidence.before.manifest);
  verify(evidence, printEvidence.after.rows === issuesFixture.template.issuePageSize, "print: afterprint restores the paginated screen view", printEvidence);
  verify(evidence, printEvidence.after.printMedia === false, "print: afterprint restores screen media", printEvidence);
  verify(evidence, pdf.subarray(0, 5).toString("ascii") === "%PDF-", "print: Chrome produced a PDF artifact");
  verify(evidence, pageCount > 1, "print: complete issue register spans multiple PDF pages", { pageCount });
  verify(evidence, sha256(firstPdf.output) === sha256(secondPdf.output), "print: normalized Chrome PDF bytes are deterministic", { first: sha256(firstPdf.output), second: sha256(secondPdf.output) });
  const printFile = join(PRINT_ROOT, "issues-ctrl-p.pdf");
  await writeFile(printFile, pdf);
  return {
    expectedActionable,
    screenRows,
    beforeprint: printEvidence.before,
    afterprint: printEvidence.after,
    pdf: { file: "print/issues-ctrl-p.pdf", bytes: pdf.length, sha256: sha256(pdf), pageCount, metadataDatesNormalized: firstPdf.replacements }
  };
}

async function exercisePortfolioPrintScopes(client, fixtures, evidence) {
  const printOptions = {
    printBackground: true,
    preferCSSPageSize: true,
    paperWidth: 11.69,
    paperHeight: 8.27,
    marginTop: 0.35,
    marginBottom: 0.35,
    marginLeft: 0.35,
    marginRight: 0.35
  };
  const results = {};
  for (const fixture of fixtures) {
    await setViewport(client, DESKTOP);
    const eventOffset = client.events.length;
    await client.send("Page.navigate", { url: pathToFileURL(fixture.file).href });
    await waitFor(client, `portfolio ${fixture.issueScope} print report`, `document.readyState === "complete"
      && document.body.dataset.purpose === "print"
      && document.body.dataset.mode === "register"
      && document.querySelector(".print-manifest")
      && document.querySelectorAll("#project-drilldown .project-detail").length === ${fixture.expectedProjects}`);
    await evaluate(client, "document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true");
    const screen = await evaluate(client, `(() => {
      const registers = Array.from(document.querySelectorAll("#project-drilldown details")).filter((node) => node.querySelector(":scope > summary")?.textContent.startsWith("Detailed issue register"));
      const lifecycleCounts = { actionable: 0, accepted: 0, closed: 0, unknown: 0 };
      registers.forEach((register) => register.querySelectorAll("table tbody tr").forEach((row) => {
        const lifecycle = (row.children[4]?.textContent || "unknown").trim().toLowerCase();
        lifecycleCounts[lifecycle in lifecycleCounts ? lifecycle : "unknown"] += 1;
      }));
      return {
        purpose: document.body.dataset.purpose,
        mode: document.body.dataset.mode,
        issueScope: document.body.dataset.issueScope,
        manifest: document.querySelector(".print-manifest")?.textContent.replace(/\\s+/g, " ").trim() || "",
        projects: document.querySelectorAll("#project-drilldown .project-detail").length,
        registers: registers.length,
        openRegisters: registers.filter((node) => node.open).length,
        registerRows: registers.reduce((total, node) => total + node.querySelectorAll("table tbody tr").length, 0),
        lifecycleCounts,
        embeddedModels: document.querySelectorAll("#portfolio-model-v3").length,
        runtimeErrors: document.querySelectorAll(".runtime-error").length,
        policy: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || ""
      };
    })()`);
    const label = `portfolio print ${fixture.issueScope}`;
    verify(evidence, screen.purpose === "print" && screen.mode === "register" && screen.issueScope === fixture.issueScope, `${label}: document declares the requested print scope`, screen);
    verify(evidence, screen.projects === fixture.expectedProjects && screen.registers === fixture.expectedProjects, `${label}: every selected project has an issue register`, screen);
    verify(evidence, screen.openRegisters === screen.registers, `${label}: issue registers are expanded for print`, screen);
    verify(evidence, screen.registerRows === fixture.expectedSelected, `${label}: physical issue rows match the selected scope`, screen);
    verify(evidence, JSON.stringify(screen.lifecycleCounts) === JSON.stringify(fixture.expectedLifecycle), `${label}: lifecycle rows match the requested active/all semantics`, { actual: screen.lifecycleCounts, expected: fixture.expectedLifecycle });
    verify(evidence, screen.manifest.includes(`${fixture.expectedSelected} rendered / ${fixture.expectedSelected} selected / ${fixture.expectedCollected} collected`), `${label}: manifest reconciles rendered, selected, and collected issues`, screen.manifest);
    verify(evidence, screen.embeddedModels === 0, `${label}: rendered-only print does not embed the full Model v3 payload`, screen);
    verify(evidence, screen.runtimeErrors === 0, `${label}: no renderer failure state`, screen);
    verify(evidence, /default-src 'none'/.test(screen.policy) && /connect-src 'none'/.test(screen.policy), `${label}: restrictive offline CSP is active`, screen.policy);

    const pageEvents = client.events.slice(eventOffset);
    const errors = diagnostics(pageEvents);
    const requestedExternally = externalRequests(pageEvents);
    verify(evidence, errors.length === 0, `${label}: no browser runtime or console errors`, errors);
    verify(evidence, requestedExternally.length === 0, `${label}: generated print report made no external network request`, requestedExternally);

    await client.send("Emulation.setEmulatedMedia", { media: "print" });
    const printLayout = await evaluate(client, `(() => ({
      printMedia: matchMedia("print").matches,
      toolbarDisplay: getComputedStyle(document.querySelector(".print-toolbar")).display,
      manifestDisplay: getComputedStyle(document.querySelector(".print-manifest")).display,
      registerRows: Array.from(document.querySelectorAll("#project-drilldown details")).filter((node) => node.querySelector(":scope > summary")?.textContent.startsWith("Detailed issue register")).reduce((total, node) => total + node.querySelectorAll("table tbody tr").length, 0),
      tableOverflow: getComputedStyle(document.querySelector("#project-drilldown .table-wrap")).overflow
    }))()`);
    verify(evidence, printLayout.printMedia === true && printLayout.toolbarDisplay === "none" && printLayout.manifestDisplay !== "none", `${label}: print media hides controls and retains the manifest`, printLayout);
    verify(evidence, printLayout.registerRows === fixture.expectedSelected && printLayout.tableOverflow === "visible", `${label}: print media preserves every scoped row without clipped tables`, printLayout);

    const firstPdf = normalizePdfMetadata(await printToPdf(client, printOptions));
    const secondPdf = normalizePdfMetadata(await printToPdf(client, printOptions));
    const pdf = firstPdf.output;
    const pageCount = pdfPageCount(pdf);
    verify(evidence, pdf.subarray(0, 5).toString("ascii") === "%PDF-" && pageCount > 1, `${label}: Chrome produced a multi-page PDF`, { bytes: pdf.length, pageCount });
    verify(evidence, sha256(firstPdf.output) === sha256(secondPdf.output), `${label}: normalized Chrome PDF bytes are deterministic`, { first: sha256(firstPdf.output), second: sha256(secondPdf.output) });
    const relativeFile = `print/portfolio-${fixture.issueScope}.pdf`;
    await writeFile(join(ARTIFACT_ROOT, relativeFile), pdf);
    results[fixture.issueScope] = {
      expectedSelected: fixture.expectedSelected,
      expectedCollected: fixture.expectedCollected,
      screen,
      printLayout,
      errors,
      externalRequests: requestedExternally,
      pdf: { file: relativeFile, bytes: pdf.length, sha256: sha256(pdf), pageCount, metadataDatesNormalized: firstPdf.replacements }
    };
    await client.send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    const restoredMedia = await evaluate(client, "matchMedia('print').matches");
    verify(evidence, restoredMedia === false, `${label}: screen media is restored after PDF generation`, { printMedia: restoredMedia });
  }
  return results;
}

async function exerciseCspAndOffline(client, evidence) {
  const eventOffset = client.events.length;
  const probe = await evaluate(client, `(async () => {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    delete globalThis.__offlineReportInlineProbe;
    const script = document.createElement("script");
    script.textContent = "globalThis.__offlineReportInlineProbe = 'executed'";
    document.body.appendChild(script);
    let fetchResult = "resolved";
    try {
      await fetch("https://offline-report.invalid/browser-regression-probe");
    } catch (error) {
      fetchResult = "blocked: " + (error && error.name ? error.name : "Error");
    }
    await new Promise((resolveProbe) => setTimeout(resolveProbe, 100));
    const externalAttributes = Array.from(document.querySelectorAll("[src],[href]")).flatMap((node) => [node.getAttribute("src"), node.getAttribute("href")]).filter((value) => /^(?:https?|wss?|ftp):/i.test(value || ""));
    return {
      policy: meta?.content || "",
      inlineExecuted: globalThis.__offlineReportInlineProbe === "executed",
      fetchResult,
      navigatorOnline: navigator.onLine,
      renderedSections: document.querySelectorAll("main section").length,
      runtimeErrors: document.querySelectorAll(".runtime-error").length,
      externalAttributes
    };
  })()`);
  await delay(100);
  const probeEvents = client.events.slice(eventOffset);
  const securityMessages = probeEvents
    .filter((event) => event.method === "Log.entryAdded")
    .map((event) => event.params.entry.text)
    .filter((text) => /Content Security Policy|Refused to (?:execute|connect)/i.test(text));
  const probeRequests = externalRequests(probeEvents);
  verify(evidence, /default-src 'none'/.test(probe.policy), "CSP probe: default source is denied", probe.policy);
  verify(evidence, /connect-src 'none'/.test(probe.policy), "CSP probe: connections are denied", probe.policy);
  verify(evidence, /img-src data:/.test(probe.policy), "CSP probe: images are restricted to embedded data", probe.policy);
  verify(evidence, /script-src 'sha256-[A-Za-z0-9+/]+=*'/.test(probe.policy) && !/script-src[^;]*'unsafe-inline'/.test(probe.policy), "CSP probe: only the integrity-pinned runtime is executable", probe.policy);
  verify(evidence, probe.inlineExecuted === false, "CSP probe: an unpinned injected inline script did not execute", probe);
  verify(evidence, probe.fetchResult.startsWith("blocked:"), "CSP probe: an external fetch was rejected", probe);
  verify(evidence, probe.externalAttributes.length === 0, "offline probe: generated document has no external resource attributes", probe.externalAttributes);
  verify(evidence, probe.renderedSections > 0 && probe.runtimeErrors === 0, "offline probe: report remains rendered and error-free with Chrome network emulation offline", probe);
  return { ...probe, securityMessages, networkRequestsObservedDuringProbe: probeRequests };
}

async function main() {
  await rm(ARTIFACT_ROOT, { recursive: true, force: true });
  await mkdir(HTML_ROOT, { recursive: true });
  await mkdir(SCREENSHOT_ROOT, { recursive: true });
  await mkdir(PRINT_ROOT, { recursive: true });

  const evidence = {
    schemaVersion: 1,
    fixtureGeneratedAt: FIXED_GENERATED_AT,
    networkMode: "Chrome DevTools offline emulation",
    browser: null,
    profiles: [],
    print: null,
    portfolioPrint: null,
    cspAndOffline: null,
    checks: []
  };
  const profileDirectories = [];
  let launched;
  let client;
  let chrome;
  const browserProcessDetails = () => {
    if (!launched) return null;
    return {
      exitCode: launched.browser.exitCode,
      signalCode: launched.browser.signalCode,
      diagnostics: launched.getDiagnostics().slice(-4000)
    };
  };
  const startSession = async () => {
    const profileDirectory = await mkdtemp(join(tmpdir(), "offline-report-browser-"));
    profileDirectories.push(profileDirectory);
    launched = launchChrome(chrome, profileDirectory);
    const browserWebSocketUrl = await launched.listening;
    client = await connectToPage(browserWebSocketUrl, () => {
      const process = browserProcessDetails();
      return process ? `Chrome exit=${process.exitCode ?? "running"}, signal=${process.signalCode ?? "none"}. ${process.diagnostics}` : "";
    });
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    await client.send("Network.enable");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Network.emulateNetworkConditions", {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
      connectionType: "none"
    });
    return client.send("Browser.getVersion");
  };
  const stopSession = async () => {
    const activeClient = client;
    const activeLaunch = launched;
    client = null;
    launched = null;
    if (activeClient) {
      await activeClient.send("Browser.close").catch(() => {});
      activeClient.close();
    }
    if (activeLaunch && activeLaunch.browser.exitCode === null) {
      await Promise.race([
        new Promise((resolveExit) => activeLaunch.browser.once("exit", resolveExit)),
        delay(3000)
      ]);
      if (activeLaunch.browser.exitCode === null) activeLaunch.browser.kill();
    }
  };
  try {
    const fixtureData = await generateFixtures();
    chrome = await findChrome();
    const browserVersion = await startSession();
    evidence.browser = {
      product: browserVersion.product,
      protocolVersion: browserVersion.protocolVersion,
      revision: browserVersion.revision,
      userAgent: browserVersion.userAgent,
      jsVersion: browserVersion.jsVersion
    };

    for (const fixture of fixtureData.fixtures) {
      const profileEvidence = { id: fixture.id, persona: fixture.template.persona, title: fixture.template.title };
      profileEvidence.desktop = await inspectFixture(client, fixture, DESKTOP, evidence);
      profileEvidence.mobile390 = await inspectFixture(client, fixture, MOBILE, evidence);
      evidence.profiles.push(profileEvidence);
    }

    await stopSession();
    await startSession();
    const issuesFixture = fixtureData.fixtures.find((fixture) => fixture.id === "issues");
    evidence.print = await exercisePrint(client, issuesFixture, fixtureData.actionableCount, evidence);
    evidence.cspAndOffline = await exerciseCspAndOffline(client, evidence);
    evidence.portfolioPrint = {};
    for (const fixture of fixtureData.portfolioPrintFixtures) {
      await stopSession();
      await startSession();
      Object.assign(evidence.portfolioPrint, await exercisePortfolioPrintScopes(client, [fixture], evidence));
    }
    evidence.summary = {
      passed: evidence.checks.filter((check) => check.passed).length,
      failed: evidence.checks.filter((check) => !check.passed).length,
      screenshots: evidence.profiles.length * 2,
      personas: evidence.profiles.length,
      printArtifacts: 1 + Object.keys(evidence.portfolioPrint).length
    };
    await writeFile(join(ARTIFACT_ROOT, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
    console.log(`Browser regression passed: ${evidence.summary.passed} checks, ${evidence.summary.personas} personas, ${evidence.summary.screenshots} deterministic screenshots.`);
    console.log(`Evidence: ${join(ARTIFACT_ROOT, "evidence.json")}`);
  } catch (error) {
    evidence.failure = { name: error.name, message: error.message, browserProcess: browserProcessDetails() };
    evidence.summary = {
      passed: evidence.checks.filter((check) => check.passed).length,
      failed: evidence.checks.filter((check) => !check.passed).length + 1
    };
    await writeFile(join(ARTIFACT_ROOT, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8").catch(() => {});
    throw error;
  } finally {
    await stopSession();
    await Promise.all(profileDirectories.map((profileDirectory) => rm(profileDirectory, { recursive: true, force: true }).catch(() => {})));
  }
}

await main();
