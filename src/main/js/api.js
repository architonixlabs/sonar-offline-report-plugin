(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const API_PATHS = Object.freeze({
    systemStatus: "/api/system/status",
    measures: "/api/measures/component",
    qualityGate: "/api/qualitygates/project_status",
    issues: "/api/issues/search",
    components: "/api/components/tree",
    analyses: "/api/project_analyses/search"
  });
  const METRICS = [
    "alert_status", "ncloc", "coverage", "duplicated_lines_density", "complexity",
    "cognitive_complexity", "bugs", "vulnerabilities", "code_smells",
    "reliability_rating", "security_rating", "sqale_rating", "sqale_index",
    "security_hotspots", "security_hotspots_reviewed", "security_review_rating",
    "new_security_hotspots", "new_coverage", "new_duplicated_lines_density",
    "new_bugs", "new_vulnerabilities", "new_code_smells", "new_violations",
    "new_security_hotspots_reviewed"
  ].join(",");

  function assertAllowedPath(path) {
    if (!Object.values(API_PATHS).includes(path)) throw new Error(`Blocked unexpected API path: ${path}`);
  }

  function abortIfNeeded(signal) {
    if (signal && signal.aborted) throw new DOMException("Export cancelled", "AbortError");
  }

  function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function errorStatus(error) {
    return error && (error.status || (error.response && error.response.status));
  }

  async function apiGet(path, params, signal, retries) {
    assertAllowedPath(path);
    abortIfNeeded(signal);
    const request = global.SonarRequest && global.SonarRequest.getJSON;
    if (typeof request !== "function") throw new Error("SonarQube's authenticated request helper is unavailable.");
    const maxRetries = retries === undefined ? 2 : retries;
    let attempt = 0;
    while (true) {
      try {
        const result = await request(path, params || {});
        abortIfNeeded(signal);
        return result;
      } catch (error) {
        const status = errorStatus(error);
        if (attempt >= maxRetries || ![429, 503].includes(status)) throw error;
        await sleep(300 * (2 ** attempt) + Math.floor(Math.random() * 100));
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
      const status = errorStatus(error);
      warnings.push(`${label} could not be exported${status ? ` (HTTP ${status})` : ""}.`);
      if (typeof onFailure === "function") onFailure(error);
      return fallback;
    }
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
      analysisSnapshot: { requested: true, state: "complete" }
    };
    const common = branchParameters(branchLike);
    const startedAt = new Date().toISOString();
    progress({ phase: "metadata", message: "Reading project metadata…" });

    const status = await optional("Server version", () => apiGet(API_PATHS.systemStatus, {}, signal), {}, warnings,
      (error) => { datasetStates.serverMetadata = failedDatasetState(error); });
    const measuresResponse = await apiGet(API_PATHS.measures, {
      component: component.key,
      metricKeys: METRICS,
      ...common
    }, signal);
    const measuredComponent = measuresResponse.component || component;
    let analysisDateBeforeCollection = app.text(measuredComponent.analysisDate || component.analysisDate);
    if (!analysisDateBeforeCollection) {
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
      const response = await optional("Analysis history", () => apiGet(API_PATHS.analyses, {
        project: component.key, p: 1, ps: 100
      }, signal), { analyses: [] }, warnings, (error) => {
        analysesFailed = true;
        datasetStates.analyses = failedDatasetState(error);
      });
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
      analysisExpected = pagingTotal(response) || analyses.length;
      analysisPaging = {
        expected: analysisExpected,
        exported: analyses.length,
        limit: 100,
        rawFetched: (response.analyses || []).length,
        uniqueFetched: analyses.length,
        duplicates: analysisDuplicates,
        duplicatesRemoved: analysisDuplicates,
        pagesFetched: analysesFailed ? 0 : 1,
        pageSize: 100,
        reconciled: analysisExpected === 0 || analyses.length >= Math.min(analysisExpected, 100),
        truncated: analysisExpected > analyses.length,
        reconciliation: "stable-key-first-seen"
      };
      if (!analysesFailed) datasetStates.analyses = pagedDatasetState(true, {
        items: analyses, expected: analysisExpected, paging: analysisPaging
      }, 100);
      if (analysisExpected > analyses.length) warnings.push(`Analysis history is incomplete: ${analyses.length} of ${analysisExpected} analyses were exported.`);
      if (!analysesFailed && analysisPaging.reconciled === false) warnings.push("Analysis history could not be reconciled to the server-reported total; duplicate results were removed.");
    }

    let analysisDateAfterCollection = "";
    let snapshotCheckFailed = false;
    const finalAnalysisResponse = await optional("Analysis consistency check", () => apiGet(API_PATHS.analyses, {
      project: component.key, p: 1, ps: 1
    }, signal), null, warnings, (error) => {
      snapshotCheckFailed = true;
      datasetStates.analysisSnapshot = failedDatasetState(error);
    });
    if (!snapshotCheckFailed) {
      analysisDateAfterCollection = app.text(finalAnalysisResponse && finalAnalysisResponse.analyses && finalAnalysisResponse.analyses[0] && finalAnalysisResponse.analyses[0].date);
      if (!analysisDateBeforeCollection || !analysisDateAfterCollection) {
        datasetStates.analysisSnapshot = { requested: true, state: "not_available", reason: "analysis_identity_missing" };
        warnings.push("Analysis snapshot identity was unavailable; report consistency could not be verified.");
      } else if (analysisDateBeforeCollection !== analysisDateAfterCollection) {
        datasetStates.analysisSnapshot = { requested: true, state: "partial_error", reason: "analysis_changed_during_collection" };
        warnings.push("The project analysis changed while data was being collected; datasets may describe different snapshots.");
      }
    }

    const issues = issueResult.items.map((issue) => normalizeIssue(issue, options.includePeople));
    const projectStatus = gateResponse.projectStatus || { status: "UNKNOWN", conditions: [] };
    const complete = Object.values(datasetStates).every((dataset) => !dataset.requested || dataset.state === "complete");
    const completedAt = new Date().toISOString();
    progress({ phase: "complete", message: `Collected ${issues.length} issues.`, current: issues.length, total: issueResult.expected });
    return {
      schemaVersion: app.REPORT_SCHEMA_VERSION,
      modelVersion: app.MODEL_VERSION || app.REPORT_SCHEMA_VERSION,
      rendererVersion: app.RENDERER_VERSION,
      pluginVersion: app.PLUGIN_VERSION,
      reportId: app.randomReportId(),
      generatedAt: completedAt,
      collectionStartedAt: startedAt,
      collectionCompletedAt: completedAt,
      complete,
      datasetStates,
      serverVersion: app.text(status.version),
      branchLabel: branchLabel(branchLike),
      collectionScope: {
        issues: !!options.includeIssues,
        components: !!options.includeComponents,
        analyses: !!options.includeAnalyses,
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
      analysisSnapshotConsistent: analysisDateBeforeCollection && analysisDateAfterCollection
        ? analysisDateBeforeCollection === analysisDateAfterCollection
        : null,
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
        qualifier: app.text(item.qualifier), language: app.text(item.language)
      })),
      analyses: analyses.map((item) => ({
        key: app.text(item.key), date: app.text(item.date), projectVersion: app.text(item.projectVersion),
        revision: app.text(item.revision), events: item.events || []
      })),
      issuePaging: { ...issueResult.paging, expected: issueResult.expected, exported: issues.length, limit: options.maxIssues },
      componentPaging: { ...componentResult.paging, expected: componentExpected, exported: components.length, limit: options.maxComponents },
      analysisPaging,
      warnings
    };
  }

  Object.assign(app, {
    API_PATHS,
    METRICS,
    assertAllowedPath,
    branchParameters,
    normalizeIssue,
    collectPaged,
    collectReport
  });
})(window);
