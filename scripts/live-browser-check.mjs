import { readFile } from "node:fs/promises";

const cdpBase = process.env.OFFLINE_REPORT_CDP || "http://127.0.0.1:9223";
const sonarUrl = process.env.OFFLINE_REPORT_URL;
const projectKey = process.env.OFFLINE_REPORT_PROJECT;
let token = process.env.OFFLINE_REPORT_TOKEN;
const downloadPath = process.env.OFFLINE_REPORT_DOWNLOADS;
const outputFormat = process.env.OFFLINE_REPORT_FORMAT || "html";

if (!token && process.env.OFFLINE_REPORT_ENV_FILE) {
  const environment = await readFile(process.env.OFFLINE_REPORT_ENV_FILE, "utf8");
  const match = environment.match(/^\s*(?:export\s+)?SONAR_TOKEN=(.*)$/m);
  token = match && match[1].trim().replace(/^(["'])(.*)\1$/, "$2");
}

if (!sonarUrl || !projectKey || !token || !downloadPath) {
  throw new Error("OFFLINE_REPORT_URL, OFFLINE_REPORT_PROJECT, OFFLINE_REPORT_TOKEN, and OFFLINE_REPORT_DOWNLOADS are required.");
}

const targets = await (await fetch(`${cdpBase}/json/list`)).json();
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No CDP page target is available.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

let sequence = 0;
const pending = new Map();
const events = [];
const allowedOrigin = new URL(sonarUrl).origin;
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const handlers = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) handlers.reject(new Error(JSON.stringify(message.error)));
    else handlers.resolve(message.result);
  } else if (message.method === "Fetch.requestPaused") {
    const requestUrl = new URL(message.params.request.url);
    if (requestUrl.origin !== allowedOrigin) {
      send("Fetch.failRequest", { requestId: message.params.requestId, errorReason: "BlockedByClient" }).catch(() => {});
      return;
    }
    const headers = (message.params.request.headers ? Object.entries(message.params.request.headers) : [])
      .filter(([name]) => name.toLowerCase() !== "authorization")
      .map(([name, value]) => ({ name, value: String(value) }));
    headers.push({ name: "Authorization", value: `Bearer ${token}` });
    send("Fetch.continueRequest", { requestId: message.params.requestId, headers }).catch(() => {});
  } else {
    events.push(message);
  }
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(label, probeExpression, timeoutMs = 60000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(probeExpression)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${label} after ${Math.round(timeoutMs / 1000)} seconds.`);
}

await send("Network.enable");
await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath, eventsEnabled: true });
await send("Page.navigate", {
  url: `${sonarUrl}/project/extension/offlinereport/report_page?id=${encodeURIComponent(projectKey)}`
});
await waitFor("the Offline Report page", `Boolean(document.querySelector('.orp'))`, 30000);

const layout = await evaluate(`(() => {
  const root = document.querySelector('.orp');
  const create = document.querySelector('#orp-create');
  return {
    url: location.href,
    title: document.title,
    pluginRoot: Boolean(root),
    viewportHeight: innerHeight,
    documentScrollHeight: document.documentElement.scrollHeight,
    bodyScrollHeight: document.body.scrollHeight,
    pluginScrollHeight: root && root.scrollHeight,
    bodyOverflow: getComputedStyle(document.body).overflow,
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    createRect: create && create.getBoundingClientRect().toJSON(),
    hasNestedPluginScroll: root && root.scrollHeight > root.clientHeight && ['auto','scroll'].includes(getComputedStyle(root).overflowY),
    formats: Array.from(document.querySelectorAll('input[name="format"]')).map((item) => item.value),
    progressLabel: document.querySelector('#orp-progress')?.getAttribute('aria-label'),
    status: document.querySelector('#orp-status')?.textContent
  };
})()`);
console.log(JSON.stringify({ layout }));

if (layout.pluginRoot) {
  await evaluate(`(() => { const input = document.querySelector('input[name="format"][value=${JSON.stringify(outputFormat)}]'); if (!input) throw new Error('Requested format is unavailable'); input.checked = true; input.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await evaluate(`document.querySelector('#orp-create').click(); true`);
  await waitFor("report collection and export", `(() => {
    const create = document.querySelector('#orp-create');
    const status = document.querySelector('#orp-status')?.textContent || '';
    return create && !create.disabled && !/^(Ready to create|Collecting current data|Using prepared data|Reading )/.test(status);
  })()`, 90000);
  const collected = await evaluate(`(() => ({
    status: document.querySelector('#orp-status')?.textContent,
    cache: document.querySelector('#orp-cache')?.textContent,
    createDisabled: document.querySelector('#orp-create')?.disabled
  }))()`);
  console.log(JSON.stringify({ collected }));
}

const relevantEvents = events
  .filter((event) => ["Runtime.exceptionThrown", "Log.entryAdded", "Browser.downloadWillBegin", "Browser.downloadProgress"].includes(event.method))
  .map((event) => ({ method: event.method, params: event.params }));
console.log(JSON.stringify({ events: relevantEvents }, null, 2));
await send("Browser.close").catch(() => {});
socket.close();
