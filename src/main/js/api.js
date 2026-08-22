(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const API_PATHS = Object.freeze({
    systemStatus: "/api/system/status",
    measures: "/api/measures/component",
    qualityGate: "/api/qualitygates/project_status",
    issues: "/api/issues/search",
    components: "/api/components/tree",
    analyses: "/api/project_analyses/search",
    projects: "/api/components/search",
    trends: "/api/measures/search_history"
  });
  const METRICS = [
    "alert_status", "ncloc", "files", "coverage", "lines_to_cover", "uncovered_lines",
    "line_coverage", "branch_coverage", "conditions_to_cover", "uncovered_conditions",
    "new_lines_to_cover", "new_uncovered_lines", "new_conditions_to_cover", "new_uncovered_conditions",
    "duplicated_lines_density", "duplicated_lines", "complexity",
    "cognitive_complexity", "bugs", "vulnerabilities", "code_smells",
    "tests", "test_errors", "test_failures", "skipped_tests", "test_execution_time", "test_success_density",
    "reliability_rating", "security_rating", "sqale_rating", "sqale_index",
    "security_hotspots", "security_hotspots_reviewed", "security_review_rating",
    "new_security_hotspots", "new_coverage", "new_duplicated_lines_density",
    "new_bugs", "new_vulnerabilities", "new_code_smells", "new_violations",
    "new_security_hotspots_reviewed"
  ].join(",");
  const COMPONENT_METRICS = [
    "ncloc", "coverage", "line_coverage", "branch_coverage", "lines_to_cover", "uncovered_lines",
    "conditions_to_cover", "uncovered_conditions", "duplicated_lines_density", "duplicated_lines",
    "complexity", "cognitive_complexity"
  ].join(",");
  const TREND_METRICS = ["coverage", "duplicated_lines_density", "bugs", "vulnerabilities", "code_smells", "sqale_index", "security_hotspots", "ncloc"];
  const REQUEST_TIMEOUT_MS = 45000;
  const MAX_RETRY_DELAY_MS = 30000;
  const ISSUE_SEARCH_WINDOW = 10000;
  const MAX_PORTFOLIO_PROJECTS = 50;
  const DEFAULT_PORTFOLIO_CONCURRENCY = 3;
  const ARTIFACT_FORMATS = Object.freeze(["html", "xlsx", "docx", "print", "csv", "json"]);

  function assertAllowedPath(path) {
    if (!Object.values(API_PATHS).includes(path)) throw new Error(`Blocked unexpected API path: ${path}`);
  }

  function abortIfNeeded(signal) {
    if (signal && signal.aborted) throw new DOMException("Export cancelled", "AbortError");
  }

  function abortError() {
    return new DOMException("Export cancelled", "AbortError");
  }

  function sleep(milliseconds, signal) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (handler, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (signal) signal.removeEventListener("abort", onAbort);
        handler(value);
      };
      const onAbort = () => finish(reject, abortError());
      const timer = setTimeout(() => finish(resolve), Math.max(0, milliseconds));
      if (signal) {
        if (signal.aborted) onAbort();
        else signal.addEventListener("abort", onAbort, { once: true });
      }
    });
  }

  function errorStatus(error) {
    return error && (error.status || (error.response && error.response.status));
  }

  function errorHeader(error, name) {
    const responseHeaders = error && error.response && error.response.headers;
    const headers = responseHeaders || (error && error.headers);
    if (!headers) return "";
    if (typeof headers.get === "function") return headers.get(name) || "";
    const wanted = name.toLowerCase();
    const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === wanted);
    return key ? headers[key] : "";
  }

  function retryAfterMilliseconds(error, now) {
    const value = String(errorHeader(error, "Retry-After") || "").trim();
    if (!value) return 0;
    if (/^\d+(?:\.\d+)?$/.test(value)) return Math.max(0, Number(value) * 1000);
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed - (now === undefined ? Date.now() : now)) : 0;
  }

  function retryDelayMilliseconds(error, attempt) {
    const localDelay = 300 * (2 ** attempt) + Math.floor(Math.random() * 100);
    return Math.min(MAX_RETRY_DELAY_MS, Math.max(localDelay, retryAfterMilliseconds(error)));
  }

  function requestWithControl(requestPromise, signal, timeoutMs) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (handler, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (signal) signal.removeEventListener("abort", onAbort);
        handler(value);
      };
      const onAbort = () => finish(reject, abortError());
      const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : REQUEST_TIMEOUT_MS;
      const timer = setTimeout(() => {
        const error = new Error(`SonarQube did not respond within ${Math.round(timeout / 1000)} seconds.`);
        error.name = "TimeoutError";
        finish(reject, error);
      }, timeout);
      if (signal) {
        if (signal.aborted) onAbort();
        else signal.addEventListener("abort", onAbort, { once: true });
      }
      Promise.resolve(requestPromise).then(
        (value) => finish(resolve, value),
        (error) => finish(reject, error)
      );
    });
  }

  function contextPathFromLocation() {
    const pathname = global.location && typeof global.location.pathname === "string" ? global.location.pathname : "";
    const markers = ["/project/extension/", "/extension/"];
    const positions = markers.map((marker) => pathname.indexOf(marker)).filter((index) => index >= 0);
    if (!positions.length) return "";
    const candidate = pathname.slice(0, Math.min(...positions)).replace(/\/+$/, "");
    return /^\/(?:[A-Za-z0-9._~-]+\/?)*$/.test(candidate) ? candidate : "";
  }

  function serverLocationProvenance() {
    const location = global.location;
    if (!location) return { serverBaseUrl: null, serverBaseUrlScope: "unavailable" };
    let origin = app.text(location.origin);
    if (!origin && location.protocol && location.host) origin = `${location.protocol}//${location.host}`;
    try {
      const parsed = new URL(origin);
      if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin.replace(/\/$/, "")) {
        return { serverBaseUrl: null, serverBaseUrlScope: "unavailable" };
      }
      const contextPath = contextPathFromLocation();
      return {
        serverBaseUrl: `${parsed.origin}${contextPath}`,
        serverBaseUrlScope: contextPath ? "origin_and_context_path" : "origin_only"
      };
    } catch (_) {
      return { serverBaseUrl: null, serverBaseUrlScope: "unavailable" };
    }
  }

  function apiRequestUrl(path, params) {
    assertAllowedPath(path);
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      query.set(key, Array.isArray(value) ? value.join(",") : String(value));
    });
    const suffix = query.toString();
    const requestPath = `${contextPathFromLocation()}${path}`;
    return suffix ? `${requestPath}?${suffix}` : requestPath;
  }

  function timeoutError(timeout) {
    const error = new Error(`SonarQube did not respond within ${Math.round(timeout / 1000)} seconds.`);
    error.name = "TimeoutError";
    return error;
  }

  async function fetchJson(path, params, signal, timeoutMs) {
    abortIfNeeded(signal);
    const Controller = global.AbortController || (typeof AbortController === "function" ? AbortController : null);
    if (!Controller) throw new Error("This browser cannot create an abortable SonarQube request.");
    const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : REQUEST_TIMEOUT_MS;
    const transport = new Controller();
    let timedOut = false;
    const onAbort = () => transport.abort();
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      transport.abort();
    }, timeout);
    try {
      const response = await global.fetch(apiRequestUrl(path, params), {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        signal: transport.signal
      });
      abortIfNeeded(signal);
      if (timedOut) throw timeoutError(timeout);
      if (!response || !response.ok) {
        const status = Number(response && response.status) || 0;
        const error = new Error(status ? `SonarQube request failed (HTTP ${status}).` : "SonarQube request failed.");
        error.status = status;
        error.response = response;
        throw error;
      }
      const body = await response.json();
      abortIfNeeded(signal);
      if (timedOut) throw timeoutError(timeout);
      return body;
    } catch (error) {
      if (signal && signal.aborted) throw abortError();
      if (timedOut) throw timeoutError(timeout);
      throw error;
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
    }
  }

  async function authenticatedRequest(path, params, signal, timeoutMs) {
    if (typeof global.fetch === "function") return fetchJson(path, params, signal, timeoutMs);
    const request = global.SonarRequest && global.SonarRequest.getJSON;
    if (typeof request !== "function") {
      throw new Error("This SonarQube page does not expose a compatible same-origin request transport.");
    }
    return requestWithControl(request(path, params || {}), signal, timeoutMs);
  }

  async function apiGet(path, params, signal, retries, timeoutMs) {
    assertAllowedPath(path);
    abortIfNeeded(signal);
    const maxRetries = retries === undefined ? 2 : retries;
    let attempt = 0;
    while (true) {
      try {
        const result = await authenticatedRequest(path, params || {}, signal, timeoutMs);
        abortIfNeeded(signal);
        return result;
      } catch (error) {
        if (error && (error.name === "AbortError" || error.name === "TimeoutError")) throw error;
        const status = errorStatus(error);
        if (attempt >= maxRetries || ![429, 503].includes(status)) throw error;
        await sleep(retryDelayMilliseconds(error, attempt), signal);
        attempt += 1;
        abortIfNeeded(signal);
      }
    }
  }

  function branchParameters(branchLike) {
    if (!branchLike) return {};
    if (branchLike.name) return { branch: branchLike.name };
    if (branchLike.key) return { pullRequest: branchLike.key };
    return {};
  }

  function branchLabel(branchLike) {
    if (!branchLike) return "Main branch";
    if (branchLike.name) return `Branch: ${branchLike.name}`;
    if (branchLike.key) return `Pull request: ${branchLike.key}`;
    return "Main branch";
  }

  function measureSnapshotFingerprint(response) {
    const component = response && response.component || {};
    const measures = Array.isArray(component.measures) ? component.measures : [];
    return JSON.stringify({
      key: app.text(component.key),
      measures: measures.map((measure) => ({
        metric: app.text(measure && measure.metric),
        value: app.text(measure && measure.value),
        bestValue: measure && typeof measure.bestValue === "boolean" ? measure.bestValue : null,
        period: measure && measure.period ? {
          index: Number.isFinite(Number(measure.period.index)) ? Number(measure.period.index) : null,
          value: app.text(measure.period.value),
          bestValue: typeof measure.period.bestValue === "boolean" ? measure.period.bestValue : null
        } : null
      })).sort((left, right) => left.metric.localeCompare(right.metric))
    });
  }

  function pagingTotal(response) {
    return Number((response.paging && response.paging.total) || response.total || 0);
  }

  function normalizeIssue(issue, includePeople) {
    const impacts = Array.isArray(issue.impacts)
      ? issue.impacts.map((impact) => `${impact.softwareQuality || ""}:${impact.severity || ""}`).filter(Boolean)
      : [];
    const issueStatus = app.text(issue.issueStatus);
    const legacyStatus = app.text(issue.status);
    const status = issueStatus || legacyStatus;
    const resolution = app.text(issue.resolution);
    return {
      key: app.text(issue.key),
      rule: app.text(issue.rule),
      type: app.text(issue.type || impacts.map((value) => value.split(":")[0]).join(", ")),
      severity: app.text(issue.severity || impacts.map((value) => value.split(":")[1]).join(", ")),
      impacts,
      status,
      issueStatus,
      legacyStatus,
      lifecycleStatus: app.issueLifecycleStatus(status, resolution),
      resolution,
      message: app.text(issue.message),
      component: app.text(issue.component),
      project: app.text(issue.project),
      line: issue.line === undefined ? "" : app.text(issue.line),
      textRange: issue.textRange || null,
      effort: app.text(issue.effort || issue.debt),
      assignee: includePeople ? app.text(issue.assignee) : "",
      author: includePeople ? app.text(issue.author) : "",
      tags: Array.isArray(issue.tags) ? issue.tags.map(app.text) : [],
      creationDate: app.text(issue.creationDate),
      updateDate: app.text(issue.updateDate),
      closeDate: app.text(issue.closeDate),
      cleanCodeAttribute: app.text(issue.cleanCodeAttribute)
    };
  }

  function itemIdentity(item) {
    if (!item || typeof item !== "object") return "";
    for (const property of ["key", "id", "uuid"]) {
      const value = app.text(item[property]);
      if (value) return `${property}:${value}`;
    }
    return "";
  }

  async function collectPaged(path, baseParams, arrayName, limit, progress, signal) {
    const pageSize = 500;
    const items = [];
    const identities = new Set();
    const observedTotals = [];
    const normalizedLimit = Math.max(0, Number(limit) || 0);
    let expected = 0;
    let page = 1;
    let pagesFetched = 0;
    let rawFetched = 0;
    let duplicatesRemoved = 0;
    let terminationReason = normalizedLimit === 0 ? "limit_zero" : "not_started";
    let auxiliary = {};
    const relatedRules = {};
    const maximumPages = Math.ceil(normalizedLimit / pageSize) + 2;
    while (items.length < normalizedLimit) {
      abortIfNeeded(signal);
      if (path === API_PATHS.issues && (page - 1) * pageSize >= ISSUE_SEARCH_WINDOW) {
        terminationReason = "api_search_window";
        break;
      }
      // Keep page size stable: changing ps changes the server-side page offset and can duplicate rows.
      const response = await apiGet(path, { ...baseParams, p: page, ps: pageSize }, signal);
      const pageItems = Array.isArray(response[arrayName]) ? response[arrayName] : [];
      expected = pagingTotal(response);
      observedTotals.push(expected);
      pagesFetched += 1;
      rawFetched += pageItems.length;
      auxiliary = response;
      (response.rules || []).forEach((rule) => {
        if (rule && rule.key) relatedRules[rule.key] = rule;
      });
      pageItems.forEach((item) => {
        const identity = itemIdentity(item);
        if (identity && identities.has(identity)) {
          duplicatesRemoved += 1;
          return;
        }
        if (identity) identities.add(identity);
        items.push(item);
      });
      progress(Math.min(items.length, expected || items.length), expected);
      const target = Math.min(expected || normalizedLimit, normalizedLimit);
      if (items.length >= target) {
        terminationReason = "target_reached";
        break;
      }
      if (!pageItems.length) {
        terminationReason = "empty_page";
        break;
      }
      if (pageItems.length < pageSize) {
        terminationReason = "short_page";
        break;
      }
      if (pagesFetched >= maximumPages) {
        terminationReason = "safety_cap";
        break;
      }
      page += 1;
    }
    const exportedItems = items.slice(0, normalizedLimit);
    const target = Math.min(expected, normalizedLimit);
    const expectedChangedDuringPaging = new Set(observedTotals).size > 1;
    const reconciled = !expectedChangedDuringPaging
      && (expected === 0 ? rawFetched === 0 : items.length >= target);
    auxiliary = { ...auxiliary, rules: Object.values(relatedRules) };
    return {
      items: exportedItems,
      expected,
      auxiliary,
      paging: {
        expected,
        exported: exportedItems.length,
        limit: normalizedLimit,
        rawFetched,
        uniqueFetched: items.length,
        duplicates: duplicatesRemoved,
        duplicatesRemoved,
        pagesFetched,
        pageSize,
        expectedAtFirstPage: observedTotals.length ? observedTotals[0] : 0,
        expectedAtLastPage: observedTotals.length ? observedTotals[observedTotals.length - 1] : 0,
        expectedChangedDuringPaging,
        reconciled,
        truncated: expected > exportedItems.length,
        reconciliation: "stable-key-first-seen",
        terminationReason,
        maximumPages
      }
    };
  }

  async function listVisibleProjects(signal, onProgress, limit) {
    const maximum = Math.max(1, Math.min(10000, Number(limit) || 10000));
    const result = await collectPaged(API_PATHS.projects, { qualifiers: "TRK" }, "components", maximum, (current, total) => {
      if (typeof onProgress === "function") onProgress({ current, total, message: `Reading visible projects: ${current} of ${total || "?"}` });
    }, signal);
    const projects = result.items.filter((component) => !component.qualifier || ["TRK", "PROJECT"].includes(app.text(component.qualifier).toUpperCase())).map((component) => ({
      key: app.text(component.key),
      name: app.text(component.name || component.key),
      qualifier: app.text(component.qualifier || "TRK"),
      project: app.text(component.project),
      lastAnalysisDate: app.text(component.lastAnalysisDate),
      visibility: app.text(component.visibility)
    })).filter((project) => project.key);
    return { projects, paging: { ...result.paging, expected: result.expected, exported: projects.length } };
  }

  async function collectTrendHistory(componentKey, common, signal) {
    const pageSize = 100;
    const parameters = { component: componentKey, metrics: TREND_METRICS.join(","), p: 1, ps: pageSize, ...common };
    const first = await apiGet(API_PATHS.trends, parameters, signal);
    const serverTotal = pagingTotal(first);
    const lastPage = serverTotal > pageSize ? Math.ceil(serverTotal / pageSize) : 1;
    const response = lastPage > 1 ? await apiGet(API_PATHS.trends, { ...parameters, p: lastPage }, signal) : first;
    const normalized = app.normalizeTrendResponse(response, TREND_METRICS, pageSize);
    const expected = Math.min(serverTotal, pageSize);
    const exported = normalized.paging.exported;
    const reconciled = expected === 0 || exported >= expected;
    normalized.paging = {
      ...normalized.paging,
      expected,
      serverTotal,
      exported,
      pagesFetched: lastPage > 1 ? 2 : 1,
      requestedPage: lastPage,
      reconciled,
      truncated: false,
      olderAvailable: serverTotal > exported,
      terminationReason: serverTotal > exported ? "selected_scope_reached" : "target_reached"
    };
    return normalized;
  }

  function failedDatasetState(error) {
    const status = Number(errorStatus(error)) || undefined;
    return {
      requested: true,
      state: status === 401 || status === 403 ? "permission_denied" : status === 404 ? "not_available" : "partial_error",
      ...(status ? { httpStatus: status } : {})
    };
  }

  function pagedDatasetState(requested, result, limit) {
    if (!requested) return { requested: false, state: "not_requested" };
    const paging = result.paging || {
      expected: result.expected || 0,
      exported: (result.items || []).length,
      limit
    };
    let state = "complete";
    let reason;
    if (paging.reconciled === false) {
      state = "partial_error";
      reason = "unreconciled_paging";
    } else if (paging.expected > paging.exported) {
      state = "partial_limit";
      reason = "configured_or_api_limit";
    }
    return { requested: true, state, ...(reason ? { reason } : {}), ...paging };
  }

  async function optional(label, operation, fallback, warnings, onFailure) {
    try {
      return await operation();
    } catch (error) {
      if (error && error.name === "AbortError") throw error;
      const status = errorStatus(error);
      warnings.push(`${label} could not be exported${status ? ` (HTTP ${status})` : ""}.`);
      if (typeof onFailure === "function") onFailure(error);
      return fallback;
    }
  }

  function requiredDatasetKeys(template) {
    const source = template && template.requiredDatasets;
    if (Array.isArray(source)) return source.map((key) => app.text(key)).filter((key) => (app.DATASET_KEYS || []).includes(key));
    if (!source || typeof source !== "object") return [];
    return (app.DATASET_KEYS || ["issues", "components", "analyses", "trends", "people"]).filter((key) => source[key] === true);
  }

  function datasetWasRequested(source, key) {
    if (!source || typeof source !== "object") return false;
    const collectionScope = source.collectionScope || source.requestedScope || source;
    if (collectionScope[key] !== undefined) return !!collectionScope[key];
    const option = `include${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    if (collectionScope[option] !== undefined) return !!collectionScope[option];
    const state = source.datasetStates && source.datasetStates[key];
    return !!(state && state.requested);
  }

  function missingRequiredDatasets(template, source) {
    return requiredDatasetKeys(template).filter((key) => !datasetWasRequested(source, key));
  }

  function buildProvenance() {
    const build = global.OfflineReportBuild && typeof global.OfflineReportBuild === "object" ? global.OfflineReportBuild : {};
    const sourceRevision = /^[0-9a-f]{7,64}$/i.test(app.text(build.sourceRevision)) ? app.text(build.sourceRevision) : null;
    const sourceDigest = /^sha256:[0-9a-f]{64}$/i.test(app.text(build.sourceDigest))
      ? app.text(build.sourceDigest).toLowerCase()
      : null;
    const pluginArtifactDigest = /^sha256:[0-9a-f]{64}$/i.test(app.text(build.pluginArtifactDigest))
      ? app.text(build.pluginArtifactDigest).toLowerCase()
      : null;
    return { sourceRevision, sourceDigest, pluginArtifactDigest, ...serverLocationProvenance() };
  }

  function reportCollections(report) {
    if (report && report.reportMode === "portfolio") {
      const projectEntries = report.projects || [];
      const entries = projectEntries.filter((entry) => entry && entry.derived);
      return {
        projects: projectEntries.length,
        issues: entries.flatMap((entry) => entry.issues || []),
        components: entries.flatMap((entry) => entry.components || []),
        analyses: entries.flatMap((entry) => entry.analyses || []),
        trends: entries.flatMap((entry) => entry.trends || [])
      };
    }
    return {
      projects: report && report.project ? 1 : 0,
      issues: report && report.issues || [],
      components: report && report.components || [],
      analyses: report && report.analyses || [],
      trends: report && report.trends || []
    };
  }

  function artifactIssueCount(issues, issueScope) {
    if (issueScope !== "active") return issues.length;
    return issues.filter((issue) => {
      const lifecycle = app.text(issue && (issue.normalizedLifecycle || issue.lifecycleStatus)).toLowerCase();
      return lifecycle ? lifecycle === "actionable" : app.issueLifecycle ? app.issueLifecycle(issue) === "actionable" : true;
    }).length;
  }

  function createArtifactReport(snapshot, requestedFormat, context) {
    if (!snapshot || typeof snapshot !== "object") throw new Error("A collected report snapshot is required before export.");
    const format = app.text(requestedFormat).toLowerCase();
    if (!ARTIFACT_FORMATS.includes(format)) throw new Error(`Unsupported report artifact format: ${requestedFormat}`);
    const settings = context && typeof context === "object" ? context : {};
    const exportedAt = settings.exportedAt ? new Date(settings.exportedAt).toISOString() : new Date().toISOString();
    const purpose = app.text(settings.purpose) || (format === "print" ? "print" : ["csv", "json"].includes(format) ? "data" : "document");
    const mode = app.text(settings.mode) || (["docx", "print"].includes(format) ? "summary" : format === "csv" ? "register" : "full");
    const issueScope = app.text(settings.issueScope) || (format === "csv" ? "all-collected" : mode === "register" ? "active" : "not-applicable");
    const collectionComplete = snapshot.collectionComplete !== undefined ? !!snapshot.collectionComplete : !!snapshot.complete;
    const missing = [...new Set([...(settings.missingRequiredDatasets || []), ...missingRequiredDatasets(settings.template, snapshot)])];
    const warnings = [...new Set([...(settings.warnings || []), ...(missing.length ? [`The selected profile requires uncollected datasets: ${missing.join(", ")}.`] : [])])];
    const issueDatasetRequired = format === "csv" || (["docx", "print"].includes(format) && mode === "register");
    if (issueDatasetRequired && !datasetWasRequested(snapshot, "issues")) warnings.push("This artifact requires the Issues dataset, but it was not collected.");
    const collections = reportCollections(snapshot);
    const fullModel = ["html", "xlsx", "json"].includes(format);
    const templateSections = settings.template && settings.template.sections || {};
    const sectionDatasetsRepresented = ["docx", "print"].includes(format);
    const issuesRepresented = format === "csv" || (!!templateSections.issues && ["docx", "print"].includes(format));
    const representedDatasets = fullModel
      ? (app.DATASET_KEYS || []).filter((key) => datasetWasRequested(snapshot, key))
      : [
        issuesRepresented && "issues",
        sectionDatasetsRepresented && templateSections.components && "components",
        sectionDatasetsRepresented && templateSections.analyses && "analyses",
        sectionDatasetsRepresented && templateSections.trends && "trends",
        issuesRepresented && datasetWasRequested(snapshot, "people") && "people"
      ].filter(Boolean);
    const trendObservationCount = collections.trends.reduce((sum, series) => sum + ((series && series.observations || []).length), 0);
    const defaultCounts = fullModel ? {
      projects: collections.projects,
      issues: collections.issues.length,
      components: collections.components.length,
      analyses: collections.analyses.length,
      trendObservations: trendObservationCount
    } : {
      projects: collections.projects,
      issues: format === "csv" || (mode === "register" && !!templateSections.issues) ? artifactIssueCount(collections.issues, issueScope) : 0,
      components: sectionDatasetsRepresented && templateSections.components ? collections.components.length : 0,
      analyses: sectionDatasetsRepresented && templateSections.analyses ? collections.analyses.length : 0,
      trendObservations: sectionDatasetsRepresented && templateSections.trends ? trendObservationCount : 0
    };
    const datasetKeys = app.DATASET_KEYS || ["issues", "components", "analyses", "trends", "people"];
    const requestedScope = settings.scope && typeof settings.scope === "object" ? settings.scope : {};
    const effectiveRepresentedDatasets = (Array.isArray(requestedScope.representedDatasets) ? requestedScope.representedDatasets : representedDatasets)
      .map((key) => app.text(key)).filter((key, index, items) => datasetKeys.includes(key) && items.indexOf(key) === index);
    const explicitlyExcludedDatasets = (Array.isArray(requestedScope.excludedDatasets) ? requestedScope.excludedDatasets : [])
      .map((key) => app.text(key)).filter((key, index, items) => datasetKeys.includes(key) && items.indexOf(key) === index);
    const requestedRepresentations = requestedScope.representationByDataset && typeof requestedScope.representationByDataset === "object"
      ? requestedScope.representationByDataset : {};
    const representationByDataset = Object.freeze(Object.fromEntries(datasetKeys
      .filter((key) => requestedRepresentations[key] !== undefined)
      .map((key) => [key, app.text(requestedRepresentations[key]).slice(0, 80)])));
    const requiredDatasets = requiredDatasetKeys(settings.template);
    const enforcePersonaRepresentation = ["html", "xlsx", "docx", "print"].includes(format);
    const unrepresentedRequiredDatasets = enforcePersonaRepresentation
      ? requiredDatasets.filter((key) => !effectiveRepresentedDatasets.includes(key) && !explicitlyExcludedDatasets.includes(key))
      : [];
    if (unrepresentedRequiredDatasets.length) {
      warnings.push(`This artifact does not represent profile-required datasets: ${unrepresentedRequiredDatasets.join(", ")}.`);
    }
    const scope = Object.freeze({
      ...requestedScope,
      fullModel: requestedScope.fullModel !== undefined ? !!requestedScope.fullModel : fullModel,
      requiredDatasets: Object.freeze(requiredDatasets),
      representedDatasets: Object.freeze(effectiveRepresentedDatasets),
      excludedDatasets: Object.freeze(explicitlyExcludedDatasets),
      representationByDataset
    });
    const artifactEligibleForCompletion = collectionComplete && missing.length === 0 && unrepresentedRequiredDatasets.length === 0
      && (!issueDatasetRequired || datasetWasRequested(snapshot, "issues"));
    const artifactComplete = settings.artifactComplete !== undefined
      ? artifactEligibleForCompletion && !!settings.artifactComplete
      : artifactEligibleForCompletion;
    const artifact = Object.freeze({
      format,
      purpose,
      mode,
      issueScope,
      exportedAt,
      collectionComplete,
      artifactComplete,
      exportedCounts: Object.freeze({ ...defaultCounts, ...(settings.exportedCounts || {}) }),
      warnings: Object.freeze([...new Set(warnings)]),
      scope,
      artifactDigest: null,
      artifactDigestState: "not_computed"
    });
    return Object.freeze({
      ...snapshot,
      collectedAt: snapshot.collectedAt || snapshot.collectionCompletedAt || snapshot.generatedAt,
      collectionComplete,
      exportedAt,
      artifactComplete,
      artifact,
      generatedAt: exportedAt
    });
  }

  async function collectReport(component, branchLike, options, onProgress, signal) {
    if (!component || !component.key) throw new Error("The current SonarQube project could not be identified.");
    const progress = typeof onProgress === "function" ? onProgress : () => {};
    const warnings = [];
    const datasetStates = {
      serverMetadata: { requested: true, state: "complete" },
      measures: { requested: true, state: "complete" },
      qualityGate: { requested: true, state: "complete" },
      issues: { requested: !!options.includeIssues, state: options.includeIssues ? "complete" : "not_requested" },
      components: { requested: !!options.includeComponents, state: options.includeComponents ? "complete" : "not_requested" },
      analyses: { requested: !!options.includeAnalyses, state: options.includeAnalyses ? "complete" : "not_requested" },
      trends: { requested: !!options.includeTrends, state: options.includeTrends ? "complete" : "not_requested" },
      analysisSnapshot: { requested: true, state: "complete" }
    };
    const common = branchParameters(branchLike);
    const branchScoped = Object.keys(common).length > 0;
    const startedAt = new Date().toISOString();
    progress({ phase: "metadata", message: "Reading project metadata…" });

    const status = await optional("Server version", () => apiGet(API_PATHS.systemStatus, {}, signal), {}, warnings,
      (error) => { datasetStates.serverMetadata = failedDatasetState(error); });
    const measuresResponse = await apiGet(API_PATHS.measures, {
      component: component.key,
      metricKeys: METRICS,
      ...common
    }, signal);
    const initialMeasureSnapshot = measureSnapshotFingerprint(measuresResponse);
    const measuredComponent = measuresResponse.component || component;
    let analysisDateBeforeCollection = app.text(measuredComponent.analysisDate || component.analysisDate);
    if (!analysisDateBeforeCollection && !branchScoped) {
      const initialAnalysis = await optional("Initial analysis identity", () => apiGet(API_PATHS.analyses, {
        project: component.key, p: 1, ps: 1
      }, signal), { analyses: [] }, warnings);
      analysisDateBeforeCollection = app.text(initialAnalysis.analyses && initialAnalysis.analyses[0] && initialAnalysis.analyses[0].date);
    }

    progress({ phase: "quality-gate", message: "Reading quality gate…" });
    const gateResponse = await optional("Quality gate", () => apiGet(API_PATHS.qualityGate, {
      projectKey: component.key,
      ...common
    }, signal), { projectStatus: { status: "UNKNOWN", conditions: [] } }, warnings,
    (error) => { datasetStates.qualityGate = failedDatasetState(error); });

    let issueResult = { items: [], expected: 0, auxiliary: {}, paging: { expected: 0, exported: 0, limit: options.maxIssues } };
    if (options.includeIssues) {
      progress({ phase: "issues", message: "Reading issues…", current: 0, total: 0 });
      issueResult = await collectPaged(API_PATHS.issues, {
        components: component.key,
        additionalFields: "rules",
        s: "CREATION_DATE",
        asc: true,
        ...common
      }, "issues", options.maxIssues, (current, total) => progress({
        phase: "issues", message: `Reading issues: ${current} of ${total || "?"}`, current, total
      }), signal);
      datasetStates.issues = pagedDatasetState(true, issueResult, options.maxIssues);
      if (issueResult.expected > issueResult.items.length) {
        warnings.push(`Issue export is incomplete: ${issueResult.items.length} of ${issueResult.expected} issues were exported. The Web API search window and configured safety limit are 10,000 issues.`);
      }
      if (issueResult.paging.reconciled === false) warnings.push("Issue paging could not be reconciled to the server-reported total; duplicate or changing results were removed.");
    }

    let components = [];
    let componentExpected = 0;
    let componentResult = { items: [], expected: 0, paging: { expected: 0, exported: 0, limit: options.maxComponents } };
    let componentFailed = false;
    if (options.includeComponents) {
      progress({ phase: "components", message: "Reading file inventory…" });
      const result = await optional("Component inventory", () => collectPaged(API_PATHS.components, {
        component: component.key,
        qualifiers: "FIL",
        strategy: "leaves",
        metricKeys: COMPONENT_METRICS,
        s: "path",
        asc: true,
        ...common
      }, "components", options.maxComponents, () => {}, signal), {
        items: [], expected: 0, paging: { expected: 0, exported: 0, limit: options.maxComponents }
      }, warnings, (error) => {
        componentFailed = true;
        datasetStates.components = failedDatasetState(error);
      });
      componentResult = result;
      components = result.items;
      componentExpected = result.expected;
      if (!componentFailed) datasetStates.components = pagedDatasetState(true, result, options.maxComponents);
      if (componentExpected > components.length) warnings.push(`Component inventory is incomplete: ${components.length} of ${componentExpected} files were exported.`);
      if (!componentFailed && result.paging.reconciled === false) warnings.push("Component paging could not be reconciled to the server-reported total; duplicate or changing results were removed.");
    }

    let analyses = [];
    let analysisExpected = 0;
    let analysisPaging = {
      expected: 0, exported: 0, limit: 100, rawFetched: 0, uniqueFetched: 0,
      duplicates: 0, duplicatesRemoved: 0, pagesFetched: 0, pageSize: 100, reconciled: true,
      truncated: false, reconciliation: "stable-key-first-seen"
    };
    let analysesFailed = false;
    if (options.includeAnalyses) {
      progress({ phase: "analyses", message: "Reading analysis history…" });
      let response = { analyses: [] };
      if (branchScoped) {
        analysesFailed = true;
        datasetStates.analyses = { requested: true, state: "not_available", reason: "branch_history_not_supported" };
        warnings.push("Analysis history was excluded because the public project analyses API does not support branch or pull-request scope.");
      } else {
        response = await optional("Analysis history", () => apiGet(API_PATHS.analyses, {
          project: component.key, p: 1, ps: 100
        }, signal), { analyses: [] }, warnings, (error) => {
          analysesFailed = true;
          datasetStates.analyses = failedDatasetState(error);
        });
      }
      const analysisIdentities = new Set();
      let analysisDuplicates = 0;
      analyses = (response.analyses || []).filter((item) => {
        const identity = itemIdentity(item);
        if (identity && analysisIdentities.has(identity)) {
          analysisDuplicates += 1;
          return false;
        }
        if (identity) analysisIdentities.add(identity);
        return true;
      });
      const analysisServerTotal = pagingTotal(response) || analyses.length;
      analysisExpected = Math.min(analysisServerTotal, 100);
      analysisPaging = {
        expected: analysisExpected,
        serverTotal: analysisServerTotal,
        exported: analyses.length,
        limit: 100,
        rawFetched: (response.analyses || []).length,
        uniqueFetched: analyses.length,
        duplicates: analysisDuplicates,
        duplicatesRemoved: analysisDuplicates,
        pagesFetched: analysesFailed ? 0 : 1,
        pageSize: 100,
        reconciled: analysisExpected === 0 || analyses.length >= analysisExpected,
        truncated: false,
        olderAvailable: analysisServerTotal > analyses.length,
        reconciliation: "latest-100-stable-key-first-seen",
        terminationReason: analysisServerTotal > analyses.length ? "selected_scope_reached" : "target_reached"
      };
      if (!analysesFailed) datasetStates.analyses = pagedDatasetState(true, {
        items: analyses, expected: analysisExpected, paging: analysisPaging
      }, 100);
      if (!analysesFailed && analysisPaging.reconciled === false) warnings.push("Analysis history could not be reconciled to the server-reported total; duplicate results were removed.");
    }

    let trends = [];
    let trendPaging = { expected: 0, exported: 0, limit: 100, pagesFetched: 0, truncated: false, reconciled: true, terminationReason: "not_requested" };
    if (options.includeTrends) {
      progress({ phase: "trends", message: "Reading historical metrics…" });
      let trendsFailed = false;
      const result = await optional("Historical metrics", () => collectTrendHistory(component.key, common, signal), { series: [], paging: trendPaging }, warnings, (error) => {
        trendsFailed = true;
        datasetStates.trends = failedDatasetState(error);
      });
      trends = result.series || [];
      trendPaging = result.paging || trendPaging;
      if (!trendsFailed) {
        datasetStates.trends = trendPaging.reconciled === false
          ? { requested: true, state: "partial_error", reason: "unreconciled_history_scope", ...trendPaging }
          : { requested: true, state: "complete", ...trendPaging };
      }
      if (trendPaging.olderAvailable) warnings.push(`Historical metric scope is the latest ${trendPaging.expected} of ${trendPaging.serverTotal} server observations per metric; older observations are outside the declared report scope.`);
    }

    let analysisDateAfterCollection = "";
    let analysisSnapshotConsistent = null;
    let analysisSnapshotMethod = branchScoped ? "branch_measure_fingerprint" : "analysis_date";
    let snapshotCheckFailed = false;
    const finalAnalysisResponse = await optional("Analysis consistency check", () => branchScoped
      ? apiGet(API_PATHS.measures, { component: component.key, metricKeys: METRICS, ...common }, signal)
      : apiGet(API_PATHS.analyses, { project: component.key, p: 1, ps: 1 }, signal), null, warnings, (error) => {
      snapshotCheckFailed = true;
      datasetStates.analysisSnapshot = failedDatasetState(error);
    });
    if (!snapshotCheckFailed) {
      if (branchScoped) {
        analysisDateAfterCollection = app.text(finalAnalysisResponse && finalAnalysisResponse.component && finalAnalysisResponse.component.analysisDate);
        analysisSnapshotConsistent = initialMeasureSnapshot === measureSnapshotFingerprint(finalAnalysisResponse);
      } else {
        analysisDateAfterCollection = app.text(finalAnalysisResponse && finalAnalysisResponse.analyses && finalAnalysisResponse.analyses[0] && finalAnalysisResponse.analyses[0].date);
        analysisSnapshotConsistent = analysisDateBeforeCollection && analysisDateAfterCollection
          ? analysisDateBeforeCollection === analysisDateAfterCollection
          : null;
      }
      if (analysisSnapshotConsistent === null) {
        datasetStates.analysisSnapshot = { requested: true, state: "not_available", reason: "analysis_identity_missing", method: analysisSnapshotMethod };
        warnings.push("Analysis snapshot identity was unavailable; report consistency could not be verified.");
      } else if (!analysisSnapshotConsistent) {
        datasetStates.analysisSnapshot = { requested: true, state: "partial_error", reason: "analysis_changed_during_collection", method: analysisSnapshotMethod };
        warnings.push("The project analysis changed while data was being collected; datasets may describe different snapshots.");
      } else {
        datasetStates.analysisSnapshot = { requested: true, state: "complete", method: analysisSnapshotMethod };
      }
    }

    abortIfNeeded(signal);
    const issues = issueResult.items.map((issue) => normalizeIssue(issue, options.includePeople));
    const projectStatus = gateResponse.projectStatus || { status: "UNKNOWN", conditions: [] };
    const complete = Object.values(datasetStates).every((dataset) => !dataset.requested || dataset.state === "complete");
    const completedAt = new Date().toISOString();
    abortIfNeeded(signal);
    progress({ phase: "complete", message: `Collected ${issues.length} issues.`, current: issues.length, total: issueResult.expected });
    abortIfNeeded(signal);
    const baseReport = {
      schemaVersion: app.REPORT_SCHEMA_VERSION,
      modelVersion: app.MODEL_VERSION || app.REPORT_SCHEMA_VERSION,
      rendererVersion: app.RENDERER_VERSION,
      pluginVersion: app.PLUGIN_VERSION,
      reportId: app.randomReportId(),
      generatedAt: completedAt,
      collectedAt: completedAt,
      collectionStartedAt: startedAt,
      collectionCompletedAt: completedAt,
      reportMode: "single",
      complete,
      collectionComplete: complete,
      artifactComplete: null,
      artifact: null,
      ...buildProvenance(),
      datasetStates,
      serverVersion: app.text(status.version),
      branchLabel: branchLabel(branchLike),
      collectionScope: {
        issues: !!options.includeIssues,
        components: !!options.includeComponents,
        analyses: !!options.includeAnalyses,
        trends: !!options.includeTrends,
        people: !!options.includePeople
      },
      project: {
        key: app.text(measuredComponent.key || component.key),
        name: app.text(measuredComponent.name || component.name || component.key),
        qualifier: app.text(measuredComponent.qualifier || component.qualifier),
        version: app.text(measuredComponent.version || component.version),
        analysisDate: analysisDateBeforeCollection
      },
      analysisDateBeforeCollection,
      analysisDateAfterCollection,
      analysisSnapshotConsistent,
      analysisSnapshotMethod,
      qualityGate: {
        status: app.text(projectStatus.status || "UNKNOWN"),
        conditions: projectStatus.conditions || [],
        ignoredConditions: !!projectStatus.ignoredConditions
      },
      measures: measuredComponent.measures || [],
      issues,
      rules: issueResult.auxiliary.rules || [],
      components: components.map((item) => ({
        key: app.text(item.key), name: app.text(item.name), path: app.text(item.path),
        qualifier: app.text(item.qualifier), language: app.text(item.language),
        measures: Array.isArray(item.measures) ? item.measures : []
      })),
      analyses: analyses.map((item) => ({
        key: app.text(item.key), date: app.text(item.date), projectVersion: app.text(item.projectVersion),
        revision: app.text(item.revision), events: item.events || []
      })),
      trends,
      issuePaging: { ...issueResult.paging, expected: issueResult.expected, exported: issues.length, limit: options.maxIssues },
      componentPaging: { ...componentResult.paging, expected: componentExpected, exported: components.length, limit: options.maxComponents },
      analysisPaging,
      trendPaging,
      warnings
    };
    return app.deriveProjectAnalytics ? app.deriveProjectAnalytics(baseReport) : baseReport;
  }

  async function collectPortfolio(selectedProjects, options, onProgress, signal) {
    const requested = Array.isArray(selectedProjects) ? selectedProjects : [];
    const unique = [];
    const keys = new Set();
    requested.forEach((project) => {
      const key = app.text(project && project.key);
      if (!key || keys.has(key)) return;
      keys.add(key);
      unique.push({ ...project, key, name: app.text(project.name || key), qualifier: app.text(project.qualifier || "TRK") });
    });
    if (!unique.length) throw new Error("Select at least one project for the portfolio report.");
    if (unique.length > MAX_PORTFOLIO_PROJECTS) throw new Error(`Portfolio reports support at most ${MAX_PORTFOLIO_PROJECTS} selected projects.`);
    const startedAt = new Date().toISOString();
    const concurrency = Math.max(1, Math.min(4, Number(options && options.concurrency) || DEFAULT_PORTFOLIO_CONCURRENCY, unique.length));
    const attempts = new Array(unique.length);
    let nextIndex = 0;
    let completedCount = 0;
    const emit = (state) => {
      if (typeof onProgress !== "function") return;
      const outcomes = attempts.filter(Boolean).reduce((counts, attempt) => {
        counts[attempt.state] = (counts[attempt.state] || 0) + 1;
        return counts;
      }, {});
      onProgress({ total: unique.length, completed: completedCount, outcomes, ...state });
    };
    async function worker() {
      while (true) {
        abortIfNeeded(signal);
        const index = nextIndex;
        nextIndex += 1;
        if (index >= unique.length) return;
        const project = unique[index];
        emit({ project, projectIndex: index, phase: "project", message: `Analysing ${index + 1} of ${unique.length}: ${project.name}` });
        try {
          const report = await collectReport(project, null, options, (projectProgress) => emit({ project, projectIndex: index, phase: projectProgress.phase, message: projectProgress.message }), signal);
          attempts[index] = { project, state: report.complete ? "complete" : "partial", report };
        } catch (error) {
          if (error && error.name === "AbortError") throw error;
          const status = Number(errorStatus(error));
          attempts[index] = { project, state: status === 401 || status === 403 ? "permission_denied" : "failed", error };
        }
        completedCount += 1;
        emit({ project, projectIndex: index, phase: "project-complete", message: `Analysed ${completedCount} of ${unique.length} projects.` });
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    abortIfNeeded(signal);
    const completedAt = new Date().toISOString();
    const report = app.buildPortfolioReport(attempts, unique, { ...options, concurrency }, startedAt, completedAt);
    return {
      ...report,
      collectedAt: completedAt,
      collectionComplete: !!report.complete,
      artifactComplete: null,
      artifact: null,
      ...buildProvenance()
    };
  }

  Object.assign(app, {
    API_PATHS,
    METRICS,
    COMPONENT_METRICS,
    TREND_METRICS,
    REQUEST_TIMEOUT_MS,
    MAX_RETRY_DELAY_MS,
    ISSUE_SEARCH_WINDOW,
    MAX_PORTFOLIO_PROJECTS,
    DEFAULT_PORTFOLIO_CONCURRENCY,
    assertAllowedPath,
    contextPathFromLocation,
    serverLocationProvenance,
    apiRequestUrl,
    fetchJson,
    branchParameters,
    apiGet,
    retryAfterMilliseconds,
    retryDelayMilliseconds,
    requestWithControl,
    requiredDatasetKeys,
    missingRequiredDatasets,
    createArtifactReport,
    normalizeIssue,
    collectPaged,
    listVisibleProjects,
    collectTrendHistory,
    collectReport,
    collectPortfolio
  });
})(window);
