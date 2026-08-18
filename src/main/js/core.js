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
