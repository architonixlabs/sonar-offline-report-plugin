(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const MAX_DOCX_ISSUES = 2000;
  const MAX_DOCX_COMPONENTS = 2000;
  const MAX_DOCX_TREND_OBSERVATIONS = 5000;
  const MAX_DOCX_ANALYSES = 5000;
  const MAX_DOCX_BYTES = 50 * 1024 * 1024;

  function text(value) {
    return app.xmlEscape(value === null || value === undefined || value === "" ? "Not provided" : value);
  }

  function run(value, options) {
    const settings = options || {};
    const properties = [
      settings.bold ? "<w:b/>" : "",
      settings.color ? `<w:color w:val="${app.xmlEscape(settings.color)}"/>` : "",
      settings.size ? `<w:sz w:val="${Number(settings.size)}"/>` : ""
    ].join("");
    return `<w:r>${properties ? `<w:rPr>${properties}</w:rPr>` : ""}<w:t xml:space="preserve">${text(value)}</w:t></w:r>`;
  }

  function paragraph(value, style, options) {
    const settings = options || {};
    const properties = [
      style ? `<w:pStyle w:val="${app.xmlEscape(style)}"/>` : "",
      settings.keepNext ? "<w:keepNext/>" : "",
      settings.pageBreakBefore ? "<w:pageBreakBefore/>" : "",
      settings.spacingAfter !== undefined ? `<w:spacing w:after="${Number(settings.spacingAfter)}"/>` : ""
    ].join("");
    return `<w:p>${properties ? `<w:pPr>${properties}</w:pPr>` : ""}${run(value, settings)}</w:p>`;
  }

  function cell(value, width, header) {
    const shade = header ? '<w:shd w:val="clear" w:color="auto" w:fill="16324F"/>' : "";
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${shade}<w:vAlign w:val="top"/></w:tcPr>${paragraph(value, null, { bold: header, color: header ? "FFFFFF" : null, spacingAfter: 0 })}</w:tc>`;
  }

  function table(headers, rows, widths) {
    const columnWidths = widths || headers.map(() => Math.floor(9000 / Math.max(1, headers.length)));
    const grid = columnWidths.map((width) => `<w:gridCol w:w="${width}"/>`).join("");
    const header = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${headers.map((value, index) => cell(value, columnWidths[index], true)).join("")}</w:tr>`;
    const body = rows.map((row) => `<w:tr>${headers.map((_, index) => cell(row[index], columnWidths[index], false)).join("")}</w:tr>`).join("");
    return `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D8E0EA"/><w:left w:val="single" w:sz="4" w:color="D8E0EA"/><w:bottom w:val="single" w:sz="4" w:color="D8E0EA"/><w:right w:val="single" w:sz="4" w:color="D8E0EA"/><w:insideH w:val="single" w:sz="4" w:color="D8E0EA"/><w:insideV w:val="single" w:sz="4" w:color="D8E0EA"/></w:tblBorders></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${header}${body}</w:tbl>${paragraph("", null, { spacingAfter: 0 })}`;
  }

  function friendlyStatus(value) {
    const key = app.text(value).toUpperCase();
    if (key === "OK") return "Passed";
    if (key === "ERROR") return "Failed";
    return app.humanize(value) || "Unknown";
  }

  function requirement(condition) {
    const threshold = condition.errorThreshold !== undefined ? condition.errorThreshold : condition.warningThreshold;
    const comparator = condition.comparator === "LT" ? "At least" : condition.comparator === "GT" ? "At most" : "Threshold";
    return `${comparator} ${app.metricValueLabel(condition.metricKey, threshold)}`;
  }

  function activeIssue(issue) {
    return app.issueLifecycle(issue) === "actionable";
  }

  function risk(issue) {
    const impacts = Array.isArray(issue.impacts) ? issue.impacts : [];
    const first = impacts[0] ? impacts[0].split(":").pop() : issue.severity;
    return app.humanize(first) || "Unknown";
  }

  function rawMeasure(report, key) {
    const measure = (report.measures || []).find((item) => item.metric === key);
    if (measure) {
      if (key.startsWith("new_") && measure.period && measure.period.value !== undefined) return measure.period.value;
      if (measure.value !== undefined) return measure.value;
      if (measure.period && measure.period.value !== undefined) return measure.period.value;
    }
    const condition = ((report.qualityGate && report.qualityGate.conditions) || []).find((item) => item.metricKey === key);
    return condition && condition.actualValue !== undefined ? condition.actualValue : null;
  }

  function componentMeasure(component, key) {
    const measures = component && component.measures;
    if (Array.isArray(measures)) {
      const match = measures.find((measure) => measure && measure.metric === key);
      if (match && match.value !== undefined) return match.value;
    } else if (measures && typeof measures === "object" && measures[key] !== undefined) {
      return measures[key] && typeof measures[key] === "object" && measures[key].value !== undefined
        ? measures[key].value : measures[key];
    }
    return component && component[key] !== undefined ? component[key] : null;
  }

  function available(value, suffix) {
    if (value === null || value === undefined || value === "") return "Not available";
    return `${value}${suffix || ""}`;
  }

  function componentEvidenceRow(component, projectLabel) {
    const name = [component.name || component.key, component.path, component.key, app.qualifierLabel(component.qualifier)].filter(Boolean).join("\n");
    return [
      ...(projectLabel === undefined ? [] : [projectLabel]),
      name, app.languageLabel(component.language), available(componentMeasure(component, "ncloc")),
      available(componentMeasure(component, "coverage"), "%"),
      `Lines ${available(componentMeasure(component, "uncovered_lines"))}/${available(componentMeasure(component, "lines_to_cover"))}; Conditions ${available(componentMeasure(component, "uncovered_conditions"))}/${available(componentMeasure(component, "conditions_to_cover"))}`,
      `Density ${available(componentMeasure(component, "duplicated_lines_density"), "%")}; lines ${available(componentMeasure(component, "duplicated_lines"))}`,
      `${available(componentMeasure(component, "complexity"))} / ${available(componentMeasure(component, "cognitive_complexity"))}`
    ];
  }

  function datasetInfo(report, key) {
    return app.datasetStateInfo ? app.datasetStateInfo(report, key) : {
      requested: !!(report.collectionScope && report.collectionScope[key]),
      state: report.collectionScope && report.collectionScope[key] ? "complete" : "not_requested",
      label: report.collectionScope && report.collectionScope[key] ? "Complete" : "Not requested",
      reason: "",
      available: !!(report.collectionScope && report.collectionScope[key])
    };
  }

  function portfolioDatasetInfo(entry, key) {
    const state = entry && entry.datasetStates && entry.datasetStates[key];
    if (state) return datasetInfo({ datasetStates: { [key]: state }, collectionScope: { [key]: !!state.requested } }, key);
    const expectedName = key === "components" ? "components" : key === "analyses" ? "analyses" : key === "trends" ? "historical metrics" : key;
    const evidence = (entry && entry.collectionEvidence && entry.collectionEvidence.datasets || []).find((item) => app.text(item.dataset).toLowerCase() === expectedName);
    if (!evidence) return { requested: false, state: "not_requested", label: "Not requested", reason: "", available: false };
    return datasetInfo({ datasetStates: { [key]: { ...evidence, requested: evidence.requested !== false } }, collectionScope: { [key]: evidence.requested !== false } }, key);
  }

  function trendObservationRows(report, projectLabel) {
    return (report.trends || []).flatMap((series) => (series.observations || []).map((observation) => [
      ...(projectLabel === undefined ? [] : [projectLabel]), app.metricLabel(series.metric), app.formatExportDate(observation.date),
      app.metricValueLabel(series.metric, observation.value),
      app.metricValueLabel(series.metric, series.current && series.current.value),
      app.metricValueLabel(series.metric, series.previous && series.previous.value),
      available(series.absoluteChange), available(series.percentageChange, "%")
    ]));
  }

  function combinedWarnings(report) {
    return [...new Set([...(report.warnings || []), ...((report.artifact && report.artifact.warnings) || [])].map(app.text).filter(Boolean))];
  }

  function collectionIsComplete(report) {
    const artifact = report.artifact || {};
    if (artifact.collectionComplete !== undefined) return !!artifact.collectionComplete;
    if (report.collectionComplete !== undefined) return !!report.collectionComplete;
    return !!report.complete;
  }

  function artifactIsComplete(report) {
    const artifact = report.artifact || {};
    return artifact.artifactComplete !== undefined ? !!artifact.artifactComplete : collectionIsComplete(report);
  }

  function explicitDigest(report) {
    return report.pluginArtifactDigest === null || report.pluginArtifactDigest === undefined ? "not_computed" : report.pluginArtifactDigest;
  }

  function estimatedStoredZipBytes(files) {
    const encoder = new TextEncoder();
    return Object.entries(files).reduce((total, [name, content]) => {
      const nameLength = encoder.encode(name).byteLength;
      const dataLength = typeof content === "string" ? encoder.encode(content).byteLength : content.byteLength;
      return total + 30 + nameLength + dataLength + 46 + nameLength;
    }, 22);
  }

  function issueRows(report, issueScope) {
    const rules = Object.fromEntries((report.rules || []).filter((rule) => rule && rule.key).map((rule) => [rule.key, rule.name || rule.key]));
    const issues = (report.issues || []).filter((issue) => issueScope === "all" || activeIssue(issue));
    return {
      issues,
      rows: issues.map((issue) => [
        issue.key || "Key unavailable",
        risk(issue),
        `${issue.message || "No message"}\n${rules[issue.rule] || issue.rule || "Rule unavailable"}`,
        `${issue.component || "Component unavailable"}${issue.line ? `:${issue.line}` : ""}`,
        `${app.humanize(app.issueLifecycle(issue)) || "Unknown"}\n${app.humanize(issue.status) || "Unknown"}\n${app.formatEffort(issue.effort) || "Effort unavailable"}`
      ])
    };
  }

  function portfolioDocumentBody(report, template, options) {
    const settings = options || {};
    const issueScope = settings.issueScope === "all" ? "all" : "active";
    const summary = report.portfolioSummary || {};
    const aggregate = report.aggregateIssueSummary || {};
    const projects = report.projects || [];
    const analysed = projects.filter((entry) => entry && entry.derived);
    const artifact = report.artifact || {};
    const complete = collectionIsComplete(report);
    const issueRowsForDocument = app.flattenReportIssues(report).filter((issue) => issueScope === "all" || app.issueLifecycle(issue) === "actionable");
    if (settings.includeIssueRegister && issueRowsForDocument.length > MAX_DOCX_ISSUES) {
      throw new Error(`The selected Word issue register contains ${issueRowsForDocument.length} rows. Word output is limited to ${MAX_DOCX_ISSUES}; narrow the scope or use Excel.`);
    }
    const componentCount = analysed.reduce((sum, entry) => sum + (entry.components || []).length, 0);
    if (template.sections.components && componentCount > MAX_DOCX_COMPONENTS) {
      throw new Error(`The selected Word component evidence contains ${componentCount.toLocaleString()} rows. Word output is limited to ${MAX_DOCX_COMPONENTS.toLocaleString()} component rows; reduce the portfolio/component limit or use Excel.`);
    }
    const trendCount = analysed.reduce((sum, entry) => sum + (entry.trends || []).reduce((inner, series) => inner + (series.observations || []).length, 0), 0);
    if (template.sections.trends && trendCount > MAX_DOCX_TREND_OBSERVATIONS) {
      throw new Error(`The selected Word historical-trend evidence contains ${trendCount.toLocaleString()} observations. Word output is limited to ${MAX_DOCX_TREND_OBSERVATIONS.toLocaleString()} observations; reduce the portfolio scope or use Excel.`);
    }
    const analysisCount = analysed.reduce((sum, entry) => sum + (entry.analyses || []).length, 0);
    if (template.sections.analyses && analysisCount > MAX_DOCX_ANALYSES) {
      throw new Error(`The selected Word analysis history contains ${analysisCount.toLocaleString()} rows. Word output is limited to ${MAX_DOCX_ANALYSES.toLocaleString()} analyses; reduce the portfolio scope or use Excel.`);
    }
    const parts = [
      paragraph(template.title, "Title", { keepNext: true }),
      paragraph(template.subtitle, "Subtitle"),
      paragraph(`Portfolio report  |  ${summary.projectsAnalysed || 0} of ${summary.projectsSelected || 0} projects analysed  |  Exported ${app.formatExportDate(artifact.exportedAt || report.generatedAt)}`),
      paragraph(complete ? "Complete for selected collection scope" : "INCOMPLETE REPORT", null, { bold: true, color: complete ? "18794E" : "B42318" }),
      paragraph(artifactIsComplete(report) ? "This Word artifact is complete for its declared artifact scope." : "This Word artifact is incomplete for its declared artifact scope.", null, { bold: true, color: artifactIsComplete(report) ? "18794E" : "B42318" }),
      paragraph(template.intro),
      paragraph("Executive Summary", "Heading1", { keepNext: true }),
      table(["Selected", "Analysed", "Complete", "Partial", "Failed", "Permission denied"], [[summary.projectsSelected, summary.projectsAnalysed, summary.projectsComplete, summary.projectsPartial, summary.projectsFailed, summary.projectsPermissionDenied]], [1450, 1450, 1450, 1450, 1450, 1750]),
      paragraph("Issue Landscape", "Heading2", { keepNext: true }),
      table(["Collected", "Actionable", "Accepted", "Closed", "Unknown"], [[aggregate.totalCollected, aggregate.actionable, aggregate.accepted, aggregate.closed, aggregate.unknown]], [1800, 1800, 1800, 1800, 1800]),
      paragraph("Project Scorecard", "Heading1", { keepNext: true }),
      table(["Project", "Collection", "Gate", "S/R/M", "Coverage", "Actionable"], projects.map((entry) => {
        const status = entry.derived && entry.derived.statusModel || {};
        const issues = entry.derived && entry.derived.issueSummary || {};
        return [entry.projectIdentity.name, app.humanize(entry.collectionState.outcome), friendlyStatus(status.qualityGate), [status.security, status.reliability, status.maintainability].map((value) => value || "—").join("/"), status.coverage === null || status.coverage === undefined ? "Not available" : `${status.coverage}%`, issues.actionable === undefined ? "Not available" : issues.actionable];
      }), [2400, 1300, 1100, 1100, 1400, 1500]),
      paragraph("Projects Requiring Attention", "Heading1", { keepNext: true })
    ];
    const attention = report.aggregateRiskConcentrations && report.aggregateRiskConcentrations.attentionOrder || [];
    if (attention.length) attention.slice(0, 12).forEach((item) => parts.push(paragraph(`${item.rank}. ${item.projectName} — ${item.reasons.join("; ")}`)));
    else parts.push(paragraph("Project prioritization was disabled or no analysed project was available."));
    parts.push(paragraph("Ranking method: lexicographic factual indicators; no composite or AI health score is used."));
    parts.push(paragraph("Data Confidence", "Heading1", { keepNext: true }));
    parts.push(table(["Project", "Dataset", "Expected", "Unique", "State", "Reason"], projects.flatMap((entry) => (entry.collectionEvidence && entry.collectionEvidence.datasets || []).map((dataset) => [entry.projectIdentity.name, dataset.dataset, dataset.expected, dataset.unique, app.humanize(dataset.state), app.humanize(dataset.reason)])), [2100, 1700, 1100, 1100, 1400, 1600]));

    if (template.sections.measures) {
      const measureEvidence = analysed.flatMap((entry) => (entry.measures || []).map((measure) => {
        const overall = measure.value !== undefined ? measure.value : measure.period && measure.period.value;
        const newCode = measure.period && measure.period.value !== undefined ? measure.period.value : null;
        return [entry.projectIdentity.name, app.metricLabel(measure.metric), app.metricValueLabel(measure.metric, overall), newCode === null ? "Not available" : app.metricValueLabel(measure.metric, newCode)];
      }));
      parts.push(paragraph("Portfolio Quality Measures", "Heading1", { keepNext: true }));
      if (measureEvidence.length) parts.push(table(["Project", "Measure", "Overall", "New code"], measureEvidence, [2200, 3000, 1900, 1900]));
      else parts.push(paragraph("No project quality measures were returned."));
    }

    if (template.sections.components) {
      const componentRows = analysed.flatMap((entry) => (entry.components || []).map((component) => componentEvidenceRow(component, `${entry.projectIdentity.name}\n${entry.projectIdentity.key}`)));
      parts.push(paragraph("Component Quality Evidence", "Heading1", { keepNext: true }));
      if (componentRows.length) parts.push(table(["Project", "File / component", "Language", "LOC", "Coverage", "Uncovered / total L / C", "Duplication density / lines", "Complexity C / Cog"], componentRows, [1100, 1800, 800, 650, 850, 1200, 900, 1700]));
      else {
        parts.push(paragraph("No component rows were returned. Dataset evidence follows."));
        analysed.forEach((entry) => {
          const state = portfolioDatasetInfo(entry, "components");
          parts.push(paragraph(`${entry.projectIdentity.name}: ${state.label}${state.reason ? ` (${app.humanize(state.reason)})` : ""}.`));
        });
      }
    }

    if (template.sections.trends) {
      const rows = analysed.flatMap((entry) => trendObservationRows(entry, entry.projectIdentity.name));
      parts.push(paragraph("Historical Metric Trends", "Heading1", { keepNext: true }));
      if (rows.length) parts.push(table(["Project", "Metric", "Date", "Value", "Latest", "Previous", "Delta", "Delta %"], rows, [1300, 1700, 1200, 1000, 1000, 1000, 900, 900]));
      else {
        parts.push(paragraph("No historical trend observations were returned. Dataset states follow."));
        analysed.forEach((entry) => {
          const state = portfolioDatasetInfo(entry, "trends");
          parts.push(paragraph(`${entry.projectIdentity.name}: ${state.label}${state.reason ? ` (${app.humanize(state.reason)})` : ""}.`));
        });
      }
    }

    if (template.sections.analyses) {
      const rows = analysed.flatMap((entry) => (entry.analyses || []).map((analysis) => [
        entry.projectIdentity.name, app.formatExportDate(analysis.date), analysis.projectVersion, analysis.revision,
        (analysis.events || []).map((event) => `${app.humanize(event.category)}: ${event.name || ""}`).join("; ")
      ]));
      parts.push(paragraph("Portfolio Analysis History", "Heading1", { keepNext: true }));
      if (rows.length) parts.push(table(["Project", "Date", "Version", "Revision", "Events"], rows, [1800, 1500, 1300, 1800, 2600]));
      else parts.push(paragraph("No analysis-history rows were returned; see Data Confidence for the requested state of each project."));
    }

    analysed.forEach((entry) => {
      const status = entry.derived.statusModel;
      parts.push(paragraph(entry.projectIdentity.name, "Heading1", { pageBreakBefore: true, keepNext: true }));
      parts.push(paragraph(`${entry.projectIdentity.key}  |  ${entry.projectIdentity.branch}  |  ${app.humanize(entry.collectionState.outcome)}`));
      parts.push(table(["Quality Gate", "Security", "Reliability", "Maintainability", "Debt", "Analysis Age"], [[friendlyStatus(status.qualityGate), status.security || "Not available", status.reliability || "Not available", status.maintainability || "Not available", status.technicalDebtMinutes === null ? "Not available" : app.durationLabel(status.technicalDebtMinutes), status.analysisAgeDays === null ? "Not available" : `${status.analysisAgeDays} days`]], [1700, 1400, 1400, 1500, 1500, 1500]));
      const failures = entry.derived.qualityGateFailureReasons || [];
      if (failures.length) {
        parts.push(paragraph("Why This Project Failed the Quality Gate", "Heading2", { keepNext: true }));
        parts.push(table(["Metric", "Context", "Actual", "Requirement"], failures.map((failure) => [app.metricLabel(failure.metric), app.humanize(failure.context), failure.actual, `${app.humanize(failure.comparator)} ${failure.threshold}`]), [2800, 1800, 1800, 2600]));
      }
    });
    if (settings.includeIssueRegister) {
      parts.push(paragraph("Issue Register", "Heading1", { pageBreakBefore: true, keepNext: true }));
      parts.push(paragraph(`${issueRowsForDocument.length} ${issueScope === "all" ? "collected" : "actionable"} issues. Use Excel for larger or interactive analysis.`));
      parts.push(table(["Project", "Issue key", "Impact / lifecycle", "Issue and rule", "Component", "Effort / age"], issueRowsForDocument.map((issue) => [issue.reportProjectName, issue.key || "Key unavailable", `${(issue.impactSeverities || []).join(", ")} / ${app.humanize(issue.normalizedLifecycle)}`, `${issue.message || "No message"}\n${issue.rule || "Rule unavailable"}`, `${issue.component || "Component unavailable"}${issue.line ? `:${issue.line}` : ""}`, `${app.formatEffort(issue.effort) || "Unknown effort"} / ${issue.ageDays === null ? "Unknown age" : `${issue.ageDays}d`}`]), [1300, 1050, 1400, 2050, 1900, 1300]));
    }
    const warnings = combinedWarnings(report);
    if (warnings.length) {
      parts.push(paragraph("Warnings and Limitations", "Heading1", { keepNext: true }));
      warnings.forEach((warning) => parts.push(paragraph(`- ${warning}`)));
    }
    parts.push(paragraph("Provenance", "Heading1", { keepNext: true }));
    const serverVersions = [...new Set([report.serverVersion, ...projects.map((entry) => entry.collectionEvidence && entry.collectionEvidence.serverVersion)].filter(Boolean))];
    parts.push(table(["Field", "Value"], [
      ["Report ID", report.reportId], ["Report mode", "Portfolio"], ["Report schema", report.schemaVersion],
      ["Model / renderer / plugin", `${report.modelVersion} / ${report.rendererVersion} / ${report.pluginVersion}`],
      ["Collection started", app.formatExportDate(report.collectionStartedAt)], ["Collection completed", app.formatExportDate(report.collectionCompletedAt)],
      ["Collected at", app.formatExportDate(report.collectedAt)], ["Artifact exported at", app.formatExportDate(artifact.exportedAt || report.generatedAt)],
      ["Collection complete", complete ? "Yes" : "No"], ["Artifact complete", artifactIsComplete(report) ? "Yes" : "No"],
      ["Artifact format / purpose / mode", `${artifact.format || "docx"} / ${artifact.purpose || "document"} / ${artifact.mode || "summary"}`],
      ["Applied issue scope", artifact.issueScope || issueScope], ["Artifact scope", JSON.stringify(artifact.scope || {})],
      ["Artifact exported counts", JSON.stringify(artifact.exportedCounts || {})], ["SonarQube version(s)", serverVersions.join("; ") || "Not available"],
      ["Server base URL", report.serverBaseUrl || "Not available"], ["Server base URL scope", report.serverBaseUrlScope || "Not available"],
      ["Requested project keys", (report.requestedScope && report.requestedScope.projectKeys || []).join("; ")],
      ["Actual project keys", (report.actualScope && report.actualScope.projectKeys || []).join("; ")],
      ["Requested scope", JSON.stringify(report.requestedScope || {})], ["Actual scope", JSON.stringify(report.actualScope || {})],
      ["Source revision", report.sourceRevision || "Not available"],
      ["Source digest (build metadata only)", report.sourceDigest === null || report.sourceDigest === undefined ? "not_computed" : report.sourceDigest],
      ["Plugin artifact digest (build metadata only)", explicitDigest(report)],
      ["Artifact digest", artifact.artifactDigest || "not_computed"], ["Artifact digest state", artifact.artifactDigestState || "not_computed"]
    ], [2900, 6100]));
    parts.push(paragraph("Source, plugin, and artifact digests, when present, are metadata only; this document is not digitally signed and does not claim tamper evidence."));
    parts.push(paragraph("Source code and credentials were not collected."));
    parts.push(paragraph(template.footer));
    return { xml: parts.join(""), issueCount: settings.includeIssueRegister ? issueRowsForDocument.length : 0, issueScope };
  }

  function documentBody(report, template, options) {
    if (report && report.reportMode === "portfolio") return portfolioDocumentBody(report, template, options);
    const settings = options || {};
    const issueScope = settings.issueScope === "all" ? "all" : "active";
    const artifact = report.artifact || {};
    const issuesState = datasetInfo(report, "issues");
    const componentsState = datasetInfo(report, "components");
    const analysesState = datasetInfo(report, "analyses");
    const trendsState = datasetInfo(report, "trends");
    const peopleState = datasetInfo(report, "people");
    const issueRegister = issueRows(report, issueScope);
    if (settings.includeIssueRegister !== false && issueRegister.issues.length > MAX_DOCX_ISSUES) {
      throw new Error(`The Word issue register is limited to ${MAX_DOCX_ISSUES.toLocaleString()} rows; this scope contains ${issueRegister.issues.length.toLocaleString()}. Choose actionable issues, reduce the collected scope, or use Excel.`);
    }
    if (template.sections.components && (report.components || []).length > MAX_DOCX_COMPONENTS) {
      throw new Error(`The selected Word component evidence contains ${(report.components || []).length.toLocaleString()} rows. Word output is limited to ${MAX_DOCX_COMPONENTS.toLocaleString()} component rows; reduce the component limit or use Excel.`);
    }
    const trendCount = (report.trends || []).reduce((sum, series) => sum + (series.observations || []).length, 0);
    if (template.sections.trends && trendCount > MAX_DOCX_TREND_OBSERVATIONS) {
      throw new Error(`The selected Word historical-trend evidence contains ${trendCount.toLocaleString()} observations. Word output is limited to ${MAX_DOCX_TREND_OBSERVATIONS.toLocaleString()} observations; reduce the trend scope or use Excel.`);
    }
    if (template.sections.analyses && (report.analyses || []).length > MAX_DOCX_ANALYSES) {
      throw new Error(`The selected Word analysis history contains ${(report.analyses || []).length.toLocaleString()} rows. Word output is limited to ${MAX_DOCX_ANALYSES.toLocaleString()} analyses; reduce the analysis limit or use Excel.`);
    }
    const lifecycle = (report.issues || []).reduce((counts, issue) => {
      const key = app.issueLifecycle(issue);
      counts[key in counts ? key : "unknown"] += 1;
      return counts;
    }, { actionable: 0, accepted: 0, closed: 0, unknown: 0 });
    const conditions = (report.qualityGate && report.qualityGate.conditions) || [];
    const failedConditions = conditions.filter((condition) => String(condition.status).toUpperCase() === "ERROR").length;
    const complete = collectionIsComplete(report);
    const parts = [
      paragraph(template.title, "Title", { keepNext: true }),
      paragraph(template.subtitle, "Subtitle"),
      paragraph(report.project && (report.project.name || report.project.key), "Heading2", { keepNext: true }),
      paragraph(`${report.branchLabel || "Main branch"}  |  Analyzed ${app.formatExportDate(report.project && report.project.analysisDate)}  |  Exported ${app.formatExportDate(artifact.exportedAt || report.generatedAt)}`),
      paragraph(complete ? "Complete for selected collection scope" : "INCOMPLETE REPORT", null, { bold: true, color: complete ? "18794E" : "B42318" }),
      paragraph(artifactIsComplete(report) ? "This Word artifact is complete for its declared artifact scope." : "This Word artifact is incomplete for its declared artifact scope.", null, { bold: true, color: artifactIsComplete(report) ? "18794E" : "B42318" }),
      paragraph(template.intro),
      paragraph("Executive summary", "Heading1", { keepNext: true }),
      table(["Quality Gate", "Actionable", "Accepted", "Closed", "Unknown", "Issues dataset"], [[
        friendlyStatus(report.qualityGate && report.qualityGate.status),
        issuesState.available ? lifecycle.actionable : issuesState.label,
        issuesState.available ? lifecycle.accepted : issuesState.label,
        issuesState.available ? lifecycle.closed : issuesState.label,
        issuesState.available ? lifecycle.unknown : issuesState.label,
        issuesState.label
      ]], [1800, 1400, 1400, 1400, 1400, 1600])
    ];

    if (conditions.length) {
      parts.push(paragraph(`Quality Gate conditions (${failedConditions} failed)`, "Heading2", { keepNext: true }));
      parts.push(table(["Condition", "Result", "Actual", "Requirement"], conditions.map((condition) => [
        app.metricLabel(condition.metricKey),
        friendlyStatus(condition.status),
        app.metricValueLabel(condition.metricKey, condition.actualValue),
        requirement(condition)
      ]), [2800, 1500, 2000, 2700]));
    }

    if (template.sections.measures) {
      const definitions = [
        ["Coverage", "coverage", "new_coverage"],
        ["Duplication", "duplicated_lines_density", "new_duplicated_lines_density"],
        ["Bugs", "bugs", "new_bugs"],
        ["Vulnerabilities", "vulnerabilities", "new_vulnerabilities"],
        ["Code smells", "code_smells", "new_code_smells"],
        ["Security hotspots", "security_hotspots", null],
        ["New hotspots reviewed", "new_security_hotspots_reviewed", null],
        ["Reliability rating", "reliability_rating", null],
        ["Security rating", "security_rating", null],
        ["Maintainability rating", "sqale_rating", null],
        ["Technical debt", "sqale_index", null],
        ["Lines of code", "ncloc", null],
        ["Cyclomatic complexity", "complexity", null],
        ["Cognitive complexity", "cognitive_complexity", null],
        ["Tests", "tests", null],
        ["Test failures", "test_failures", null],
        ["Test errors", "test_errors", null],
        ["Skipped tests", "skipped_tests", null],
        ["Test execution time", "test_execution_time", null]
      ];
      const used = new Set(definitions.flatMap((definition) => definition.slice(1).filter(Boolean)));
      const rows = definitions.filter((definition) => rawMeasure(report, definition[1]) !== null || definition[2] && rawMeasure(report, definition[2]) !== null).map((definition) => [
        definition[0],
        app.metricValueLabel(definition[1], rawMeasure(report, definition[1])),
        definition[2] ? app.metricValueLabel(definition[2], rawMeasure(report, definition[2])) : "Not applicable"
      ]);
      (report.measures || []).filter((measure) => !used.has(measure.metric)).forEach((measure) => rows.push([
        app.metricLabel(measure.metric),
        measure.metric.startsWith("new_") ? "Not applicable" : app.metricValueLabel(measure.metric, measure.value),
        measure.metric.startsWith("new_") ? app.metricValueLabel(measure.metric, measure.period && measure.period.value !== undefined ? measure.period.value : measure.value) : "Not applicable"
      ]));
      parts.push(paragraph("Quality measures", "Heading1", { keepNext: true }));
      if (rows.length) parts.push(table(["Measure", "Overall", "New code"], rows, [4000, 2500, 2500]));
      else parts.push(paragraph("No quality measures were returned."));
    }

    if (template.sections.issues && settings.includeIssueRegister !== false) {
      parts.push(paragraph("Issue register", "Heading1", { keepNext: true }));
      parts.push(paragraph(`${issueRegister.issues.length} ${issueScope === "all" ? "collected" : "open/actionable"} issues. For large remediation datasets, use the Excel export for filtering and analysis.`));
      if (!issuesState.available) parts.push(paragraph(`Issues: ${issuesState.label}${issuesState.reason ? ` (${app.humanize(issuesState.reason)})` : ""}.`, null, { bold: true }));
      else if (!issueRegister.rows.length) parts.push(paragraph("No issues match this document scope."));
      else parts.push(table(["Issue key", "Risk", "Issue and rule", "File and line", "Lifecycle, status and effort"], issueRegister.rows, [1100, 900, 2900, 2500, 1600]));
    }

    if (template.sections.components) {
      parts.push(paragraph("Component quality evidence", "Heading1", { keepNext: true }));
      if (!componentsState.available) parts.push(paragraph(`Components: ${componentsState.label}${componentsState.reason ? ` (${app.humanize(componentsState.reason)})` : ""}.`));
      else if (!(report.components || []).length) parts.push(paragraph("The component dataset completed but returned no component rows."));
      else parts.push(table(["File / component", "Language", "LOC", "Coverage", "Uncovered / total L / C", "Duplication density / lines", "Complexity C / Cog"], (report.components || []).map((component) => componentEvidenceRow(component)), [2300, 900, 700, 900, 1300, 1000, 1900]));
    }

    if (template.sections.analyses) {
      parts.push(paragraph("Analysis history", "Heading1", { keepNext: true }));
      if (!analysesState.available) parts.push(paragraph(`Analyses: ${analysesState.label}${analysesState.reason ? ` (${app.humanize(analysesState.reason)})` : ""}.`));
      else if (!(report.analyses || []).length) parts.push(paragraph("The analysis-history dataset completed but returned no rows."));
      else parts.push(table(["Date", "Version", "Revision", "Events"], (report.analyses || []).map((analysis) => [
        app.formatExportDate(analysis.date), analysis.projectVersion, analysis.revision,
        (analysis.events || []).map((event) => `${app.humanize(event.category)}: ${event.name}`).join("; ")
      ]), [2200, 1700, 2400, 2700]));
    }

    if (template.sections.trends) {
      const rows = trendObservationRows(report);
      parts.push(paragraph("Historical metric trends", "Heading1", { keepNext: true }));
      if (!trendsState.available) parts.push(paragraph(`Historical metrics: ${trendsState.label}${trendsState.reason ? ` (${app.humanize(trendsState.reason)})` : ""}.`));
      else if (!rows.length) parts.push(paragraph("The historical-metrics dataset completed but returned no observations."));
      else parts.push(table(["Metric", "Date", "Value", "Latest", "Previous", "Delta", "Delta %"], rows, [1800, 1300, 1200, 1200, 1200, 1100, 1200]));
    }

    parts.push(paragraph("Data provenance", "Heading1", { keepNext: true }));
    const paging = { issues: report.issuePaging || {}, components: report.componentPaging || {}, analyses: report.analysisPaging || {}, trends: report.trendPaging || {} };
    parts.push(table(["Dataset", "Requested", "State", "Reason", "Exported", "Expected", "Limit"], [
      ["Issues", issuesState.requested ? "Yes" : "No", issuesState.label, app.humanize(issuesState.reason) || "Not applicable", paging.issues.exported, paging.issues.expected, paging.issues.limit],
      ["Components", componentsState.requested ? "Yes" : "No", componentsState.label, app.humanize(componentsState.reason) || "Not applicable", paging.components.exported, paging.components.expected, paging.components.limit],
      ["Analyses", analysesState.requested ? "Yes" : "No", analysesState.label, app.humanize(analysesState.reason) || "Not applicable", paging.analyses.exported, paging.analyses.expected, paging.analyses.limit],
      ["Historical metrics", trendsState.requested ? "Yes" : "No", trendsState.label, app.humanize(trendsState.reason) || "Not applicable", paging.trends.exported, paging.trends.expected, paging.trends.limit],
      ["People", peopleState.requested ? "Yes" : "No", peopleState.label, app.humanize(peopleState.reason) || "Not applicable", peopleState.requested ? "Included fields" : 0, "Not applicable", "Not applicable"]
    ], [1300, 900, 1300, 2100, 1100, 1100, 1200]));
    parts.push(paragraph("Report and artifact metadata", "Heading2", { keepNext: true }));
    parts.push(table(["Field", "Value"], [
      ["Report ID", report.reportId], ["Report mode", report.reportMode || "single"], ["Report schema", report.schemaVersion],
      ["Model / renderer / plugin", `${report.modelVersion} / ${report.rendererVersion} / ${report.pluginVersion}`],
      ["Collection started", app.formatExportDate(report.collectionStartedAt)], ["Collection completed", app.formatExportDate(report.collectionCompletedAt)],
      ["Collected at", app.formatExportDate(report.collectedAt)], ["Artifact exported at", app.formatExportDate(artifact.exportedAt || report.generatedAt)],
      ["Collection complete", complete ? "Yes" : "No"], ["Artifact complete", artifactIsComplete(report) ? "Yes" : "No"],
      ["Artifact format / purpose / mode", `${artifact.format || "docx"} / ${artifact.purpose || "document"} / ${artifact.mode || "summary"}`],
      ["Applied issue scope", artifact.issueScope || issueScope], ["Artifact scope", JSON.stringify(artifact.scope || {})],
      ["Artifact exported counts", JSON.stringify(artifact.exportedCounts || {})], ["SonarQube version", report.serverVersion || "Not available"],
      ["Server base URL", report.serverBaseUrl || "Not available"], ["Server base URL scope", report.serverBaseUrlScope || "Not available"],
      ["Project key", report.project && report.project.key], ["Project name", report.project && report.project.name], ["Branch / pull request", report.branchLabel],
      ["Source revision", report.sourceRevision || "Not available"],
      ["Source digest (build metadata only)", report.sourceDigest === null || report.sourceDigest === undefined ? "not_computed" : report.sourceDigest],
      ["Plugin artifact digest (build metadata only)", explicitDigest(report)],
      ["Artifact digest", artifact.artifactDigest || "not_computed"], ["Artifact digest state", artifact.artifactDigestState || "not_computed"]
    ], [2900, 6100]));
    const warnings = combinedWarnings(report);
    if (warnings.length) {
      parts.push(paragraph("Export warnings", "Heading2", { keepNext: true }));
      warnings.forEach((warning) => parts.push(paragraph(`- ${warning}`)));
    }
    parts.push(paragraph("Snapshot semantics", "Heading2", { keepNext: true }));
    parts.push(paragraph("This is a non-transactional current snapshot. Data can change after export. Source code and credentials were not collected."));
    parts.push(paragraph("Source, plugin, and artifact digests, when present, are metadata only; this document is not digitally signed and does not claim tamper evidence."));
    parts.push(paragraph(template.footer));
    return { xml: parts.join(""), issueCount: template.sections.issues && settings.includeIssueRegister !== false ? issueRegister.issues.length : 0, issueScope };
  }

  function buildDocx(report, inputTemplate, options) {
    if (!app.zipStore) throw new Error("The OOXML package writer is unavailable.");
    const template = app.normalizeTemplate(inputTemplate);
    const content = documentBody(report, template, options);
    const generated = new Date(report.generatedAt || Date.now());
    const created = Number.isNaN(generated.getTime()) ? new Date().toISOString() : generated.toISOString();
    const title = app.xmlEscape(template.title);
    const project = app.xmlEscape(report.reportMode === "portfolio" ? "SonarQube portfolio" : report.project && (report.project.name || report.project.key) || "SonarQube project");
    const files = {
      "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
      "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
      "word/document.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${content.xml}<w:sectPr><w:headerReference w:type="default" r:id="rId3"/><w:footerReference w:type="default" r:id="rId4"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`,
      "word/_rels/document.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`,
      "word/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Subtitle"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="160"/></w:pPr><w:rPr><w:b/><w:color w:val="16324F"/><w:sz w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:color w:val="5F6B7A"/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:outlineLvl w:val="0"/><w:spacing w:before="320" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="16324F"/><w:sz w:val="30"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:outlineLvl w:val="1"/><w:spacing w:before="240" w:after="100"/></w:pPr><w:rPr><w:b/><w:color w:val="0F766E"/><w:sz w:val="24"/></w:rPr></w:style></w:styles>`,
      "word/settings.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="720"/><w:compat/></w:settings>`,
      "word/header1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="right"/></w:pPr>${run(project, { color: "5F6B7A", size: 18 })}</w:p></w:hdr>`,
      "word/footer1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>${run("SonarQube offline report", { color: "5F6B7A", size: 18 })}</w:p></w:ftr>`,
      "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${title}</dc:title><dc:subject>SonarQube offline quality report</dc:subject><dc:creator>SonarQube Offline Report Plugin</dc:creator><dc:description>Portable report for ${project}</dc:description><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified></cp:coreProperties>`,
      "docProps/app.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>SonarQube Offline Report Plugin</Application><AppVersion>1.0</AppVersion></Properties>`
    };
    const estimatedBytes = estimatedStoredZipBytes(files);
    if (estimatedBytes > MAX_DOCX_BYTES) {
      throw new Error(`Word export requires approximately ${Math.ceil(estimatedBytes / 1024 / 1024)} MiB, above the ${Math.round(MAX_DOCX_BYTES / 1024 / 1024)} MiB safety limit. Reduce the issue, component, trend, or portfolio scope, or use Excel.`);
    }
    let packageBytes;
    try {
      packageBytes = app.zipStore(files, MAX_DOCX_BYTES);
    } catch (error) {
      if (/configured size limit/.test(error && error.message || "")) {
        throw new Error(`Word export exceeds the ${Math.round(MAX_DOCX_BYTES / 1024 / 1024)} MiB safety limit. Reduce the issue, component, trend, or portfolio scope, or use Excel.`);
      }
      throw error;
    }
    return {
      blob: new Blob([packageBytes], { type: WORD_MIME }),
      issueCount: content.issueCount,
      issueScope: content.issueScope,
      warnings: combinedWarnings(report),
      estimatedBytes
    };
  }

  Object.assign(app, {
    WORD_MIME, MAX_DOCX_ISSUES, MAX_DOCX_COMPONENTS, MAX_DOCX_TREND_OBSERVATIONS, MAX_DOCX_ANALYSES, MAX_DOCX_BYTES,
    buildDocx, docxEstimatedStoredZipBytes: estimatedStoredZipBytes, docxDocumentBody: documentBody, portfolioDocxBody: portfolioDocumentBody
  });
})(window);
