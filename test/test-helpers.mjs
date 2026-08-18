import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");

export async function loadApp(files = ["core.js", "xlsx.js", "api.js", "html-report.js"], globals = {}) {
  const window = {};
  const { window: windowGlobals = {}, ...contextGlobals } = globals;
  Object.assign(window, windowGlobals);
  const context = vm.createContext({
    window,
    console,
    TextEncoder,
    TextDecoder,
    Blob,
    DOMException,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    Math,
    Date,
    ...contextGlobals
  });
  window.window = window;
  for (const file of files) {
    const source = await readFile(resolve(root, "src/main/js", file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
  return window.OfflineReport;
}

export function sampleReport(overrides = {}) {
  return {
    schemaVersion: 1,
    generatedAt: "2026-08-18T12:00:00.000Z",
    collectionStartedAt: "2026-08-18T11:59:00.000Z",
    complete: true,
    serverVersion: "10.8.0.100206",
    branchLabel: "Main branch",
    collectionScope: { issues: true, components: true, analyses: true, people: false },
    project: { key: "sample", name: "Sample", qualifier: "TRK", version: "1.0", analysisDate: "2026-08-18T11:00:00Z" },
    qualityGate: { status: "OK", conditions: [], ignoredConditions: false },
    measures: [{ metric: "ncloc", value: "42", bestValue: false }],
    issues: [],
    rules: [],
    components: [],
    analyses: [],
    issuePaging: { expected: 0, exported: 0, limit: 10000 },
    componentPaging: { expected: 0, exported: 0, limit: 10000 },
    warnings: [],
    ...overrides
  };
}
