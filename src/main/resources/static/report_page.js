/* SonarQube Offline Report Plugin 1.2.1 - generated; edit src/main/js and run npm run build. */
window.OfflineReportBuild = Object.freeze({ pluginVersion: "1.2.1" });
(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const TEMPLATE_SCHEMA_VERSION = 2;
  const REPORT_SCHEMA_VERSION = 2;
  const MODEL_VERSION = REPORT_SCHEMA_VERSION;
  const RENDERER_VERSION = 2;
  const PLUGIN_VERSION = global.OfflineReportBuild && global.OfflineReportBuild.pluginVersion
    ? String(global.OfflineReportBuild.pluginVersion)
    : "development";
  const MAX_TEMPLATE_BYTES = 65536;
  const DANGEROUS_CELL = /^[\u0000-\u0020]*[=+\-@]/;
  const LABEL_OVERRIDES = Object.freeze({
    CODE_SMELL: "Code Smell",
    FALSE_POSITIVE: "False Positive",
    WONTFIX: "Won't Fix",
    TO_REVIEW: "To Review",
    IN_REVIEW: "In Review",
    SECURITY_HOTSPOT: "Security Hotspot",
    NOT_PROVIDED: "Not Provided"
  });
  const LANGUAGE_LABELS = Object.freeze({
    cs: "C#", css: "CSS", docker: "Docker", go: "Go", html: "HTML", java: "Java",
    js: "JavaScript", json: "JSON", kotlin: "Kotlin", php: "PHP", py: "Python",
    ruby: "Ruby", scala: "Scala", ts: "TypeScript", web: "Web", xml: "XML"
  });
  const QUALIFIER_LABELS = Object.freeze({
    APP: "Application", BRC: "Subproject", DIR: "Directory", FIL: "File", MOD: "Module",
    PROJECT: "Project", TRK: "Project", UTS: "Test File", VW: "Portfolio"
  });
  const METRIC_LABELS = Object.freeze({
    alert_status: "Quality Gate", bugs: "Bugs", code_smells: "Code Smells",
    cognitive_complexity: "Cognitive Complexity", complexity: "Cyclomatic Complexity",
    coverage: "Coverage", duplicated_lines_density: "Duplicated Lines",
    ncloc: "Lines of Code", new_bugs: "New Bugs", new_code_smells: "New Code Smells",
    new_coverage: "New Code Coverage", new_duplicated_lines_density: "New Code Duplication",
    new_security_hotspots_reviewed: "New Hotspots Reviewed", new_violations: "New Violations",
    new_vulnerabilities: "New Vulnerabilities", reliability_rating: "Reliability Rating",
    security_hotspots: "Security Hotspots", security_rating: "Security Rating",
    security_review_rating: "Security Review Rating", sqale_index: "Technical Debt",
    sqale_rating: "Maintainability Rating", vulnerabilities: "Vulnerabilities"
  });

  const BUILTIN_TEMPLATES = Object.freeze([
    Object.freeze({
      schemaVersion: 2,
      id: "executive",
      name: "Executive summary",
      description: "Quality gate, headline measures, and a concise issue summary.",
      title: "Code Quality Executive Report",
      subtitle: "Current SonarQube project snapshot",
      accentColor: "#1f6feb",
      intro: "A concise, portable overview of the project's current quality position.",
      footer: "Generated from SonarQube. Treat this report as sensitive project information.",
      sections: { summary: true, measures: true, issues: true, components: false, analyses: false },
      issuePageSize: 50
    }),
    Object.freeze({
      schemaVersion: 2,
      id: "technical",
      name: "Detailed technical",
      description: "All available measures, issues, components, and analysis metadata.",
      title: "Detailed Code Quality Report",
      subtitle: "Offline technical review",
      accentColor: "#0f766e",
      intro: "Use the filters and issue links to investigate the current project snapshot.",
      footer: "Generated from SonarQube. Counts can change after a new analysis or issue update.",
      sections: { summary: true, measures: true, issues: true, components: true, analyses: true },
      issuePageSize: 100
    }),
    Object.freeze({
      schemaVersion: 2,
      id: "issues",
      name: "Issues only",
      description: "A focused issue register for remediation work.",
      title: "Issue Remediation Register",
      subtitle: "Searchable offline issue inventory",
      accentColor: "#b45309",
      intro: "Filter by severity, type, and status to focus remediation work.",
      footer: "Generated from SonarQube. Verify current status in SonarQube before acting.",
      sections: { summary: true, measures: false, issues: true, components: false, analyses: false },
      issuePageSize: 100
    })
  ]);

  function text(value) {
    return value === null || value === undefined ? "" : String(value);
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function xmlEscape(value) {
    return text(value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function jsonForHtml(value) {
    return JSON.stringify(value)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");
  }

  function safeFileName(value, extension) {
    const base = text(value)
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^[.-]+|[.-]+$/g, "")
      .slice(0, 90) || "sonarqube-report";
    return `${base}.${extension}`;
  }

  function formulaSafe(value) {
    const stringValue = text(value);
    return DANGEROUS_CELL.test(stringValue) ? `'${stringValue}` : stringValue;
  }

  function csvCell(value) {
    const safe = formulaSafe(value).replace(/\r\n|\r|\n/g, "\r\n");
    return `"${safe.replace(/"/g, '""')}"`;
  }

  function toCsv(rows) {
    return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
  }

  function sanitizeSingleLine(value, maxLength) {
    return text(value).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength);
  }

  function sanitizeMultiline(value, maxLength) {
    return text(value).replace(/\u0000/g, "").trim().slice(0, maxLength);
  }

  function normalizeTemplate(candidate, fallback) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const base = fallback || BUILTIN_TEMPLATES[1];
    if (source.schemaVersion !== undefined && ![1, TEMPLATE_SCHEMA_VERSION].includes(Number(source.schemaVersion))) {
      throw new Error(`Unsupported template schema version: ${source.schemaVersion}`);
    }
    const color = /^#[0-9a-fA-F]{6}$/.test(text(source.accentColor)) ? source.accentColor : base.accentColor;
    const sections = source.sections && typeof source.sections === "object" ? source.sections : {};
    return {
      schemaVersion: TEMPLATE_SCHEMA_VERSION,
      id: sanitizeSingleLine(source.id || "custom", 50) || "custom",
      name: sanitizeSingleLine(source.name || base.name, 80) || base.name,
      description: sanitizeSingleLine(source.description || base.description, 240),
      title: sanitizeSingleLine(source.title || base.title, 160) || base.title,
      subtitle: sanitizeSingleLine(source.subtitle || base.subtitle, 240),
      accentColor: color,
      intro: sanitizeMultiline(source.intro !== undefined ? source.intro : base.intro, 2000),
      footer: sanitizeMultiline(source.footer !== undefined ? source.footer : base.footer, 1000),
      sections: {
        summary: sections.summary !== false,
        measures: sections.measures !== undefined ? !!sections.measures : base.sections.measures,
        issues: sections.issues !== undefined ? !!sections.issues : base.sections.issues,
        components: sections.components !== undefined ? !!sections.components : base.sections.components,
        analyses: sections.analyses !== undefined ? !!sections.analyses : base.sections.analyses
      },
      issuePageSize: [50, 100, 250].includes(Number(source.issuePageSize)) ? Number(source.issuePageSize) : base.issuePageSize
    };
  }

  function parseTemplateJson(source) {
    if (new TextEncoder().encode(source).length > MAX_TEMPLATE_BYTES) {
      throw new Error("Template exceeds the 64 KiB size limit.");
    }
    let parsed;
    try {
      parsed = JSON.parse(source);
    } catch (error) {
      throw new Error(`Template is not valid JSON: ${error.message}`);
    }
    if (Array.isArray(parsed) || !parsed || typeof parsed !== "object") {
      throw new Error("Template must be a JSON object.");
    }
    return normalizeTemplate(parsed);
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    link.style.display = "none";
    link.setAttribute("aria-hidden", "true");
    document.body.appendChild(link);
    link.click();
    // Removing the anchor or revoking its Blob URL immediately can cancel the
    // transfer in Firefox and in browser-managed application shells.
    setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 30000);
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? text(value) : date.toLocaleString();
  }

  function randomReportId() {
    const bytes = new Uint8Array(16);
    if (global.crypto && typeof global.crypto.getRandomValues === "function") {
      global.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0F) | 0x40;
    bytes[8] = (bytes[8] & 0x3F) | 0x80;
    const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function issueLifecycleStatus(value, resolution) {
    const key = text(value).trim().toUpperCase().replace(/-/g, "_");
    const resolutionKey = text(resolution).trim().toUpperCase().replace(/-/g, "_");
    if (["OPEN", "CONFIRMED", "REOPENED", "TO_REVIEW", "IN_REVIEW"].includes(key)) return "actionable";
    if (key === "ACCEPTED") return "accepted";
    if (["FIXED", "FALSE_POSITIVE", "WONTFIX", "CLOSED", "RESOLVED", "REMOVED"].includes(key)
      || ["FIXED", "FALSE_POSITIVE", "WONTFIX", "REMOVED"].includes(resolutionKey)) return "closed";
    return "unknown";
  }

  function reportManifest(report) {
    const scope = report.collectionScope || {};
    return {
      manifestVersion: 1,
      reportSchemaVersion: report.schemaVersion,
      modelVersion: report.modelVersion || MODEL_VERSION,
      rendererVersion: report.rendererVersion || RENDERER_VERSION,
      pluginVersion: report.pluginVersion || PLUGIN_VERSION,
      reportId: report.reportId,
      product: "SonarQube Offline Report Plugin",
      disclaimer: "Custom plugin output; not an official SonarQube product report.",
      generatedAt: report.generatedAt,
      collectionStartedAt: report.collectionStartedAt,
      collectionCompletedAt: report.collectionCompletedAt,
      serverVersion: report.serverVersion,
      project: {
        key: report.project && report.project.key,
        name: report.project && report.project.name,
        branch: report.branchLabel,
        analysisDate: report.project && report.project.analysisDate,
        analysisDateAfterCollection: report.analysisDateAfterCollection
      },
      scope: {
        issues: !!scope.issues,
        components: !!scope.components,
        analyses: !!scope.analyses,
        people: !!scope.people,
        issueScope: scope.issueScope || "all-collected"
      },
      complete: !!report.complete,
      datasetStates: report.datasetStates || {},
      counts: {
        issues: report.issuePaging || {},
        components: report.componentPaging || {},
        analyses: report.analysisPaging || {}
      },
      warnings: report.warnings || []
    };
  }

  function humanize(value) {
    const original = text(value).trim();
    if (!original) return "";
    const key = original.toUpperCase().replace(/-/g, "_");
    if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
    return original
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  function languageLabel(value) {
    const key = text(value).trim().toLowerCase();
    return LANGUAGE_LABELS[key] || humanize(value) || "Not Provided";
  }

  function qualifierLabel(value) {
    const key = text(value).trim().toUpperCase();
    return QUALIFIER_LABELS[key] || humanize(value) || "Not Provided";
  }

  function metricLabel(value) {
    const key = text(value).trim();
    return METRIC_LABELS[key] || humanize(key) || "Measure";
  }

  function impactLabel(value) {
    return text(value).split(":").filter(Boolean).map(humanize).join(" – ");
  }

  function impactsLabel(values) {
    return (values || []).map(impactLabel).filter(Boolean).join("; ");
  }

  function formatEffort(value) {
    const original = text(value).trim();
    const match = original.match(/^([0-9.]+)(min|h|d)$/i);
    if (!match) return original;
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase() === "min" ? "min" : match[2].toLowerCase() === "h" ? "hr" : "day";
    return `${match[1]} ${unit}${amount === 1 || unit === "min" ? "" : "s"}`;
  }

  function formatTextRange(range) {
    if (!range || typeof range !== "object") return "Not Provided";
    const startLine = range.startLine;
    const endLine = range.endLine === undefined ? startLine : range.endLine;
    const lineText = startLine === undefined ? "Line Not Provided" : startLine === endLine ? `Line ${startLine}` : `Lines ${startLine}–${endLine}`;
    const offsets = range.startOffset === undefined && range.endOffset === undefined
      ? ""
      : `, columns ${range.startOffset === undefined ? "?" : range.startOffset}–${range.endOffset === undefined ? "?" : range.endOffset}`;
    return lineText + offsets;
  }

  function formatExportDate(value) {
    if (!value) return "Not Provided";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return text(value);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")} ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}:${String(date.getUTCSeconds()).padStart(2, "0")} UTC`;
  }

  function durationLabel(minutes) {
    const numeric = Number(minutes);
    if (!Number.isFinite(numeric)) return text(minutes);
    const rounded = Math.max(0, Math.round(numeric));
    const days = Math.floor(rounded / 480);
    const hours = Math.floor((rounded % 480) / 60);
    const mins = rounded % 60;
    return [days ? `${days}d` : "", hours ? `${hours}h` : "", mins || (!days && !hours) ? `${mins}m` : ""].filter(Boolean).join(" ");
  }

  function metricValueLabel(metric, value) {
    if (value === null || value === undefined || value === "") return "Not Available";
    const key = text(metric);
    const numeric = Number(value);
    if (key.includes("rating") && Number.isFinite(numeric) && numeric >= 1 && numeric <= 5) return String.fromCharCode(64 + Math.round(numeric));
    if (key.includes("coverage") || key.includes("density") || key.includes("reviewed")) return Number.isFinite(numeric) ? `${numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })}%` : `${value}%`;
    if (key === "sqale_index") return durationLabel(value);
    if (key === "ncloc") return Number.isFinite(numeric) ? `${numeric.toLocaleString()} LOC` : `${value} LOC`;
    if (key === "alert_status") return text(value).toUpperCase() === "OK" ? "Passed" : text(value).toUpperCase() === "ERROR" ? "Failed" : humanize(value);
    return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 2 }) : humanize(value);
  }

  function issueRows(report) {
    const ruleNames = Object.fromEntries((report.rules || []).filter((rule) => rule && rule.key).map((rule) => [rule.key, rule.name || ""]));
    const header = [
      "Issue Key", "Rule Key", "Rule Name", "Issue Type", "Severity", "Software Quality Impacts", "Status", "Resolution", "Message",
      "File or Component", "Project", "Line", "Remediation Effort", "Assignee", "Author", "Tags",
      "Clean Code Attribute", "Text Range", "Created At", "Updated At", "Closed At"
    ];
    const rows = (report.issues || []).map((issue) => [
      issue.key, issue.rule, ruleNames[issue.rule] || "Metadata Unavailable", humanize(issue.type), humanize(issue.severity),
      impactsLabel(issue.impacts), humanize(issue.status), humanize(issue.resolution) || "Not Provided",
      issue.message, issue.component, issue.project, issue.line, formatEffort(issue.effort),
      issue.assignee, issue.author, (issue.tags || []).map(humanize).join("; "), humanize(issue.cleanCodeAttribute) || "Not Provided",
      formatTextRange(issue.textRange), formatExportDate(issue.creationDate),
      formatExportDate(issue.updateDate), formatExportDate(issue.closeDate)
    ]);
    return [header, ...rows];
  }

  Object.assign(app, {
    TEMPLATE_SCHEMA_VERSION,
    REPORT_SCHEMA_VERSION,
    MODEL_VERSION,
    RENDERER_VERSION,
    PLUGIN_VERSION,
    MAX_TEMPLATE_BYTES,
    BUILTIN_TEMPLATES,
    text,
    escapeHtml,
    xmlEscape,
    jsonForHtml,
    safeFileName,
    formulaSafe,
    csvCell,
    toCsv,
    normalizeTemplate,
    parseTemplateJson,
    downloadBlob,
    formatDate,
    randomReportId,
    issueLifecycleStatus,
    reportManifest,
    humanize,
    languageLabel,
    qualifierLabel,
    metricLabel,
    impactLabel,
    impactsLabel,
    formatEffort,
    formatTextRange,
    formatExportDate,
    durationLabel,
    metricValueLabel,
    issueRows
  });
})(window);


(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const MAX_CELL_LENGTH = 32767;
  const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

  function numberCell(value) {
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

  /** Creates a standards-compliant ZIP using STORE entries, avoiding a runtime dependency. */
  function zipStore(files) {
    const encoder = new TextEncoder();
    const now = dosTimestamp(new Date());
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;

    Object.entries(files).forEach(([name, content]) => {
      const nameBytes = encoder.encode(name);
      const data = typeof content === "string" ? encoder.encode(content) : content;
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
    });

    const centralDirectory = concatArrays(centralParts);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    set32(ev, 0, 0x06054B50); set16(ev, 4, 0); set16(ev, 6, 0);
    set16(ev, 8, centralParts.length); set16(ev, 10, centralParts.length);
    set32(ev, 12, centralDirectory.length); set32(ev, 16, localOffset); set16(ev, 20, 0);
    return concatArrays([...localParts, centralDirectory, end]);
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
      result = result.slice(0, MAX_CELL_LENGTH - 1) + "…";
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
      ["Cognitive Complexity", "cognitive_complexity", null]
    ];
    const used = new Set();
    const rows = [["Category", "Measure", "Overall", "New Code", "Overall at Best Value?", "New Code at Best Value?"]];
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
        overall ? overall.bestValue === true ? "Yes" : overall.bestValue === false ? "No" : "Not Provided" : "Not Applicable",
        newKey ? newCode ? newCode.bestValue === true ? "Yes" : newCode.bestValue === false ? "No" : "Not Provided" : "Not Available" : "Not Applicable"
      ]);
    });
    (report.measures || []).filter((measure) => !used.has(measure.metric)).forEach((measure) => rows.push([
      metricCategory(measure.metric), app.metricLabel(measure.metric),
      measure.metric.startsWith("new_") ? "Not Applicable" : app.metricValueLabel(measure.metric, measure.value),
      measure.metric.startsWith("new_") ? app.metricValueLabel(measure.metric, measure.period && measure.period.value !== undefined ? measure.period.value : measure.value) : "Not Applicable",
      measure.metric.startsWith("new_") ? "Not Applicable" : measure.bestValue === true ? "Yes" : measure.bestValue === false ? "No" : "Not Provided",
      measure.metric.startsWith("new_") ? measure.bestValue === true ? "Yes" : measure.bestValue === false ? "No" : "Not Provided" : "Not Applicable"
    ]));
    return rows;
  }

  function toRows(report) {
    const metadata = [
      ["Field", "Value"],
      ["Report ID", report.reportId || "Not Provided"],
      ["Plugin version", report.pluginVersion || app.PLUGIN_VERSION],
      ["Report schema version", numberCell(report.schemaVersion)],
      ["Renderer version", numberCell(report.rendererVersion || app.RENDERER_VERSION)],
      ["Generated at (UTC)", dateCell(report.generatedAt)],
      ["Generated at (ISO 8601)", report.generatedAt],
      ["Collection started at (UTC)", dateCell(report.collectionStartedAt)],
      ["Collection completed at (UTC)", dateCell(report.collectionCompletedAt)],
      ["Completeness", report.complete ? "Complete for selected scope" : "Incomplete"],
      ["SonarQube version", report.serverVersion],
      ["Project key", report.project.key],
      ["Project name", report.project.name],
      ["Project version", report.project.version],
      ["Analysis date (UTC)", dateCell(report.project.analysisDate)],
      ["Analysis date (ISO 8601)", report.project.analysisDate],
      ["Branch / pull request", report.branchLabel],
      ["Issues dataset", report.collectionScope && report.collectionScope.issues ? "Collected" : "Not collected"],
      ["Components dataset", report.collectionScope && report.collectionScope.components ? "Collected" : "Not collected"],
      ["Analyses dataset", report.collectionScope && report.collectionScope.analyses ? "Collected" : "Not collected"],
      ["People identifiers", report.collectionScope && report.collectionScope.people ? "Included" : "Excluded by selection"],
      ["Expected issue count", numberCell(report.issuePaging.expected)],
      ["Raw issue rows fetched", numberCell(report.issuePaging.rawFetched === undefined ? report.issues.length : report.issuePaging.rawFetched)],
      ["Duplicate issue rows removed", numberCell(report.issuePaging.duplicates || 0)],
      ["Exported unique issue count", numberCell(report.issues.length)]
    ];
    const qualityGate = [["Condition", "Result", "Actual", "Requirement", "SonarQube Status"]];
    (report.qualityGate.conditions || []).forEach((condition) => qualityGate.push([
      app.metricLabel(condition.metricKey), gateStatus(condition.status), conditionDisplayValue(condition, condition.actualValue),
      requirementLabel(condition), app.humanize(condition.status)
    ]));
    qualityGate.splice(1, 0, ["Overall Quality Gate", gateStatus(report.qualityGate.status), "", "", app.humanize(report.qualityGate.status)]);
    const measures = measureRows(report);
    const rules = [["Rule Key", "Rule Name", "Language", "Status", "Issue Type", "Severity"]];
    (report.rules || []).forEach((rule) => rules.push([
      rule.key, rule.name, rule.langName || app.languageLabel(rule.lang), app.humanize(rule.status), app.humanize(rule.type), app.humanize(rule.severity)
    ]));
    const components = [["Component Key", "Name", "Path", "Component Type", "Language"]];
    (report.components || []).forEach((item) => components.push([item.key, item.name, item.path, app.qualifierLabel(item.qualifier), app.languageLabel(item.language)]));
    const analyses = [["Analysis Key", "Analysis Date", "Project Version", "Revision", "Events"]];
    (report.analyses || []).forEach((analysis) => analyses.push([
      analysis.key, dateCell(analysis.date), analysis.projectVersion, analysis.revision,
      (analysis.events || []).map((event) => `${app.humanize(event.category)}: ${event.name}`).join("; ")
    ]));
    if (report.collectionScope && !report.collectionScope.components) components.push(["Not collected"]);
    if (report.collectionScope && !report.collectionScope.analyses) analyses.push(["Not collected"]);
    const issueSheetRows = app.issueRows(report);
    issueSheetRows.slice(1).forEach((row, rowIndex) => {
      const source = report.issues[rowIndex];
      if (!source) return;
      if (row[11] !== undefined && row[11] !== "") row[11] = numberCell(row[11]);
      if (source.creationDate) row[18] = dateCell(source.creationDate);
      if (source.updateDate) row[19] = dateCell(source.updateDate);
      if (source.closeDate) row[20] = dateCell(source.closeDate);
    });
    if (report.collectionScope && !report.collectionScope.issues) issueSheetRows.push(["Not collected"]);
    const sheets = [
      { name: "Metadata", rows: metadata },
      { name: "Quality Gate", rows: qualityGate },
      { name: "Measures", rows: measures },
      { name: "Issues", rows: issueSheetRows },
      { name: "Rules", rows: rules },
      { name: "Components", rows: components },
      { name: "Analyses", rows: analyses }
    ];
    const warnings = [...(report.warnings || [])];
    if (sheets.some((sheet) => sheet.rows.some((row) => row.some((cell) => app.formulaSafe(displayCell(cell)).length > MAX_CELL_LENGTH)))) {
      warnings.push("One or more spreadsheet cells were truncated to Excel's 32,767 character limit.");
    }
    sheets.push({ name: "Warnings", rows: [["Warning"], ...(warnings.length ? warnings.map((warning) => [warning]) : [["No export warnings were recorded."]])] });
    return sheets;
  }

  function buildXlsx(report) {
    const truncationWarnings = new Set();
    const sheets = toRows(report);
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
    return {
      blob: new Blob([zipStore(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      warnings: [...truncationWarnings]
    };
  }

  Object.assign(app, { crc32, zipStore, buildXlsx, xlsxRows: toRows, xlsxNumberCell: numberCell, xlsxDateCell: dateCell });
})(window);


(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const MAX_DOCX_ISSUES = 2000;
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
    return app.issueLifecycleStatus(issue.status) === "actionable";
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

  function issueRows(report, issueScope) {
    const rules = Object.fromEntries((report.rules || []).filter((rule) => rule && rule.key).map((rule) => [rule.key, rule.name || rule.key]));
    const issues = (report.issues || []).filter((issue) => issueScope === "all" || activeIssue(issue));
    return {
      issues,
      rows: issues.map((issue) => [
        risk(issue),
        `${issue.message || "No message"}\n${rules[issue.rule] || issue.rule || "Rule unavailable"}`,
        `${issue.component || "Component unavailable"}${issue.line ? `:${issue.line}` : ""}`,
        `${app.humanize(issue.status) || "Unknown"}\n${app.formatEffort(issue.effort) || "Effort unavailable"}`
      ])
    };
  }

  function documentBody(report, template, options) {
    const settings = options || {};
    const issueScope = settings.issueScope === "all" ? "all" : "active";
    const scope = report.collectionScope || {};
    const issueRegister = issueRows(report, issueScope);
    if (settings.includeIssueRegister !== false && issueRegister.issues.length > MAX_DOCX_ISSUES) {
      throw new Error(`The Word issue register is limited to ${MAX_DOCX_ISSUES.toLocaleString()} rows; this scope contains ${issueRegister.issues.length.toLocaleString()}. Choose actionable issues, reduce the collected scope, or use Excel.`);
    }
    const actionable = (report.issues || []).filter(activeIssue).length;
    const closed = (report.issues || []).length - actionable;
    const conditions = (report.qualityGate && report.qualityGate.conditions) || [];
    const failedConditions = conditions.filter((condition) => String(condition.status).toUpperCase() === "ERROR").length;
    const parts = [
      paragraph(template.title, "Title", { keepNext: true }),
      paragraph(template.subtitle, "Subtitle"),
      paragraph(report.project && (report.project.name || report.project.key), "Heading2", { keepNext: true }),
      paragraph(`${report.branchLabel || "Main branch"}  |  Analyzed ${app.formatExportDate(report.project && report.project.analysisDate)}  |  Exported ${app.formatExportDate(report.generatedAt)}`),
      paragraph(report.complete ? "Complete for selected scope" : "INCOMPLETE REPORT", null, { bold: true, color: report.complete ? "18794E" : "B42318" }),
      paragraph(template.intro),
      paragraph("Executive summary", "Heading1", { keepNext: true }),
      table(["Quality Gate", "Open/actionable issues", "Historical issues", "Collection"], [[
        friendlyStatus(report.qualityGate && report.qualityGate.status),
        scope.issues ? actionable : "Not collected",
        scope.issues ? closed : "Not collected",
        report.complete ? "Complete" : "Incomplete"
      ]], [2250, 2250, 2250, 2250])
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
        ["Cognitive complexity", "cognitive_complexity", null]
      ];
      const rows = definitions.filter((definition) => rawMeasure(report, definition[1]) !== null || definition[2] && rawMeasure(report, definition[2]) !== null).map((definition) => [
        definition[0],
        app.metricValueLabel(definition[1], rawMeasure(report, definition[1])),
        definition[2] ? app.metricValueLabel(definition[2], rawMeasure(report, definition[2])) : "Not applicable"
      ]);
      parts.push(paragraph("Quality measures", "Heading1", { keepNext: true }));
      parts.push(table(["Measure", "Overall", "New code"], rows, [4000, 2500, 2500]));
    }

    if (template.sections.issues && settings.includeIssueRegister !== false) {
      parts.push(paragraph("Issue register", "Heading1", { keepNext: true }));
      parts.push(paragraph(`${issueRegister.issues.length} ${issueScope === "all" ? "collected" : "open/actionable"} issues. For large remediation datasets, use the Excel export for filtering and analysis.`));
      if (scope.issues === false) parts.push(paragraph("Issues were not collected for this export.", null, { bold: true }));
      else if (!issueRegister.rows.length) parts.push(paragraph("No issues match this document scope."));
      else parts.push(table(["Risk", "Issue and rule", "File and line", "Status and effort"], issueRegister.rows, [1200, 3300, 3000, 1500]));
    }

    if (template.sections.components) {
      parts.push(paragraph("File inventory", "Heading1", { keepNext: true }));
      if (scope.components === false) parts.push(paragraph("Files were not collected for this export."));
      else parts.push(table(["Name", "Path", "Language", "Type"], (report.components || []).map((component) => [
        component.name, component.path, app.languageLabel(component.language), app.qualifierLabel(component.qualifier)
      ]), [2200, 4100, 1400, 1300]));
    }

    if (template.sections.analyses) {
      parts.push(paragraph("Analysis history", "Heading1", { keepNext: true }));
      if (scope.analyses === false) parts.push(paragraph("Analysis history was not collected for this export."));
      else parts.push(table(["Date", "Version", "Revision", "Events"], (report.analyses || []).map((analysis) => [
        app.formatExportDate(analysis.date), analysis.projectVersion, analysis.revision,
        (analysis.events || []).map((event) => `${app.humanize(event.category)}: ${event.name}`).join("; ")
      ]), [2200, 1700, 2400, 2700]));
    }

    parts.push(paragraph("Data provenance", "Heading1", { keepNext: true }));
    parts.push(table(["Dataset", "State", "Exported", "Expected", "Limit"], [
      ["Issues", scope.issues ? "Collected" : "Not requested", report.issuePaging && report.issuePaging.exported, report.issuePaging && report.issuePaging.expected, report.issuePaging && report.issuePaging.limit],
      ["Files", scope.components ? "Collected" : "Not requested", report.componentPaging && report.componentPaging.exported, report.componentPaging && report.componentPaging.expected, report.componentPaging && report.componentPaging.limit],
      ["Analyses", scope.analyses ? "Collected" : "Not requested", report.analysisPaging && report.analysisPaging.exported, report.analysisPaging && report.analysisPaging.expected, report.analysisPaging && report.analysisPaging.limit],
      ["People", scope.people ? "Included" : "Excluded", scope.people ? "Included fields" : 0, "Not applicable", "Not applicable"]
    ], [1900, 1800, 1700, 1700, 1900]));
    if ((report.warnings || []).length) {
      parts.push(paragraph("Export warnings", "Heading2", { keepNext: true }));
      report.warnings.forEach((warning) => parts.push(paragraph(`• ${warning}`)));
    }
    parts.push(paragraph("Snapshot semantics", "Heading2", { keepNext: true }));
    parts.push(paragraph("This is a non-transactional current snapshot. Data can change after export. Source code was not collected."));
    parts.push(paragraph(template.footer));
    return { xml: parts.join(""), issueCount: issueRegister.issues.length, issueScope };
  }

  function buildDocx(report, inputTemplate, options) {
    if (!app.zipStore) throw new Error("The OOXML package writer is unavailable.");
    const template = app.normalizeTemplate(inputTemplate);
    const content = documentBody(report, template, options);
    const generated = new Date(report.generatedAt || Date.now());
    const created = Number.isNaN(generated.getTime()) ? new Date().toISOString() : generated.toISOString();
    const title = app.xmlEscape(template.title);
    const project = app.xmlEscape(report.project && (report.project.name || report.project.key) || "SonarQube project");
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
    const packageBytes = app.zipStore(files);
    if (packageBytes.byteLength > MAX_DOCX_BYTES) {
      throw new Error(`The Word package exceeds the ${Math.round(MAX_DOCX_BYTES / 1024 / 1024)} MiB safety limit. Reduce the issue scope or use Excel.`);
    }
    return {
      blob: new Blob([packageBytes], { type: WORD_MIME }),
      issueCount: content.issueCount,
      issueScope: content.issueScope,
      warnings: report.warnings || []
    };
  }

  Object.assign(app, { WORD_MIME, MAX_DOCX_ISSUES, MAX_DOCX_BYTES, buildDocx, docxDocumentBody: documentBody });
})(window);


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


(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};

  const REPORT_RUNTIME = `(function(){
"use strict";
var report=null,template=null,exportOptions={};
var state={query:"",severity:"",status:"active",type:"",sort:"risk",page:1};
var severityRank={BLOCKER:0,CRITICAL:1,HIGH:1,MAJOR:2,MEDIUM:2,MINOR:3,LOW:3,INFO:4};
var metricLabels={alert_status:"Quality Gate",ncloc:"Lines of Code",coverage:"Coverage",new_coverage:"New Code Coverage",duplicated_lines_density:"Duplication",new_duplicated_lines_density:"New Code Duplication",complexity:"Cyclomatic Complexity",cognitive_complexity:"Cognitive Complexity",bugs:"Bugs",new_bugs:"New Bugs",vulnerabilities:"Vulnerabilities",new_vulnerabilities:"New Vulnerabilities",code_smells:"Code Smells",new_code_smells:"New Code Smells",reliability_rating:"Reliability Rating",security_rating:"Security Rating",sqale_rating:"Maintainability Rating",sqale_index:"Technical Debt",security_hotspots:"Security Hotspots",new_security_hotspots:"New Security Hotspots",security_hotspots_reviewed:"Hotspots Reviewed",security_review_rating:"Security Review Rating",new_security_hotspots_reviewed:"New Hotspots Reviewed",new_violations:"New Violations"};
function array(v){return Array.isArray(v)?v:[];}
function el(tag,className,text){var node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text===null?"":String(text);return node;}
function value(v){return v===null||v===undefined||v===""?"\u2014":String(v);}
function number(v){var n=Number(v);return Number.isFinite(n)?n:null;}
function formatNumber(v,digits){var n=number(v);return n===null?value(v):n.toLocaleString(undefined,{maximumFractionDigits:digits===undefined?2:digits});}
function formatDate(v){if(!v)return"Not provided";var d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString();}
function humanize(v){var original=String(v||"").trim(),overrides={CODE_SMELL:"Code Smell",FALSE_POSITIVE:"False Positive",WONTFIX:"Won't Fix",TO_REVIEW:"To Review",IN_REVIEW:"In Review",SECURITY_HOTSPOT:"Security Hotspot"},key=original.toUpperCase().replace(/-/g,"_");if(!original)return"Not provided";if(overrides[key])return overrides[key];return original.replace(/[_-]+/g," ").replace(/\s+/g," ").toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();});}
function languageLabel(v){var labels={cs:"C#",css:"CSS",docker:"Docker",go:"Go",html:"HTML",java:"Java",js:"JavaScript",json:"JSON",kotlin:"Kotlin",php:"PHP",py:"Python",ruby:"Ruby",scala:"Scala",ts:"TypeScript",web:"Web",xml:"XML"};return labels[String(v||"").toLowerCase()]||humanize(v);}
function qualifierLabel(v){var labels={APP:"Application",BRC:"Subproject",DIR:"Directory",FIL:"File",MOD:"Module",PROJECT:"Project",TRK:"Project",UTS:"Test File",VW:"Portfolio"};return labels[String(v||"").toUpperCase()]||humanize(v);}
function impactLabel(v){return String(v||"").split(":").filter(Boolean).map(humanize).join(" \u2013 ");}
function formatEffort(v){var original=String(v||"").trim(),match=original.match(/^([0-9.]+)(min|h|d)$/i);if(!match)return value(v);var amount=Number(match[1]),unit=match[2].toLowerCase()==="min"?"min":match[2].toLowerCase()==="h"?"hr":"day";return match[1]+" "+unit+(amount===1||unit==="min"?"":"s");}
function formatTextRange(range){if(!range||typeof range!=="object")return"Not provided";var start=range.startLine,end=range.endLine===undefined?start:range.endLine,line=start===undefined?"Line not provided":start===end?"Line "+start:"Lines "+start+"\u2013"+end,offsets=range.startOffset===undefined&&range.endOffset===undefined?"":", columns "+(range.startOffset===undefined?"?":range.startOffset)+"\u2013"+(range.endOffset===undefined?"?":range.endOffset);return line+offsets;}
function duration(minutes){var n=Math.max(0,Math.round(number(minutes)||0)),hours=Math.floor(n/60),mins=n%60,parts=[];if(hours)parts.push(hours+"h");if(mins||!parts.length)parts.push(mins+"m");return parts.join(" ");}
function analysisAge(){var analysis=new Date(report.project&&report.project.analysisDate).getTime(),generated=new Date(report.generatedAt).getTime();if(!Number.isFinite(analysis)||!Number.isFinite(generated))return null;var diff=Math.max(0,generated-analysis),days=Math.floor(diff/86400000),hours=Math.floor((diff%86400000)/3600000);return{days:days,text:days+" day"+(days===1?"":"s")+" "+hours+" hour"+(hours===1?"":"s")};}
function collected(name){return !report.collectionScope||report.collectionScope[name]===true;}
function lifecycle(issue){if(issue&&issue.lifecycleStatus)return String(issue.lifecycleStatus);var key=String(issue&&issue.status||"").toUpperCase();if(["OPEN","CONFIRMED","REOPENED","TO_REVIEW","IN_REVIEW"].includes(key))return"actionable";if(key==="ACCEPTED")return"accepted";if(["FIXED","FALSE_POSITIVE","WONTFIX","CLOSED","RESOLVED","REMOVED"].includes(key))return"closed";return"unknown";}
function active(issue){return lifecycle(issue)==="actionable";}
function rank(v){var key=String(v||"").toUpperCase();return severityRank[key]===undefined?9:severityRank[key];}
function impact(issue){var impacts=array(issue.impacts).map(function(item){return String(item).split(":").pop();});return impacts.sort(function(a,b){return rank(a)-rank(b);})[0]||issue.severity||"Unknown";}
function ruleMetadata(key){return array(report.rules).find(function(rule){return rule&&rule.key===key;});}
function ruleLabel(key){var rule=ruleMetadata(key);return rule&&rule.name?rule.name+" ("+key+")":value(key)+" (metadata unavailable)";}
function friendlyStatus(status){var key=String(status||"UNKNOWN").toUpperCase();return key==="ERROR"?"Failed":key==="OK"?"Passed":humanize(key);}
function tone(status){var key=String(status||"").toUpperCase();if(["ERROR","FAILED","BLOCKER","CRITICAL","HIGH"].includes(key))return"danger";if(["WARN","WARNING","MEDIUM","MAJOR"].includes(key))return"warning";if(["OK","PASSED","LOW","MINOR"].includes(key))return"success";return"neutral";}
function badge(textValue,toneValue){return el("span","badge badge-"+(toneValue||"neutral"),textValue);}
function section(id,title,lead){var node=el("section","report-section");node.id=id;node.appendChild(el("h2","section-title",title));if(lead)node.appendChild(el("p","section-lead",lead));if(id==="issues"&&collected("issues")&&array(report.issues).length)node.appendChild(barList("Top rules affecting open issues",countBy(array(report.issues).filter(active),function(issue){return ruleLabel(issue.rule);}),10));document.getElementById("report-content").appendChild(node);return node;}
function emptyState(title,text){var box=el("div","empty-state");box.appendChild(el("strong","",title));box.appendChild(el("p","",text));return box;}
function table(headers,rows,caption){var wrap=el("div","table-wrap");wrap.tabIndex=0;wrap.setAttribute("role","region");wrap.setAttribute("aria-label",caption);var t=el("table");t.appendChild(el("caption","sr-only",caption));var thead=el("thead"),tr=el("tr");headers.forEach(function(h){var th=el("th","",h);th.scope="col";tr.appendChild(th);});thead.appendChild(tr);t.appendChild(thead);var body=el("tbody");rows.forEach(function(row){var r=el("tr");row.forEach(function(cell){r.appendChild(el("td","",value(cell)));});body.appendChild(r);});t.appendChild(body);wrap.appendChild(t);return wrap;}
function measure(key){return array(report.measures).find(function(item){return item.metric===key;});}
function gateCondition(key){return array(report.qualityGate&&report.qualityGate.conditions).find(function(item){return item.metricKey===key;});}
function rawMeasure(key){var m=measure(key);if(m){if(key.indexOf("new_")===0&&m.period&&m.period.value!==undefined)return m.period.value;if(m.value!==undefined)return m.value;if(m.period&&m.period.value!==undefined)return m.period.value;}var condition=gateCondition(key);return condition&&condition.actualValue!==undefined?condition.actualValue:null;}
function rating(v){var n=Math.round(number(v)||0);return n>=1&&n<=5?String.fromCharCode(64+n):value(v);}
function metricValue(key){var v=rawMeasure(key);if(v===null||v===undefined||v==="")return"Not available";if(key.indexOf("rating")>=0)return rating(v);if(key.indexOf("coverage")>=0||key.indexOf("density")>=0||key.indexOf("reviewed")>=0)return formatNumber(v,2)+"%";if(key==="sqale_index")return duration(v);if(key==="ncloc")return formatNumber(v,0)+" LOC";if(key==="alert_status")return friendlyStatus(v);return formatNumber(v,2);}
function sum(items,selector){return items.reduce(function(total,item){return total+(number(selector(item))||0);},0);}
function issueCounts(){var issues=array(report.issues),counts={total:issues.length,active:0,accepted:0,closed:0,resolved:0,unknown:0};issues.forEach(function(issue){var state=lifecycle(issue),status=String(issue&&issue.status||"").toUpperCase();if(state==="actionable")counts.active+=1;else if(state==="accepted"){counts.accepted+=1;counts.resolved+=1;}else if(state==="closed"){if(["RESOLVED","FALSE_POSITIVE","WONTFIX"].includes(status))counts.resolved+=1;else counts.closed+=1;}else counts.unknown+=1;});return counts;}
function countBy(items,selector){var map={};items.forEach(function(item){var key=value(selector(item));map[key]=(map[key]||0)+1;});return Object.keys(map).map(function(key){return{label:key,value:map[key]};}).sort(function(a,b){return b.value-a.value;});}
function barList(title,items,limit){var block=el("div","insight-card"),list=el("div","bar-list"),shown=items.slice(0,limit||items.length),max=Math.max.apply(null,shown.map(function(item){return item.value;}).concat([1]));block.appendChild(el("h3","",title));shown.forEach(function(item){var row=el("div","bar-row"),label=el("span","bar-label",item.label),track=el("span","bar-track"),fill=el("span","bar-fill"),count=el("strong","bar-value",formatNumber(item.value,0));fill.style.width=Math.max(2,(item.value/max)*100)+"%";track.appendChild(fill);row.appendChild(label);row.appendChild(track);row.appendChild(count);list.appendChild(row);});block.appendChild(list);return block;}
function statCard(label,val,context,toneValue){var card=el("div","stat-card"+(toneValue?" stat-"+toneValue:""));card.appendChild(el("span","stat-label",label));card.appendChild(el("strong","stat-value",val));if(context)card.appendChild(el("span","stat-context",context));return card;}
function scopeLabel(name,enabled){return badge((enabled?"Included: ":"Excluded: ")+name,enabled?"success":"neutral");}
function renderDataHealth(host){if(!report.complete){var health=el("div","data-health health-partial");health.appendChild(el("strong","health-title","Incomplete report"));health.appendChild(el("span","health-copy","Some requested data could not be collected or was truncated. Review provenance below."));host.appendChild(health);}if(array(report.warnings).length){var box=el("div","warning-box");box.appendChild(el("h3","","Collection warnings"));var list=el("ul");report.warnings.forEach(function(w){list.appendChild(el("li","",w));});box.appendChild(list);host.appendChild(box);}}
function conditionValue(condition){var key=condition.metricKey||"",percent=key.indexOf("coverage")>=0||key.indexOf("density")>=0||key.indexOf("reviewed")>=0,unit=percent?"%":"",thresholdValue=condition.errorThreshold!==undefined?condition.errorThreshold:condition.warningThreshold,actual=number(condition.actualValue),threshold=number(thresholdValue),required=condition.comparator==="LT"?"at least ":condition.comparator==="GT"?"at most ":"threshold ",variance="Variance unavailable";if(actual!==null&&threshold!==null){var difference=actual-threshold,suffix=percent?" percentage points":"";if(condition.comparator==="LT")variance=difference>=0?formatNumber(difference,5)+suffix+" above minimum":formatNumber(Math.abs(difference),5)+suffix+" below minimum";else if(condition.comparator==="GT")variance=difference<=0?formatNumber(Math.abs(difference),5)+suffix+" headroom":formatNumber(difference,5)+suffix+" above limit";}return{actual:formatNumber(condition.actualValue,5)+unit,required:required+formatNumber(thresholdValue,5)+unit,variance:variance};}
function renderGate(host){var gate=report.qualityGate||{},conditions=array(gate.conditions).slice().sort(function(a,b){return(a.status==="ERROR"?-1:1)-(b.status==="ERROR"?-1:1);}),failed=conditions.filter(function(c){return c.status==="ERROR";}).length,panel=el("div","gate-panel gate-"+tone(gate.status)),head=el("div","gate-heading");head.appendChild(badge("Quality Gate: "+friendlyStatus(gate.status),tone(gate.status)));head.appendChild(el("strong","gate-count",gate.ignoredConditions?"Conditions ignored by SonarQube":conditions.length?failed+" of "+conditions.length+" conditions failed":"Conditions unavailable"));panel.appendChild(head);if(gate.ignoredConditions)panel.appendChild(el("p","gate-note","SonarQube marked quality-gate conditions as ignored for this analysis."));if(conditions.length){panel.appendChild(el("p","gate-note","Thresholds are defined by SonarQube's new-code quality gate."));var grid=el("div","condition-grid");conditions.forEach(function(c){var vals=conditionValue(c),card=el("article","condition-card condition-"+tone(c.status));card.appendChild(badge(friendlyStatus(c.status),tone(c.status)));card.appendChild(el("h3","",metricLabels[c.metricKey]||humanize(c.metricKey)||"Condition"));card.appendChild(el("strong","condition-actual",vals.actual));card.appendChild(el("span","condition-required","Required: "+vals.required));card.appendChild(el("span","condition-variance",vals.variance));grid.appendChild(card);});panel.appendChild(grid);}host.appendChild(panel);}
function effortMinutes(issue){var match=String(issue.effort||"").match(/([0-9.]+)(min|h|d)/);return match?Number(match[1])*(match[2]==="d"?480:match[2]==="h"?60:1):0;}
function renderSummary(){if(!template.sections.summary)return;var s=section("summary","Decision summary","Current position, collection health, and the items most likely to need attention."),counts=issueCounts(),activeIssues=array(report.issues).filter(active),high=activeIssues.filter(function(i){return["BLOCKER","CRITICAL","HIGH"].includes(String(impact(i)).toUpperCase());}).length,debt=sum(activeIssues,effortMinutes),analysis=analysisAge();renderDataHealth(s);renderGate(s);var cards=el("div","stats-grid");cards.appendChild(statCard("Open issues",collected("issues")?formatNumber(counts.active,0):"Not collected",collected("issues")?formatNumber(counts.total,0)+" records exported":"Issue dataset excluded",counts.active?"warning":"success"));cards.appendChild(statCard("High-impact open",collected("issues")?formatNumber(high,0):"Not collected","Blocker, critical, or high",high?"danger":"success"));cards.appendChild(statCard("New-code violations",metricValue("new_violations"),"Quality gate new-code scope",number(rawMeasure("new_violations"))?"danger":"success"));cards.appendChild(statCard("Remediation effort",collected("issues")?duration(debt):"Not collected","Open issues only"));cards.appendChild(statCard("Coverage",metricValue("coverage"),"New code: "+metricValue("new_coverage")));cards.appendChild(statCard("Analysis age",analysis?analysis.text:"Unknown",formatDate(report.project&&report.project.analysisDate),analysis&&analysis.days>=30?"warning":""));s.appendChild(cards);if(collected("issues")){var insights=el("div","insights-grid");insights.appendChild(barList("Open issues by impact",countBy(activeIssues,function(i){return humanize(impact(i));}),5));insights.appendChild(barList("Issue records by status",countBy(array(report.issues),function(i){return friendlyStatus(i.status);}),6));insights.appendChild(barList("Open issues by type",countBy(activeIssues,function(i){return humanize(i.type);}),6));s.appendChild(insights);}}
function renderMeasures(){if(!template.sections.measures)return;var s=section("measures","Quality measures","Human-readable overall and new-code values, organized by engineering outcome."),groups=[{title:"Coverage and duplication",items:[["Coverage","coverage","new_coverage"],["Duplication","duplicated_lines_density","new_duplicated_lines_density"]]},{title:"Reliability and security",items:[["Bugs","bugs","new_bugs"],["Vulnerabilities","vulnerabilities","new_vulnerabilities"],["Security hotspots","security_hotspots",null],["Reliability rating","reliability_rating",null],["Security rating","security_rating",null]]},{title:"Maintainability",items:[["Code smells","code_smells","new_code_smells"],["Technical debt","sqale_index",null],["Maintainability rating","sqale_rating",null]]},{title:"Size and complexity",items:[["Lines of code","ncloc",null],["Cyclomatic complexity","complexity",null],["Cognitive complexity","cognitive_complexity",null]]}],matrix=el("div","metric-groups");groups.forEach(function(group){var card=el("article","metric-group");card.appendChild(el("h3","",group.title));var rows=group.items.filter(function(item){return measure(item[1])||item[2]&&measure(item[2]);}).map(function(item){return[item[0],metricValue(item[1]),item[2]?metricValue(item[2]):"Not applicable"];});card.appendChild(table(["Measure","Overall","New code"],rows,group.title+" measures"));matrix.appendChild(card);});s.appendChild(matrix);var raw=el("details","raw-details"),rows=array(report.measures).map(function(m){return[metricLabels[m.metric]||humanize(m.metric),metricValue(m.metric),m.metric.indexOf("new_")===0?metricValue(m.metric):m.period&&m.period.value!==undefined?metricValue(m.metric):"Not applicable",m.bestValue===true?"Yes":m.bestValue===false?"No":"Not provided"];});raw.appendChild(el("summary","","Show detailed measure values"));raw.appendChild(table(["Measure","Displayed value","New-code value","At best value?"],rows,"Detailed SonarQube measure values"));s.appendChild(raw);}
function unique(field){exportOptions=report.exportOptions||{};if(exportOptions.issueScope==="all")state.status="all";var values={};array(report.issues).forEach(function(issue){if(issue[field])values[issue[field]]=true;});return Object.keys(values).sort();}
function compactIssueNode(issue){var article=el("article","issue issue-compact");article.appendChild(el("strong","",humanize(impact(issue))+" | "+friendlyStatus(issue.status)+" | "+humanize(issue.type)));article.appendChild(el("p","issue-title",value(issue.message)));article.appendChild(el("p","issue-location",value(issue.component)+(issue.line?":"+issue.line:"")+" \u00b7 "+ruleLabel(issue.rule)+" \u00b7 "+formatEffort(issue.effort)));return article;}
function fillSelect(select,values){values.forEach(function(item){var option=el("option","",humanize(item));option.value=item;select.appendChild(option);});}
function labeledControl(labelText,control){var label=el("label","filter-control");label.appendChild(el("span","",labelText));label.appendChild(control);return label;}
function filteredIssues(){var q=state.query.toLowerCase();return array(report.issues).filter(function(issue){var hay=[issue.key,issue.rule,ruleLabel(issue.rule),issue.message,issue.component,issue.assignee,array(issue.tags).join(" ")].join(" ").toLowerCase(),status=String(issue.status||"");return(!q||hay.indexOf(q)>=0)&&(state.status==="all"||state.status==="active"&&active(issue)||state.status===status)&&(!state.severity||issue.severity===state.severity)&&(!state.type||issue.type===state.type);}).sort(function(a,b){if(state.sort==="risk")return rank(impact(a))-rank(impact(b))||String(a.message).localeCompare(String(b.message));if(state.sort==="newest")return String(b.creationDate).localeCompare(String(a.creationDate));if(state.sort==="oldest")return String(a.creationDate).localeCompare(String(b.creationDate));return String(a.component).localeCompare(String(b.component),undefined,{numeric:true});});}
function issueId(issue){return"issue-"+String(issue.key).replace(/[^a-zA-Z0-9_-]/g,"-");}
function definitionList(rows){var dl=el("dl","detail-grid");rows.forEach(function(row){dl.appendChild(el("dt","",row[0]));dl.appendChild(el("dd","",value(row[1])));});return dl;}
function issueNode(issue){var article=el("article","issue");article.id=issueId(issue);var top=el("div","issue-top"),badges=el("div","issue-badges");badges.appendChild(badge(humanize(impact(issue)),tone(impact(issue))));badges.appendChild(badge(friendlyStatus(issue.status),issue.status==="OPEN"?"warning":"neutral"));if(issue.type)badges.appendChild(badge(humanize(issue.type),"neutral"));top.appendChild(badges);var heading=el("h3","issue-title"),anchor=el("a","",value(issue.message));anchor.href="#"+article.id;heading.appendChild(anchor);top.appendChild(heading);article.appendChild(top);article.appendChild(el("p","issue-location",value(issue.component)+(issue.line?":"+issue.line:"")+" \u00b7 "+ruleLabel(issue.rule)));var details=el("details","issue-details");details.appendChild(el("summary","","View details"));details.appendChild(definitionList([["Issue key",issue.key],["Software quality impact",array(issue.impacts).map(impactLabel).join(", ")||humanize(issue.severity)],["Legacy severity",humanize(issue.severity)],["Legacy type",humanize(issue.type)],["Rule",ruleLabel(issue.rule)],["File or component",issue.component],["Line",issue.line],["Text range",formatTextRange(issue.textRange)],["Status",friendlyStatus(issue.status)],["Resolution",humanize(issue.resolution)],["Remediation effort",formatEffort(issue.effort)],["Clean Code attribute",humanize(issue.cleanCodeAttribute)],["Tags",array(issue.tags).map(humanize).join(", ")],["Created",formatDate(issue.creationDate)],["Updated",formatDate(issue.updateDate)],["Closed",formatDate(issue.closeDate)],["Assignee",collected("people")?issue.assignee:"Excluded by selection"],["Author",collected("people")?issue.author:"Excluded by selection"],["Source snippet","Not collected"]]));article.appendChild(details);return article;}
function renderIssues(){if(!template.sections.issues)return;var host=section("issues","Issue investigation","The default view contains actionable/open issues. Historical records remain available through Status."),counts=issueCounts();if(!collected("issues")){host.appendChild(emptyState("Issues not collected","This export was created without the issue dataset."));return;}if(!array(report.issues).length){host.appendChild(emptyState("No issues","No issue records were returned for the selected project scope."));return;}var tabs=el("div","status-summary"),statusSelect=el("select");[["Open/actionable",counts.active,"active"],["Resolved",counts.resolved,"RESOLVED"],["Closed",counts.closed,"CLOSED"],["All exported",counts.total,"all"]].forEach(function(item){var button=el("button","status-tab",item[0]+" "+formatNumber(item[1],0));button.type="button";button.dataset.status=item[2];button.addEventListener("click",function(){state.status=item[2];state.page=1;statusSelect.value=item[2];draw();});tabs.appendChild(button);});host.appendChild(tabs);var controls=el("div","filters"),search=el("input"),severity=el("select"),type=el("select"),sort=el("select"),clear=el("button","clear-filters","Clear filters");search.id="issue-search";search.type="search";search.placeholder="Message, rule, file, key, or tag";severity.id="severity-filter";severity.appendChild(new Option("All severities",""));fillSelect(severity,unique("severity"));statusSelect.id="status-filter";[["Open/actionable","active"],["All exported","all"]].concat(unique("status").map(function(v){return[v,v];})).forEach(function(item){statusSelect.appendChild(new Option(item[0],item[1]));});type.id="type-filter";type.appendChild(new Option("All types",""));fillSelect(type,unique("type"));sort.id="sort-filter";[["Risk first","risk"],["Newest first","newest"],["Oldest first","oldest"],["File path","file"]].forEach(function(item){sort.appendChild(new Option(item[0],item[1]));});clear.type="button";controls.appendChild(labeledControl("Search",search));controls.appendChild(labeledControl("Severity",severity));controls.appendChild(labeledControl("Status",statusSelect));controls.appendChild(labeledControl("Type",type));controls.appendChild(labeledControl("Sort",sort));controls.appendChild(clear);host.appendChild(controls);var count=el("p","result-count");count.tabIndex=-1;count.setAttribute("aria-live","polite");host.appendChild(count);var list=el("div","issue-list");host.appendChild(list);var pager=el("div","pager"),prev=el("button","","Previous"),next=el("button","","Next"),pageLabel=el("span");prev.type="button";next.type="button";pager.appendChild(prev);pager.appendChild(pageLabel);pager.appendChild(next);host.appendChild(pager);
function updateTabs(){Array.prototype.forEach.call(tabs.querySelectorAll("button"),function(button){var selected=button.dataset.status===state.status;button.classList.toggle("is-active",selected);button.setAttribute("aria-pressed",selected?"true":"false");});}
function draw(printAll){var issues=filteredIssues(),size=template.issuePageSize||100,pages=Math.max(1,Math.ceil(issues.length/size));state.page=Math.min(state.page,pages);var start=(state.page-1)*size;list.textContent="";(printAll?issues:issues.slice(start,start+size)).forEach(function(issue){list.appendChild(printAll&&exportOptions.purpose==="print"?compactIssueNode(issue):issueNode(issue));});count.textContent=printAll?issues.length+" selected issues prepared for print":issues.length?"Showing "+(start+1)+"\u2013"+Math.min(start+size,issues.length)+" of "+issues.length+" matching issues":"No issues match these filters";pageLabel.textContent="Page "+state.page+" of "+pages;prev.disabled=state.page<=1;next.disabled=state.page>=pages;pager.hidden=printAll||issues.length<=size;updateTabs();}
function revealHash(){var wanted=decodeURIComponent(location.hash.slice(1));if(wanted.indexOf("issue-")!==0)return;var issues=filteredIssues(),index=issues.findIndex(function(issue){return issueId(issue)===wanted;});if(index<0){state.query=state.severity=state.type="";state.status="all";search.value=severity.value=type.value="";statusSelect.value="all";issues=filteredIssues();index=issues.findIndex(function(issue){return issueId(issue)===wanted;});}if(index>=0){state.page=Math.floor(index/(template.issuePageSize||100))+1;draw();setTimeout(function(){var target=document.getElementById(wanted);if(target){target.scrollIntoView();var link=target.querySelector("h3 a");if(link)link.focus();}},0);}}
controls.addEventListener("input",function(event){if(event.target===search)state.query=search.value;if(event.target===severity)state.severity=severity.value;if(event.target===statusSelect)state.status=statusSelect.value;if(event.target===type)state.type=type.value;if(event.target===sort)state.sort=sort.value;state.page=1;draw();});clear.addEventListener("click",function(){state={query:"",severity:"",status:"active",type:"",sort:"risk",page:1};search.value=severity.value=type.value="";statusSelect.value="active";sort.value="risk";draw();search.focus();});prev.addEventListener("click",function(){state.page-=1;draw();count.focus();host.scrollIntoView();});next.addEventListener("click",function(){state.page+=1;draw();count.focus();host.scrollIntoView();});globalThis.addEventListener("hashchange",revealHash);globalThis.addEventListener("beforeprint",function(){if(exportOptions.purpose==="print"&&exportOptions.mode==="register")draw(true);});globalThis.addEventListener("afterprint",function(){draw();});draw();revealHash();}
function shortPath(valueText){var text=String(valueText||"");return text.length>90?"\u2026"+text.slice(-89):text;}
function renderComponents(){if(!template.sections.components)return;var host=section("components","Files and remediation concentration","Files are ranked by actionable issue count; the complete inventory remains available below.");if(!collected("components")){host.appendChild(emptyState("Files not collected","This export was created without the file inventory."));return;}var components=array(report.components),activeIssues=array(report.issues).filter(active),byComponent={};activeIssues.forEach(function(issue){var key=issue.component||"Unmatched component";byComponent[key]=(byComponent[key]||0)+1;});var ranked=Object.keys(byComponent).map(function(key){return{label:shortPath(key),value:byComponent[key]};}).sort(function(a,b){return b.value-a.value;});if(ranked.length)host.appendChild(barList("Top files by open issues",ranked,12));else host.appendChild(emptyState("No actionable file concentration","No open issues could be joined to file/component keys."));var languages=countBy(components,function(c){return languageLabel(c.language);});if(languages.length)host.appendChild(barList("Files by language",languages,10));var details=el("details","raw-details"),rows=components.map(function(c){return[c.name,c.path,languageLabel(c.language),qualifierLabel(c.qualifier),c.key,byComponent[c.key]||0];});details.appendChild(el("summary","","Browse all "+components.length+" collected files"));details.appendChild(table(["Name","Path","Language","Component type","Component key","Open issues"],rows,"Collected file and component inventory"));host.appendChild(details);}
function renderAnalyses(){if(!template.sections.analyses)return;var host=section("analyses","Analysis history","An audit timeline of collected analyses; this is not a quality trend because metric history was not collected.");if(!collected("analyses")){host.appendChild(emptyState("Analyses not collected","This export was created without analysis history."));return;}var analyses=array(report.analyses).slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));});if(!analyses.length){host.appendChild(emptyState("No analyses returned","SonarQube returned no analysis history for this project."));return;}var timeline=el("ol","timeline");analyses.forEach(function(a,index){var item=el("li","timeline-item");item.appendChild(el("time","timeline-date",formatDate(a.date)));item.appendChild(el("strong","",a.projectVersion||(index===0?"Latest collected analysis":"Analysis")));var meta=[a.revision,array(a.events).map(function(e){return humanize(e.category)+": "+value(e.name);}).join("; ")].filter(Boolean).join(" \u00b7 ");if(meta)item.appendChild(el("p","timeline-meta",meta));timeline.appendChild(item);});host.appendChild(timeline);}
function renderProvenance(){var s=section("provenance","Data provenance","Collection scope, reconciliation, and limitations for this portable snapshot."),uniqueRules={},rules=array(report.rules);array(report.issues).forEach(function(i){if(i.rule)uniqueRules[i.rule]=true;});var uniqueRuleCount=Object.keys(uniqueRules).length,ruleCoverage=uniqueRuleCount?rules.filter(function(r){return r&&r.key&&uniqueRules[r.key];}).length:0,issuePaging=report.issuePaging||{},componentPaging=report.componentPaging||{},analysisPaging=report.analysisPaging||{};var rows=[["Issues",collected("issues")?"Collected":"Not requested",issuePaging.exported!==undefined?issuePaging.exported:array(report.issues).length,issuePaging.expected!==undefined?issuePaging.expected:"Not recorded",issuePaging.limit||"Not recorded"],["Files",collected("components")?"Collected":"Not requested",componentPaging.exported!==undefined?componentPaging.exported:array(report.components).length,componentPaging.expected!==undefined?componentPaging.expected:"Not recorded",componentPaging.limit||"Not recorded"],["Analyses",collected("analyses")?"Collected":"Not requested",analysisPaging.exported!==undefined?analysisPaging.exported:array(report.analyses).length,analysisPaging.expected!==undefined?analysisPaging.expected:"Not recorded",analysisPaging.limit||100],["People",collected("people")?"Collected":"Excluded",collected("people")?"Included fields":"0","Not applicable","Not applicable"],["Rule metadata",ruleCoverage===uniqueRuleCount?"Complete":"Partial",ruleCoverage,uniqueRuleCount,"Metadata returned with issue pages"]];s.appendChild(table(["Dataset","State","Exported","Expected/unique","Limit or note"],rows,"Dataset collection provenance"));if(uniqueRuleCount&&ruleCoverage<uniqueRuleCount){var warning=el("div","warning-box");warning.appendChild(el("strong","","Rule metadata is incomplete"));warning.appendChild(el("p","",ruleCoverage+" of "+uniqueRuleCount+" unique rule keys have metadata in this report. Issue keys remain available, but missing rule names cannot be reconstructed offline."));s.appendChild(warning);}s.appendChild(definitionList([["Project key",report.project&&report.project.key],["Branch",report.branchLabel],["Analysis timestamp",formatDate(report.project&&report.project.analysisDate)],["Collection started",formatDate(report.collectionStartedAt)],["Export generated",formatDate(report.generatedAt)],["SonarQube server version",report.serverVersion],["Snapshot semantics","Non-transactional current snapshot; data may change after export."],["Source code","Never collected by this plugin."]]));}
function setupNavigation(){var links=Array.prototype.slice.call(document.querySelectorAll(".toc a"));links.forEach(function(link){link.addEventListener("click",function(){links.forEach(function(item){item.removeAttribute("aria-current");});link.setAttribute("aria-current","location");});});var disclosure=document.getElementById("toc-disclosure");if(disclosure&&globalThis.matchMedia&&globalThis.matchMedia("(max-width: 760px)").matches)disclosure.removeAttribute("open");}
function setupPrintView(){if(exportOptions.purpose!=="print")return;var button=document.getElementById("print-now");if(button)button.addEventListener("click",function(){globalThis.focus();globalThis.print();});globalThis.addEventListener("load",function(){globalThis.setTimeout(function(){globalThis.focus();globalThis.print();},750);},{once:true});}
function init(){report=JSON.parse(document.getElementById("report-data").textContent);template=JSON.parse(document.getElementById("template-data").textContent);exportOptions=report.exportOptions||{};report.project=report.project||{};report.collectionScope=report.collectionScope||{};if(exportOptions.purpose==="print"&&exportOptions.mode==="register")state.status=exportOptions.issueScope==="all"?"all":"active";document.title=template.title+" \u2014 "+report.project.name;document.getElementById("report-title").textContent=template.title;document.getElementById("report-subtitle").textContent=template.subtitle;document.getElementById("project-name").textContent=report.project.name||report.project.key||"Unknown project";var projectMeta=[report.project.key&&report.project.key!==report.project.name?report.project.key:null,report.branchLabel,report.project.version&&!/^not provided$/i.test(report.project.version)?report.project.version:null].filter(Boolean);document.getElementById("project-meta").textContent=projectMeta.join(" \u00b7 ");document.getElementById("intro").textContent=template.intro;document.getElementById("analysis-meta").textContent="Analyzed "+formatDate(report.project.analysisDate);document.getElementById("generated").textContent="Exported "+formatDate(report.generatedAt);document.getElementById("footer-text").textContent=template.footer;var coverStatus=document.getElementById("cover-status"),age=analysisAge();coverStatus.appendChild(badge("Quality Gate: "+friendlyStatus(report.qualityGate&&report.qualityGate.status),tone(report.qualityGate&&report.qualityGate.status)));coverStatus.appendChild(badge("Export: "+(report.complete?"Complete":"Incomplete"),report.complete?"success":"danger"));if(age)coverStatus.appendChild(badge("Analysis Age: "+age.text,age.days>=30?"warning":"neutral"));renderSummary();renderMeasures();renderIssues();renderComponents();renderAnalyses();renderProvenance();setupNavigation();setupPrintView();}
function renderFailure(error){var host=document.getElementById("report-content")||document.body;host.textContent="";var panel=el("section","runtime-error");panel.appendChild(el("h2","","Report could not be displayed"));panel.appendChild(el("p","","The embedded report data or rendering code is damaged or blocked. Download the report again from SonarQube."));panel.appendChild(el("pre","",error&&error.message?error.message:"Unknown rendering error"));host.appendChild(panel);}
try{init();}catch(error){renderFailure(error);}
})();`;
  // SHA-256 of REPORT_RUNTIME. The test suite detects drift after runtime edits.
  const REPORT_RUNTIME_SHA256 = "6DtgeBhUxsQtv6vsjuW+hn241SSw7VTHKbJEY98YN4Q=";

  function reportStyles(accentColor) {
    return `:root{--accent:${accentColor};--ink:#172033;--muted:#5f6b7a;--line:#d8e0ea;--surface:#f5f7fa;--panel:#fff;--danger:#b42318;--danger-bg:#fff1f0;--warning:#9a6700;--warning-bg:#fff8db;--success:#18794e;--success-bg:#eafaf1;color-scheme:light}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--surface);overflow-wrap:anywhere}.skip{position:absolute;left:-999px}.skip:focus{left:1rem;top:1rem;background:#fff;padding:.75rem;z-index:20}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.cover{padding:2rem max(4vw,1rem);border-bottom:4px solid var(--accent);background:#fff}.cover-inner{max-width:1520px;margin:auto}.cover h1{font-size:clamp(1.9rem,4vw,2.8rem);line-height:1.1;margin:.35rem 0;max-width:900px}.eyebrow{color:var(--accent);font-weight:800;text-transform:uppercase;letter-spacing:.1em}.subtitle{font-size:1.05rem;color:var(--muted);margin:.5rem 0 1.25rem}.project-line{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}.project-line strong{font-size:1.25rem}.meta-grid{display:flex;flex-wrap:wrap;gap:.5rem 1rem;color:var(--muted);font-size:.9rem}.intro{max-width:900px}.layout{display:grid;grid-template-columns:230px minmax(0,1fr);gap:1.5rem;max-width:1520px;margin:auto;padding:1.5rem}.toc{position:sticky;top:1rem;align-self:start;border:1px solid var(--line);border-radius:.75rem;padding:.75rem;background:var(--panel);box-shadow:0 2px 10px rgba(23,32,51,.04)}.toc summary{min-height:44px;padding:.5rem;font-weight:800;cursor:pointer}.toc a{display:block;color:var(--ink);padding:.65rem .6rem;min-height:44px;border-radius:.4rem;text-decoration:none}.toc a:hover,.toc a:focus,.toc a[aria-current]{color:var(--accent);background:color-mix(in srgb,var(--accent) 9%,white)}main{min-width:0}.report-section{margin:0 0 1.5rem;padding:1.5rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel);box-shadow:0 2px 12px rgba(23,32,51,.035);scroll-margin-top:1rem}.section-title{font-size:1.55rem;margin:0}.section-lead{color:var(--muted);margin:.35rem 0 1.25rem;max-width:900px}.data-health{display:grid;grid-template-columns:max-content 1fr;gap:.25rem 1rem;align-items:center;padding:1rem;border-left:5px solid;margin-bottom:.75rem}.health-complete{background:var(--success-bg);border-color:var(--success)}.health-partial{background:var(--danger-bg);border-color:var(--danger)}.health-title{font-size:1.05rem}.health-copy{color:var(--muted)}.scope-list{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem}.badge{display:inline-flex;align-items:center;min-height:28px;padding:.2rem .6rem;border:1px solid var(--line);border-radius:999px;font-size:.78rem;font-weight:750;background:#fff}.badge-danger{color:var(--danger);background:var(--danger-bg);border-color:#f3b7b2}.badge-warning{color:#704b00;background:var(--warning-bg);border-color:#e7cf72}.badge-success{color:var(--success);background:var(--success-bg);border-color:#9bd4b7}.badge-neutral{color:#465467;background:#f4f6f8}.gate-panel{border:1px solid var(--line);border-left:6px solid;border-radius:.7rem;padding:1rem;margin:1rem 0}.gate-danger{border-left-color:var(--danger);background:var(--danger-bg)}.gate-success{border-left-color:var(--success);background:var(--success-bg)}.gate-neutral{border-left-color:#77869a}.gate-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}.gate-count{font-size:1.05rem}.condition-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:.75rem;margin-top:1rem}.condition-card{padding:.85rem;background:#fff;border:1px solid var(--line);border-radius:.55rem}.condition-card h3{font-size:.9rem;margin:.65rem 0 .2rem}.condition-actual{display:block;font-size:1.45rem}.condition-required{color:var(--muted);font-size:.85rem}.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:.75rem}.stat-card{min-height:132px;padding:1rem;border:1px solid var(--line);border-top:4px solid var(--accent);border-radius:.6rem}.stat-danger{border-top-color:var(--danger)}.stat-warning{border-top-color:var(--warning)}.stat-success{border-top-color:var(--success)}.stat-label,.stat-context{display:block;color:var(--muted)}.stat-value{display:block;font-size:1.65rem;line-height:1.2;margin:.35rem 0}.stat-context{font-size:.8rem}.insights-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.75rem;margin-top:1rem}.insight-card{padding:1rem;border:1px solid var(--line);border-radius:.6rem}.insight-card h3{font-size:1rem;margin:0 0 .8rem}.bar-list{display:grid;gap:.55rem}.bar-row{display:grid;grid-template-columns:minmax(90px,1.1fr) minmax(70px,2fr) max-content;gap:.5rem;align-items:center;font-size:.85rem}.bar-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bar-track{height:.55rem;background:#e7ecf2;border-radius:999px;overflow:hidden}.bar-fill{display:block;height:100%;background:var(--accent);border-radius:inherit}.bar-value{text-align:right}.metric-groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:1rem}.metric-group h3{font-size:1rem;margin:.2rem 0 .75rem}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:.5rem}.table-wrap:focus{outline:3px solid var(--accent);outline-offset:2px}table{border-collapse:collapse;width:100%;font-size:.87rem}th,td{padding:.65rem .7rem;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}th{background:#eaf0f7;position:sticky;top:0;z-index:1}tbody tr:last-child td{border-bottom:0}.raw-details{margin-top:1rem}.raw-details>summary,.issue-details>summary{cursor:pointer;min-height:44px;padding:.65rem;font-weight:700;color:var(--accent)}.status-summary{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem}.status-tab,.clear-filters,.pager button{min-height:44px;padding:.55rem .8rem;border:1px solid #9aa6b5;border-radius:.45rem;background:#fff;color:var(--ink);cursor:pointer}.status-tab.is-active{background:var(--accent);border-color:var(--accent);color:#fff}.filters{position:sticky;top:0;z-index:3;display:grid;grid-template-columns:minmax(220px,2fr) repeat(4,minmax(130px,1fr)) max-content;gap:.65rem;align-items:end;padding:.8rem;margin:0 0 1rem;background:#fff;border:1px solid var(--line);border-radius:.6rem;box-shadow:0 3px 12px rgba(23,32,51,.07)}.filter-control{font-weight:700;font-size:.8rem}.filter-control span{display:block;margin-bottom:.25rem}.filter-control input,.filter-control select{width:100%;min-height:44px;padding:.55rem;border:1px solid #8996a8;border-radius:.35rem;background:#fff;color:var(--ink)}.issue{border:1px solid var(--line);border-left:5px solid var(--accent);border-radius:.55rem;padding:1rem;margin:0 0 .75rem}.issue-top{display:grid;gap:.55rem}.issue-badges{display:flex;flex-wrap:wrap;gap:.4rem}.issue-title{font-size:1rem;line-height:1.4;margin:0}.issue-title a{color:var(--ink);text-decoration:none}.issue-title a:hover{text-decoration:underline}.issue-location{margin:.5rem 0 0;color:var(--muted);font:.85rem/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.detail-grid{display:grid;grid-template-columns:minmax(130px,max-content) minmax(0,1fr);gap:.4rem 1rem;margin:.5rem 0}.detail-grid dt{font-weight:750}.detail-grid dd{margin:0;min-width:0}.pager{display:flex;justify-content:center;align-items:center;gap:1rem;margin-top:1rem}.result-count{font-weight:700}.warning-box{background:var(--warning-bg);border-left:5px solid var(--warning);padding:1rem;margin:1rem 0}.empty-state{padding:1rem;border:1px dashed #9aa6b5;border-radius:.5rem;background:var(--surface)}.empty-state p{margin:.25rem 0}.timeline{list-style:none;margin:0;padding:0 0 0 1.25rem;border-left:2px solid var(--line)}.timeline-item{position:relative;padding:0 0 1.2rem 1rem}.timeline-item:before{content:"";position:absolute;left:-1.63rem;top:.35rem;width:.65rem;height:.65rem;border-radius:50%;background:var(--accent)}.timeline-date{display:block;color:var(--muted);font-size:.85rem}.timeline-meta{margin:.25rem 0;color:var(--muted)}.runtime-error{max-width:850px;margin:3rem auto;padding:1.5rem;border:2px solid var(--danger);background:var(--danger-bg)}footer{border-top:1px solid var(--line);padding:2rem max(4vw,1rem);color:var(--muted);background:#fff}:focus-visible{outline:3px solid var(--accent);outline-offset:3px}@media(max-width:1050px){.filters{grid-template-columns:repeat(3,minmax(0,1fr))}.filter-control:first-child{grid-column:span 2}}@media(max-width:760px){.cover{padding:1.25rem 1rem}.layout{grid-template-columns:1fr;padding:1rem}.toc{position:static}.report-section{padding:1rem}.data-health{grid-template-columns:1fr}.metric-groups{grid-template-columns:1fr}.filters{position:static;grid-template-columns:1fr}.filter-control:first-child{grid-column:auto}.detail-grid{grid-template-columns:1fr}.detail-grid dd{margin-bottom:.45rem}.bar-row{grid-template-columns:minmax(90px,1fr) minmax(50px,1fr) max-content}.cover h1,.project-line strong{overflow-wrap:anywhere}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media(forced-colors:active){.badge,.stat-card,.gate-panel,.issue{border:2px solid CanvasText}.bar-fill{background:CanvasText}}@media print{body{background:#fff;font-size:10pt}.cover{padding:1rem 0}.toc,.filters,.pager,.skip,.status-summary,.issue-details>summary{display:none}.layout{display:block;padding:0}.report-section{border:0;box-shadow:none;padding:.7rem 0}.issue{break-inside:avoid}.issue-details{display:block}.issue-details>*{display:block}.table-wrap{overflow:visible;border:0}table{font-size:8pt}th{position:static}.stats-grid,.condition-grid{grid-template-columns:repeat(3,1fr)}footer{padding:1rem 0}}`;
  }

  function professionalStyles() {
    return `
:root{--navy:#102a43;--surface:#eef3f8}
body{line-height:1.6;background:linear-gradient(180deg,#f8fafc 0,var(--surface) 34rem)}
.cover{position:relative;overflow:hidden;padding:2.7rem max(4vw,1rem);border-bottom:1px solid #cbd7e4;background:linear-gradient(135deg,#fff 0%,#f5f9fc 56%,#edf7f5 100%);box-shadow:0 10px 32px rgba(16,42,67,.07)}
.cover:after{content:"";position:absolute;right:-9rem;top:-12rem;width:30rem;height:30rem;border-radius:50%;background:rgba(15,118,110,.06);pointer-events:none}
.cover-inner{position:relative;z-index:1;max-width:1440px}
.cover h1{font-size:clamp(2.1rem,4vw,3.25rem);letter-spacing:-.035em;color:var(--navy);max-width:950px}
.eyebrow{font-size:.78rem;font-weight:850;letter-spacing:.13em}
.subtitle{max-width:850px;font-size:1.08rem}
.project-line strong{font-size:1.3rem;color:var(--navy)}
.project-line .meta{padding:.2rem .55rem;border-radius:.35rem;background:rgba(255,255,255,.78);color:var(--muted)}
.cover-status{display:flex;flex-wrap:wrap;gap:.5rem;margin:1rem 0}
.cover-status .badge{box-shadow:0 1px 4px rgba(16,42,67,.09)}
.layout{grid-template-columns:240px minmax(0,1fr);gap:1.75rem;max-width:1440px;padding:2rem 1.5rem}
.toc{border-color:#cbd7e4;border-radius:1rem;padding:.8rem;background:rgba(255,255,255,.95);box-shadow:0 8px 24px rgba(16,42,67,.07)}
.toc summary{color:var(--navy);letter-spacing:.01em}
main{counter-reset:report-section}
.report-section{counter-increment:report-section;border-color:#d4dee9;border-radius:1rem;padding:1.75rem;box-shadow:0 8px 26px rgba(16,42,67,.055)}
.section-title{display:flex;align-items:center;gap:.75rem;color:var(--navy);letter-spacing:-.02em}
.section-title:before{content:counter(report-section,decimal-leading-zero);display:inline-grid;place-items:center;flex:0 0 2.25rem;width:2.25rem;height:2.25rem;border-radius:.65rem;background:var(--navy);color:#fff;font-size:.76rem;letter-spacing:.04em}
.section-lead{margin-left:3rem}
.data-health,.gate-panel{border-radius:.75rem}
.stat-card{border-color:#d4dee9;border-radius:.75rem;background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%);box-shadow:0 3px 12px rgba(16,42,67,.045)}
.stat-label{font-size:.78rem;font-weight:750;letter-spacing:.035em;text-transform:uppercase}
.stat-value{color:var(--navy);letter-spacing:-.025em}
.insight-card,.metric-group{border-color:#d4dee9;border-radius:.75rem;background:#fff}
.table-wrap{border-color:#cbd7e4;border-radius:.7rem;background:#fff}
th{padding:.75rem;background:var(--navy);color:#fff;font-size:.78rem;letter-spacing:.025em;text-transform:uppercase}
tbody tr:nth-child(even){background:#f7f9fc}
tbody tr:hover{background:#edf5f7}
td{padding:.72rem .75rem}
.issue{border-color:#d4dee9;border-radius:.75rem;background:#fff;box-shadow:0 3px 12px rgba(16,42,67,.04)}
.issue-title{font-size:1.02rem;color:var(--navy)}
.status-tab,.clear-filters,.pager button{font-weight:700}
.filters{border-color:#cbd7e4;border-radius:.75rem;box-shadow:0 8px 24px rgba(16,42,67,.08)}
footer{text-align:center;background:#f8fafc}
@media(max-width:760px){.cover{padding:1.6rem 1rem}.layout{padding:1rem}.report-section{padding:1.1rem}.section-lead{margin-left:0}.section-title:before{flex-basis:2rem;width:2rem;height:2rem}}
@media print{.cover:after{display:none}.section-title:before{background:#fff;color:#000;border:1px solid #555}.report-section{box-shadow:none}}
`;
  }

  function buildHtmlReport(report, inputTemplate, inputOptions) {
    const template = app.normalizeTemplate(inputTemplate);
    const requested = inputOptions && typeof inputOptions === "object" ? inputOptions : {};
    const exportOptions = {
      purpose: requested.purpose === "print" ? "print" : "interactive",
      mode: requested.mode === "register" ? "register" : "summary",
      issueScope: requested.issueScope === "all" ? "all" : "active"
    };
    const embeddedReport = exportOptions.purpose === "print" ? { ...report, exportOptions } : report;
    const collectedIssues = (report.issues || []).length;
    const exportedIssues = exportOptions.mode === "register"
      ? (report.issues || []).filter((issue) => exportOptions.issueScope === "all" || app.issueLifecycleStatus(issue.status, issue.resolution) === "actionable").length
      : 0;
    const printManifest = exportOptions.purpose === "print" ? `<aside class="print-manifest" aria-label="Print export manifest"><strong>Print export manifest</strong><dl><dt>Mode</dt><dd>${exportOptions.mode === "register" ? "Summary + compact issue register" : "Executive summary"}</dd><dt>Issue scope</dt><dd>${exportOptions.mode === "register" ? (exportOptions.issueScope === "all" ? "All collected" : "Actionable only") : "Not included"}</dd><dt>Issue rows</dt><dd>${exportedIssues} exported / ${collectedIssues} collected</dd><dt>Completeness</dt><dd>${report.complete ? "Complete for selected collection scope" : "Incomplete — review data provenance"}</dd><dt>Report ID</dt><dd>${app.escapeHtml(report.reportId || "Not provided")}</dd><dt>Generated UTC</dt><dd>${app.escapeHtml(report.generatedAt || "Not provided")}</dd></dl></aside>` : "";
    const printToolbar = exportOptions.purpose === "print" ? `<aside class="print-toolbar" aria-label="PDF export controls"><button type="button" id="print-now">Print / Save as PDF</button><p>If the print dialog did not open automatically, select this button. In the Destination or Printer field, choose <strong>Save as PDF</strong>, then save the file.</p></aside>` : "";
    const scriptPolicy = `'sha256-${REPORT_RUNTIME_SHA256}'`;
    const nav = [
      ["summary", "Decision summary", template.sections.summary],
      ["measures", "Quality measures", template.sections.measures],
      ["issues", "Issue investigation", template.sections.issues],
      ["components", "Files", template.sections.components],
      ["analyses", "Analyses", template.sections.analyses],
      ["provenance", "Data provenance", true]
    ].filter((item) => item[2]).map((item) => `<a href="#${item[0]}">${item[1]}</a>`).join("");
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; object-src 'none'; connect-src 'none'; form-action 'none'; img-src data:; style-src 'unsafe-inline'; script-src ${scriptPolicy}">
<title>${app.escapeHtml(template.title)}</title><style>${reportStyles(template.accentColor)}${professionalStyles()}.condition-required,.condition-variance{display:block;color:var(--muted);font-size:.85rem}.condition-variance{font-weight:700;margin-top:.2rem}.gate-note{margin:.65rem 0 0;color:var(--muted);font-size:.85rem}.print-toolbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:1rem;padding:.8rem max(4vw,1rem);border-bottom:1px solid var(--line);background:#fff;box-shadow:0 4px 16px rgba(16,42,67,.12)}.print-toolbar button{min-height:44px;padding:.65rem 1rem;border:0;border-radius:.45rem;background:var(--accent);color:#fff;font-weight:800;cursor:pointer}.print-toolbar p{margin:0;color:var(--muted)}.print-manifest{margin:1rem 0;padding:1rem;border:2px solid var(--ink);background:#fff}.print-manifest dl{display:grid;grid-template-columns:max-content 1fr;gap:.25rem 1rem;margin:.5rem 0 0}.print-manifest dt{font-weight:700}.print-manifest dd{margin:0}@media(max-width:700px){.print-toolbar{align-items:stretch;flex-direction:column}}@media print{.print-toolbar{display:none!important}}</style></head>
<body>${printToolbar}<a class="skip" href="#report-content">Skip to report content</a><header class="cover"><div class="cover-inner"><div class="eyebrow">SonarQube · Offline quality intelligence</div><h1 id="report-title"></h1><p class="subtitle" id="report-subtitle"></p><div class="project-line"><strong id="project-name"></strong><span class="meta" id="project-meta"></span></div><div class="cover-status" id="cover-status" aria-label="Report status"></div><p class="intro" id="intro"></p><div class="meta-grid"><span id="analysis-meta"></span><span id="generated"></span></div></div></header>
${printManifest}<div class="layout"><nav class="toc" aria-label="Report contents"><details id="toc-disclosure" open><summary>Contents</summary>${nav}</details></nav><main id="report-content" tabindex="-1"><noscript><section class="runtime-error"><h2>JavaScript is required</h2><p>This offline report uses its embedded, integrity-pinned script for navigation and rendering. Enable JavaScript for this local file or export it again.</p></section></noscript></main></div><footer><span id="footer-text"></span></footer>
<script type="application/json" id="report-data">${app.jsonForHtml(embeddedReport)}</script><script type="application/json" id="template-data">${app.jsonForHtml(template)}</script><script>${REPORT_RUNTIME}</script></body></html>`;
  }

  Object.assign(app, { REPORT_RUNTIME, REPORT_RUNTIME_SHA256, reportStyles, professionalStyles, buildHtmlReport });
})(window);


(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const STORAGE_KEY = "sonarqube-offline-report-template-v2";
  const FORMAT_NAMES = Object.freeze({
    html: "offline HTML", xlsx: "Excel workbook", docx: "Word document",
    print: "PDF print view", csv: "issues CSV", json: "JSON snapshot"
  });

  const UI_CSS = `
.orp{--ink:#17212b;--muted:#5f6b76;--line:#d6dde4;--surface:#fff;--soft:#f5f7f9;--brand:#0f6f73;box-sizing:border-box;width:100%;max-width:1040px;height:var(--orp-available-height,calc(100dvh - 150px));margin:0 auto;padding:24px 24px 0;color:var(--ink);font:14px/1.5 Arial,sans-serif;overflow-x:hidden;overflow-y:scroll;overscroll-behavior:contain;scrollbar-gutter:stable}
.orp *{box-sizing:border-box}.orp h1{font-size:28px;line-height:1.2;margin:0}.orp h2{font-size:19px;margin:0}.orp h3{font-size:15px;margin:0}.orp p{margin:6px 0}.orp-header{display:flex;gap:24px;justify-content:space-between;align-items:flex-start;margin-bottom:18px}.orp-subtitle,.orp-help,.orp small{color:var(--muted)}.orp-context{text-align:right;max-width:40%}.orp-context strong,.orp-context span{display:block}.orp-warning{border-left:4px solid #b7791f;background:#fff8e8;padding:12px 14px;margin:0 0 18px}.orp-form{display:grid;gap:16px}.orp-card{border:1px solid var(--line);border-radius:10px;background:var(--surface);padding:18px}.orp-section-head{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;margin-bottom:12px}.orp-section-head p{color:var(--muted);margin:2px 0}.orp-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.orp-format-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.orp-choice{position:relative;display:block;border:1px solid var(--line);border-radius:8px;padding:14px;min-height:90px;cursor:pointer;background:#fff}.orp-choice:hover{border-color:#7c929f}.orp-choice:focus-within{outline:3px solid #8ac7ca;outline-offset:2px}.orp-choice input{position:absolute;top:14px;right:14px;width:18px;height:18px}.orp-choice strong,.orp-choice span{display:block;padding-right:25px}.orp-choice span{color:var(--muted);margin-top:5px}.orp-choice.is-selected{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand);background:#f1fbfa}.orp details{border-top:1px solid var(--line);margin-top:14px;padding-top:12px}.orp summary{cursor:pointer;font-weight:700;min-height:40px;padding:8px 2px}.orp details[open]>summary{margin-bottom:10px}.orp-advanced-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.orp fieldset{min-width:0;border:1px solid var(--line);border-radius:8px;padding:12px}.orp legend{font-weight:700;padding:0 5px}.orp label:not(.orp-choice):not(.orp-check){display:grid;gap:4px;margin:10px 0}.orp input[type=text],.orp input[type=number],.orp textarea,.orp select{width:100%;min-height:42px;border:1px solid #aeb9c2;border-radius:6px;padding:8px;color:var(--ink);background:#fff}.orp input[type=color]{width:60px;height:42px;border:1px solid #aeb9c2;border-radius:6px;padding:3px}.orp textarea{min-height:78px;resize:vertical}.orp-check{display:flex;gap:8px;align-items:flex-start;min-height:36px;padding:6px 0}.orp-check input{width:18px;height:18px;flex:0 0 auto}.orp-inline{display:flex;gap:12px;flex-wrap:wrap}.orp-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.orp button{min-height:42px;border:1px solid #8c9aa5;border-radius:6px;background:#fff;padding:8px 13px;font-weight:700;color:var(--ink);cursor:pointer}.orp button:hover:not(:disabled){background:#edf1f4}.orp button:focus-visible,.orp summary:focus-visible{outline:3px solid #77bdc1;outline-offset:2px}.orp button:disabled{opacity:.55;cursor:not-allowed}.orp-primary{background:var(--brand)!important;border-color:var(--brand)!important;color:#fff!important;min-width:190px}.orp-submit{display:flex;align-items:center;gap:12px;position:sticky;bottom:0;background:rgba(255,255,255,.96);border-top:1px solid var(--line);padding:14px 0;z-index:2}.orp-submit .orp-status{margin-left:auto}.orp-status{white-space:pre-line;color:var(--muted)}.orp-status[data-kind=error]{color:#a12622;font-weight:700}.orp-status[data-kind=success]{color:#176b42}.orp-status[data-kind=stale]{color:#8a5700;font-weight:700}.orp-progress{width:180px;height:10px}.orp-document-options{background:var(--soft);border-radius:8px;padding:12px;margin-top:12px}.orp-document-options[hidden]{display:none}.orp-file{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
.orp input[type=text],.orp input[type=number],.orp textarea,.orp select,.orp button{min-height:44px}.orp input[type=color]{height:44px}.orp-submit{position:static;bottom:auto;z-index:auto;background:#fff}.orp-end-space{height:clamp(128px,16vh,220px);min-height:128px;pointer-events:none}
@media(max-width:800px){.orp-format-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.orp-advanced-grid{grid-template-columns:1fr}.orp-context{max-width:none;text-align:left}.orp-header{display:block}.orp-context{margin-top:8px}}
@media(max-width:520px){.orp{padding:14px}.orp-choice-grid,.orp-format-grid{grid-template-columns:1fr}.orp-submit{align-items:stretch;flex-direction:column}.orp-submit .orp-status{margin-left:0}.orp-progress{width:100%}}
@media print{.orp-submit{position:static}}
`;

  function injectStyle() {
    if (document.getElementById("orp-ui-style")) return;
    const style = document.createElement("style");
    style.id = "orp-ui-style";
    style.textContent = UI_CSS;
    document.head.appendChild(style);
  }

  function fitScrollViewport(container) {
    let frame = 0;
    const update = () => {
      if (!container || !container.isConnected) return;
      const viewportHeight = global.visualViewport ? global.visualViewport.height : global.innerHeight;
      const top = Math.max(0, container.getBoundingClientRect().top);
      const available = Math.max(120, Math.floor(viewportHeight - top - 16));
      container.style.setProperty("--orp-available-height", `${available}px`);
    };
    const schedule = () => {
      if (frame) global.cancelAnimationFrame(frame);
      frame = global.requestAnimationFrame(update);
    };
    global.addEventListener("resize", schedule, { passive: true });
    if (global.visualViewport) global.visualViewport.addEventListener("resize", schedule, { passive: true });
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    if (observer) observer.observe(document.documentElement);
    schedule();
    return () => {
      if (frame) global.cancelAnimationFrame(frame);
      global.removeEventListener("resize", schedule);
      if (global.visualViewport) global.visualViewport.removeEventListener("resize", schedule);
      if (observer) observer.disconnect();
    };
  }

  function readStoredTemplate() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value ? app.parseTemplateJson(value) : null;
    } catch (_) { return null; }
  }

  function writeStoredTemplate(template) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
  }

  function projectFromLocation() {
    const key = new URLSearchParams(global.location.search).get("id");
    return key ? { key, name: key, qualifier: "TRK" } : null;
  }

  function freezeSnapshot(value, seen) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    const visited = seen || new WeakSet();
    if (visited.has(value)) return value;
    visited.add(value);
    Object.keys(value).forEach((key) => freezeSnapshot(value[key], visited));
    return Object.freeze(value);
  }

  function snapshotSignature(component, branchLike, settings) {
    const branch = branchLike || {};
    return JSON.stringify({
      project: component && component.key || "",
      branch: branch.key || branch.name || "",
      pullRequest: branch.pullRequest || branch.pullRequestKey || "",
      includeIssues: !!settings.includeIssues,
      includeComponents: !!settings.includeComponents,
      includeAnalyses: !!settings.includeAnalyses,
      includePeople: !!settings.includePeople,
      maxIssues: Number(settings.maxIssues),
      maxComponents: Number(settings.maxComponents)
    });
  }

  function start(root, extensionOptions) {
    injectStyle();
    const component = extensionOptions.component || projectFromLocation();
    const branchLike = extensionOptions.branchLike;
    let currentTemplate = readStoredTemplate() || app.normalizeTemplate(app.BUILTIN_TEMPLATES[1]);
    let snapshot = null;
    let preparedSignature = "";
    let controller = null;
    let working = false;

    root.innerHTML = `<main class="page page-limited orp"><header class="orp-header"><div><h1>Create offline report</h1><p class="orp-subtitle">Choose the audience and output. Data is collected once and reused while its scope stays unchanged.</p></div><div class="orp-context"><strong id="orp-project"></strong><span id="orp-branch"></span><small id="orp-cache">No data prepared</small></div></header><div class="orp-warning"><strong>Portable data warning:</strong> exports are no longer protected by SonarQube access controls. Store and share them appropriately. Source code is never exported.</div><form id="orp-form" class="orp-form">
<section class="orp-card" aria-labelledby="orp-preset-title"><div class="orp-section-head"><div><h2 id="orp-preset-title">1. Choose a report</h2><p>Start with a preset; appearance can be adjusted under Advanced.</p></div></div><div class="orp-choice-grid" id="orp-presets">${app.BUILTIN_TEMPLATES.map((template, index) => `<label class="orp-choice"><input type="radio" name="preset" value="${app.escapeHtml(template.id)}" ${index === 1 ? "checked" : ""}><strong>${app.escapeHtml(template.name)}</strong><span>${app.escapeHtml(template.description)}</span></label>`).join("")}</div></section>
<section class="orp-card" aria-labelledby="orp-format-title"><div class="orp-section-head"><div><h2 id="orp-format-title">2. Choose a format</h2><p>HTML is the best fully offline experience; Excel is best for analysis.</p></div></div><div class="orp-choice-grid orp-format-grid" id="orp-formats"><label class="orp-choice"><input type="radio" name="format" value="html" checked><strong>Offline HTML</strong><span>Searchable, navigable, single-file report.</span></label><label class="orp-choice"><input type="radio" name="format" value="xlsx"><strong>Excel</strong><span>Typed workbook for sorting and analysis.</span></label><label class="orp-choice"><input type="radio" name="format" value="docx"><strong>Word</strong><span>Fixed, editable management document.</span></label><label class="orp-choice"><input type="radio" name="format" value="print"><strong>PDF</strong><span>Opens a print-ready view; choose Save as PDF.</span></label></div>
<div id="orp-document-options" class="orp-document-options" hidden><fieldset><legend>Document content</legend><label class="orp-check"><input type="radio" name="document-mode" value="summary" checked> Executive summary</label><label class="orp-check"><input type="radio" name="document-mode" value="register"> Summary + compact issue register</label><div id="orp-scope-options" hidden><strong>Issue scope</strong><label class="orp-check"><input type="radio" name="issue-scope" value="active" checked> Actionable only (accepted and closed issues excluded)</label><label class="orp-check"><input type="radio" name="issue-scope" value="all"> All collected issues</label><small>Word supports at most 2,000 issue rows. Use Excel for larger registers.</small></div></fieldset></div>
<details><summary>Data-only formats</summary><div class="orp-choice-grid"><label class="orp-choice"><input type="radio" name="format" value="csv"><strong>Issues CSV</strong><span>Flat issue rows for other tools.</span></label><label class="orp-choice"><input type="radio" name="format" value="json"><strong>JSON snapshot</strong><span>Full collected model and manifest.</span></label></div></details></section>
<section class="orp-card"><details id="orp-advanced"><summary>Advanced data and appearance</summary><div class="orp-advanced-grid"><div><h3>Data scope</h3><fieldset><legend>Include</legend><label class="orp-check"><input id="orp-issues" type="checkbox" checked> Issues</label><label class="orp-check"><input id="orp-components" type="checkbox" checked> File/component inventory</label><label class="orp-check"><input id="orp-analyses" type="checkbox" checked> Last 100 analyses</label><label class="orp-check"><input id="orp-people" type="checkbox"> Assignee and author identifiers</label></fieldset><label>Maximum issues<input id="orp-max-issues" type="number" value="10000" min="1" max="10000"></label><small>Exports are marked incomplete if server or configured limits prevent full collection.</small></div><div><h3>Appearance</h3><label>Report title<input id="orp-title" type="text" maxlength="160"></label><label>Subtitle<input id="orp-subtitle" type="text" maxlength="240"></label><label>Accent color<input id="orp-color" type="color"></label><label>Introduction<textarea id="orp-intro" maxlength="2000"></textarea></label><label>Footer<textarea id="orp-footer" maxlength="1000"></textarea></label><fieldset><legend>Sections</legend><label class="orp-check"><input id="orp-sec-summary" type="checkbox"> Summary</label><label class="orp-check"><input id="orp-sec-measures" type="checkbox"> Measures</label><label class="orp-check"><input id="orp-sec-issues" type="checkbox"> Issues</label><label class="orp-check"><input id="orp-sec-components" type="checkbox"> Files</label><label class="orp-check"><input id="orp-sec-analyses" type="checkbox"> Analyses</label></fieldset><small>Saved templates contain presentation settings only and are stored for this browser origin.</small><div class="orp-actions"><button type="button" id="orp-save-template">Save template</button><button type="button" id="orp-use-template">Use saved</button><button type="button" id="orp-delete-template">Delete saved</button><button type="button" id="orp-export-template">Export</button><button type="button" id="orp-import-template">Import</button><input class="orp-file" id="orp-template-file" type="file" accept="application/json,.json"></div></div></div></details></section>
<div class="orp-submit"><button class="orp-primary" id="orp-create" type="submit">Create offline HTML</button><button id="orp-cancel" type="button" hidden>Cancel</button><progress id="orp-progress" class="orp-progress" aria-label="Report creation progress" max="100" value="0" hidden></progress><div id="orp-status" class="orp-status" role="status" aria-live="polite">Ready to create.</div></div></form><div class="orp-end-space" aria-hidden="true"></div></main>`;

    const releaseViewport = fitScrollViewport(root.querySelector(".orp"));

    const find = (id) => root.querySelector(`#${id}`);
    const form = find("orp-form");
    const dataControls = ["orp-issues", "orp-components", "orp-analyses", "orp-people", "orp-max-issues"].map(find);
    find("orp-project").textContent = component ? `${component.name || component.key} (${component.key})` : "Unknown project";
    find("orp-branch").textContent = app.text(branchLike && (branchLike.name || branchLike.key)) || "Main branch";

    function setStatus(message, kind) {
      const status = find("orp-status");
      status.textContent = message;
      status.dataset.kind = kind || "info";
      status.setAttribute("role", kind === "error" ? "alert" : "status");
    }

    function selected(name) {
      const input = root.querySelector(`input[name="${name}"]:checked`);
      return input && input.value;
    }

    function markChoices() {
      root.querySelectorAll(".orp-choice").forEach((choice) => {
        const radio = choice.querySelector("input[type=radio]");
        choice.classList.toggle("is-selected", !!radio && radio.checked);
      });
    }

    function showTemplate(template) {
      currentTemplate = app.normalizeTemplate(template);
      find("orp-title").value = currentTemplate.title;
      find("orp-subtitle").value = currentTemplate.subtitle;
      find("orp-color").value = currentTemplate.accentColor;
      find("orp-intro").value = currentTemplate.intro;
      find("orp-footer").value = currentTemplate.footer;
      ["summary", "measures", "issues", "components", "analyses"].forEach((key) => { find(`orp-sec-${key}`).checked = currentTemplate.sections[key]; });
    }

    function readTemplateForm() {
      return app.normalizeTemplate({
        ...currentTemplate, id: "custom", name: "Custom report",
        title: find("orp-title").value, subtitle: find("orp-subtitle").value,
        accentColor: find("orp-color").value, intro: find("orp-intro").value,
        footer: find("orp-footer").value,
        sections: Object.fromEntries(["summary", "measures", "issues", "components", "analyses"].map((key) => [key, find(`orp-sec-${key}`).checked]))
      });
    }

    function dataSettings() {
      return {
        includeIssues: find("orp-issues").checked,
        includeComponents: find("orp-components").checked,
        includeAnalyses: find("orp-analyses").checked,
        includePeople: find("orp-people").checked,
        maxIssues: Math.max(1, Math.min(10000, Number(find("orp-max-issues").value) || 10000)),
        maxComponents: 10000
      };
    }

    function currentSignature() { return snapshotSignature(component, branchLike, dataSettings()); }

    function markStale() {
      if (!snapshot || currentSignature() === preparedSignature) return;
      find("orp-cache").textContent = "Data needs refresh";
      setStatus("Data needs refresh. Create again to collect the changed scope.", "stale");
    }

    function updateFormat() {
      const format = selected("format") || "html";
      find("orp-create").textContent = `Create ${FORMAT_NAMES[format]}`;
      find("orp-document-options").hidden = !["docx", "print"].includes(format);
      find("orp-scope-options").hidden = selected("document-mode") !== "register";
      markChoices();
    }

    function setWorking(value) {
      working = value;
      root.querySelectorAll("input,textarea,select,button").forEach((control) => { control.disabled = value; });
      find("orp-cancel").disabled = !value;
      find("orp-cancel").hidden = !value;
      find("orp-progress").hidden = !value;
      if (!value) {
        find("orp-use-template").disabled = !readStoredTemplate();
        find("orp-delete-template").disabled = !readStoredTemplate();
      }
    }

    function summaryTemplate(template, includeRegister) {
      if (includeRegister) return app.normalizeTemplate({ ...template, sections: { ...template.sections, components: false, analyses: false } });
      return app.normalizeTemplate({ ...template, sections: { summary: true, measures: true, issues: false, components: false, analyses: false } });
    }

    function fileBase(report) {
      return `${report.project.key}-${new Date(report.generatedAt).toISOString().slice(0, 10)}-sonarqube-report`;
    }

    async function ensureSnapshot() {
      const signature = currentSignature();
      if (snapshot && preparedSignature === signature) return snapshot;
      controller = new AbortController();
      const progress = find("orp-progress");
      const collected = await app.collectReport(component, branchLike, dataSettings(), (progressState) => {
        setStatus(progressState.message || "Collecting current data…");
        if (progressState.total) { progress.max = progressState.total; progress.value = progressState.current || 0; }
        else progress.removeAttribute("value");
      }, controller.signal);
      snapshot = freezeSnapshot(collected);
      preparedSignature = signature;
      find("orp-cache").textContent = `Prepared ${new Date().toLocaleTimeString()}`;
      return snapshot;
    }

    async function createOutput(event) {
      event.preventDefault();
      if (working) return;
      if (!component) { setStatus("Project context is missing. Open this page from a SonarQube project.", "error"); return; }
      const format = selected("format") || "html";
      const mode = selected("document-mode") || "summary";
      const issueScope = selected("issue-scope") || "active";
      let printWindow = null;
      if (format === "print") {
        try { printWindow = global.open("", "_blank"); } catch (_) { printWindow = null; }
        if (printWindow) {
          try { printWindow.opener = null; } catch (_) { /* retained reference is still used below */ }
          printWindow.document.write("<!doctype html><meta charset=utf-8><title>Preparing PDF print view…</title><p>Preparing the PDF print view…</p>");
        }
      }
      setWorking(true);
      setStatus(snapshot && preparedSignature === currentSignature() ? "Using prepared data…" : "Collecting current data…");
      try {
        const report = await ensureSnapshot();
        const template = readTemplateForm();
        const base = fileBase(report);
        if (format === "html") {
          const html = app.buildHtmlReport(report, template, { purpose: "interactive" });
          app.downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), app.safeFileName(base, "html"));
        } else if (format === "xlsx") {
          const result = app.buildXlsx(report);
          app.downloadBlob(result.blob, app.safeFileName(base, "xlsx"));
        } else if (format === "docx") {
          const includeRegister = mode === "register";
          const result = app.buildDocx(report, summaryTemplate(template, includeRegister), { includeIssueRegister: includeRegister, issueScope });
          app.downloadBlob(result.blob, app.safeFileName(base, "docx"));
        } else if (format === "print") {
          const includeRegister = mode === "register";
          const html = app.buildHtmlReport(report, summaryTemplate(template, includeRegister), {
            purpose: "print", mode, issueScope
          });
          if (printWindow && !printWindow.closed) {
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
          } else {
            app.downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), app.safeFileName(`${base}-print-view`, "html"));
          }
        } else if (format === "csv") {
          if (!report.collectionScope.issues) throw new Error("Issues were not included in the prepared data. Enable Issues under Advanced and try again.");
          app.downloadBlob(new Blob([app.toCsv(app.issueRows(report))], { type: "text/csv;charset=utf-8" }), app.safeFileName(`${report.project.key}-issues`, "csv"));
        } else if (format === "json") {
          const content = JSON.stringify({ manifest: app.reportManifest(report), report }, null, 2);
          app.downloadBlob(new Blob([content], { type: "application/json" }), app.safeFileName(base, "json"));
        }
        const completion = format === "print"
          ? printWindow && !printWindow.closed
            ? "PDF print view opened. If the print dialog does not appear, select Print / Save as PDF in that view."
            : "The browser blocked the PDF window, so a print-ready HTML file was downloaded. Open it and select Print / Save as PDF."
          : `${FORMAT_NAMES[format]} created. Choose another format to reuse the prepared data.`;
        setStatus(completion, report.complete ? "success" : "error");
      } catch (error) {
        if (printWindow && !printWindow.closed) printWindow.close();
        setStatus(error.name === "AbortError" ? "Collection cancelled." : `Could not create ${FORMAT_NAMES[format]}: ${error.message}`, error.name === "AbortError" ? "info" : "error");
      } finally {
        controller = null;
        setWorking(false);
      }
    }

    root.addEventListener("change", (event) => {
      if (event.target.name === "preset") {
        const template = app.BUILTIN_TEMPLATES.find((item) => item.id === event.target.value);
        if (template) showTemplate(template);
      }
      if (["format", "document-mode"].includes(event.target.name)) updateFormat();
      if (dataControls.includes(event.target)) markStale();
      markChoices();
    });
    find("orp-max-issues").addEventListener("input", markStale);
    form.addEventListener("submit", createOutput);
    find("orp-cancel").addEventListener("click", () => { if (controller) controller.abort(); });
    find("orp-save-template").addEventListener("click", () => {
      try { currentTemplate = readTemplateForm(); writeStoredTemplate(currentTemplate); setStatus("Template saved in this browser.", "success"); setWorking(false); }
      catch (error) { setStatus(error.message, "error"); }
    });
    find("orp-use-template").addEventListener("click", () => { const saved = readStoredTemplate(); if (saved) { showTemplate(saved); setStatus("Saved template applied."); } });
    find("orp-delete-template").addEventListener("click", () => { localStorage.removeItem(STORAGE_KEY); showTemplate(app.BUILTIN_TEMPLATES[1]); setWorking(false); setStatus("Saved template deleted."); });
    find("orp-export-template").addEventListener("click", () => { app.downloadBlob(new Blob([JSON.stringify(readTemplateForm(), null, 2)], { type: "application/json" }), "sonarqube-report-template.json"); });
    find("orp-import-template").addEventListener("click", () => find("orp-template-file").click());
    find("orp-template-file").addEventListener("change", async (event) => {
      try {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (file.size > app.MAX_TEMPLATE_BYTES) throw new Error("Template exceeds the 64 KiB size limit.");
        showTemplate(app.parseTemplateJson(await file.text()));
        setStatus("Template imported. Save it to retain it in this browser.", "success");
      } catch (error) { setStatus(error.message, "error"); }
      event.target.value = "";
    });

    showTemplate(currentTemplate);
    setWorking(false);
    updateFormat();
    return () => { if (controller) controller.abort(); releaseViewport(); root.textContent = ""; };
  }

  Object.assign(app, { start, readStoredTemplate, writeStoredTemplate, freezeSnapshot, snapshotSignature, fitScrollViewport, UI_CSS });
})(window);


(function (global) {
  "use strict";

  if (typeof global.registerExtension !== "function") return;
  global.registerExtension("offlinereport/report_page", function (options) {
    return global.OfflineReport.start(options.el, options);
  });
})(window);

