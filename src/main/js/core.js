(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const TEMPLATE_SCHEMA_VERSION = 2;
  const REPORT_SCHEMA_VERSION = 3;
  const MODEL_VERSION = REPORT_SCHEMA_VERSION;
  const RENDERER_VERSION = 3;
  const PLUGIN_VERSION = global.OfflineReportBuild && global.OfflineReportBuild.pluginVersion
    ? String(global.OfflineReportBuild.pluginVersion)
    : "development";
  const MAX_TEMPLATE_BYTES = 65536;
  const DATASET_KEYS = Object.freeze(["issues", "components", "analyses", "trends", "people"]);
  const CSV_PROVENANCE_HEADERS = Object.freeze([
    "Record Type", "Report ID", "Report Mode", "Artifact Format", "Artifact Purpose", "Artifact Mode",
    "Applied Issue Scope", "Collection Complete", "Artifact Complete", "Generated At UTC",
    "Collection Started At UTC", "Collection Completed At UTC", "Plugin Version", "Report Schema Version",
    "Model Version", "Renderer Version", "SonarQube Version", "Server Base URL", "Server Base URL Scope",
    "Source Revision", "Source Digest", "Plugin Artifact Digest", "Artifact Digest", "Artifact Digest State",
    "Collected At UTC", "Requested Project Keys", "Actual Project Keys",
    "Selected Dataset States", "Issues Dataset State", "Expected Issues", "Exported Issues", "Issue Limit", "Warnings"
  ]);
  const DANGEROUS_CELL = /^[\u0000-\u0020]*[=+\-@\uFF1D\uFF0B\uFF0D\uFF20]/;
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
    coverage: "Coverage", line_coverage: "Line Coverage", branch_coverage: "Condition Coverage",
    lines_to_cover: "Lines to Cover", uncovered_lines: "Uncovered Lines",
    conditions_to_cover: "Conditions to Cover", uncovered_conditions: "Uncovered Conditions",
    duplicated_lines_density: "Duplicated Lines", duplicated_lines: "Duplicated Lines Count",
    files: "Files", ncloc: "Lines of Code", tests: "Unit Tests", test_errors: "Test Errors",
    test_failures: "Test Failures", skipped_tests: "Skipped Tests", test_execution_time: "Test Duration",
    test_success_density: "Test Success", new_bugs: "New Bugs", new_code_smells: "New Code Smells",
    new_coverage: "New Code Coverage", new_line_coverage: "New Code Line Coverage",
    new_branch_coverage: "New Code Condition Coverage", new_lines_to_cover: "New Lines to Cover",
    new_uncovered_lines: "New Uncovered Lines", new_conditions_to_cover: "New Conditions to Cover",
    new_uncovered_conditions: "New Uncovered Conditions", new_duplicated_lines_density: "New Code Duplication",
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
      persona: "CTO / CIO",
      requiredDatasets: { issues: true, trends: true },
      title: "Code Quality Executive Report",
      subtitle: "Current SonarQube project snapshot",
      accentColor: "#1f6feb",
      intro: "A concise, portable overview of the project's current quality position.",
      footer: "Generated from SonarQube. Treat this report as sensitive project information.",
      sections: { summary: true, measures: true, issues: false, components: false, analyses: false, trends: true, dataQuality: true },
      issuePageSize: 50
    }),
    Object.freeze({
      schemaVersion: 2,
      id: "executive-technical",
      name: "Executive + technical",
      description: "Decision summary followed by engineering evidence and issue drill-down.",
      persona: "Engineering leadership",
      requiredDatasets: { issues: true, components: true, analyses: true, trends: true },
      title: "Code Quality Decision Report",
      subtitle: "Executive position and engineering evidence",
      accentColor: "#0f766e",
      intro: "Start with project health and confidence, then use the evidence sections to prioritize engineering work.",
      footer: "Generated from SonarQube. Counts can change after a new analysis or issue update.",
      sections: { summary: true, measures: true, issues: true, components: true, analyses: true, trends: true, dataQuality: true },
      issuePageSize: 100
    }),
    Object.freeze({
      schemaVersion: 2,
      id: "technical",
      name: "Detailed technical",
      description: "Full measures, issue analytics, components, trends, timeline and evidence.",
      persona: "Engineering manager / architect",
      requiredDatasets: { issues: true, components: true, analyses: true, trends: true },
      title: "Detailed Code Quality Report",
      subtitle: "Offline engineering review",
      accentColor: "#0f766e",
      intro: "Investigate issue drivers, aging, effort, rules and component concentrations from one reconciled snapshot.",
      footer: "Generated from SonarQube. Verify current issue state before remediation.",
      sections: { summary: true, measures: true, issues: true, components: true, analyses: true, trends: true, dataQuality: true },
      issuePageSize: 100
    }),
    Object.freeze({
      schemaVersion: 2,
      id: "issues",
      name: "Issues only",
      description: "A focused issue register for remediation work.",
      persona: "Developer / technical lead",
      requiredDatasets: { issues: true, components: true },
      title: "Issue Remediation Register",
      subtitle: "Searchable offline issue inventory",
      accentColor: "#b45309",
      intro: "Filter by severity, type, and status to focus remediation work.",
      footer: "Generated from SonarQube. Verify current status in SonarQube before acting.",
      sections: { summary: true, measures: false, issues: true, components: false, analyses: false, trends: false, dataQuality: true },
      issuePageSize: 100
    }),
    Object.freeze({
      schemaVersion: 2,
      id: "portfolio",
      name: "Portfolio review",
      description: "Project comparison, quality gates, risks, confidence and bounded drill-down.",
      persona: "CTO / delivery leadership",
      requiredDatasets: { issues: true, components: true, trends: true },
      title: "Engineering Portfolio Review",
      subtitle: "Project health, priorities and collection confidence",
      accentColor: "#0b6b69",
      intro: "A factual portfolio view for deciding where leadership and engineering attention are needed.",
      footer: "Generated from SonarQube. Partial and unavailable data are identified explicitly.",
      sections: { summary: true, measures: true, issues: true, components: true, analyses: true, trends: true, dataQuality: true },
      issuePageSize: 100
    }),
    Object.freeze({
      schemaVersion: 2,
      id: "delivery",
      name: "Delivery and program",
      description: "Project attention, issue aging, debt, ownership fields when approved, and change evidence.",
      persona: "Delivery / program manager",
      requiredDatasets: { issues: true, components: true, analyses: true, trends: true },
      title: "Engineering Delivery Risk Report",
      subtitle: "Priorities, aging, debt and evidence",
      accentColor: "#315b7d",
      intro: "Identify which projects need attention, why they need it, and how current the supporting evidence is.",
      footer: "Generated from SonarQube. Ownership appears only when people identifiers were explicitly approved for collection.",
      sections: { summary: true, measures: true, issues: true, components: true, analyses: true, trends: true, dataQuality: true },
      issuePageSize: 100
    }),
    Object.freeze({
      schemaVersion: 2,
      id: "security",
      name: "Application security",
      description: "Vulnerabilities, security impacts, hotspot review evidence, aging and collection confidence.",
      persona: "Application security architect",
      requiredDatasets: { issues: true, components: true, trends: true },
      title: "Application Security Evidence Report",
      subtitle: "Vulnerabilities, hotspot review and security change",
      accentColor: "#7a3e00",
      intro: "Review source-backed security issues and hotspot-review evidence without treating an unreviewed hotspot as a confirmed vulnerability.",
      footer: "Generated from SonarQube. Security Hotspots require contextual human review; this artifact does not make that decision.",
      sections: { summary: true, measures: true, issues: true, components: true, analyses: false, trends: true, dataQuality: true },
      issuePageSize: 100
    }),
    Object.freeze({
      schemaVersion: 2,
      id: "qa-audit",
      name: "QA and data audit",
      description: "Coverage and test evidence, file-level gaps, reconciliation, history and provenance.",
      persona: "QA lead / data auditor",
      requiredDatasets: { issues: true, components: true, analyses: true, trends: true },
      title: "Quality Assurance Evidence Report",
      subtitle: "Coverage, tests, reconciliation and provenance",
      accentColor: "#4d4b8f",
      intro: "Treat every number as evidence: inspect test and coverage gaps, reconcile dataset totals, and review freshness before drawing conclusions.",
      footer: "Generated from SonarQube. Missing values remain unavailable and are never interpreted as zero or pass.",
      sections: { summary: true, measures: true, issues: true, components: true, analyses: true, trends: true, dataQuality: true },
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

  function xmlSafeText(value) {
    let result = "";
    for (const character of text(value)) {
      const codePoint = character.codePointAt(0);
      if (codePoint === 0x09 || codePoint === 0x0A || codePoint === 0x0D
        || (codePoint >= 0x20 && codePoint <= 0xD7FF)
        || (codePoint >= 0xE000 && codePoint <= 0xFFFD)
        || (codePoint >= 0x10000 && codePoint <= 0x10FFFF)) {
        result += character;
      } else {
        result += "\uFFFD";
      }
    }
    return result;
  }

  function xmlEscape(value) {
    return xmlSafeText(value)
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
    const source = Array.isArray(rows) ? rows : [];
    const envelope = source.csvEnvelope;
    let serializedRows = source;
    if (envelope) {
      const issueHeader = source[0] || [];
      const provenance = CSV_PROVENANCE_HEADERS.map((header) => envelope[header] === undefined ? "" : envelope[header]);
      const blankIssueCells = issueHeader.map(() => "");
      const manifestIssueCells = blankIssueCells.slice();
      [
        ["Project", envelope.projectName], ["Project Key", envelope.projectKey],
        ["Branch / Pull Request", envelope.branch]
      ].forEach(([header, value]) => {
        const index = issueHeader.indexOf(header);
        if (index >= 0) manifestIssueCells[index] = value || "";
      });
      serializedRows = [
        [...CSV_PROVENANCE_HEADERS, ...issueHeader],
        ["MANIFEST", ...provenance.slice(1), ...manifestIssueCells],
        ...source.slice(1).map((row) => ["ISSUE", ...provenance.slice(1), ...row])
      ];
    }
    return `\uFEFF${serializedRows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
  }

  function sanitizeSingleLine(value, maxLength) {
    return text(value).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength);
  }

  function sanitizeMultiline(value, maxLength) {
    return text(value).replace(/\u0000/g, "").trim().slice(0, maxLength);
  }

  function colorContrastWithWhite(value) {
    if (!/^#[0-9a-fA-F]{6}$/.test(text(value))) return 0;
    const channels = [1, 3, 5].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255)
      .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    return 1.05 / (luminance + 0.05);
  }

  function normalizeTemplate(candidate, fallback) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const base = fallback || BUILTIN_TEMPLATES[2];
    if (source.schemaVersion !== undefined && ![1, TEMPLATE_SCHEMA_VERSION].includes(Number(source.schemaVersion))) {
      throw new Error(`Unsupported template schema version: ${source.schemaVersion}`);
    }
    const requestedColor = /^#[0-9a-fA-F]{6}$/.test(text(source.accentColor)) ? source.accentColor : base.accentColor;
    const color = colorContrastWithWhite(requestedColor) >= 4.5 ? requestedColor : base.accentColor;
    const sections = source.sections && typeof source.sections === "object" ? source.sections : {};
    const requiredSource = source.requiredDatasets !== undefined ? source.requiredDatasets : base.requiredDatasets;
    const requiredSet = Array.isArray(requiredSource) ? new Set(requiredSource.map((value) => text(value))) : null;
    const requiredObject = requiredSource && !Array.isArray(requiredSource) && typeof requiredSource === "object" ? requiredSource : {};
    return {
      schemaVersion: TEMPLATE_SCHEMA_VERSION,
      id: sanitizeSingleLine(source.id || "custom", 50) || "custom",
      name: sanitizeSingleLine(source.name || base.name, 80) || base.name,
      description: sanitizeSingleLine(source.description || base.description, 240),
      persona: sanitizeSingleLine(source.persona !== undefined ? source.persona : base.persona || "General", 60) || "General",
      requiredDatasets: Object.fromEntries(DATASET_KEYS.map((key) => [key, requiredSet ? requiredSet.has(key) : requiredObject[key] === true])),
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
        analyses: sections.analyses !== undefined ? !!sections.analyses : base.sections.analyses,
        trends: sections.trends !== undefined ? !!sections.trends : base.sections.trends !== false,
        dataQuality: sections.dataQuality !== undefined ? !!sections.dataQuality : base.sections.dataQuality !== false
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

  function issueLifecycle(issue) {
    const stored = text(issue && issue.lifecycleStatus).trim().toLowerCase();
    if (["actionable", "accepted", "closed", "unknown"].includes(stored)) return stored;
    return issueLifecycleStatus(issue && issue.status, issue && issue.resolution);
  }

  function datasetStateInfo(report, key) {
    const source = report && report.datasetStates && report.datasetStates[key];
    const scope = report && report.collectionScope || {};
    const hasState = !!source && typeof source === "object";
    const fallbackRequested = scope[key] === true;
    const state = hasState && source.state ? text(source.state) : fallbackRequested ? "complete" : "not_requested";
    const requested = state === "not_requested" ? false
      : hasState && source.requested !== undefined ? !!source.requested : fallbackRequested;
    const unavailable = ["not_requested", "not_available", "permission_denied"].includes(state);
    return {
      requested,
      state,
      reason: hasState ? text(source.reason || source.terminationReason) : "",
      available: requested && !unavailable,
      complete: requested && state === "complete",
      label: state === "not_requested" ? "Not requested"
        : state === "not_available" ? "Not available"
          : state === "permission_denied" ? "Permission denied"
            : state === "partial_limit" ? "Partial - limit reached"
              : state === "partial_error" ? "Partial - collection error"
                : state === "complete" ? "Complete" : humanize(state) || "Unknown"
    };
  }

  function reportManifest(report) {
    const scope = report.collectionScope || {};
    if (report && report.reportMode === "portfolio") {
      return {
        manifestVersion: 2,
        reportSchemaVersion: report.schemaVersion,
        modelVersion: report.modelVersion || MODEL_VERSION,
        rendererVersion: report.rendererVersion || RENDERER_VERSION,
        pluginVersion: report.pluginVersion || PLUGIN_VERSION,
        reportId: report.reportId,
        reportMode: "portfolio",
        product: "SonarQube Offline Report Plugin",
        disclaimer: "Custom plugin output; not an official SonarQube product report.",
        generatedAt: report.generatedAt,
        collectionStartedAt: report.collectionStartedAt,
        collectionCompletedAt: report.collectionCompletedAt,
        collectedAt: report.collectedAt,
        collectionComplete: report.collectionComplete !== undefined ? !!report.collectionComplete : !!report.complete,
        serverBaseUrl: report.serverBaseUrl,
        serverBaseUrlScope: report.serverBaseUrlScope,
        sourceRevision: report.sourceRevision,
        sourceDigest: report.sourceDigest === null || report.sourceDigest === undefined ? "not_computed" : report.sourceDigest,
        pluginArtifactDigest: report.pluginArtifactDigest === null || report.pluginArtifactDigest === undefined ? "not_computed" : report.pluginArtifactDigest,
        artifactDigest: report.artifact && report.artifact.artifactDigest || "not_computed",
        artifactDigestState: report.artifact && report.artifact.artifactDigestState || "not_computed",
        artifact: report.artifact || null,
        requestedScope: report.requestedScope || {},
        actualScope: report.actualScope || {},
        complete: !!report.complete,
        portfolioSummary: report.portfolioSummary || {},
        counts: {
          issues: report.aggregateIssueSummary || {},
          projects: report.portfolioSummary || {},
          exported: report.artifact && report.artifact.exportedCounts || {}
        },
        datasetStates: report.datasetStates || {},
        warnings: [...new Set([...(report.warnings || []), ...((report.artifact && report.artifact.warnings) || [])])]
      };
    }
    const issues = datasetStateInfo(report, "issues");
    const components = datasetStateInfo(report, "components");
    const analyses = datasetStateInfo(report, "analyses");
    const trends = datasetStateInfo(report, "trends");
    const people = datasetStateInfo(report, "people");
    return {
      manifestVersion: 2,
      reportSchemaVersion: report.schemaVersion,
      modelVersion: report.modelVersion || MODEL_VERSION,
      rendererVersion: report.rendererVersion || RENDERER_VERSION,
      pluginVersion: report.pluginVersion || PLUGIN_VERSION,
      reportId: report.reportId,
      reportMode: report.reportMode || "single",
      product: "SonarQube Offline Report Plugin",
      disclaimer: "Custom plugin output; not an official SonarQube product report.",
      generatedAt: report.generatedAt,
      collectionStartedAt: report.collectionStartedAt,
      collectionCompletedAt: report.collectionCompletedAt,
      collectedAt: report.collectedAt,
      collectionComplete: report.collectionComplete !== undefined ? !!report.collectionComplete : !!report.complete,
      serverVersion: report.serverVersion,
      serverBaseUrl: report.serverBaseUrl,
      serverBaseUrlScope: report.serverBaseUrlScope,
      sourceRevision: report.sourceRevision,
      sourceDigest: report.sourceDigest === null || report.sourceDigest === undefined ? "not_computed" : report.sourceDigest,
      pluginArtifactDigest: report.pluginArtifactDigest === null || report.pluginArtifactDigest === undefined ? "not_computed" : report.pluginArtifactDigest,
      artifactDigest: report.artifact && report.artifact.artifactDigest || "not_computed",
      artifactDigestState: report.artifact && report.artifact.artifactDigestState || "not_computed",
      artifact: report.artifact || null,
      project: {
        key: report.project && report.project.key,
        name: report.project && report.project.name,
        branch: report.branchLabel,
        analysisDate: report.project && report.project.analysisDate,
        analysisDateAfterCollection: report.analysisDateAfterCollection
      },
      scope: {
        issues: issues.requested,
        components: components.requested,
        analyses: analyses.requested,
        trends: trends.requested,
        people: people.requested,
        issueScope: report.artifact && report.artifact.issueScope || scope.issueScope || "all-collected"
      },
      complete: !!report.complete,
      datasetStates: report.datasetStates || {},
      counts: {
        issues: report.issuePaging || {},
        components: report.componentPaging || {},
        analyses: report.analysisPaging || {},
        trends: report.trendPaging || {}
      },
      warnings: [...new Set([...(report.warnings || []), ...((report.artifact && report.artifact.warnings) || [])])]
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
    if (minutes === null || minutes === undefined || minutes === "") return "Not Available";
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
    const issues = app.flattenReportIssues ? app.flattenReportIssues(report) : (report.issues || []).map((issue) => ({
      ...issue,
      reportProjectKey: report.project && report.project.key,
      reportProjectName: report.project && report.project.name,
      reportBranch: report.branchLabel,
      reportRuleName: ((report.rules || []).find((rule) => rule && rule.key === issue.rule) || {}).name || "Metadata Unavailable"
    }));
    const header = [
      "Project", "Project Key", "Branch / Pull Request",
      "Issue Key", "Rule Key", "Rule Name", "Software Quality", "Legacy Issue Type", "Impact Severity", "Legacy Severity",
      "Normalized Lifecycle", "Raw SonarQube Status", "Resolution", "Message", "File or Component", "Line", "Remediation Effort",
      "Effort Minutes", "Age Days", "Age Bucket", "Language", "Assignee", "Author", "Tags", "Clean Code Attribute",
      "Text Range", "Created At", "Updated At", "Closed At"
    ];
    const rows = issues.map((issue) => [
      issue.reportProjectName, issue.reportProjectKey, issue.reportBranch,
      issue.key, issue.rule, issue.reportRuleName, (issue.softwareQualities || (app.issueQualities ? app.issueQualities(issue) : [])).join("; "),
      humanize(issue.type), (issue.impactSeverities || (app.issueImpactSeverities ? app.issueImpactSeverities(issue) : [])).join("; "), humanize(issue.severity),
      humanize(issue.normalizedLifecycle || issueLifecycle(issue)), humanize(issue.status), humanize(issue.resolution) || "Not Provided",
      issue.message, issue.component, issue.line, formatEffort(issue.effort), issue.effortMinutes === null || issue.effortMinutes === undefined ? "" : issue.effortMinutes,
      issue.ageDays === null || issue.ageDays === undefined ? "" : issue.ageDays, issue.ageBucket || "Unknown age",
      issue.language ? languageLabel(issue.language) : "Not Provided", issue.assignee, issue.author,
      (issue.tags || []).map(humanize).join("; "), humanize(issue.cleanCodeAttribute) || "Not Provided",
      formatTextRange(issue.textRange), formatExportDate(issue.creationDate),
      formatExportDate(issue.updateDate), formatExportDate(issue.closeDate)
    ]);
    const result = [header, ...rows];
    const manifest = reportManifest(report);
    const artifact = report.artifact || {};
    const portfolioDatasetState = (key) => {
      const evidenceName = key === "trends" ? "historical metrics" : key;
      const states = [...new Set((report.projects || []).map((entry) => {
        const state = entry.datasetStates && entry.datasetStates[key];
        if (state) return text(state.state || (state.requested ? "unknown" : "not_requested"));
        const evidence = (entry.collectionEvidence && entry.collectionEvidence.datasets || []).find((item) => text(item.dataset).toLowerCase() === evidenceName);
        return evidence ? text(evidence.state || (evidence.requested ? "unknown" : "not_requested")) : "not_requested";
      }))];
      return states.length === 1 ? states[0] : states.length ? `mixed:${states.sort().join("+")}` : "not_requested";
    };
    const issueState = report.reportMode === "portfolio" ? portfolioDatasetState("issues") : datasetStateInfo(report, "issues").state;
    const projectKeys = report.reportMode === "portfolio"
      ? (report.requestedScope && report.requestedScope.projectKeys || [])
      : [report.project && report.project.key].filter(Boolean);
    const actualProjectKeys = report.reportMode === "portfolio"
      ? (report.actualScope && report.actualScope.projectKeys || [])
      : [report.project && report.project.key].filter(Boolean);
    const serverVersions = report.reportMode === "portfolio"
      ? [...new Set((report.projects || []).map((entry) => entry.collectionEvidence && entry.collectionEvidence.serverVersion).filter(Boolean))]
      : [report.serverVersion].filter(Boolean);
    const issueExpected = report.reportMode === "portfolio"
      ? report.aggregateIssueSummary && report.aggregateIssueSummary.expected
      : report.issuePaging && report.issuePaging.expected;
    const issueExported = artifact.exportedCounts && artifact.exportedCounts.issues !== undefined
      ? artifact.exportedCounts.issues
      : report.reportMode === "portfolio" ? report.aggregateIssueSummary && report.aggregateIssueSummary.totalCollected
        : report.issuePaging && report.issuePaging.exported !== undefined ? report.issuePaging.exported : issues.length;
    const issueLimit = report.reportMode === "portfolio"
      ? report.requestedScope && report.requestedScope.maxIssues
      : report.issuePaging && report.issuePaging.limit;
    const selectedStates = report.reportMode === "portfolio"
      ? DATASET_KEYS.map((key) => `${key}=${portfolioDatasetState(key)}`).join("; ")
      : DATASET_KEYS.map((key) => `${key}=${datasetStateInfo(report, key).state}`).join("; ");
    const warningValues = [...new Set([...(report.warnings || []), ...(artifact.warnings || [])].map(text).filter(Boolean))];
    const envelope = {
      "Report ID": manifest.reportId,
      "Report Mode": manifest.reportMode,
      "Artifact Format": artifact.format || "csv",
      "Artifact Purpose": artifact.purpose || "data",
      "Artifact Mode": artifact.mode || "register",
      "Applied Issue Scope": artifact.issueScope || "all-collected",
      "Collection Complete": artifact.collectionComplete !== undefined ? artifact.collectionComplete ? "Yes" : "No" : report.collectionComplete !== undefined ? report.collectionComplete ? "Yes" : "No" : report.complete ? "Yes" : "No",
      "Artifact Complete": artifact.artifactComplete !== undefined ? artifact.artifactComplete ? "Yes" : "No" : report.collectionComplete !== undefined ? report.collectionComplete ? "Yes" : "No" : report.complete ? "Yes" : "No",
      "Generated At UTC": artifact.exportedAt || report.generatedAt,
      "Collection Started At UTC": report.collectionStartedAt,
      "Collection Completed At UTC": report.collectionCompletedAt,
      "Plugin Version": report.pluginVersion || PLUGIN_VERSION,
      "Report Schema Version": report.schemaVersion,
      "Model Version": report.modelVersion || MODEL_VERSION,
      "Renderer Version": report.rendererVersion || RENDERER_VERSION,
      "SonarQube Version": serverVersions.join("; "),
      "Server Base URL": report.serverBaseUrl || "",
      "Server Base URL Scope": report.serverBaseUrlScope || "",
      "Source Revision": report.sourceRevision || "",
      "Source Digest": report.sourceDigest === null || report.sourceDigest === undefined ? "not_computed" : report.sourceDigest,
      "Plugin Artifact Digest": report.pluginArtifactDigest === null || report.pluginArtifactDigest === undefined ? "not_computed" : report.pluginArtifactDigest,
      "Artifact Digest": artifact.artifactDigest || "not_computed",
      "Artifact Digest State": artifact.artifactDigestState || "not_computed",
      "Collected At UTC": report.collectedAt || "",
      "Requested Project Keys": projectKeys.join("; "),
      "Actual Project Keys": actualProjectKeys.join("; "),
      "Selected Dataset States": selectedStates,
      "Issues Dataset State": issueState,
      "Expected Issues": issueExpected,
      "Exported Issues": issueExported,
      "Issue Limit": issueLimit,
      "Warnings": warningValues.join(" | "),
      projectName: report.project && report.project.name,
      projectKey: report.project && report.project.key,
      branch: report.branchLabel
    };
    Object.defineProperty(result, "csvEnvelope", { value: Object.freeze(envelope), enumerable: false });
    return result;
  }

  Object.assign(app, {
    TEMPLATE_SCHEMA_VERSION,
    REPORT_SCHEMA_VERSION,
    MODEL_VERSION,
    RENDERER_VERSION,
    PLUGIN_VERSION,
    MAX_TEMPLATE_BYTES,
    DATASET_KEYS,
    CSV_PROVENANCE_HEADERS,
    BUILTIN_TEMPLATES,
    text,
    escapeHtml,
    xmlSafeText,
    xmlEscape,
    jsonForHtml,
    safeFileName,
    formulaSafe,
    csvCell,
    toCsv,
    colorContrastWithWhite,
    normalizeTemplate,
    parseTemplateJson,
    downloadBlob,
    formatDate,
    randomReportId,
    issueLifecycleStatus,
    issueLifecycle,
    datasetStateInfo,
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
