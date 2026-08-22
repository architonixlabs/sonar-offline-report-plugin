(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const MAX_CELL_LENGTH = 32767;
  const MAX_XLSX_BYTES = 75 * 1024 * 1024;
  const MAX_ZIP_ENTRIES = 65535;
  const MAX_ZIP_UINT32 = 0xFFFFFFFF;
  const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

  function numberCell(value) {
    if (value === null || value === undefined || value === "") return app.text(value);
    const numeric = Number(value);
    return Number.isFinite(numeric) ? { kind: "number", value: numeric } : app.text(value);
  }

  function dateCell(value) {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return app.text(value);
    return { kind: "date", value: (date.getTime() - EXCEL_EPOCH_UTC) / 86400000 };
  }

  function displayCell(value) {
    if (value && typeof value === "object" && (value.kind === "number" || value.kind === "date")) return String(value.value);
    return app.text(value);
  }

  function numericMetricCell(value) {
    if (value === null || value === undefined || value === "") return "";
    return Number.isFinite(Number(value)) ? numberCell(value) : app.text(value);
  }

  function componentMeasure(component, metric) {
    const measures = component && component.measures;
    if (Array.isArray(measures)) {
      const measure = measures.find((item) => item && item.metric === metric);
      if (measure && measure.value !== undefined) return measure.value;
    } else if (measures && typeof measures === "object" && measures[metric] !== undefined) {
      return measures[metric] && typeof measures[metric] === "object" && measures[metric].value !== undefined
        ? measures[metric].value : measures[metric];
    }
    return component && component[metric] !== undefined ? component[metric] : "";
  }

  function componentRow(component, prefix) {
    return [
      ...(prefix || []), component.key, component.name, component.path, app.qualifierLabel(component.qualifier), app.languageLabel(component.language),
      numericMetricCell(componentMeasure(component, "ncloc")), numericMetricCell(componentMeasure(component, "coverage")),
      numericMetricCell(componentMeasure(component, "lines_to_cover")), numericMetricCell(componentMeasure(component, "uncovered_lines")),
      numericMetricCell(componentMeasure(component, "conditions_to_cover")), numericMetricCell(componentMeasure(component, "uncovered_conditions")),
      numericMetricCell(componentMeasure(component, "duplicated_lines_density")), numericMetricCell(componentMeasure(component, "duplicated_lines")),
      numericMetricCell(componentMeasure(component, "complexity")), numericMetricCell(componentMeasure(component, "cognitive_complexity"))
    ];
  }

  function componentHeaders(prefix) {
    return [
      ...(prefix || []), "Component Key", "Name", "Path", "Component Type", "Language", "Lines of Code", "Coverage",
      "Lines to Cover", "Uncovered Lines", "Conditions to Cover", "Uncovered Conditions", "Duplication", "Duplicated Lines",
      "Cyclomatic Complexity", "Cognitive Complexity"
    ];
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i += 1) crc = crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function set16(view, offset, value) { view.setUint16(offset, value, true); }
  function set32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }

  function dosTimestamp(date) {
    const year = Math.max(1980, date.getFullYear());
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
  }

  function concatArrays(arrays) {
    const size = arrays.reduce((sum, value) => sum + value.length, 0);
    const result = new Uint8Array(size);
    let offset = 0;
    arrays.forEach((value) => { result.set(value, offset); offset += value.length; });
    return result;
  }

  function utf8Length(value) {
    let length = 0;
    for (const character of value) {
      const codePoint = character.codePointAt(0);
      length += codePoint <= 0x7F ? 1 : codePoint <= 0x7FF ? 2 : codePoint <= 0xFFFF ? 3 : 4;
    }
    return length;
  }

  /** Creates a standards-compliant ZIP using STORE entries, avoiding a runtime dependency. */
  function zipStore(files, maximumBytes) {
    const encoder = new TextEncoder();
    const now = dosTimestamp(new Date());
    const localParts = [];
    const centralParts = [];
    const entries = Object.entries(files);
    const byteLimit = Number.isFinite(maximumBytes) && maximumBytes > 0 ? maximumBytes : MAX_ZIP_UINT32;
    if (entries.length > MAX_ZIP_ENTRIES) throw new Error("The Office package contains too many ZIP entries.");
    let localOffset = 0;
    let centralSize = 0;

    entries.forEach(([name, content]) => {
      if (!name || name.startsWith("/") || name.includes("\\") || name.split("/").some((segment) => segment === "." || segment === "..")) {
        throw new Error(`Blocked unsafe Office package path: ${name}`);
      }
      const nameBytes = encoder.encode(name);
      if (nameBytes.length > 0xFFFF) throw new Error("An Office package path exceeds the ZIP32 name limit.");
      const expectedDataLength = typeof content === "string" ? utf8Length(content) : content.byteLength;
      const upperPackageSize = localOffset + 30 + nameBytes.length + expectedDataLength
        + centralSize + 46 + nameBytes.length + 22;
      if (upperPackageSize > byteLimit) throw new Error("The Office package exceeds its configured size limit.");
      const data = typeof content === "string" ? encoder.encode(content) : content;
      if (data.length > MAX_ZIP_UINT32) throw new Error("An Office package part exceeds the ZIP32 size limit.");
      const crc = crc32(data);
      const local = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(local.buffer);
      set32(lv, 0, 0x04034B50); set16(lv, 4, 20); set16(lv, 6, 0x0800); set16(lv, 8, 0);
      set16(lv, 10, now.time); set16(lv, 12, now.date); set32(lv, 14, crc);
      set32(lv, 18, data.length); set32(lv, 22, data.length); set16(lv, 26, nameBytes.length); set16(lv, 28, 0);
      local.set(nameBytes, 30);
      localParts.push(local, data);

      const central = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(central.buffer);
      set32(cv, 0, 0x02014B50); set16(cv, 4, 20); set16(cv, 6, 20); set16(cv, 8, 0x0800);
      set16(cv, 10, 0); set16(cv, 12, now.time); set16(cv, 14, now.date); set32(cv, 16, crc);
      set32(cv, 20, data.length); set32(cv, 24, data.length); set16(cv, 28, nameBytes.length);
      set16(cv, 30, 0); set16(cv, 32, 0); set16(cv, 34, 0); set16(cv, 36, 0); set32(cv, 38, 0);
      set32(cv, 42, localOffset); central.set(nameBytes, 46);
      centralParts.push(central);
      localOffset += local.length + data.length;
      centralSize += central.length;
      if (localOffset > MAX_ZIP_UINT32 || localOffset + centralSize + 22 > byteLimit) {
        throw new Error("The Office package exceeds its configured size limit.");
      }
    });

    const centralDirectory = concatArrays(centralParts);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    set32(ev, 0, 0x06054B50); set16(ev, 4, 0); set16(ev, 6, 0);
    set16(ev, 8, centralParts.length); set16(ev, 10, centralParts.length);
    set32(ev, 12, centralDirectory.length); set32(ev, 16, localOffset); set16(ev, 20, 0);
    return concatArrays([...localParts, centralDirectory, end]);
  }

  function estimatedStoredZipBytes(files) {
    return Object.entries(files).reduce((total, [name, content]) => {
      const nameLength = utf8Length(name);
      const dataLength = typeof content === "string" ? utf8Length(content) : content.byteLength;
      return total + 30 + nameLength + dataLength + 46 + nameLength;
    }, 22);
  }

  function assertPackageSize(estimatedBytes) {
    if (estimatedBytes > MAX_XLSX_BYTES) {
      throw new Error(`Excel export requires approximately ${Math.ceil(estimatedBytes / 1024 / 1024)} MiB, above the ${Math.round(MAX_XLSX_BYTES / 1024 / 1024)} MiB safety limit. Reduce selected projects or issue/component limits, or use CSV/JSON.`);
    }
  }

  function columnName(index) {
    let value = index + 1;
    let name = "";
    while (value > 0) {
      value -= 1;
      name = String.fromCharCode(65 + (value % 26)) + name;
      value = Math.floor(value / 26);
    }
    return name;
  }

  function safeCell(value, warnings) {
    let result = app.formulaSafe(value);
    if (result.length > MAX_CELL_LENGTH) {
      let cutoff = MAX_CELL_LENGTH - 1;
      const before = result.charCodeAt(cutoff - 1);
      const after = result.charCodeAt(cutoff);
      if (before >= 0xD800 && before <= 0xDBFF && after >= 0xDC00 && after <= 0xDFFF) cutoff -= 1;
      result = result.slice(0, cutoff) + "…";
      warnings.add("One or more spreadsheet cells were truncated to Excel's 32,767 character limit.");
    }
    return result;
  }

  function sheetXml(rows, warnings) {
    const width = Math.max(1, ...rows.map((row) => row.length));
    const columnWidths = Array.from({ length: width }, (_, colIndex) => {
      const longest = Math.max(0, ...rows.slice(0, 500).map((row) => displayCell(row[colIndex]).length));
      return Math.min(60, Math.max(11, longest + 2));
    });
    const columns = columnWidths.map((columnWidth, index) => `<col min="${index + 1}" max="${index + 1}" width="${columnWidth}" customWidth="1"/>`).join("");
    const rowXml = rows.map((row, rowIndex) => {
      const cells = row.map((value, colIndex) => {
        const reference = `${columnName(colIndex)}${rowIndex + 1}`;
        if (value && typeof value === "object" && (value.kind === "number" || value.kind === "date")) {
          const numeric = Number(value.value);
          if (Number.isFinite(numeric)) {
            const styleId = value.kind === "date" ? (rowIndex % 2 === 0 ? 4 : 3) : (rowIndex % 2 === 0 ? 2 : 0);
            return `<c r="${reference}" t="n" s="${styleId}"><v>${numeric}</v></c>`;
          }
        }
        const style = rowIndex === 0 ? ' s="1"' : rowIndex % 2 === 0 ? ' s="2"' : ' s="0"';
        const safe = app.xmlEscape(safeCell(value, warnings));
        return `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${safe}</t></is></c>`;
      }).join("");
      return `<row r="${rowIndex + 1}" ht="${rowIndex === 0 ? 26 : 20}" customHeight="1">${cells}</row>`;
    }).join("");
    const range = `A1:${columnName(width - 1)}${Math.max(1, rows.length)}`;
    const autoFilter = rows.length > 1 ? `<autoFilter ref="${range}"/>` : "";
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><tabColor rgb="FF0F766E"/></sheetPr><sheetViews><sheetView showGridLines="0" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="20"/><cols>${columns}</cols><sheetData>${rowXml}</sheetData>${autoFilter}<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`;
  }

  function gateStatus(value) {
    const key = app.text(value).toUpperCase();
    if (key === "OK") return "Passed";
    if (key === "ERROR") return "Failed";
    if (key === "WARN") return "Warning";
    return app.humanize(value) || "Not Available";
  }

  function conditionDisplayValue(condition, value) {
    const metric = app.text(condition.metricKey);
    return app.metricValueLabel(metric, value);
  }

  function requirementLabel(condition) {
    const threshold = condition.errorThreshold !== undefined ? condition.errorThreshold : condition.warningThreshold;
    const comparator = condition.comparator === "LT" ? "At Least" : condition.comparator === "GT" ? "At Most" : app.humanize(condition.comparator) || "Threshold";
    return `${comparator} ${conditionDisplayValue(condition, threshold)}`;
  }

  function metricCategory(metric) {
    if (/test/.test(metric)) return "Tests";
    if (/coverage|duplicated/.test(metric)) return "Coverage and Duplication";
    if (/security|vulnerabilit/.test(metric)) return "Security";
    if (/reliability|bugs/.test(metric)) return "Reliability";
    if (/sqale|smells/.test(metric)) return "Maintainability";
    if (/complexity/.test(metric)) return "Complexity";
    if (/ncloc|lines/.test(metric)) return "Size";
    return "Other";
  }

  function measureRows(report) {
    const byKey = Object.fromEntries((report.measures || []).map((measure) => [measure.metric, measure]));
    const definitions = [
      ["Coverage", "coverage", "new_coverage"],
      ["Duplicated Lines", "duplicated_lines_density", "new_duplicated_lines_density"],
      ["Bugs", "bugs", "new_bugs"],
      ["Vulnerabilities", "vulnerabilities", "new_vulnerabilities"],
      ["Code Smells", "code_smells", "new_code_smells"],
      ["Security Hotspots", "security_hotspots", "new_security_hotspots"],
      ["Hotspots Reviewed", "security_hotspots_reviewed", "new_security_hotspots_reviewed"],
      ["Reliability Rating", "reliability_rating", null],
      ["Security Rating", "security_rating", null],
      ["Security Review Rating", "security_review_rating", null],
      ["Maintainability Rating", "sqale_rating", null],
      ["Technical Debt", "sqale_index", null],
      ["Lines of Code", "ncloc", null],
      ["Cyclomatic Complexity", "complexity", null],
      ["Cognitive Complexity", "cognitive_complexity", null],
      ["Tests", "tests", null],
      ["Test Failures", "test_failures", null],
      ["Test Errors", "test_errors", null],
      ["Skipped Tests", "skipped_tests", null],
      ["Test Execution Time", "test_execution_time", null]
    ];
    const used = new Set();
    const rows = [["Category", "Measure", "Overall", "New Code", "Overall Numeric", "New Code Numeric", "Overall at Best Value?", "New Code at Best Value?"]];
    definitions.forEach(([label, overallKey, newKey]) => {
      const overall = byKey[overallKey];
      const newCode = newKey ? byKey[newKey] : null;
      if (!overall && !newCode) return;
      used.add(overallKey); if (newKey) used.add(newKey);
      const overallValue = overall && overall.value !== undefined ? overall.value : overall && overall.period && overall.period.value;
      const newValue = newCode && newCode.period && newCode.period.value !== undefined ? newCode.period.value : newCode && newCode.value;
      rows.push([
        metricCategory(overallKey), label,
        overall ? app.metricValueLabel(overallKey, overallValue) : "Not Available",
        newKey ? newCode ? app.metricValueLabel(newKey, newValue) : "Not Available" : "Not Applicable",
        overall ? numericMetricCell(overallValue) : "",
        newKey && newCode ? numericMetricCell(newValue) : "",
        overall ? overall.bestValue === true ? "Yes" : overall.bestValue === false ? "No" : "Not Provided" : "Not Applicable",
        newKey ? newCode ? newCode.bestValue === true ? "Yes" : newCode.bestValue === false ? "No" : "Not Provided" : "Not Available" : "Not Applicable"
      ]);
    });
    (report.measures || []).filter((measure) => !used.has(measure.metric)).forEach((measure) => rows.push([
      metricCategory(measure.metric), app.metricLabel(measure.metric),
      measure.metric.startsWith("new_") ? "Not Applicable" : app.metricValueLabel(measure.metric, measure.value),
      measure.metric.startsWith("new_") ? app.metricValueLabel(measure.metric, measure.period && measure.period.value !== undefined ? measure.period.value : measure.value) : "Not Applicable",
      measure.metric.startsWith("new_") ? "" : numericMetricCell(measure.value),
      measure.metric.startsWith("new_") ? numericMetricCell(measure.period && measure.period.value !== undefined ? measure.period.value : measure.value) : "",
      measure.metric.startsWith("new_") ? "Not Applicable" : measure.bestValue === true ? "Yes" : measure.bestValue === false ? "No" : "Not Provided",
      measure.metric.startsWith("new_") ? measure.bestValue === true ? "Yes" : measure.bestValue === false ? "No" : "Not Provided" : "Not Applicable"
    ]));
    return rows;
  }

  function typedIssueRows(report) {
    const rows = app.issueRows(report).map((row) => row.slice());
    const header = rows[0] || [];
    const sources = app.flattenReportIssues ? app.flattenReportIssues(report) : report.issues || [];
    const numericHeaders = ["Line", "Effort Minutes", "Age Days"];
    const dateHeaders = [["Created At", "creationDate"], ["Updated At", "updateDate"], ["Closed At", "closeDate"]];
    rows.slice(1).forEach((row, rowIndex) => {
      const source = sources[rowIndex] || {};
      numericHeaders.forEach((name) => {
        const index = header.indexOf(name);
        if (index >= 0) row[index] = numberCell(row[index]);
      });
      dateHeaders.forEach(([name, property]) => {
        const index = header.indexOf(name);
        if (index >= 0) row[index] = dateCell(source[property]);
      });
    });
    return rows;
  }

  function trendRows(report, prefix) {
    const headers = [...(prefix || []), "Metric", "Metric Label", "Observation Date", "Value", "Latest", "Previous", "Absolute Change", "Percentage Change", "Source"];
    const rows = [headers];
    (report.trends || []).forEach((series) => (series.observations || []).forEach((observation) => rows.push([
      ...(prefix || []), series.metric, app.metricLabel(series.metric), dateCell(observation.date), numberCell(observation.value),
      numberCell(series.current && series.current.value), numberCell(series.previous && series.previous.value),
      numberCell(series.absoluteChange), numberCell(series.percentageChange), series.source
    ])));
    return rows;
  }

  function portfolioRows(report) {
    const projects = report.projects || [];
    const summary = report.portfolioSummary || {};
    const executive = [
      ["Portfolio Reporting Summary", "Value"],
      ["Projects Selected", numberCell(summary.projectsSelected)],
      ["Projects Attempted", numberCell(summary.projectsAttempted)],
      ["Projects Analysed", numberCell(summary.projectsAnalysed)],
      ["Projects Complete", numberCell(summary.projectsComplete)],
      ["Projects Partial", numberCell(summary.projectsPartial)],
      ["Projects Failed", numberCell(summary.projectsFailed)],
      ["Projects Permission Denied", numberCell(summary.projectsPermissionDenied)],
      ["Projects Skipped", numberCell(summary.projectsSkipped)],
      ["Collected Issues", numberCell(report.aggregateIssueSummary && report.aggregateIssueSummary.totalCollected)],
      ["Actionable Issues", numberCell(report.aggregateIssueSummary && report.aggregateIssueSummary.actionable)],
      ["Accepted Issues", numberCell(report.aggregateIssueSummary && report.aggregateIssueSummary.accepted)],
      ["Closed Issues", numberCell(report.aggregateIssueSummary && report.aggregateIssueSummary.closed)],
      ["Unknown Lifecycle", numberCell(report.aggregateIssueSummary && report.aggregateIssueSummary.unknown)],
      ["Weighted Coverage", numberCell(report.aggregateMetrics && report.aggregateMetrics.coverage.value)],
      ["Weighted Duplication", numberCell(report.aggregateMetrics && report.aggregateMetrics.duplication.value)],
      ["Technical Debt Minutes", numberCell(report.aggregateMetrics && report.aggregateMetrics.technicalDebtMinutes)],
      ["Technical Debt Projects Represented", numberCell(report.aggregateMetrics && report.aggregateMetrics.technicalDebtProjectsIncluded)],
      ["Report Complete", report.complete ? "Yes" : "No"]
    ];
    const scorecard = [["Project", "Project Key", "Branch / Pull Request", "Collection", "Quality Gate", "Security", "Reliability", "Maintainability", "Coverage", "Duplication", "Technical Debt Minutes", "Security Hotspots", "Actionable Issues", "Analysis Age Days", "Warnings"]];
    const qualityGates = [["Project", "Project Key", "Gate Result", "Condition", "Context", "Condition Status", "Actual", "Comparator", "Threshold"]];
    const measures = [["Project", "Project Key", "Metric", "Metric Label", "Overall Value", "New Code Value", "Best Value"]];
    const issueSummary = [["Project", "Project Key", "Expected", "Collected", "Unique", "Duplicates", "Actionable", "Accepted", "Closed", "Unknown", "Known Effort Minutes", "Unknown Effort Rows"]];
    const rules = [["Project", "Project Key", "Rule Key", "Rule Name", "Language", "Status", "Legacy Type", "Legacy Severity"]];
    const components = [componentHeaders(["Project", "Project Key"])];
    const trends = [["Project", "Project Key", "Metric", "Observation Date", "Value", "Latest", "Previous", "Absolute Change", "Percentage Change", "Source"]];
    const analyses = [["Project", "Project Key", "Analysis Key", "Analysis Date", "Project Version", "Revision", "Events"]];
    const dataQuality = [["Project", "Project Key", "Dataset", "Expected", "Retrieved", "Unique", "Exported", "Duplicates", "Pages", "Limit", "State", "Reason", "Reconciled"]];
    projects.forEach((entry) => {
      const identity = entry.projectIdentity || {};
      const derived = entry.derived;
      const status = derived && derived.statusModel || {};
      const issue = derived && derived.issueSummary || {};
      scorecard.push([identity.name, identity.key, identity.branch, app.humanize(entry.collectionState && entry.collectionState.outcome), gateStatus(status.qualityGate), status.security || "Not Available", status.reliability || "Not Available", status.maintainability || "Not Available", numberCell(status.coverage), numberCell(status.duplication), numberCell(status.technicalDebtMinutes), numberCell(status.securityHotspots), numberCell(issue.actionable), numberCell(status.analysisAgeDays), (entry.warnings || []).length]);
      const failures = derived && derived.qualityGateFailureReasons || [];
      if (failures.length) failures.forEach((failure) => qualityGates.push([identity.name, identity.key, gateStatus(status.qualityGate), app.metricLabel(failure.metric), app.humanize(failure.context), app.humanize(failure.status), numericMetricCell(failure.actual), app.humanize(failure.comparator), numericMetricCell(failure.threshold)]));
      else qualityGates.push([identity.name, identity.key, gateStatus(status.qualityGate), "No failed/warning condition returned", "", "", "", "", ""]);
      (entry.measures || []).forEach((measure) => measures.push([
        identity.name, identity.key, measure.metric, app.metricLabel(measure.metric), numericMetricCell(measure.value),
        numericMetricCell(measure.period && measure.period.value), measure.bestValue === true ? "Yes" : measure.bestValue === false ? "No" : "Not Provided"
      ]));
      issueSummary.push([identity.name, identity.key, numberCell(issue.expected), numberCell(issue.totalCollected), numberCell(issue.unique), numberCell(issue.duplicates), numberCell(issue.actionable), numberCell(issue.accepted), numberCell(issue.closed), numberCell(issue.unknown), numberCell(derived && derived.effort.knownMinutes), numberCell(derived && derived.effort.issuesWithUnknownEffort)]);
      (entry.rules || []).forEach((rule) => rules.push([identity.name, identity.key, rule.key, rule.name, app.languageLabel(rule.lang), app.humanize(rule.status), app.humanize(rule.type), app.humanize(rule.severity)]));
      (entry.components || []).forEach((component) => components.push(componentRow(component, [identity.name, identity.key])));
      (entry.trends || []).forEach((series) => (series.observations || []).forEach((observation) => trends.push([identity.name, identity.key, series.metric, dateCell(observation.date), numberCell(observation.value), numberCell(series.current && series.current.value), numberCell(series.previous && series.previous.value), numberCell(series.absoluteChange), numberCell(series.percentageChange), series.source])));
      (entry.analyses || []).forEach((analysis) => analyses.push([identity.name, identity.key, analysis.key, dateCell(analysis.date), analysis.projectVersion, analysis.revision, (analysis.events || []).map((event) => `${app.humanize(event.category)}: ${event.name || ""}`).join("; ")]));
      (entry.collectionEvidence && entry.collectionEvidence.datasets || []).forEach((dataset) => dataQuality.push([identity.name, identity.key, dataset.dataset, numberCell(dataset.expected), numberCell(dataset.retrieved), numberCell(dataset.unique), numberCell(dataset.exported), numberCell(dataset.duplicates), numberCell(dataset.pages), numberCell(dataset.limit), app.humanize(dataset.state), app.humanize(dataset.reason), dataset.reconciled === null ? "Not Available" : dataset.reconciled ? "Yes" : "No"]));
    });
    if (trends.length === 1) trends.push(["Portfolio", "", "No historical trend observations were collected", "", "", "", "", "", "", "See Data Quality sheet for requested states and reasons"]);
    const warnings = [["Project", "Warning"]];
    projects.forEach((entry) => (entry.warnings || []).forEach((warning) => warnings.push([entry.projectIdentity.name, warning])));
    (report.warnings || []).forEach((warning) => {
      if (!warnings.some((row) => row[1] === warning)) warnings.push(["Portfolio", warning]);
    });
    ((report.artifact && report.artifact.warnings) || []).forEach((warning) => {
      if (!warnings.some((row) => row[1] === warning)) warnings.push(["Artifact", warning]);
    });
    if (warnings.length === 1) warnings.push(["Portfolio", "No collection warnings were recorded."]);
    const serverVersions = [...new Set(projects.map((entry) => entry.collectionEvidence && entry.collectionEvidence.serverVersion).filter(Boolean))];
    const artifact = report.artifact || {};
    const metadata = [
      ["Field", "Value"], ["Report ID", report.reportId], ["Report Mode", "Portfolio"], ["Schema Version", report.schemaVersion],
      ["Model Version", report.modelVersion], ["Renderer Version", report.rendererVersion], ["Plugin Version", report.pluginVersion],
      ["Collection Started", dateCell(report.collectionStartedAt)], ["Collection Completed", dateCell(report.collectionCompletedAt)],
      ["Generated", dateCell(report.generatedAt)], ["Collected At", dateCell(report.collectedAt)],
      ["Collection Complete", artifact.collectionComplete !== undefined ? artifact.collectionComplete ? "Yes" : "No" : report.collectionComplete !== undefined ? report.collectionComplete ? "Yes" : "No" : report.complete ? "Yes" : "No"],
      ["Artifact Complete", artifact.artifactComplete !== undefined ? artifact.artifactComplete ? "Yes" : "No" : report.collectionComplete !== undefined ? report.collectionComplete ? "Yes" : "No" : report.complete ? "Yes" : "No"],
      ["Artifact Format", artifact.format || "xlsx"], ["Artifact Purpose", artifact.purpose || "data"],
      ["Artifact Mode", artifact.mode || "workbook"], ["Applied Issue Scope", artifact.issueScope || "all-collected"],
      ["SonarQube Version(s)", serverVersions.join("; ") || "Not Available"],
      ["Server Base URL", report.serverBaseUrl || "Not Available"], ["Server Base URL Scope", report.serverBaseUrlScope || "Not Available"],
      ["Source Revision", report.sourceRevision || "Not Available"],
      ["Source Digest", report.sourceDigest === null || report.sourceDigest === undefined ? "not_computed" : report.sourceDigest],
      ["Plugin Artifact Digest", report.pluginArtifactDigest === null || report.pluginArtifactDigest === undefined ? "not_computed" : report.pluginArtifactDigest],
      ["Artifact Digest", artifact.artifactDigest || "not_computed"], ["Artifact Digest State", artifact.artifactDigestState || "not_computed"],
      ["Requested Project Keys", (report.requestedScope && report.requestedScope.projectKeys || []).join("; ")],
      ["Actual Project Keys", (report.actualScope && report.actualScope.projectKeys || []).join("; ")],
      ["Requested Scope", JSON.stringify(report.requestedScope || {})], ["Actual Scope", JSON.stringify(report.actualScope || {})],
      ["Artifact Scope", JSON.stringify(artifact.scope || {})], ["Artifact Exported Counts", JSON.stringify(artifact.exportedCounts || {})],
      ["Expected Issues", numberCell(report.aggregateIssueSummary && report.aggregateIssueSummary.expected)],
      ["Exported Issues", numberCell(artifact.exportedCounts && artifact.exportedCounts.issues !== undefined ? artifact.exportedCounts.issues : report.aggregateIssueSummary && report.aggregateIssueSummary.totalCollected)],
      ["Completeness Reasons", [...new Set([...(report.warnings || []), ...(artifact.warnings || [])])].join(" | ") || "No collection warning was recorded."],
      ["Coverage Formula", report.aggregateMetrics && report.aggregateMetrics.coverage.formula],
      ["Duplication Formula", report.aggregateMetrics && report.aggregateMetrics.duplication.formula], ["Source Code Collected", "No"]
    ];
    return [
      { name: "Executive Summary", rows: executive }, { name: "Project Scorecard", rows: scorecard },
      { name: "Quality Gates", rows: qualityGates }, { name: "Measures", rows: measures },
      { name: "Issue Summary", rows: issueSummary }, { name: "Issues", rows: typedIssueRows(report) },
      { name: "Rules", rows: rules }, { name: "Components", rows: components },
      { name: "Trends", rows: trends }, { name: "Analyses", rows: analyses },
      { name: "Data Quality", rows: dataQuality }, { name: "Warnings", rows: warnings }, { name: "Metadata", rows: metadata }
    ];
  }

  function toRows(report) {
    if (report && report.reportMode === "portfolio") return portfolioRows(report);
    const artifact = report.artifact || {};
    const issuesState = app.datasetStateInfo(report, "issues");
    const componentsState = app.datasetStateInfo(report, "components");
    const analysesState = app.datasetStateInfo(report, "analyses");
    const trendsState = app.datasetStateInfo(report, "trends");
    const peopleState = app.datasetStateInfo(report, "people");
    const metadata = [
      ["Field", "Value"],
      ["Report ID", report.reportId || "Not Provided"],
      ["Plugin version", report.pluginVersion || app.PLUGIN_VERSION],
      ["Report schema version", numberCell(report.schemaVersion)],
      ["Model version", numberCell(report.modelVersion || app.MODEL_VERSION)],
      ["Renderer version", numberCell(report.rendererVersion || app.RENDERER_VERSION)],
      ["Generated at (UTC)", dateCell(report.generatedAt)],
      ["Generated at (ISO 8601)", report.generatedAt],
      ["Collection started at (UTC)", dateCell(report.collectionStartedAt)],
      ["Collection completed at (UTC)", dateCell(report.collectionCompletedAt)],
      ["Collected at (UTC)", dateCell(report.collectedAt)],
      ["Collection completeness", artifact.collectionComplete !== undefined ? artifact.collectionComplete ? "Complete for selected scope" : "Incomplete" : report.collectionComplete !== undefined ? report.collectionComplete ? "Complete for selected scope" : "Incomplete" : report.complete ? "Complete for selected scope" : "Incomplete"],
      ["Artifact completeness", artifact.artifactComplete !== undefined ? artifact.artifactComplete ? "Complete for applied artifact scope" : "Incomplete" : report.collectionComplete !== undefined ? report.collectionComplete ? "Complete for applied artifact scope" : "Incomplete" : report.complete ? "Complete for applied artifact scope" : "Incomplete"],
      ["Artifact format", artifact.format || "xlsx"],
      ["Artifact purpose", artifact.purpose || "data"],
      ["Artifact mode", artifact.mode || "workbook"],
      ["Applied issue scope", artifact.issueScope || "all-collected"],
      ["Artifact scope", JSON.stringify(artifact.scope || {})],
      ["Artifact exported counts", JSON.stringify(artifact.exportedCounts || {})],
      ["Completeness reasons", [...new Set([...(report.warnings || []), ...(artifact.warnings || [])])].join(" | ") || "No collection warning was recorded."],
      ["SonarQube version", report.serverVersion],
      ["Server base URL", report.serverBaseUrl || "Not Available"],
      ["Server base URL scope", report.serverBaseUrlScope || "Not Available"],
      ["Source revision", report.sourceRevision || "Not Available"],
      ["Source digest", report.sourceDigest === null || report.sourceDigest === undefined ? "not_computed" : report.sourceDigest],
      ["Plugin artifact digest", report.pluginArtifactDigest === null || report.pluginArtifactDigest === undefined ? "not_computed" : report.pluginArtifactDigest],
      ["Artifact digest", artifact.artifactDigest || "not_computed"],
      ["Artifact digest state", artifact.artifactDigestState || "not_computed"],
      ["Project key", report.project.key],
      ["Project name", report.project.name],
      ["Project version", report.project.version],
      ["Analysis date (UTC)", dateCell(report.project.analysisDate)],
      ["Analysis date (ISO 8601)", report.project.analysisDate],
      ["Branch / pull request", report.branchLabel],
      ["Issues dataset", issuesState.label], ["Issues dataset reason", issuesState.reason || "Not applicable"],
      ["Components dataset", componentsState.label], ["Components dataset reason", componentsState.reason || "Not applicable"],
      ["Analyses dataset", analysesState.label], ["Analyses dataset reason", analysesState.reason || "Not applicable"],
      ["Historical metrics dataset", trendsState.label], ["Historical metrics reason", trendsState.reason || "Not applicable"],
      ["People identifiers", peopleState.requested ? peopleState.label : "Excluded / not requested"],
      ["Expected issue count", numberCell(report.issuePaging && report.issuePaging.expected)],
      ["Raw issue rows fetched", numberCell(report.issuePaging && report.issuePaging.rawFetched !== undefined ? report.issuePaging.rawFetched : (report.issues || []).length)],
      ["Duplicate issue rows removed", numberCell(report.issuePaging && (report.issuePaging.duplicatesRemoved === undefined ? report.issuePaging.duplicates || 0 : report.issuePaging.duplicatesRemoved))],
      ["Exported unique issue count", numberCell(artifact.exportedCounts && artifact.exportedCounts.issues !== undefined ? artifact.exportedCounts.issues : (report.issues || []).length)],
      ["Expected component count", numberCell(report.componentPaging && report.componentPaging.expected)],
      ["Exported component count", numberCell(report.componentPaging && report.componentPaging.exported)],
      ["Expected analysis count", numberCell(report.analysisPaging && report.analysisPaging.expected)],
      ["Exported analysis count", numberCell(report.analysisPaging && report.analysisPaging.exported)],
      ["Expected trend observations", numberCell(report.trendPaging && report.trendPaging.expected)],
      ["Exported trend observations", numberCell(report.trendPaging && report.trendPaging.exported)]
    ];
    const qualityGate = [["Condition", "Result", "Actual", "Actual Numeric", "Requirement", "Threshold Numeric", "SonarQube Status"]];
    ((report.qualityGate && report.qualityGate.conditions) || []).forEach((condition) => qualityGate.push([
      app.metricLabel(condition.metricKey), gateStatus(condition.status), conditionDisplayValue(condition, condition.actualValue), numericMetricCell(condition.actualValue),
      requirementLabel(condition), numericMetricCell(condition.errorThreshold !== undefined ? condition.errorThreshold : condition.warningThreshold), app.humanize(condition.status)
    ]));
    qualityGate.splice(1, 0, ["Overall Quality Gate", gateStatus(report.qualityGate && report.qualityGate.status), "", "", "", "", app.humanize(report.qualityGate && report.qualityGate.status)]);
    const measures = measureRows(report);
    const rules = [["Rule Key", "Rule Name", "Language", "Status", "Issue Type", "Severity"]];
    (report.rules || []).forEach((rule) => rules.push([
      rule.key, rule.name, rule.langName || app.languageLabel(rule.lang), app.humanize(rule.status), app.humanize(rule.type), app.humanize(rule.severity)
    ]));
    const components = [componentHeaders()];
    (report.components || []).forEach((item) => components.push(componentRow(item)));
    const analyses = [["Analysis Key", "Analysis Date", "Project Version", "Revision", "Events"]];
    (report.analyses || []).forEach((analysis) => analyses.push([
      analysis.key, dateCell(analysis.date), analysis.projectVersion, analysis.revision,
      (analysis.events || []).map((event) => `${app.humanize(event.category)}: ${event.name}`).join("; ")
    ]));
    if (!componentsState.available) components.push([componentsState.label, componentsState.reason]);
    if (!analysesState.available) analyses.push([analysesState.label, analysesState.reason]);
    const issueSheetRows = typedIssueRows(report);
    if (!issuesState.available) issueSheetRows.push([issuesState.label, issuesState.reason]);
    const trends = trendRows(report);
    if (!trendsState.available) trends.push([trendsState.label, trendsState.reason]);
    else if (trends.length === 1) trends.push(["No observations", "The historical-metrics dataset completed but returned no observations."]);
    const dataQuality = [["Dataset", "Requested", "State", "Reason", "Expected", "Retrieved", "Unique", "Exported", "Duplicates", "Pages", "Limit", "Reconciled"]];
    const pagingByDataset = { issues: report.issuePaging || {}, components: report.componentPaging || {}, analyses: report.analysisPaging || {}, trends: report.trendPaging || {} };
    app.DATASET_KEYS.forEach((key) => {
      const state = app.datasetStateInfo(report, key);
      const paging = pagingByDataset[key] || {};
      dataQuality.push([
        key === "trends" ? "Historical metrics" : app.humanize(key), state.requested ? "Yes" : "No", state.label, state.reason,
        numberCell(paging.expected), numberCell(paging.rawFetched), numberCell(paging.uniqueFetched), numberCell(paging.exported),
        numberCell(paging.duplicatesRemoved === undefined ? paging.duplicates : paging.duplicatesRemoved), numberCell(paging.pagesFetched),
        numberCell(paging.limit), paging.reconciled === undefined ? "Not Available" : paging.reconciled ? "Yes" : "No"
      ]);
    });
    Object.entries(report.datasetStates || {}).filter(([key]) => !app.DATASET_KEYS.includes(key)).forEach(([key, state]) => dataQuality.push([
      app.humanize(key), state.requested === false ? "No" : "Yes", app.humanize(state.state), app.humanize(state.reason), "", "", "", "", "", "", "", ""
    ]));
    const sheets = [
      { name: "Metadata", rows: metadata },
      { name: "Quality Gate", rows: qualityGate },
      { name: "Measures", rows: measures },
      { name: "Issues", rows: issueSheetRows },
      { name: "Rules", rows: rules },
      { name: "Components", rows: components },
      { name: "Analyses", rows: analyses },
      { name: "Trends", rows: trends },
      { name: "Data Quality", rows: dataQuality }
    ];
    const warnings = [...(report.warnings || [])];
    (artifact.warnings || []).forEach((warning) => { if (!warnings.includes(warning)) warnings.push(warning); });
    sheets.push({ name: "Warnings", rows: [["Warning"], ...(warnings.length ? warnings.map((warning) => [warning]) : [["No export warnings were recorded."]])] });
    return sheets;
  }

  function buildXlsx(report) {
    const truncationWarnings = new Set();
    const sheets = toRows(report);
    sheets.forEach((sheet) => sheet.rows.forEach((row) => row.forEach((cell) => {
      if (!(cell && typeof cell === "object" && (cell.kind === "number" || cell.kind === "date"))) safeCell(cell, truncationWarnings);
    })));
    if (truncationWarnings.size) {
      const warningsSheet = sheets.find((sheet) => sheet.name === "Warnings");
      if (warningsSheet) {
        warningsSheet.rows = warningsSheet.rows.filter((row, index) => index === 0 || !row.some((cell) => /^No .*warnings? (?:were|was) recorded\.$/i.test(app.text(cell))));
        truncationWarnings.forEach((warning) => {
          if (!warningsSheet.rows.some((row) => row.some((cell) => cell === warning))) {
            warningsSheet.rows.push(warningsSheet.rows[0].length > 1 ? ["Workbook", warning] : [warning]);
          }
        });
      }
      const metadataSheet = sheets.find((sheet) => sheet.name === "Metadata");
      if (metadataSheet) {
        const artifactCompleteRow = metadataSheet.rows.find((row) => ["Artifact Complete", "Artifact completeness"].includes(row[0]));
        if (artifactCompleteRow) artifactCompleteRow[1] = "No";
        const reason = "One or more values exceeded Excel's 32,767-character cell limit and were truncated; use CSV or JSON when the full original cell text is required.";
        const reasonRow = metadataSheet.rows.find((row) => ["Artifact Completeness Reason", "Artifact completeness reason"].includes(row[0]));
        if (reasonRow) reasonRow[1] = reason;
        else metadataSheet.rows.push([report.reportMode === "portfolio" ? "Artifact Completeness Reason" : "Artifact completeness reason", reason]);
      }
    }
    const overrides = sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
    const workbookSheets = sheets.map((sheet, index) => `<sheet name="${app.xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("");
    const relationships = sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
    const styleId = sheets.length + 1;
    const files = {
      "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
      "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
      "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${workbookSheets}</sheets></workbook>`,
      "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}<Relationship Id="rId${styleId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm:ss &quot;UTC&quot;"/></numFmts><fonts count="2"><font><sz val="11"/><color rgb="FF172033"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos Display"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF16324F"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3F7FA"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFD8E0EA"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf><xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyAlignment="1"><alignment vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
      "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>SonarQube Offline Report</dc:title><dc:creator>SonarQube Offline Report Plugin</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${app.xmlEscape(report.generatedAt)}</dcterms:created></cp:coreProperties>`,
      "docProps/app.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>SonarQube Offline Report Plugin</Application></Properties>`
    };
    sheets.forEach((sheet, index) => { files[`xl/worksheets/sheet${index + 1}.xml`] = sheetXml(sheet.rows, truncationWarnings); });
    const estimatedBytes = estimatedStoredZipBytes(files);
    assertPackageSize(estimatedBytes);
    let packageBytes;
    try {
      packageBytes = zipStore(files, MAX_XLSX_BYTES);
    } catch (error) {
      if (/configured size limit/.test(error && error.message || "")) {
        throw new Error(`Excel export exceeds the ${Math.round(MAX_XLSX_BYTES / 1024 / 1024)} MiB safety limit. Reduce selected projects or issue/component limits, or use CSV/JSON.`);
      }
      throw error;
    }
    const sourceArtifact = report.artifact || {};
    const sourceComplete = sourceArtifact.artifactComplete !== undefined
      ? !!sourceArtifact.artifactComplete
      : sourceArtifact.collectionComplete !== undefined ? !!sourceArtifact.collectionComplete
        : report.collectionComplete !== undefined ? !!report.collectionComplete : !!report.complete;
    const refinedArtifact = Object.freeze({
      ...sourceArtifact,
      format: sourceArtifact.format || "xlsx",
      artifactComplete: sourceComplete && truncationWarnings.size === 0,
      warnings: Object.freeze([...new Set([...(sourceArtifact.warnings || []), ...truncationWarnings])])
    });
    return {
      blob: new Blob([packageBytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      warnings: [...truncationWarnings],
      estimatedBytes,
      artifact: refinedArtifact,
      artifactComplete: refinedArtifact.artifactComplete
    };
  }

  Object.assign(app, {
    MAX_XLSX_BYTES,
    crc32,
    zipStore,
    xlsxEstimatedStoredZipBytes: estimatedStoredZipBytes,
    xlsxAssertPackageSize: assertPackageSize,
    portfolioWorkbookRows: portfolioRows,
    buildXlsx,
    xlsxSafeCell: safeCell,
    xlsxIssueRows: typedIssueRows,
    xlsxRows: toRows,
    xlsxNumberCell: numberCell,
    xlsxDateCell: dateCell
  });
})(window);
