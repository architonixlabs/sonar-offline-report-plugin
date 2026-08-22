(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const DAY_MS = 86400000;
  const FORMULA_VERSION = 1;
  const AGE_BUCKETS = Object.freeze([
    Object.freeze({ id: "0_7", label: "0–7 days", minimum: 0, maximum: 7 }),
    Object.freeze({ id: "8_30", label: "8–30 days", minimum: 8, maximum: 30 }),
    Object.freeze({ id: "31_90", label: "31–90 days", minimum: 31, maximum: 90 }),
    Object.freeze({ id: "91_180", label: "91–180 days", minimum: 91, maximum: 180 }),
    Object.freeze({ id: "181_365", label: "181–365 days", minimum: 181, maximum: 365 }),
    Object.freeze({ id: "over_365", label: ">365 days", minimum: 366, maximum: Infinity }),
    Object.freeze({ id: "unknown", label: "Unknown age", minimum: null, maximum: null })
  ]);
  const RATING_ORDER = Object.freeze({ A: 1, B: 2, C: 3, D: 4, E: 5 });
  const QUALITY_ORDER = Object.freeze(["Security", "Reliability", "Maintainability", "Unknown"]);
  const IMPACT_ORDER = Object.freeze(["Blocker", "Critical", "High", "Major", "Medium", "Minor", "Low", "Info", "Unknown"]);

  function finiteNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function measureObject(report, metric) {
    return (report && report.measures || []).find((item) => item && item.metric === metric) || null;
  }

  function measureValue(report, metric, period) {
    const measure = measureObject(report, metric);
    if (!measure) return null;
    const raw = period
      ? measure.period && measure.period.value
      : measure.value !== undefined ? measure.value : measure.period && measure.period.value;
    return raw === undefined || raw === null || raw === "" ? null : raw;
  }

  function rating(value) {
    const numeric = finiteNumber(value);
    if (numeric !== null && numeric >= 1 && numeric <= 5) return String.fromCharCode(64 + Math.round(numeric));
    const label = app.text(value).trim().toUpperCase();
    return RATING_ORDER[label] ? label : null;
  }

  function effortMinutes(value) {
    const match = app.text(value).trim().match(/^([0-9]+(?:\.[0-9]+)?)(min|h|d)$/i);
    if (!match) return null;
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    return amount * (unit === "d" ? 480 : unit === "h" ? 60 : 1);
  }

  function ageDays(createdAt, generatedAt) {
    const created = new Date(createdAt).getTime();
    const generated = new Date(generatedAt).getTime();
    if (!Number.isFinite(created) || !Number.isFinite(generated)) return null;
    return Math.floor(Math.max(0, generated - created) / DAY_MS);
  }

  function ageBucket(days) {
    if (days === null || days === undefined || !Number.isFinite(Number(days))) return "Unknown age";
    const numeric = Number(days);
    return AGE_BUCKETS.find((bucket) => bucket.minimum !== null && numeric >= bucket.minimum && numeric <= bucket.maximum).label;
  }

  function normalizeQuality(value) {
    const key = app.text(value).trim().toUpperCase().replace(/[ -]+/g, "_");
    if (key === "SECURITY") return "Security";
    if (key === "RELIABILITY") return "Reliability";
    if (key === "MAINTAINABILITY") return "Maintainability";
    return "Unknown";
  }

  function normalizeImpact(value) {
    const label = app.humanize(value);
    return IMPACT_ORDER.includes(label) ? label : "Unknown";
  }

  function issueQualities(issue) {
    const values = (issue && issue.impacts || []).map((impact) => app.text(impact).split(":")[0]).filter(Boolean);
    if (!values.length) {
      const type = app.text(issue && issue.type).toUpperCase().replace(/ /g, "_");
      if (type === "VULNERABILITY") values.push("SECURITY");
      else if (type === "BUG") values.push("RELIABILITY");
      else if (type === "CODE_SMELL") values.push("MAINTAINABILITY");
    }
    return [...new Set((values.length ? values : ["UNKNOWN"]).map(normalizeQuality))];
  }

  function issueImpactSeverities(issue) {
    const values = (issue && issue.impacts || []).map((impact) => app.text(impact).split(":")[1]).filter(Boolean);
    if (!values.length && issue && issue.severity) values.push(issue.severity);
    return [...new Set((values.length ? values : ["UNKNOWN"]).map(normalizeImpact))];
  }

  function countBy(items, selector, preferredOrder) {
    const counts = new Map();
    (items || []).forEach((item) => {
      const selected = selector(item);
      const values = Array.isArray(selected) ? selected : [selected];
      [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ""))]
        .forEach((value) => counts.set(String(value), (counts.get(String(value)) || 0) + 1));
    });
    const order = preferredOrder || [];
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((left, right) => {
      const leftIndex = order.indexOf(left.label);
      const rightIndex = order.indexOf(right.label);
      if (leftIndex >= 0 || rightIndex >= 0) return (leftIndex < 0 ? order.length : leftIndex) - (rightIndex < 0 ? order.length : rightIndex);
      return right.count - left.count || left.label.localeCompare(right.label);
    });
  }

  function topBy(items, keySelector, limit, labelSelector) {
    const records = new Map();
    (items || []).forEach((item) => {
      const key = app.text(keySelector(item)) || "Unknown";
      const record = records.get(key) || { key, label: labelSelector ? app.text(labelSelector(item)) || key : key, count: 0, effortMinutes: 0 };
      record.count += 1;
      record.effortMinutes += finiteNumber(item.effortMinutes) || 0;
      records.set(key, record);
    });
    return [...records.values()].sort((left, right) => right.count - left.count || right.effortMinutes - left.effortMinutes || left.key.localeCompare(right.key)).slice(0, limit || 10);
  }

  function datasetEvidence(name, state, paging) {
    const source = paging || {};
    return {
      dataset: name,
      requested: !!(state && state.requested),
      state: state && state.state || "not_requested",
      reason: state && state.reason || source.terminationReason || "",
      expected: source.expected === undefined ? null : source.expected,
      retrieved: source.rawFetched === undefined ? null : source.rawFetched,
      unique: source.uniqueFetched === undefined ? source.exported === undefined ? null : source.exported : source.uniqueFetched,
      exported: source.exported === undefined ? null : source.exported,
      duplicates: source.duplicatesRemoved === undefined ? source.duplicates === undefined ? null : source.duplicates : source.duplicatesRemoved,
      pages: source.pagesFetched === undefined ? null : source.pagesFetched,
      limit: source.limit === undefined ? null : source.limit,
      terminationReason: source.terminationReason || "",
      reconciled: source.reconciled === undefined ? null : !!source.reconciled
    };
  }

  function enrichIssue(issue, report, componentLanguages) {
    const days = ageDays(issue.creationDate, report.generatedAt);
    return {
      ...issue,
      normalizedLifecycle: app.issueLifecycle(issue),
      softwareQualities: issueQualities(issue),
      impactSeverities: issueImpactSeverities(issue),
      ageDays: days,
      ageBucket: ageBucket(days),
      effortMinutes: effortMinutes(issue.effort),
      language: componentLanguages.get(issue.component) || ""
    };
  }

  function normalizeTrendResponse(response, requestedMetrics, limit) {
    const paging = response && response.paging || {};
    const series = (response && response.measures || []).map((measure) => {
      const observations = (measure.history || []).map((point) => ({ date: app.text(point.date), value: finiteNumber(point.value) })).filter((point) => point.date);
      const usable = observations.filter((point) => point.value !== null);
      const current = usable.length ? usable[usable.length - 1] : null;
      const previous = usable.length > 1 ? usable[usable.length - 2] : null;
      const absoluteChange = current && previous ? current.value - previous.value : null;
      const percentageChange = absoluteChange !== null && previous.value !== 0 ? (absoluteChange / Math.abs(previous.value)) * 100 : null;
      return {
        metric: app.text(measure.metric),
        observations,
        current,
        previous,
        absoluteChange,
        percentageChange,
        period: current && previous ? { from: previous.date, to: current.date } : null,
        source: "/api/measures/search_history"
      };
    });
    const expected = finiteNumber(paging.total);
    const exported = series.reduce((maximum, item) => Math.max(maximum, item.observations.length), 0);
    return {
      requestedMetrics: requestedMetrics || [],
      series,
      paging: {
        expected,
        exported,
        uniqueFetched: exported,
        rawFetched: exported,
        duplicatesRemoved: 0,
        pagesFetched: series.length ? 1 : 0,
        pageSize: limit,
        limit,
        truncated: expected !== null ? expected > exported : false,
        reconciled: expected === null ? null : exported >= Math.min(expected, limit),
        terminationReason: expected !== null && expected > exported ? "configured_limit" : "target_reached"
      }
    };
  }

  function projectStatusModel(report, issueSummary) {
    const hotspots = finiteNumber(measureValue(report, "security_hotspots"));
    const reviewed = finiteNumber(measureValue(report, "security_hotspots_reviewed"));
    return {
      qualityGate: app.text(report.qualityGate && report.qualityGate.status || "UNKNOWN"),
      security: rating(measureValue(report, "security_rating")),
      reliability: rating(measureValue(report, "reliability_rating")),
      maintainability: rating(measureValue(report, "sqale_rating")),
      coverage: finiteNumber(measureValue(report, "coverage")),
      duplication: finiteNumber(measureValue(report, "duplicated_lines_density")),
      technicalDebtMinutes: finiteNumber(measureValue(report, "sqale_index")),
      securityHotspots: hotspots,
      reviewedSecurityHotspotsPercent: reviewed,
      unreviewedSecurityHotspots: hotspots !== null && reviewed !== null ? Math.max(0, Math.round(hotspots * (100 - reviewed) / 100)) : null,
      actionableIssues: issueSummary.actionable,
      newCodeCondition: (report.qualityGate && report.qualityGate.conditions || []).some((condition) => app.text(condition.metricKey).startsWith("new_")) ? "available" : "not_available",
      analysisAgeDays: ageDays(report.project && report.project.analysisDate, report.generatedAt),
      reportCompleteness: report.complete ? "complete" : "partial"
    };
  }

  function deriveProjectAnalytics(inputReport) {
    const report = inputReport || {};
    const componentLanguages = new Map((report.components || []).map((component) => [component.key, component.language]));
    const issues = (report.issues || []).map((issue) => enrichIssue(issue, report, componentLanguages));
    const lifecycle = countBy(issues, (issue) => issue.normalizedLifecycle, ["actionable", "accepted", "closed", "unknown"]);
    const lifecycleMap = Object.fromEntries(lifecycle.map((item) => [item.label, item.count]));
    const issueSummary = {
      totalCollected: issues.length,
      expected: report.issuePaging && report.issuePaging.expected !== undefined ? report.issuePaging.expected : null,
      unique: report.issuePaging && report.issuePaging.uniqueFetched !== undefined ? report.issuePaging.uniqueFetched : issues.length,
      duplicates: report.issuePaging && (report.issuePaging.duplicatesRemoved !== undefined ? report.issuePaging.duplicatesRemoved : report.issuePaging.duplicates) || 0,
      actionable: lifecycleMap.actionable || 0,
      accepted: lifecycleMap.accepted || 0,
      closed: lifecycleMap.closed || 0,
      unknown: lifecycleMap.unknown || 0
    };
    const lifecycleReconciles = issueSummary.actionable + issueSummary.accepted + issueSummary.closed + issueSummary.unknown === issueSummary.totalCollected;
    const rules = new Map((report.rules || []).filter((rule) => rule && rule.key).map((rule) => [rule.key, rule.name || rule.key]));
    const actionable = issues.filter((issue) => issue.normalizedLifecycle === "actionable");
    const conditions = report.qualityGate && report.qualityGate.conditions || [];
    const started = new Date(report.collectionStartedAt).getTime();
    const completed = new Date(report.collectionCompletedAt).getTime();
    const evidence = [
      datasetEvidence("Issues", report.datasetStates && report.datasetStates.issues, report.issuePaging),
      datasetEvidence("Components", report.datasetStates && report.datasetStates.components, report.componentPaging),
      datasetEvidence("Analyses", report.datasetStates && report.datasetStates.analyses, report.analysisPaging),
      datasetEvidence("Historical metrics", report.datasetStates && report.datasetStates.trends, report.trendPaging)
    ];
    const derived = {
      formulaVersion: FORMULA_VERSION,
      collectionDurationMs: Number.isFinite(started) && Number.isFinite(completed) ? Math.max(0, completed - started) : null,
      analysisAgeDays: ageDays(report.project && report.project.analysisDate, report.generatedAt),
      issueSummary,
      issueBreakdowns: {
        lifecycle,
        softwareQuality: countBy(issues, (issue) => issue.softwareQualities, QUALITY_ORDER),
        impactSeverity: countBy(issues, (issue) => issue.impactSeverities, IMPACT_ORDER),
        legacyType: countBy(issues, (issue) => app.humanize(issue.type) || "Unknown"),
        rawStatus: countBy(issues, (issue) => app.humanize(issue.status) || "Unknown"),
        age: countBy(issues, (issue) => issue.ageBucket, AGE_BUCKETS.map((bucket) => bucket.label)),
        language: countBy(issues, (issue) => issue.language ? app.languageLabel(issue.language) : "Unknown"),
        tags: countBy(issues, (issue) => issue.tags && issue.tags.length ? issue.tags.map(app.humanize) : ["Untagged"])
      },
      effort: {
        knownMinutes: issues.reduce((sum, issue) => sum + (finiteNumber(issue.effortMinutes) || 0), 0),
        issuesWithKnownEffort: issues.filter((issue) => finiteNumber(issue.effortMinutes) !== null).length,
        issuesWithUnknownEffort: issues.filter((issue) => finiteNumber(issue.effortMinutes) === null).length
      },
      riskConcentrations: {
        topRules: topBy(actionable, (issue) => issue.rule, 10, (issue) => rules.get(issue.rule) || issue.rule),
        topComponents: topBy(actionable, (issue) => issue.component, 10),
        oldestActionable: actionable.slice().sort((left, right) => (right.ageDays || -1) - (left.ageDays || -1)).slice(0, 10).map((issue) => ({ key: issue.key, message: issue.message, ageDays: issue.ageDays, component: issue.component })),
        highestEffort: actionable.filter((issue) => issue.effortMinutes !== null).sort((left, right) => right.effortMinutes - left.effortMinutes).slice(0, 10).map((issue) => ({ key: issue.key, message: issue.message, effortMinutes: issue.effortMinutes, component: issue.component }))
      },
      qualityGateFailureReasons: conditions.filter((condition) => ["ERROR", "WARN"].includes(app.text(condition.status).toUpperCase())).map((condition) => ({
        metric: app.text(condition.metricKey),
        status: app.text(condition.status),
        comparator: app.text(condition.comparator),
        threshold: condition.errorThreshold !== undefined ? condition.errorThreshold : condition.warningThreshold,
        actual: condition.actualValue,
        context: app.text(condition.metricKey).startsWith("new_") ? "new_code" : "overall_or_server_defined"
      })),
      reconciliation: {
        lifecycleReconciles,
        exportedNotAboveCollected: !report.issuePaging || report.issuePaging.exported <= issues.length,
        collectedNotAboveExpected: !report.issuePaging || report.issuePaging.expectedChangedDuringPaging || issues.length <= report.issuePaging.expected,
        valid: lifecycleReconciles && (!report.issuePaging || report.issuePaging.exported <= issues.length) && (!report.issuePaging || report.issuePaging.expectedChangedDuringPaging || issues.length <= report.issuePaging.expected)
      }
    };
    derived.statusModel = projectStatusModel(report, issueSummary);
    return {
      ...report,
      schemaVersion: app.REPORT_SCHEMA_VERSION,
      modelVersion: app.MODEL_VERSION,
      rendererVersion: app.RENDERER_VERSION,
      reportMode: report.reportMode || "single",
      issues,
      derived,
      collectionEvidence: {
        reportId: report.reportId,
        pluginVersion: report.pluginVersion,
        modelVersion: app.MODEL_VERSION,
        rendererVersion: app.RENDERER_VERSION,
        serverVersion: report.serverVersion,
        projectKey: report.project && report.project.key,
        branch: report.branchLabel,
        collectionStartedAt: report.collectionStartedAt,
        collectionCompletedAt: report.collectionCompletedAt,
        snapshotConsistent: report.analysisSnapshotConsistent,
        datasets: evidence,
        warnings: report.warnings || []
      }
    };
  }

  function projectEntry(attempt) {
    const report = attempt.report;
    if (!report) {
      return {
        projectIdentity: {
          key: app.text(attempt.project && attempt.project.key),
          name: app.text(attempt.project && (attempt.project.name || attempt.project.key)),
          qualifier: app.text(attempt.project && attempt.project.qualifier || "TRK"),
          branch: "Main branch"
        },
        collectionState: { outcome: attempt.state, complete: false, error: app.text(attempt.error && attempt.error.message) },
        collectionConfidence: attempt.state,
        qualityGate: null,
        measures: [], issues: [], rules: [], components: [], analyses: [], trends: [],
        derived: null, datasetStates: {}, collectionEvidence: null,
        paging: {}, warnings: attempt.warning ? [attempt.warning] : []
      };
    }
    return {
      projectIdentity: { ...report.project, branch: report.branchLabel },
      collectionState: { outcome: report.complete ? "complete" : "partial", complete: !!report.complete },
      collectionConfidence: report.complete ? "complete" : "partial",
      qualityGate: report.qualityGate,
      measures: report.measures,
      issues: report.issues,
      rules: report.rules,
      components: report.components,
      analyses: report.analyses,
      trends: report.trends || [],
      derived: report.derived,
      datasetStates: report.datasetStates,
      collectionEvidence: report.collectionEvidence,
      paging: { issues: report.issuePaging, components: report.componentPaging, analyses: report.analysisPaging, trends: report.trendPaging },
      warnings: report.warnings || []
    };
  }

  function weightedCoverage(entries) {
    let covered = 0;
    let denominator = 0;
    let projectsIncluded = 0;
    entries.forEach((entry) => {
      if (!entry.derived) return;
      const report = { measures: entry.measures };
      const lines = finiteNumber(measureValue(report, "lines_to_cover"));
      const uncoveredLines = finiteNumber(measureValue(report, "uncovered_lines"));
      const conditions = finiteNumber(measureValue(report, "conditions_to_cover"));
      const uncoveredConditions = finiteNumber(measureValue(report, "uncovered_conditions"));
      const usableLines = lines !== null && uncoveredLines !== null;
      const usableConditions = conditions !== null && uncoveredConditions !== null;
      if (!usableLines && !usableConditions) return;
      const localDenominator = (usableLines ? lines : 0) + (usableConditions ? conditions : 0);
      if (localDenominator <= 0) return;
      denominator += localDenominator;
      covered += (usableLines ? Math.max(0, lines - uncoveredLines) : 0) + (usableConditions ? Math.max(0, conditions - uncoveredConditions) : 0);
      projectsIncluded += 1;
    });
    return { value: denominator ? covered / denominator * 100 : null, numerator: covered, denominator, projectsIncluded, formula: "sum(covered lines + covered conditions) / sum(lines to cover + conditions to cover) * 100" };
  }

  function weightedDuplication(entries) {
    let duplicated = 0;
    let ncloc = 0;
    let projectsIncluded = 0;
    entries.forEach((entry) => {
      if (!entry.derived) return;
      const report = { measures: entry.measures };
      const localDuplicated = finiteNumber(measureValue(report, "duplicated_lines"));
      const localNcloc = finiteNumber(measureValue(report, "ncloc"));
      if (localDuplicated === null || localNcloc === null || localNcloc <= 0) return;
      duplicated += localDuplicated;
      ncloc += localNcloc;
      projectsIncluded += 1;
    });
    return { value: ncloc ? duplicated / ncloc * 100 : null, numerator: duplicated, denominator: ncloc, projectsIncluded, formula: "sum(duplicated lines) / sum(non-comment lines of code) * 100" };
  }

  function attentionComparator(left, right) {
    const status = (entry) => entry.derived && entry.derived.statusModel || {};
    const failed = (entry) => app.text(status(entry).qualityGate).toUpperCase() === "ERROR" ? 1 : 0;
    const ratingRisk = (entry, key) => RATING_ORDER[status(entry)[key]] || 0;
    const highImpact = (entry) => (entry.derived && entry.derived.issueBreakdowns.impactSeverity || []).filter((item) => ["Blocker", "Critical", "High"].includes(item.label)).reduce((sum, item) => sum + item.count, 0);
    const comparisons = [
      failed(right) - failed(left),
      ratingRisk(right, "security") - ratingRisk(left, "security"),
      ratingRisk(right, "reliability") - ratingRisk(left, "reliability"),
      highImpact(right) - highImpact(left),
      (status(right).unreviewedSecurityHotspots || 0) - (status(left).unreviewedSecurityHotspots || 0),
      (status(right).technicalDebtMinutes || 0) - (status(left).technicalDebtMinutes || 0),
      (status(left).coverage === null || status(left).coverage === undefined ? Infinity : status(left).coverage) - (status(right).coverage === null || status(right).coverage === undefined ? Infinity : status(right).coverage),
      (status(right).duplication || 0) - (status(left).duplication || 0),
      (status(right).analysisAgeDays || 0) - (status(left).analysisAgeDays || 0),
      (left.collectionState.outcome === "partial" ? -1 : 0) - (right.collectionState.outcome === "partial" ? -1 : 0)
    ];
    return comparisons.find((value) => value !== 0) || left.projectIdentity.name.localeCompare(right.projectIdentity.name);
  }

  function attentionReasons(entry) {
    if (!entry.derived) return [app.humanize(entry.collectionState.outcome)];
    const status = entry.derived.statusModel;
    const reasons = [];
    if (app.text(status.qualityGate).toUpperCase() === "ERROR") reasons.push("Failed quality gate");
    if (status.security && RATING_ORDER[status.security] >= 3) reasons.push(`Security rating ${status.security}`);
    if (status.reliability && RATING_ORDER[status.reliability] >= 3) reasons.push(`Reliability rating ${status.reliability}`);
    const high = entry.derived.issueBreakdowns.impactSeverity.filter((item) => ["Blocker", "Critical", "High"].includes(item.label)).reduce((sum, item) => sum + item.count, 0);
    if (high) reasons.push(`${high} high-impact issue${high === 1 ? "" : "s"}`);
    if (status.unreviewedSecurityHotspots) reasons.push(`${status.unreviewedSecurityHotspots} estimated unreviewed hotspot${status.unreviewedSecurityHotspots === 1 ? "" : "s"}`);
    if (status.analysisAgeDays !== null && status.analysisAgeDays >= 30) reasons.push(`Analysis is ${status.analysisAgeDays} days old`);
    if (entry.collectionState.outcome !== "complete") reasons.push("Incomplete report data");
    return reasons.length ? reasons : ["No configured attention indicator triggered"];
  }

  function buildPortfolioReport(attempts, requestedProjects, options, startedAt, completedAt) {
    const entries = (attempts || []).map(projectEntry);
    const count = (state) => entries.filter((entry) => entry.collectionState.outcome === state).length;
    const analysed = entries.filter((entry) => entry.derived);
    const totalIssues = analysed.reduce((sum, entry) => sum + entry.derived.issueSummary.totalCollected, 0);
    const aggregateIssueSummary = ["actionable", "accepted", "closed", "unknown"].reduce((summary, key) => {
      summary[key] = analysed.reduce((sum, entry) => sum + entry.derived.issueSummary[key], 0);
      return summary;
    }, { totalCollected: totalIssues, expected: analysed.reduce((sum, entry) => sum + (finiteNumber(entry.derived.issueSummary.expected) || 0), 0) });
    aggregateIssueSummary.reconciles = aggregateIssueSummary.actionable + aggregateIssueSummary.accepted + aggregateIssueSummary.closed + aggregateIssueSummary.unknown === totalIssues;
    const qualityGateDistribution = countBy(analysed, (entry) => {
      const key = app.text(entry.qualityGate && entry.qualityGate.status).toUpperCase();
      return key === "OK" ? "Passed" : key === "ERROR" ? "Failed" : key === "WARN" ? "Warning" : "Unknown";
    }, ["Passed", "Failed", "Warning", "Unknown"]);
    const ranked = analysed.slice().sort(attentionComparator).map((entry, index) => ({ rank: index + 1, projectKey: entry.projectIdentity.key, projectName: entry.projectIdentity.name, reasons: attentionReasons(entry) }));
    const reportId = app.randomReportId();
    const summary = {
      projectsSelected: (requestedProjects || []).length,
      projectsAttempted: entries.filter((entry) => entry.collectionState.outcome !== "skipped").length,
      projectsAnalysed: analysed.length,
      projectsComplete: count("complete"),
      projectsPartial: count("partial"),
      projectsFailed: count("failed"),
      projectsPermissionDenied: count("permission_denied"),
      projectsSkipped: count("skipped"),
      qualityGateDistribution
    };
    const warnings = entries.flatMap((entry) => entry.warnings.map((warning) => `${entry.projectIdentity.name}: ${warning}`));
    if (summary.projectsAnalysed !== summary.projectsSelected) warnings.unshift(`${summary.projectsAnalysed} of ${summary.projectsSelected} selected projects produced report data.`);
    const complete = summary.projectsComplete === summary.projectsSelected && summary.projectsSelected > 0;
    const debtValues = analysed.map((entry) => finiteNumber(entry.derived.statusModel.technicalDebtMinutes)).filter((value) => value !== null);
    const topProjectsByQuality = (quality) => analysed.map((entry) => ({
      projectKey: entry.projectIdentity.key,
      projectName: entry.projectIdentity.name,
      count: entry.issues.filter((issue) => issue.normalizedLifecycle === "actionable" && (issue.softwareQualities || []).includes(quality)).length
    })).filter((entry) => entry.count > 0).sort((left, right) => right.count - left.count || left.projectName.localeCompare(right.projectName)).slice(0, 10);
    const flattenedActionable = analysed.flatMap((entry) => entry.issues.filter((issue) => issue.normalizedLifecycle === "actionable").map((issue) => ({
      ...issue, projectKey: entry.projectIdentity.key, projectName: entry.projectIdentity.name
    })));
    return {
      schemaVersion: app.REPORT_SCHEMA_VERSION,
      modelVersion: app.MODEL_VERSION,
      rendererVersion: app.RENDERER_VERSION,
      pluginVersion: app.PLUGIN_VERSION,
      reportId,
      generatedAt: completedAt,
      collectionStartedAt: startedAt,
      collectionCompletedAt: completedAt,
      reportMode: "portfolio",
      requestedScope: { projectKeys: (requestedProjects || []).map((project) => app.text(project.key)), ...(options || {}) },
      actualScope: { projectKeys: analysed.map((entry) => entry.projectIdentity.key), mainBranchOnly: true },
      portfolioSummary: summary,
      projects: entries,
      aggregateIssueSummary,
      aggregateRiskConcentrations: {
        topProjectsByActionableIssues: analysed.slice().sort((left, right) => right.derived.issueSummary.actionable - left.derived.issueSummary.actionable).slice(0, 10).map((entry) => ({ projectKey: entry.projectIdentity.key, projectName: entry.projectIdentity.name, count: entry.derived.issueSummary.actionable })),
        topProjectsBySecurityIssues: topProjectsByQuality("Security"),
        topProjectsByReliabilityIssues: topProjectsByQuality("Reliability"),
        topProjectsByMaintainabilityIssues: topProjectsByQuality("Maintainability"),
        topProjectsByTechnicalDebt: analysed.filter((entry) => finiteNumber(entry.derived.statusModel.technicalDebtMinutes) !== null).map((entry) => ({ projectKey: entry.projectIdentity.key, projectName: entry.projectIdentity.name, minutes: finiteNumber(entry.derived.statusModel.technicalDebtMinutes) })).sort((left, right) => right.minutes - left.minutes || left.projectName.localeCompare(right.projectName)).slice(0, 10),
        topProjectsWithFailedQualityGates: analysed.filter((entry) => app.text(entry.derived.statusModel.qualityGate).toUpperCase() === "ERROR").map((entry) => ({ projectKey: entry.projectIdentity.key, projectName: entry.projectIdentity.name, failedConditions: entry.derived.qualityGateFailureReasons.length })),
        topRules: topBy(analysed.flatMap((entry) => entry.issues.filter((issue) => issue.normalizedLifecycle === "actionable").map((issue) => ({ ...issue, rule: `${entry.projectIdentity.key}:${issue.rule}` }))), (issue) => issue.rule, 10),
        topComponents: topBy(analysed.flatMap((entry) => entry.issues.filter((issue) => issue.normalizedLifecycle === "actionable").map((issue) => ({ ...issue, component: `${entry.projectIdentity.key}:${issue.component}` }))), (issue) => issue.component, 10),
        oldestActionableIssues: flattenedActionable.filter((issue) => issue.ageDays !== null).sort((left, right) => right.ageDays - left.ageDays || left.key.localeCompare(right.key)).slice(0, 10).map((issue) => ({ projectKey: issue.projectKey, projectName: issue.projectName, issueKey: issue.key, component: issue.component, ageDays: issue.ageDays })),
        highestEffortIssues: flattenedActionable.filter((issue) => issue.effortMinutes !== null).sort((left, right) => right.effortMinutes - left.effortMinutes || left.key.localeCompare(right.key)).slice(0, 10).map((issue) => ({ projectKey: issue.projectKey, projectName: issue.projectName, issueKey: issue.key, component: issue.component, effortMinutes: issue.effortMinutes })),
        attentionOrder: options && options.rankProjects === false ? [] : ranked
      },
      aggregateMetrics: {
        coverage: weightedCoverage(analysed),
        duplication: weightedDuplication(analysed),
        technicalDebtMinutes: debtValues.length ? debtValues.reduce((sum, value) => sum + value, 0) : null,
        technicalDebtProjectsIncluded: debtValues.length
      },
      datasetStates: { projects: entries.map((entry) => ({ projectKey: entry.projectIdentity.key, state: entry.collectionState.outcome })) },
      collectionEvidence: { reportId, selected: summary.projectsSelected, attempted: summary.projectsAttempted, analysed: summary.projectsAnalysed, projects: entries.map((entry) => entry.collectionEvidence), warnings },
      complete,
      warnings
    };
  }

  function reportProjects(report) {
    return report && report.reportMode === "portfolio" ? (report.projects || []).filter((entry) => entry.derived) : report ? [{
      projectIdentity: { ...(report.project || {}), branch: report.branchLabel },
      collectionState: { outcome: report.complete ? "complete" : "partial", complete: !!report.complete },
      collectionConfidence: report.complete ? "complete" : "partial",
      qualityGate: report.qualityGate,
      measures: report.measures || [], issues: report.issues || [], rules: report.rules || [], components: report.components || [], analyses: report.analyses || [], trends: report.trends || [],
      derived: report.derived, datasetStates: report.datasetStates, collectionEvidence: report.collectionEvidence,
      paging: { issues: report.issuePaging, components: report.componentPaging, analyses: report.analysisPaging, trends: report.trendPaging }, warnings: report.warnings || []
    }] : [];
  }

  function flattenReportIssues(report) {
    return reportProjects(report).flatMap((entry) => {
      const ruleNames = new Map((entry.rules || []).filter((rule) => rule && rule.key).map((rule) => [rule.key, rule.name || rule.key]));
      return (entry.issues || []).map((issue) => ({
        ...issue,
        reportProjectKey: entry.projectIdentity.key,
        reportProjectName: entry.projectIdentity.name,
        reportBranch: entry.projectIdentity.branch,
        reportRuleName: ruleNames.get(issue.rule) || "Metadata Unavailable"
      }));
    });
  }

  Object.assign(app, {
    FORMULA_VERSION,
    AGE_BUCKETS,
    finiteNumber,
    measureValue,
    effortMinutes,
    ageDays,
    ageBucket,
    issueQualities,
    issueImpactSeverities,
    normalizeTrendResponse,
    deriveProjectAnalytics,
    buildPortfolioReport,
    reportProjects,
    flattenReportIssues,
    weightedCoverage,
    weightedDuplication,
    attentionComparator,
    attentionReasons
  });
})(window);
