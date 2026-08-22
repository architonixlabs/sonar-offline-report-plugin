/* SonarQube Offline Report Plugin 2.0.0 - generated; edit src/main/js and run npm run build. */
window.OfflineReportBuild = Object.freeze({"pluginVersion":"2.0.0","sourceRevision":null,"sourceRevisionBase":null,"sourceState":"unstamped","sourceDirty":null,"sourceRevisionVerified":false,"sourceDigest":"sha256:93ff5b892eb12393ff07d54c61659235e5ae73f98507df3567bc257cbb9fea35","sourceDigestScope":"plugin-build-inputs-v1","pluginArtifactDigest":null,"pluginArtifactDigestState":"not_computed","bundleName":"portfolio_page.js","bundleSourceDigest":"sha256:2a32775c5bcafb073bf4bf42b707303364abb7831addb5e12b7aa9532649175a","bundleSourceDigestScope":"ordered-browser-source-inputs-v1"});
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

(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};

  const REPORT_RUNTIME = `(function(){
"use strict";
var report=null,template=null,exportOptions={};
var state={query:"",impact:"",status:"actionable",type:"",sort:"risk",page:1};
var severityRank={BLOCKER:0,CRITICAL:1,HIGH:1,MAJOR:2,MEDIUM:2,MINOR:3,LOW:3,INFO:4};
var metricLabels={alert_status:"Quality Gate",ncloc:"Lines of Code",coverage:"Coverage",new_coverage:"New Code Coverage",duplicated_lines_density:"Duplication",new_duplicated_lines_density:"New Code Duplication",complexity:"Cyclomatic Complexity",cognitive_complexity:"Cognitive Complexity",bugs:"Bugs",new_bugs:"New Bugs",vulnerabilities:"Vulnerabilities",new_vulnerabilities:"New Vulnerabilities",code_smells:"Code Smells",new_code_smells:"New Code Smells",reliability_rating:"Reliability Rating",security_rating:"Security Rating",sqale_rating:"Maintainability Rating",sqale_index:"Technical Debt",security_hotspots:"Security Hotspots",new_security_hotspots:"New Security Hotspots",security_hotspots_reviewed:"Hotspots Reviewed",security_review_rating:"Security Review Rating",new_security_hotspots_reviewed:"New Hotspots Reviewed",new_violations:"New Violations",tests:"Tests",test_errors:"Test Errors",test_failures:"Test Failures",skipped_tests:"Skipped Tests",test_execution_time:"Test Execution Time",test_success_density:"Test Success Density"};
function array(v){return Array.isArray(v)?v:[];}
function el(tag,className,text){var node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text===null?"":String(text);return node;}
function value(v){return v===null||v===undefined||v===""?"\u2014":String(v);}
function number(v){var n=Number(v);return Number.isFinite(n)?n:null;}
function formatNumber(v,digits){var n=number(v);return n===null?value(v):n.toLocaleString(undefined,{maximumFractionDigits:digits===undefined?2:digits});}
function formatDate(v){if(!v)return"Not provided";var d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0")+" "+String(d.getUTCHours()).padStart(2,"0")+":"+String(d.getUTCMinutes()).padStart(2,"0")+":"+String(d.getUTCSeconds()).padStart(2,"0")+" UTC";}
function humanize(v){var original=String(v||"").trim(),overrides={CODE_SMELL:"Code Smell",FALSE_POSITIVE:"False Positive",WONTFIX:"Won't Fix",TO_REVIEW:"To Review",IN_REVIEW:"In Review",SECURITY_HOTSPOT:"Security Hotspot"},key=original.toUpperCase().replace(/-/g,"_");if(!original)return"Not provided";if(overrides[key])return overrides[key];return original.replace(/[_-]+/g," ").replace(/\\s+/g," ").toLowerCase().replace(/\\b\\w/g,function(c){return c.toUpperCase();});}
function languageLabel(v){var labels={cs:"C#",css:"CSS",docker:"Docker",go:"Go",html:"HTML",java:"Java",js:"JavaScript",json:"JSON",kotlin:"Kotlin",php:"PHP",py:"Python",ruby:"Ruby",scala:"Scala",ts:"TypeScript",web:"Web",xml:"XML"};return labels[String(v||"").toLowerCase()]||humanize(v);}
function qualifierLabel(v){var labels={APP:"Application",BRC:"Subproject",DIR:"Directory",FIL:"File",MOD:"Module",PROJECT:"Project",TRK:"Project",UTS:"Test File",VW:"Portfolio"};return labels[String(v||"").toUpperCase()]||humanize(v);}
function impactLabel(v){return String(v||"").split(":").filter(Boolean).map(humanize).join(" \u2013 ");}
function formatEffort(v){var original=String(v||"").trim(),match=original.match(/^([0-9.]+)(min|h|d)$/i);if(!match)return value(v);var amount=Number(match[1]),unit=match[2].toLowerCase()==="min"?"min":match[2].toLowerCase()==="h"?"hr":"day";return match[1]+" "+unit+(amount===1||unit==="min"?"":"s");}
function formatTextRange(range){if(!range||typeof range!=="object")return"Not provided";var start=range.startLine,end=range.endLine===undefined?start:range.endLine,line=start===undefined?"Line not provided":start===end?"Line "+start:"Lines "+start+"\u2013"+end,offsets=range.startOffset===undefined&&range.endOffset===undefined?"":", columns "+(range.startOffset===undefined?"?":range.startOffset)+"\u2013"+(range.endOffset===undefined?"?":range.endOffset);return line+offsets;}
function duration(minutes){var n=Math.max(0,Math.round(number(minutes)||0)),hours=Math.floor(n/60),mins=n%60,parts=[];if(hours)parts.push(hours+"h");if(mins||!parts.length)parts.push(mins+"m");return parts.join(" ");}
function analysisAge(){var analysis=new Date(report.project&&report.project.analysisDate).getTime(),generated=new Date(report.generatedAt).getTime();if(!Number.isFinite(analysis)||!Number.isFinite(generated))return null;var diff=Math.max(0,generated-analysis),days=Math.floor(diff/86400000),hours=Math.floor((diff%86400000)/3600000);return{days:days,text:days+" day"+(days===1?"":"s")+" "+hours+" hour"+(hours===1?"":"s")};}
function collectionComplete(){return report.collectionComplete!==undefined?!!report.collectionComplete:!!report.complete;}
function artifactComplete(){return report.artifact&&report.artifact.artifactComplete!==undefined?!!report.artifact.artifactComplete:report.artifactComplete!==undefined?!!report.artifactComplete:null;}
function collected(name){return !report.collectionScope||report.collectionScope[name]!==false;}
function datasetState(name){var source=report.datasetStates&&report.datasetStates[name];return source||{requested:collected(name),state:collected(name)?"complete":"not_requested"};}
function incompleteDatasets(){return Object.keys(report.datasetStates||{}).map(function(key){return{key:key,value:datasetState(key)};}).filter(function(item){return item.value&&item.value.requested!==false&&item.value.state!=="complete";}).map(function(item){return humanize(item.key)+": "+humanize(item.value.state)+(item.value.reason?" ("+humanize(item.value.reason)+")":"");});}
function datasetStateLabel(name){var info=datasetState(name),labels={complete:"Complete",not_requested:"Not requested",not_available:"Not available",permission_denied:"Permission denied",partial_limit:"Partial - limit reached",partial_error:"Partial - collection error"},label=labels[info.state]||humanize(info.state)||"Unknown";return info.reason?label+" ("+humanize(info.reason)+")":label;}
function issueEmptyState(){var info=datasetState("issues");return info.state==="complete"?{title:"No issues returned",text:"SonarQube returned zero issue records for the selected project scope."}:{title:"Issue data unavailable",text:"No issue rows are available because the dataset state is "+datasetStateLabel("issues")+". Review collection warnings and provenance before using this report."};}
function reportWarnings(){var seen={},values=array(report.warnings).concat(array(report.artifact&&report.artifact.warnings));return values.filter(function(item){var key=String(item||"");if(!key||seen[key])return false;seen[key]=true;return true;});}
function lifecycle(issue){if(issue&&(issue.normalizedLifecycle||issue.lifecycleStatus))return String(issue.normalizedLifecycle||issue.lifecycleStatus).toLowerCase();var key=String(issue&&issue.status||"").toUpperCase();if(["OPEN","CONFIRMED","REOPENED","TO_REVIEW","IN_REVIEW"].includes(key))return"actionable";if(key==="ACCEPTED")return"accepted";if(["FIXED","FALSE_POSITIVE","WONTFIX","CLOSED","RESOLVED","REMOVED"].includes(key))return"closed";return"unknown";}
function active(issue){return lifecycle(issue)==="actionable";}
function rank(v){var key=String(v||"").toUpperCase();return severityRank[key]===undefined?9:severityRank[key];}
function impact(issue){var impacts=array(issue&&issue.impactSeverities).concat(array(issue&&issue.impacts).map(function(item){return String(item).split(":").pop();}));return impacts.sort(function(a,b){return rank(a)-rank(b);})[0]||issue&&issue.severity||"Unknown";}
function ruleMetadata(key){return array(report.rules).find(function(rule){return rule&&rule.key===key;});}
function ruleLabel(key){var rule=ruleMetadata(key);return rule&&rule.name?rule.name+" ("+key+")":value(key)+" (metadata unavailable)";}
function friendlyStatus(status){var key=String(status||"UNKNOWN").toUpperCase();return key==="ERROR"?"Failed":key==="OK"?"Passed":humanize(key);}
function tone(status){var key=String(status||"").toUpperCase();if(["ERROR","FAILED","BLOCKER","CRITICAL","HIGH"].includes(key))return"danger";if(["WARN","WARNING","MEDIUM","MAJOR","ACTIONABLE"].includes(key))return"warning";if(["OK","PASSED","LOW","MINOR","CLOSED"].includes(key))return"success";return"neutral";}
function badge(textValue,toneValue){return el("span","badge badge-"+(toneValue||"neutral"),textValue);}
function sectionEnabled(name){if(name==="provenance")return true;var enabled=!!(template.sections&&template.sections[name]);if(exportOptions.purpose!=="print")return enabled;if(name==="summary")return true;if(name==="measures")return enabled;if(name==="issues")return exportOptions.mode==="register"&&enabled;return false;}
function gateHasConditions(){return array(report.qualityGate&&report.qualityGate.conditions).length>0;}
function gateLabel(){var result=friendlyStatus(report.qualityGate&&report.qualityGate.status);return"SonarQube gate result: "+result+(result==="Passed"&&!gateHasConditions()?" (0 conditions returned)":"");}
function gateTone(){return friendlyStatus(report.qualityGate&&report.qualityGate.status)==="Passed"&&!gateHasConditions()?"warning":tone(report.qualityGate&&report.qualityGate.status);}
function section(id,title,lead){var node=el("section","report-section");node.id=id;node.appendChild(el("h2","section-title",title));if(lead)node.appendChild(el("p","section-lead",lead));if(id==="issues"&&collected("issues")&&array(report.issues).length)node.appendChild(barList("Top rules affecting actionable issues",countBy(array(report.issues).filter(active),function(issue){return ruleLabel(issue.rule);}),10));document.getElementById("report-content").appendChild(node);return node;}
function emptyState(title,text){var box=el("div","empty-state");box.appendChild(el("strong","",title));box.appendChild(el("p","",text));return box;}
function table(headers,rows,caption){var wrap=el("div","table-wrap");wrap.tabIndex=0;wrap.setAttribute("role","region");wrap.setAttribute("aria-label",caption);var t=el("table");t.appendChild(el("caption","sr-only",caption));var thead=el("thead"),tr=el("tr");headers.forEach(function(h){var th=el("th","",h);th.scope="col";tr.appendChild(th);});thead.appendChild(tr);t.appendChild(thead);var body=el("tbody");rows.forEach(function(row){var r=el("tr");row.forEach(function(cell,index){var node=el(index===0?"th":"td","",value(cell));if(index===0)node.scope="row";r.appendChild(node);});body.appendChild(r);});t.appendChild(body);wrap.appendChild(t);return wrap;}
function measure(key){return array(report.measures).find(function(item){return item.metric===key;});}
function gateCondition(key){return array(report.qualityGate&&report.qualityGate.conditions).find(function(item){return item.metricKey===key;});}
function rawMeasure(key){var m=measure(key);if(m){if(key.indexOf("new_")===0&&m.period&&m.period.value!==undefined)return m.period.value;if(m.value!==undefined)return m.value;if(m.period&&m.period.value!==undefined)return m.period.value;}var condition=gateCondition(key);return condition&&condition.actualValue!==undefined?condition.actualValue:null;}
function rating(v){var n=Math.round(number(v)||0);return n>=1&&n<=5?String.fromCharCode(64+n):value(v);}
function metricValue(key){var v=rawMeasure(key);if(v===null||v===undefined||v==="")return"Not available";if(key.indexOf("rating")>=0)return rating(v);if(key.indexOf("coverage")>=0||key.indexOf("density")>=0||key.indexOf("reviewed")>=0)return formatNumber(v,2)+"%";if(key==="sqale_index")return duration(v);if(key==="ncloc")return formatNumber(v,0)+" LOC";if(key==="alert_status")return friendlyStatus(v);return formatNumber(v,2);}
function sum(items,selector){return items.reduce(function(total,item){return total+(number(selector(item))||0);},0);}
function issueCounts(){var issues=array(report.issues),counts={total:issues.length,actionable:0,accepted:0,closed:0,unknown:0};issues.forEach(function(issue){var state=lifecycle(issue);counts[state]===undefined?counts.unknown+=1:counts[state]+=1;});return counts;}
function countBy(items,selector){var map={};items.forEach(function(item){var key=value(selector(item));map[key]=(map[key]||0)+1;});return Object.keys(map).map(function(key){return{label:key,value:map[key]};}).sort(function(a,b){return b.value-a.value;});}
function barList(title,items,limit){var block=el("div","insight-card"),list=el("div","bar-list"),shown=items.slice(0,limit||items.length),max=Math.max.apply(null,shown.map(function(item){return item.value;}).concat([1]));list.setAttribute("role","list");block.appendChild(el("h3","",title));shown.forEach(function(item){var row=el("div","bar-row"),label=el("span","bar-label",item.label),track=el("span","bar-track"),fill=el("span","bar-fill"),count=el("strong","bar-value",formatNumber(item.value,0));row.setAttribute("role","listitem");label.title=item.label;track.setAttribute("aria-hidden","true");fill.style.width=(Number(item.value)>0?Math.max(2,(item.value/max)*100):0)+"%";track.appendChild(fill);row.appendChild(label);row.appendChild(track);row.appendChild(count);list.appendChild(row);});block.appendChild(list);return block;}
function statCard(label,val,context,toneValue){var card=el("div","stat-card"+(toneValue?" stat-"+toneValue:""));card.appendChild(el("span","stat-label",label));card.appendChild(el("strong","stat-value",val));if(context)card.appendChild(el("span","stat-context",context));return card;}
function scopeLabel(name,enabled){return badge((enabled?"Included: ":"Excluded: ")+name,enabled?"success":"neutral");}
function scopeText(included){var names={issues:"Issues",components:"Files",analyses:"Analysis events",trends:"Metric trends",people:"People fields"};return Object.keys(names).filter(function(key){return included?collected(key):!collected(key);}).map(function(key){return names[key];}).join(", ")||(included?"Core measures only":"None");}
function renderDecisionContext(host){var required=Object.keys(template.requiredDatasets||{}).filter(function(key){return template.requiredDatasets[key]===true;}).map(humanize).join(", ")||"No additional profile requirement declared",artifact=artifactComplete(),rows=[["Intended audience",template.persona||"General"],["Release readiness","Not determined by this report"],["Collection confidence",collectionComplete()?"Complete for requested scope":"Incomplete - review collection evidence"],["Artifact completeness",artifact===null?"Not declared":artifact?"Complete for selected profile and artifact scope":"Incomplete - review artifact warnings"],["Profile-required datasets",required],["Requested scope",scopeText(true)],["Excluded scope",scopeText(false)],["Snapshot freshness",analysisAge()?analysisAge().text+" old; apply your organizational freshness policy":"Unknown; analysis timestamp unavailable"]],box=el("aside","decision-frame");box.setAttribute("aria-label","Decision context");box.appendChild(el("h3","","Decision context"));box.appendChild(definitionList(rows));host.appendChild(box);}
function renderDataHealth(host){var complete=collectionComplete(),warnings=reportWarnings(),failures=incompleteDatasets(),health=el("div","data-health "+(complete?"health-complete":"health-partial"));health.appendChild(el("strong","health-title",complete?"Collection complete for requested scope":"Collection incomplete"));health.appendChild(el("span","health-copy",complete?"Every requested dataset reconciled. Excluded datasets remain outside this completeness claim.":failures.length?"Incomplete datasets: "+failures.join("; ")+". Review provenance below.":"Some requested data could not be collected or reconciled. Review provenance below."));host.appendChild(health);if(warnings.length){var box=el("div","warning-box");box.appendChild(el("h3","","Collection and artifact warnings"));var list=el("ul");warnings.forEach(function(w){list.appendChild(el("li","",w));});box.appendChild(list);host.appendChild(box);}}
function conditionValue(condition){var key=condition.metricKey||"",percent=key.indexOf("coverage")>=0||key.indexOf("density")>=0||key.indexOf("reviewed")>=0,unit=percent?"%":"",thresholdValue=condition.errorThreshold!==undefined?condition.errorThreshold:condition.warningThreshold,actual=number(condition.actualValue),threshold=number(thresholdValue),required=condition.comparator==="LT"?"at least ":condition.comparator==="GT"?"at most ":"threshold ",variance="Variance unavailable";if(actual!==null&&threshold!==null){var difference=actual-threshold,suffix=percent?" percentage points":"";if(condition.comparator==="LT")variance=difference>=0?formatNumber(difference,5)+suffix+" above minimum":formatNumber(Math.abs(difference),5)+suffix+" below minimum";else if(condition.comparator==="GT")variance=difference<=0?formatNumber(Math.abs(difference),5)+suffix+" headroom":formatNumber(difference,5)+suffix+" above limit";}return{actual:formatNumber(condition.actualValue,5)+unit,required:required+formatNumber(thresholdValue,5)+unit,variance:variance};}
function renderGate(host){var gate=report.qualityGate||{},conditions=array(gate.conditions).slice().sort(function(a,b){return(a.status==="ERROR"?-1:1)-(b.status==="ERROR"?-1:1);}),failed=conditions.filter(function(c){return c.status==="ERROR";}).length,panel=el("div","gate-panel gate-"+gateTone()),head=el("div","gate-heading");head.appendChild(badge(gateLabel(),gateTone()));head.appendChild(el("strong","gate-count",gate.ignoredConditions?"Conditions ignored by SonarQube":conditions.length?failed+" of "+conditions.length+" conditions failed":"No gate conditions returned"));panel.appendChild(head);if(gate.ignoredConditions)panel.appendChild(el("p","gate-note","SonarQube marked quality-gate conditions as ignored for this analysis."));if(!conditions.length)panel.appendChild(el("p","gate-note","The raw SonarQube result is preserved, but a pass with no returned conditions does not establish release readiness or override the evidence below."));if(conditions.length){panel.appendChild(el("p","gate-note","Thresholds are the configured SonarQube quality-gate evidence; they are not a release approval."));var grid=el("div","condition-grid");conditions.forEach(function(c){var vals=conditionValue(c),card=el("article","condition-card condition-"+tone(c.status));card.appendChild(badge(friendlyStatus(c.status),tone(c.status)));card.appendChild(el("h3","",metricLabels[c.metricKey]||humanize(c.metricKey)||"Condition"));card.appendChild(el("strong","condition-actual",vals.actual));card.appendChild(el("span","condition-required","Required: "+vals.required));card.appendChild(el("span","condition-variance",vals.variance));grid.appendChild(card);});panel.appendChild(grid);}host.appendChild(panel);}
function effortMinutes(issue){var match=String(issue.effort||"").match(/([0-9.]+)(min|h|d)/);return match?Number(match[1])*(match[2]==="d"?480:match[2]==="h"?60:1):0;}
function unreviewedHotspots(){var hotspots=number(rawMeasure("security_hotspots")),reviewed=number(rawMeasure("security_hotspots_reviewed"));return hotspots===null||reviewed===null?null:Math.max(0,Math.round(hotspots*(100-reviewed)/100));}
function renderSummary(){if(!sectionEnabled("summary"))return;var s=section("summary","Decision summary","Source facts, collection confidence, freshness, and material evidence requiring human review."),counts=issueCounts(),activeIssues=array(report.issues).filter(active),high=activeIssues.filter(function(i){return["BLOCKER","CRITICAL","HIGH"].includes(String(impact(i)).toUpperCase());}).length,debt=sum(activeIssues,effortMinutes),analysis=analysisAge(),vulnerabilities=number(rawMeasure("vulnerabilities")),unreviewed=unreviewedHotspots(),hotspots=number(rawMeasure("security_hotspots")),reviewed=number(rawMeasure("security_hotspots_reviewed"));renderDecisionContext(s);renderDataHealth(s);renderGate(s);var cards=el("div","stats-grid");cards.appendChild(statCard("Actionable issues",collected("issues")?formatNumber(counts.actionable,0):"Not collected",collected("issues")?formatNumber(counts.total,0)+" collected records":"Issue dataset excluded",counts.actionable?"warning":"success"));cards.appendChild(statCard("High-impact actionable",collected("issues")?formatNumber(high,0):"Not collected","Blocker, critical, or high impact",high?"danger":"success"));cards.appendChild(statCard("Vulnerabilities",vulnerabilities===null?"Not available":formatNumber(vulnerabilities,0),"Source SonarQube measure",vulnerabilities?"danger":""));cards.appendChild(statCard("Unreviewed hotspots",unreviewed===null?"Not available":formatNumber(unreviewed,0),hotspots===null?"Hotspot measure unavailable":formatNumber(hotspots,0)+" total · "+(reviewed===null?"review rate unavailable":formatNumber(reviewed,2)+"% reviewed"),unreviewed?"danger":""));cards.appendChild(statCard("Coverage",metricValue("coverage"),"New code: "+metricValue("new_coverage"),number(rawMeasure("coverage"))===0?"danger":""));cards.appendChild(statCard("Issue remediation effort",collected("issues")?duration(debt):"Not collected","Sum of actionable issue effort; distinct from SonarQube technical debt"));cards.appendChild(statCard("New-code violations",metricValue("new_violations"),"Not available means no usable source value",number(rawMeasure("new_violations"))?"danger":""));cards.appendChild(statCard("Snapshot age",analysis?analysis.text:"Unknown",formatDate(report.project&&report.project.analysisDate)+" · apply organizational freshness policy",analysis&&analysis.days>=30?"warning":""));s.appendChild(cards);if(collected("issues")){var insights=el("div","insights-grid"),quality=[];activeIssues.forEach(function(issue){var values=array(issue.softwareQualities);if(!values.length&&issue.type)values=[issue.type];values.forEach(function(item){quality.push({label:humanize(item)});});});insights.appendChild(barList("Actionable issues by impact",countBy(activeIssues,function(i){return humanize(impact(i));}),5));insights.appendChild(barList("Issue records by raw status",countBy(array(report.issues),function(i){return friendlyStatus(i.status);}),6));insights.appendChild(barList("Actionable issues by software quality",countBy(quality,function(i){return i.label;}),6));insights.appendChild(barList("Actionable issues by age",countBy(activeIssues,function(i){return i.ageBucket||"Unknown age";}),8));s.appendChild(insights);}}
function componentMeasure(component,key){var item=array(component&&component.measures).find(function(entry){return entry&&entry.metric===key;});if(!item)return null;return item.value!==undefined?item.value:item.period&&item.period.value!==undefined?item.period.value:null;}
function renderQaEvidence(host){var keys=["tests","test_failures","test_errors","skipped_tests","test_execution_time","test_success_density"],hasProject=keys.some(function(key){return !!measure(key);}),measuredFiles=array(report.components).filter(function(component){return array(component&&component.measures).some(function(item){return item&&["coverage","uncovered_lines","lines_to_cover"].includes(item.metric);});}),section=el("article","qa-evidence");section.appendChild(el("h3","","QA and test evidence"));section.appendChild(el("p","section-note","Unavailable values are not treated as zero. File coverage is shown only when SonarQube returned component measures."));var cards=el("div","stats-grid");[["Tests","tests"],["Failures","test_failures"],["Errors","test_errors"],["Skipped","skipped_tests"],["Execution time","test_execution_time"],["Success density","test_success_density"]].forEach(function(item){var raw=rawMeasure(item[1]),display=raw===null||raw===undefined||raw===""?"Not available":item[1]==="test_success_density"?formatNumber(raw,2)+"%":item[1]==="test_execution_time"?formatNumber(raw,0)+" ms":formatNumber(raw,0);cards.appendChild(statCard(item[0],display,"SonarQube test measure"));});section.appendChild(cards);if(measuredFiles.length){var rows=measuredFiles.map(function(component){return{component:component,coverage:number(componentMeasure(component,"coverage")),uncovered:number(componentMeasure(component,"uncovered_lines")),lines:number(componentMeasure(component,"lines_to_cover"))};}).sort(function(a,b){if(a.coverage===null&&b.coverage!==null)return 1;if(a.coverage!==null&&b.coverage===null)return-1;return(a.coverage===null?0:a.coverage)-(b.coverage===null?0:b.coverage)||(b.uncovered||0)-(a.uncovered||0);}).slice(0,20).map(function(item){return[shortPath(item.component.path||item.component.name||item.component.key),item.coverage===null?"Not available":formatNumber(item.coverage,2)+"%",item.uncovered===null?"Not available":formatNumber(item.uncovered,0),item.lines===null?"Not available":formatNumber(item.lines,0)];});section.appendChild(table(["File","Coverage","Uncovered lines","Lines to cover"],rows,"Lowest available file coverage"));}else section.appendChild(emptyState("File coverage unavailable","No per-file coverage measures were returned for this snapshot."));if(!hasProject&& !measuredFiles.length)section.classList.add("qa-unavailable");host.appendChild(section);}
function renderMeasures(){if(!sectionEnabled("measures"))return;var s=section("measures","Quality and verification evidence","Overall, new-code, security-review, and test evidence organized by engineering outcome."),groups=[{title:"Coverage and duplication",items:[["Coverage","coverage","new_coverage"],["Duplication","duplicated_lines_density","new_duplicated_lines_density"]]},{title:"Reliability and security",items:[["Bugs","bugs","new_bugs"],["Vulnerabilities","vulnerabilities","new_vulnerabilities"],["Security hotspots","security_hotspots",null],["Hotspots reviewed","security_hotspots_reviewed","new_security_hotspots_reviewed"],["Security review rating","security_review_rating",null],["Reliability rating","reliability_rating",null],["Security rating","security_rating",null]]},{title:"Maintainability",items:[["Code smells","code_smells","new_code_smells"],["Technical debt","sqale_index",null],["Maintainability rating","sqale_rating",null]]},{title:"Size and complexity",items:[["Lines of code","ncloc",null],["Cyclomatic complexity","complexity",null],["Cognitive complexity","cognitive_complexity",null]]}],matrix=el("div","metric-groups");groups.forEach(function(group){var card=el("article","metric-group");card.appendChild(el("h3","",group.title));var rows=group.items.filter(function(item){return measure(item[1])||item[2]&&measure(item[2]);}).map(function(item){return[item[0],metricValue(item[1]),item[2]?metricValue(item[2]):"Not applicable"];});card.appendChild(rows.length?table(["Measure","Overall","New code"],rows,group.title+" measures"):emptyState("Measures unavailable","No source measure was returned for this group."));matrix.appendChild(card);});s.appendChild(matrix);renderQaEvidence(s);var raw=el("details","raw-details"),rows=array(report.measures).map(function(m){return[metricLabels[m.metric]||humanize(m.metric),metricValue(m.metric),m.metric.indexOf("new_")===0?metricValue(m.metric):m.period&&m.period.value!==undefined?metricValue(m.metric):"Not applicable",m.bestValue===true?"Yes":m.bestValue===false?"No":"Not provided"];});raw.appendChild(el("summary","","Show detailed measure values"));raw.appendChild(table(["Measure","Displayed value","New-code value","At best value?"],rows,"Detailed SonarQube measure values"));s.appendChild(raw);}
function unique(field){var values={};array(report.issues).forEach(function(issue){if(issue[field])values[issue[field]]=true;});return Object.keys(values).sort();}
function uniqueImpacts(){var values={};array(report.issues).forEach(function(issue){var current=impact(issue);if(current)values[current]=true;});return Object.keys(values).sort(function(a,b){return rank(a)-rank(b)||a.localeCompare(b);});}
function compactIssueNode(issue){var article=el("article","issue issue-compact");article.appendChild(el("strong","",humanize(impact(issue))+" impact | "+humanize(lifecycle(issue))+" lifecycle | Raw "+friendlyStatus(issue.status)));article.appendChild(el("p","issue-title",value(issue.message)));article.appendChild(el("p","issue-location",value(issue.component)+(issue.line?":"+issue.line:"")+" \u00b7 "+ruleLabel(issue.rule)+" \u00b7 "+formatEffort(issue.effort)));return article;}
function fillSelect(select,values){values.forEach(function(item){var option=el("option","",humanize(item));option.value=item;select.appendChild(option);});}
function labeledControl(labelText,control){var label=el("label","filter-control");label.appendChild(el("span","",labelText));label.appendChild(control);return label;}
function filteredIssues(){var q=state.query.toLowerCase();return array(report.issues).filter(function(issue){var hay=[issue.key,issue.rule,ruleLabel(issue.rule),issue.message,issue.component,issue.assignee,array(issue.tags).join(" ")].join(" ").toLowerCase();return(!q||hay.indexOf(q)>=0)&&(state.status==="all"||lifecycle(issue)===state.status)&&(!state.impact||impact(issue)===state.impact)&&(!state.type||issue.type===state.type);}).sort(function(a,b){if(state.sort==="risk")return rank(impact(a))-rank(impact(b))||String(a.message).localeCompare(String(b.message));if(state.sort==="newest")return String(b.creationDate).localeCompare(String(a.creationDate));if(state.sort==="oldest")return String(a.creationDate).localeCompare(String(b.creationDate));return String(a.component).localeCompare(String(b.component),undefined,{numeric:true});});}
function issueId(issue){return"issue-"+String(issue.key).replace(/[^a-zA-Z0-9_-]/g,"-");}
function definitionList(rows){var dl=el("dl","detail-grid");rows.forEach(function(row){dl.appendChild(el("dt","",row[0]));dl.appendChild(el("dd","",value(row[1])));});return dl;}
function issueNode(issue){var article=el("article","issue");article.id=issueId(issue);var top=el("div","issue-top"),badges=el("div","issue-badges");badges.appendChild(badge(humanize(impact(issue))+" impact",tone(impact(issue))));badges.appendChild(badge(humanize(lifecycle(issue))+" lifecycle",tone(lifecycle(issue))));badges.appendChild(badge("Raw "+friendlyStatus(issue.status),"neutral"));if(issue.type)badges.appendChild(badge("Legacy type: "+humanize(issue.type),"neutral"));top.appendChild(badges);var heading=el("h3","issue-title"),anchor=el("a","",value(issue.message));anchor.href="#"+article.id;heading.appendChild(anchor);top.appendChild(heading);article.appendChild(top);article.appendChild(el("p","issue-location",value(issue.component)+(issue.line?":"+issue.line:"")+" \u00b7 "+ruleLabel(issue.rule)));var details=el("details","issue-details");details.appendChild(el("summary","","View evidence and remediation fields"));details.appendChild(definitionList([["Suggested next step",lifecycle(issue)==="actionable"?"Triage against current source, then assign an owner and due date":lifecycle(issue)==="accepted"?"Validate the accepted-risk rationale and review date":lifecycle(issue)==="closed"?"Verify closure before using this snapshot as evidence":"Review the unrecognized lifecycle in SonarQube"],["Issue key",issue.key],["Normalized lifecycle",humanize(issue.normalizedLifecycle||lifecycle(issue))],["Raw SonarQube status",humanize(issue.status)],["Software quality",array(issue.softwareQualities).join(", ")||array(issue.impacts).map(function(item){return humanize(String(item).split(":")[0]);}).join(", ")],["Impact severity",array(issue.impactSeverities).join(", ")||humanize(impact(issue))],["Legacy severity",humanize(issue.severity)],["Legacy type",humanize(issue.type)],["Rule",ruleLabel(issue.rule)],["File or component",issue.component],["Line",issue.line],["Language",issue.language?languageLabel(issue.language):"Not provided"],["Text range",formatTextRange(issue.textRange)],["Resolution",humanize(issue.resolution)],["Remediation effort",formatEffort(issue.effort)],["Age",issue.ageDays===null||issue.ageDays===undefined?"Unknown":issue.ageDays+" days ("+value(issue.ageBucket)+")"],["Clean Code attribute",humanize(issue.cleanCodeAttribute)],["Tags",array(issue.tags).map(humanize).join(", ")],["Created",formatDate(issue.creationDate)],["Updated",formatDate(issue.updateDate)],["Closed",formatDate(issue.closeDate)],["Assignee",collected("people")?issue.assignee:"Excluded by selection"],["Author",collected("people")?issue.author:"Excluded by selection"],["Source snippet","Not collected; use the file, line, text range, and rule to inspect current source"]]));article.appendChild(details);return article;}
function renderIssues(){if(!sectionEnabled("issues"))return;var host=section("issues","Issue investigation","Lifecycle, modern impact, raw SonarQube status, and legacy fields remain distinct."),counts=issueCounts();if(!collected("issues")){host.appendChild(emptyState("Issues not collected","This export was created without the issue dataset."));return;}if(!array(report.issues).length){var empty=issueEmptyState();host.appendChild(emptyState(empty.title,empty.text));return;}var tabs=el("div","status-summary"),statusSelect=el("select");tabs.setAttribute("aria-label","Issue lifecycle summary");[["Actionable",counts.actionable,"actionable"],["Accepted",counts.accepted,"accepted"],["Closed",counts.closed,"closed"],["Unknown lifecycle",counts.unknown,"unknown"],["All collected",counts.total,"all"]].forEach(function(item){var button=el("button","status-tab",item[0]+" "+formatNumber(item[1],0));button.type="button";button.dataset.status=item[2];button.addEventListener("click",function(){state.status=item[2];state.page=1;statusSelect.value=item[2];draw();});tabs.appendChild(button);});host.appendChild(tabs);var controls=el("div","filters"),search=el("input"),impactSelect=el("select"),type=el("select"),sort=el("select"),clear=el("button","clear-filters","Clear filters");search.id="issue-search";search.type="search";search.placeholder="Message, rule, file, key, or tag";impactSelect.id="impact-filter";impactSelect.appendChild(new Option("All impact levels",""));fillSelect(impactSelect,uniqueImpacts());statusSelect.id="lifecycle-filter";[["Actionable","actionable"],["Accepted","accepted"],["Closed","closed"],["Unknown lifecycle","unknown"],["All collected","all"]].forEach(function(item){statusSelect.appendChild(new Option(item[0],item[1]));});type.id="type-filter";type.appendChild(new Option("All legacy types",""));fillSelect(type,unique("type"));sort.id="sort-filter";[["Impact first","risk"],["Newest first","newest"],["Oldest first","oldest"],["File path","file"]].forEach(function(item){sort.appendChild(new Option(item[0],item[1]));});clear.type="button";controls.appendChild(labeledControl("Search",search));controls.appendChild(labeledControl("Modern impact",impactSelect));controls.appendChild(labeledControl("Lifecycle",statusSelect));controls.appendChild(labeledControl("Legacy type",type));controls.appendChild(labeledControl("Sort",sort));controls.appendChild(clear);host.appendChild(controls);var count=el("p","result-count");count.tabIndex=-1;count.setAttribute("aria-live","polite");host.appendChild(count);var printNote=el("aside","browser-print-manifest");printNote.setAttribute("aria-label","Browser print issue scope");host.appendChild(printNote);var list=el("div","issue-list");host.appendChild(list);var pager=el("div","pager"),prev=el("button","","Previous"),next=el("button","","Next"),pageLabel=el("span");prev.type="button";next.type="button";pager.appendChild(prev);pager.appendChild(pageLabel);pager.appendChild(next);host.appendChild(pager);
function updateTabs(){Array.prototype.forEach.call(tabs.querySelectorAll("button"),function(button){var selected=button.dataset.status===state.status;button.classList.toggle("is-active",selected);button.setAttribute("aria-pressed",selected?"true":"false");});}
function draw(printAll){var issues=filteredIssues(),size=template.issuePageSize||100,pages=Math.max(1,Math.ceil(issues.length/size));state.page=Math.min(state.page,pages);var start=(state.page-1)*size;list.textContent="";(printAll?issues:issues.slice(start,start+size)).forEach(function(issue){list.appendChild(printAll?compactIssueNode(issue):issueNode(issue));});count.textContent=printAll?issues.length+" matching issues prepared for print":issues.length?"Showing "+(start+1)+"\u2013"+Math.min(start+size,issues.length)+" of "+issues.length+" matching issues":"No issues match these filters";printNote.textContent="Browser print scope: "+issues.length+" matching issue rows prepared / "+array(report.issues).length+" collected. Lifecycle "+humanize(state.status)+". Report ID "+value(report.reportId)+". Generated "+formatDate(report.generatedAt)+".";pageLabel.textContent="Page "+state.page+" of "+pages;prev.disabled=state.page<=1;next.disabled=state.page>=pages;pager.hidden=printAll||issues.length<=size;updateTabs();}
function revealHash(){var wanted=decodeURIComponent(location.hash.slice(1));if(wanted.indexOf("issue-")!==0)return;var issues=filteredIssues(),index=issues.findIndex(function(issue){return issueId(issue)===wanted;});if(index<0){state.query=state.impact=state.type="";state.status="all";search.value=impactSelect.value=type.value="";statusSelect.value="all";issues=filteredIssues();index=issues.findIndex(function(issue){return issueId(issue)===wanted;});}if(index>=0){state.page=Math.floor(index/(template.issuePageSize||100))+1;draw();setTimeout(function(){var target=document.getElementById(wanted);if(target){target.scrollIntoView();var link=target.querySelector("h3 a");if(link)link.focus();}},0);}}
controls.addEventListener("input",function(event){if(event.target===search)state.query=search.value;if(event.target===impactSelect)state.impact=impactSelect.value;if(event.target===statusSelect)state.status=statusSelect.value;if(event.target===type)state.type=type.value;if(event.target===sort)state.sort=sort.value;state.page=1;draw();});clear.addEventListener("click",function(){state={query:"",impact:"",status:"actionable",type:"",sort:"risk",page:1};search.value=impactSelect.value=type.value="";statusSelect.value="actionable";sort.value="risk";draw();search.focus();});prev.addEventListener("click",function(){state.page-=1;draw();count.focus();host.scrollIntoView();});next.addEventListener("click",function(){state.page+=1;draw();count.focus();host.scrollIntoView();});globalThis.addEventListener("hashchange",revealHash);globalThis.addEventListener("beforeprint",function(){draw(true);});globalThis.addEventListener("afterprint",function(){draw();});draw();revealHash();}
function shortPath(valueText){var text=String(valueText||"");return text.length>90?"\u2026"+text.slice(-89):text;}
function renderComponents(){if(!sectionEnabled("components"))return;var host=section("components","Files and remediation concentration","Files are ranked by actionable issue count; the complete inventory remains available below.");if(!collected("components")){host.appendChild(emptyState("Files not collected","This export was created without the file inventory."));return;}var components=array(report.components),activeIssues=array(report.issues).filter(active),byComponent={};activeIssues.forEach(function(issue){var key=issue.component||"Unmatched component";byComponent[key]=(byComponent[key]||0)+1;});var ranked=Object.keys(byComponent).map(function(key){return{label:shortPath(key),value:byComponent[key]};}).sort(function(a,b){return b.value-a.value;});if(ranked.length)host.appendChild(barList("Top files by actionable issues",ranked,12));else host.appendChild(emptyState("No actionable file concentration","No actionable issues could be joined to file/component keys."));var languages=countBy(components,function(c){return languageLabel(c.language);});if(languages.length)host.appendChild(barList("Files by language",languages,10));var details=el("details","raw-details"),rows=components.map(function(c){return[c.name,c.path,languageLabel(c.language),qualifierLabel(c.qualifier),c.key,byComponent[c.key]||0];});details.appendChild(el("summary","","Browse all "+components.length+" collected files"));details.appendChild(table(["Name","Path","Language","Component type","Component key","Actionable issues"],rows,"Collected file and component inventory"));host.appendChild(details);}
function renderAnalyses(){if(!sectionEnabled("analyses"))return;var host=section("analyses","Analysis history","An audit timeline of collected analyses; this is not a quality trend because metric history was not collected.");if(!collected("analyses")){host.appendChild(emptyState("Analyses not collected","This export was created without analysis history."));return;}var analyses=array(report.analyses).slice().sort(function(a,b){return String(b.date).localeCompare(String(a.date));});if(!analyses.length){host.appendChild(emptyState("No analyses returned","SonarQube returned no analysis history for this project."));return;}var timeline=el("ol","timeline");analyses.forEach(function(a,index){var item=el("li","timeline-item");item.appendChild(el("time","timeline-date",formatDate(a.date)));item.appendChild(el("strong","",a.projectVersion||(index===0?"Latest collected analysis":"Analysis")));var meta=[a.revision,array(a.events).map(function(e){return humanize(e.category)+": "+value(e.name);}).join("; ")].filter(Boolean).join(" \u00b7 ");if(meta)item.appendChild(el("p","timeline-meta",meta));timeline.appendChild(item);});host.appendChild(timeline);}
function renderTrends(){if(!sectionEnabled("trends"))return;var host=section("trends","Historical metric trends","Current and previous retained measurements from SonarQube metric history. Analysis events are not used as metric values.");if(!collected("trends")){host.appendChild(emptyState("Trend data not collected","Historical metric collection was not requested for this export."));return;}var series=array(report.trends);if(!series.length){host.appendChild(emptyState("Trend data unavailable","SonarQube returned no usable historical metric series for this scope."));return;}var rows=series.map(function(item){var current=item.current,previous=item.previous,absolute=item.absoluteChange,percentage=item.percentageChange;return[metricLabels[item.metric]||humanize(item.metric),current?formatNumber(current.value,3):"Not available",previous?formatNumber(previous.value,3):"Not available",absolute===null||absolute===undefined?"Not available":formatNumber(absolute,3),percentage===null||percentage===undefined?"Not available":formatNumber(percentage,2)+"%",item.period?formatDate(item.period.from)+" to "+formatDate(item.period.to):"Insufficient history",item.source||"Not recorded"];});host.appendChild(table(["Metric","Current","Previous","Absolute change","Percentage change","Period","Source"],rows,"Historical metric trend evidence"));}
function renderProvenance(){var s=section("provenance","Data provenance","Collection scope, reconciliation, decision boundaries, and limitations for this portable snapshot."),uniqueRules={},rules=array(report.rules);array(report.issues).forEach(function(i){if(i.rule)uniqueRules[i.rule]=true;});var uniqueRuleCount=Object.keys(uniqueRules).length,ruleCoverage=uniqueRuleCount?rules.filter(function(r){return r&&r.key&&uniqueRules[r.key];}).length:0,issuePaging=report.issuePaging||{},componentPaging=report.componentPaging||{},analysisPaging=report.analysisPaging||{},trendPaging=report.trendPaging||{};var rows=[["Issues",datasetStateLabel("issues"),issuePaging.exported!==undefined?issuePaging.exported:array(report.issues).length,issuePaging.expected!==undefined?issuePaging.expected:"Not recorded",issuePaging.limit||"Not recorded"],["Files",datasetStateLabel("components"),componentPaging.exported!==undefined?componentPaging.exported:array(report.components).length,componentPaging.expected!==undefined?componentPaging.expected:"Not recorded",componentPaging.limit||"Not recorded"],["Analyses",datasetStateLabel("analyses"),analysisPaging.exported!==undefined?analysisPaging.exported:array(report.analyses).length,analysisPaging.expected!==undefined?analysisPaging.expected:"Not recorded",analysisPaging.limit||100],["Historical metrics",datasetStateLabel("trends"),trendPaging.exported!==undefined?trendPaging.exported:array(report.trends).length,trendPaging.expected!==undefined?trendPaging.expected:"Not recorded",trendPaging.terminationReason||trendPaging.limit||"Not recorded"],["People",datasetStateLabel("people"),collected("people")?"Included fields":"0","Not applicable","Not applicable"],["Rule metadata",ruleCoverage===uniqueRuleCount?"Complete":"Partial",ruleCoverage,uniqueRuleCount,"Metadata returned with issue pages"]];s.appendChild(table(["Dataset","State","Exported","Expected/unique","Limit or note"],rows,"Dataset collection provenance"));if(uniqueRuleCount&&ruleCoverage<uniqueRuleCount){var warning=el("div","warning-box");warning.appendChild(el("strong","","Rule metadata is incomplete"));warning.appendChild(el("p","",ruleCoverage+" of "+uniqueRuleCount+" unique rule keys have metadata in this report. Issue keys remain available, but missing rule names cannot be reconstructed offline."));s.appendChild(warning);}s.appendChild(definitionList([["Intended audience",template.persona||"General"],["Collection confidence",collectionComplete()?"Complete for requested scope":"Incomplete - review warnings and dataset evidence"],["Artifact completeness",artifactComplete()===null?"Not declared":artifactComplete()?"Complete for selected profile and artifact scope":"Incomplete - review artifact warnings"],["Release readiness","Not determined by this report"],["Requested scope",scopeText(true)],["Excluded scope",scopeText(false)],["Report ID",report.reportId],["Model version",report.modelVersion],["Renderer version",report.rendererVersion],["Plugin version",report.pluginVersion],["Project key",report.project&&report.project.key],["Branch",report.branchLabel],["Analysis timestamp",formatDate(report.project&&report.project.analysisDate)],["Collection started",formatDate(report.collectionStartedAt)],["Collection completed",formatDate(report.collectionCompletedAt)],["Export generated",formatDate(report.generatedAt)],["SonarQube server version",report.serverVersion],["Snapshot consistency",report.analysisSnapshotConsistent===true?"Verified":report.analysisSnapshotConsistent===false?"Changed during collection":"Not verified"],["Snapshot semantics","Non-transactional current snapshot; data may change after export."],["Source code","Never collected by this plugin."]]));}
function setupNavigation(){var links=Array.prototype.slice.call(document.querySelectorAll(".toc a"));links.forEach(function(link){link.addEventListener("click",function(){links.forEach(function(item){item.removeAttribute("aria-current");});link.setAttribute("aria-current","location");});});var disclosure=document.getElementById("toc-disclosure");if(disclosure&&globalThis.matchMedia&&globalThis.matchMedia("(max-width: 760px)").matches)disclosure.removeAttribute("open");}
function setupPrintView(){if(exportOptions.purpose!=="print")return;var button=document.getElementById("print-now");if(button)button.addEventListener("click",function(){globalThis.focus();globalThis.print();});globalThis.addEventListener("load",function(){globalThis.setTimeout(function(){globalThis.focus();globalThis.print();},750);},{once:true});}
function init(){report=JSON.parse(document.getElementById("report-data").textContent);template=JSON.parse(document.getElementById("template-data").textContent);exportOptions=report.exportOptions||{};report.project=report.project||{};report.collectionScope=report.collectionScope||{};if(exportOptions.purpose==="print"&&exportOptions.mode==="register")state.status=exportOptions.issueScope==="all"?"all":"actionable";document.title=template.title+" \u2014 "+report.project.name;document.querySelector(".cover .eyebrow").textContent=(template.persona||"General")+" evidence dossier | SonarQube offline report";document.getElementById("report-title").textContent=template.title;document.getElementById("report-subtitle").textContent=template.subtitle;document.getElementById("project-name").textContent=report.project.name||report.project.key||"Unknown project";var projectMeta=[report.project.key&&report.project.key!==report.project.name?report.project.key:null,report.branchLabel,report.project.version&&!/^not provided$/i.test(report.project.version)?report.project.version:null].filter(Boolean);document.getElementById("project-meta").textContent=projectMeta.join(" \u00b7 ");document.getElementById("intro").textContent=template.intro;document.getElementById("analysis-meta").textContent="Analyzed "+formatDate(report.project.analysisDate);document.getElementById("generated").textContent="Exported "+formatDate(report.generatedAt);document.getElementById("footer-text").textContent=template.footer;var coverStatus=document.getElementById("cover-status"),age=analysisAge(),complete=collectionComplete(),artifact=artifactComplete();coverStatus.appendChild(badge(gateLabel(),gateTone()));coverStatus.appendChild(badge("Collection: "+(complete?"Complete for requested scope":"Incomplete"),complete?"success":"danger"));if(artifact!==null)coverStatus.appendChild(badge("Artifact: "+(artifact?"Complete":"Incomplete"),artifact?"success":"danger"));coverStatus.appendChild(badge("Release readiness: Not determined","neutral"));if(age)coverStatus.appendChild(badge("Snapshot age: "+age.text,age.days>=30?"warning":"neutral"));renderSummary();renderMeasures();renderIssues();renderComponents();renderAnalyses();renderTrends();renderProvenance();setupNavigation();setupPrintView();}
function renderFailure(error){var host=document.getElementById("report-content")||document.body;host.textContent="";var panel=el("section","runtime-error");panel.appendChild(el("h2","","Report could not be displayed"));panel.appendChild(el("p","","The embedded report data or rendering code is damaged or blocked. Download the report again from SonarQube."));panel.appendChild(el("pre","",error&&error.message?error.message:"Unknown rendering error"));host.appendChild(panel);}
try{init();}catch(error){renderFailure(error);}
})();`;
  // SHA-256 of REPORT_RUNTIME. The test suite detects drift after runtime edits.
  const REPORT_RUNTIME_SHA256 = "glYIN3UdIc5+ldQQL5hcpg2yZLzi0k3y87W7jczey10=";

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
.report-section{border-color:#d4dee9;border-radius:1rem;padding:1.75rem;box-shadow:0 8px 26px rgba(16,42,67,.055)}
.section-title{color:var(--navy);letter-spacing:-.02em}
.section-lead{margin-left:0}
.data-health,.gate-panel{border-radius:.75rem}
.gate-warning{border-left-color:var(--warning);background:var(--warning-bg)}
.stat-card{border-color:#d4dee9;border-radius:.75rem;background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%);box-shadow:0 3px 12px rgba(16,42,67,.045)}
.stat-label{font-size:.78rem;font-weight:750;letter-spacing:.035em;text-transform:uppercase}
.stat-value{color:var(--navy);letter-spacing:-.025em}
.insight-card,.metric-group{border-color:#d4dee9;border-radius:.75rem;background:#fff}
.table-wrap{border-color:#cbd7e4;border-radius:.7rem;background:#fff}
th{padding:.75rem;background:var(--navy);color:#fff;font-size:.78rem;letter-spacing:.025em;text-transform:uppercase}
tbody tr:nth-child(even){background:#f7f9fc}
tbody tr:hover{background:#edf5f7}
tbody tr:last-child>*{border-bottom:0}
td{padding:.72rem .75rem}
.issue{border-color:#d4dee9;border-radius:.75rem;background:#fff;box-shadow:0 3px 12px rgba(16,42,67,.04)}
.issue-title{font-size:1.02rem;color:var(--navy)}
.status-tab,.clear-filters,.pager button{font-weight:700}
.filters{border-color:#cbd7e4;border-radius:.75rem;box-shadow:0 8px 24px rgba(16,42,67,.08)}
footer{text-align:center;background:#f8fafc}
@media(max-width:760px){.cover{padding:1.6rem 1rem}.layout{grid-template-columns:1fr;padding:1rem}.toc{position:static}.report-section{padding:1.1rem}.section-lead{margin-left:0}}
@media print{.cover:after{display:none}.report-section{box-shadow:none}}
`;
  }

  function buildHtmlReport(report, inputTemplate, inputOptions) {
    if (report && report.reportMode === "portfolio" && typeof app.buildPortfolioHtmlReport === "function") {
      return app.buildPortfolioHtmlReport(report, inputTemplate, inputOptions);
    }
    const template = app.normalizeTemplate(inputTemplate);
    const requested = inputOptions && typeof inputOptions === "object" ? inputOptions : {};
    const exportOptions = {
      purpose: requested.purpose === "print" ? "print" : "interactive",
      mode: requested.mode === "register" ? "register" : "summary",
      issueScope: requested.issueScope === "all" ? "all" : "active"
    };
    const embeddedReport = exportOptions.purpose === "print" ? { ...report, exportOptions } : report;
    const collectedIssues = (report.issues || []).length;
    const collectionIsComplete = report.collectionComplete !== undefined ? !!report.collectionComplete : !!report.complete;
    const artifactIsComplete = report.artifact && report.artifact.artifactComplete !== undefined
      ? !!report.artifact.artifactComplete
      : report.artifactComplete !== undefined ? !!report.artifactComplete : null;
    const exportedIssues = exportOptions.mode === "register" && template.sections.issues
      ? (report.issues || []).filter((issue) => exportOptions.issueScope === "all" || app.issueLifecycle(issue) === "actionable").length
      : 0;
    const printManifest = exportOptions.purpose === "print" ? `<aside class="print-manifest" aria-label="Print export manifest"><strong>Print export manifest</strong><dl><dt>Profile audience</dt><dd>${app.escapeHtml(template.persona || "General")}</dd><dt>Mode</dt><dd>${exportOptions.mode === "register" ? "Summary + compact issue register" : "Executive summary"}</dd><dt>Issue scope</dt><dd>${exportOptions.mode === "register" && template.sections.issues ? (exportOptions.issueScope === "all" ? "All collected" : "Actionable only") : "Not included"}</dd><dt>Issue register rows</dt><dd>${exportedIssues} exported / ${collectedIssues} collected</dd><dt>Collection confidence</dt><dd>${collectionIsComplete ? "Complete for selected collection scope" : "Incomplete - review data provenance"}</dd><dt>Artifact completeness</dt><dd>${artifactIsComplete === null ? "Not declared" : artifactIsComplete ? "Complete for selected profile and artifact scope" : "Incomplete - review artifact warnings"}</dd><dt>Release readiness</dt><dd>Not determined by this report</dd><dt>Report ID</dt><dd>${app.escapeHtml(report.reportId || "Not provided")}</dd><dt>Generated UTC</dt><dd>${app.escapeHtml(app.formatExportDate(report.generatedAt))}</dd></dl></aside>` : "";
    const printToolbar = exportOptions.purpose === "print" ? `<aside class="print-toolbar" aria-label="PDF export controls"><button type="button" id="print-now">Print / Save as PDF</button><p>If the print dialog did not open automatically, select this button. In the Destination or Printer field, choose <strong>Save as PDF</strong>, then save the file.</p></aside>` : "";
    const scriptPolicy = `'sha256-${REPORT_RUNTIME_SHA256}'`;
    const nav = [
      ["summary", "Decision summary", exportOptions.purpose === "print" || template.sections.summary],
      ["measures", "Quality and verification evidence", template.sections.measures],
      ["issues", "Issue investigation", template.sections.issues && (exportOptions.purpose !== "print" || exportOptions.mode === "register")],
      ["components", "Files", template.sections.components && exportOptions.purpose !== "print"],
      ["analyses", "Analyses", template.sections.analyses && exportOptions.purpose !== "print"],
      ["trends", "Metric trends", template.sections.trends && exportOptions.purpose !== "print"],
      ["provenance", "Data provenance", true]
    ].filter((item) => item[2]).map((item) => `<a href="#${item[0]}">${item[1]}</a>`).join("");
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; object-src 'none'; connect-src 'none'; form-action 'none'; img-src data:; style-src 'unsafe-inline'; script-src ${scriptPolicy}">
<title>${app.escapeHtml(template.title)}</title><style>${reportStyles(template.accentColor)}${professionalStyles()}.condition-required,.condition-variance{display:block;color:var(--muted);font-size:.85rem}.condition-variance{font-weight:700;margin-top:.2rem}.gate-note,.section-note{margin:.65rem 0;color:var(--muted);font-size:.85rem}.decision-frame{margin:0 0 1rem;padding:1rem;border:1px solid var(--line);border-left:6px solid var(--navy);border-radius:.75rem;background:#f8fafc}.decision-frame h3{margin:0 0 .65rem;color:var(--navy)}.decision-frame .detail-grid{margin:0}.qa-evidence{margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--line)}.qa-evidence>h3{margin-bottom:.2rem}.browser-print-manifest{display:none}tbody th{padding:.72rem .75rem;text-align:left;vertical-align:top;border-bottom:1px solid var(--line);background:inherit;color:var(--ink);font-size:.87rem;letter-spacing:0;text-transform:none}.print-toolbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:1rem;padding:.8rem max(4vw,1rem);border-bottom:1px solid var(--line);background:#fff;box-shadow:0 4px 16px rgba(16,42,67,.12)}.print-toolbar button{min-height:44px;padding:.65rem 1rem;border:0;border-radius:.45rem;background:var(--accent);color:#fff;font-weight:800;cursor:pointer}.print-toolbar p{margin:0;color:var(--muted)}.print-manifest{margin:1rem 0;padding:1rem;border:2px solid var(--ink);background:#fff}.print-manifest dl{display:grid;grid-template-columns:max-content 1fr;gap:.25rem 1rem;margin:.5rem 0 0}.print-manifest dt{font-weight:700}.print-manifest dd{margin:0}@media(max-width:700px){.print-toolbar{align-items:stretch;flex-direction:column}.print-manifest dl{grid-template-columns:1fr}}@media print{.print-toolbar{display:none!important}.browser-print-manifest{display:block;margin:0 0 1rem;padding:.75rem;border:1px solid #555}.decision-frame{break-inside:avoid}}</style></head>
<body>${printToolbar}<a class="skip" href="#report-content">Skip to report content</a><header class="cover"><div class="cover-inner"><div class="eyebrow">SonarQube · Offline quality intelligence</div><h1 id="report-title"></h1><p class="subtitle" id="report-subtitle"></p><div class="project-line"><strong id="project-name"></strong><span class="meta" id="project-meta"></span></div><div class="cover-status" id="cover-status" aria-label="Report status"></div><p class="intro" id="intro"></p><div class="meta-grid"><span id="analysis-meta"></span><span id="generated"></span></div></div></header>
${printManifest}<div class="layout"><nav class="toc" aria-label="Report contents"><details id="toc-disclosure" open><summary>Contents</summary>${nav}</details></nav><main id="report-content" tabindex="-1"><noscript><section class="runtime-error"><h2>JavaScript is required</h2><p>This offline report uses its embedded, integrity-pinned script for navigation and rendering. Enable JavaScript for this local file or export it again.</p></section></noscript></main></div><footer><span id="footer-text"></span></footer>
<script type="application/json" id="report-data">${app.jsonForHtml(embeddedReport)}</script><script type="application/json" id="template-data">${app.jsonForHtml(template)}</script><script>${REPORT_RUNTIME}</script></body></html>`;
  }

  Object.assign(app, { REPORT_RUNTIME, REPORT_RUNTIME_SHA256, reportStyles, professionalStyles, buildHtmlReport });
})(window);

(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const PORTFOLIO_RUNTIME = `(function(){"use strict";var search=document.getElementById("project-search"),status=document.getElementById("project-status"),rows=Array.prototype.slice.call(document.querySelectorAll("[data-project-row]")),count=document.getElementById("project-result-count");function draw(){var q=(search&&search.value||"").toLowerCase(),s=status&&status.value||"";var shown=0;rows.forEach(function(row){var visible=(!q||row.getAttribute("data-search").indexOf(q)>=0)&&(!s||row.getAttribute("data-state")===s);row.hidden=!visible;if(visible)shown+=1;});if(count)count.textContent=shown+" of "+rows.length+" projects shown";}if(search)search.addEventListener("input",draw);if(status)status.addEventListener("change",draw);var print=document.getElementById("print-now");if(print)print.addEventListener("click",function(){globalThis.focus();globalThis.print();});if(document.body.getAttribute("data-purpose")==="print")globalThis.addEventListener("load",function(){globalThis.setTimeout(function(){globalThis.focus();globalThis.print();},750);},{once:true});draw();})();`;
  const PORTFOLIO_RUNTIME_SHA256 = "HFT1wty+o298Mu+tt/6vQ/5p4gxc3PyqPdC8DUvrE54=";

  function e(value) { return app.escapeHtml(value === null || value === undefined || value === "" ? "Not available" : value); }
  function n(value, digits) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: digits === undefined ? 2 : digits }) : "Not available";
  }
  function date(value) { return value ? app.formatExportDate(value) : "Not available"; }
  function label(value) { return app.humanize(value) || "Unknown"; }
  function gateLabel(value) {
    const key = app.text(value).toUpperCase();
    return key === "OK" ? "Passed" : key === "ERROR" ? "Failed" : label(value);
  }
  function gateBadge(value) { return `<span class="badge badge-${tone(value)}">SonarQube gate: ${e(gateLabel(value))}</span>`; }
  function collectionBadge(value) { return `<span class="badge badge-${tone(value)}">Collection: ${e(label(value))}</span>`; }
  function projectId(value) { return `project-${app.text(value).replace(/[^a-zA-Z0-9_-]/g, "-")}`; }
  function lifecycle(issue) { return app.issueLifecycle ? app.issueLifecycle(issue) : app.text(issue && (issue.normalizedLifecycle || issue.lifecycleStatus) || "unknown"); }
  function selectedForScope(issue, issueScope) { return issueScope === "all" || lifecycle(issue) === "actionable"; }
  function nextAction(issue) {
    const state = lifecycle(issue);
    if (state === "actionable") return "Triage current source; assign owner and due date";
    if (state === "accepted") return "Validate accepted-risk rationale and review date";
    if (state === "closed") return "Verify closure before citing as evidence";
    return "Review unrecognized lifecycle in SonarQube";
  }
  function tone(value) {
    const key = app.text(value).toLowerCase();
    if (["error", "failed", "permission_denied"].includes(key)) return "danger";
    if (["partial", "warn", "warning", "skipped"].includes(key)) return "warning";
    if (["ok", "passed", "complete"].includes(key)) return "success";
    return "neutral";
  }
  function badge(value, explicitTone) { return `<span class="badge badge-${explicitTone || tone(value)}">${e(label(value))}</span>`; }
  function table(headers, rows, caption) {
    return `<div class="table-wrap" role="region" aria-label="${e(caption)}" tabindex="0"><table><caption>${e(caption)}</caption><thead><tr>${headers.map((header) => `<th scope="col">${e(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell, index) => index === 0 ? `<th scope="row">${cell === null || cell === undefined || cell === "" ? "—" : cell}</th>` : `<td>${cell === null || cell === undefined || cell === "" ? "—" : cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function distribution(items, empty) {
    return (items || []).length ? table(["State", "Projects"], items.map((item) => [e(item.label), e(item.count)]), "Quality gate distribution") : `<p class="empty">${e(empty)}</p>`;
  }
  function attention(report, linkProjects) {
    const items = report.aggregateRiskConcentrations && report.aggregateRiskConcentrations.attentionOrder || [];
    if (!items.length) return `<p class="empty">Project prioritization was disabled or no analysed project was available.</p>`;
    return `<ol class="attention">${items.slice(0, 12).map((item) => `<li><div><strong>${linkProjects ? `<a href="#${projectId(item.projectKey)}">${e(item.projectName)}</a>` : e(item.projectName)}</strong><code>${e(item.projectKey)}</code><p>${e(item.reasons.join(" | "))}</p></div></li>`).join("")}</ol><p class="method">Ordered lexicographically by failed quality gate, worse security rating, worse reliability rating, high-impact issues, unreviewed hotspots, debt, low coverage, duplication, analysis age and incomplete data. This is factual attention ordering, not a composite health score or release decision.</p>`;
  }
  function bars(items, caption) {
    const maximum = Math.max(1, ...(items || []).map((item) => Number(item.count) || 0));
    return (items || []).length
      ? `<div class="bar-list" aria-hidden="true">${items.map((item) => `<div class="bar"><span>${e(item.projectName || item.label || item.key)}</span><i style="width:${Number(item.count) > 0 ? Math.max(2, (Number(item.count) || 0) / maximum * 100) : 0}%"></i><strong>${e(item.count)}</strong></div>`).join("")}</div>${table([caption, "Count"], items.map((item) => [e(item.projectName || item.label || item.key), e(item.count)]), `${caption} data`)}`
      : `<p class="empty">No source-backed concentration was available.</p>`;
  }
  function highImpactCount(entry) {
    return (entry.issues || []).filter((issue) => {
      if (lifecycle(issue) !== "actionable") return false;
      const impacts = (issue.impactSeverities || []).length
        ? issue.impactSeverities
        : (issue.impacts || []).map((impact) => app.text(impact).split(":").pop());
      return impacts.some((impact) => ["BLOCKER", "CRITICAL", "HIGH"].includes(app.text(impact).toUpperCase()));
    }).length;
  }
  function materialFacts(entry) {
    const derived = entry.derived || {};
    const state = derived.statusModel || {};
    const facts = [];
    if (app.text(state.qualityGate).toUpperCase() === "ERROR") facts.push("The raw SonarQube quality gate failed");
    if (state.security && state.security !== "A") facts.push(`Security rating is ${state.security}`);
    if (state.reliability && state.reliability !== "A") facts.push(`Reliability rating is ${state.reliability}`);
    const high = highImpactCount(entry);
    if (high) facts.push(`${n(high, 0)} high-impact actionable issue${high === 1 ? "" : "s"}`);
    if (state.unreviewedSecurityHotspots) facts.push(`${n(state.unreviewedSecurityHotspots, 0)} estimated unreviewed security hotspot${state.unreviewedSecurityHotspots === 1 ? "" : "s"}`);
    if (state.coverage === 0) facts.push("Reported coverage is 0%");
    if (state.analysisAgeDays !== null && state.analysisAgeDays !== undefined && Number(state.analysisAgeDays) >= 30) facts.push(`Analysis snapshot is ${n(state.analysisAgeDays, 0)} days old`);
    return facts;
  }
  function projectDetail(entry, includeIssues, issueScope, printOpen) {
    const identity = entry.projectIdentity || {};
    const derived = entry.derived;
    const collectionState = entry.collectionState || {};
    const warnings = entry.warnings || [];
    if (!derived) {
      return `<article id="${projectId(identity.key)}" class="project-detail" data-project-row data-state="${e(collectionState.outcome)}" data-search="${e(`${identity.name} ${identity.key}`.toLowerCase())}"><header><div><h3>${e(identity.name)}</h3><code>${e(identity.key)}</code></div><div>${collectionBadge(collectionState.outcome)}</div></header><p class="decision-boundary"><strong>Release readiness: Not determined.</strong> No project report data was available.</p><p class="warning">${e(collectionState.error || "Collection did not produce project data.")}</p></article>`;
    }
    const state = derived.statusModel || {};
    const summary = derived.issueSummary || {};
    const breakdowns = derived.issueBreakdowns || {};
    const failures = derived.qualityGateFailureReasons || [];
    const issueLimit = 10000;
    const selectedIssues = includeIssues ? (entry.issues || []).filter((issue) => selectedForScope(issue, issueScope)) : [];
    const issues = selectedIssues.slice(0, issueLimit);
    const issueNote = includeIssues && selectedIssues.length > issueLimit ? `<p class="warning">The HTML register renders ${n(issueLimit, 0)} of ${n(selectedIssues.length, 0)} selected rows for this project. Use XLSX, CSV or JSON for the complete collected register.</p>` : "";
    const facts = materialFacts(entry);
    const open = printOpen ? " open" : "";
    const reviewed = state.reviewedSecurityHotspotsPercent === null || state.reviewedSecurityHotspotsPercent === undefined ? "Not available" : `${n(state.reviewedSecurityHotspotsPercent)}%`;
    const issueRegister = includeIssues ? `<details${open}><summary>Detailed issue register (${n(issues.length, 0)} rendered / ${n(selectedIssues.length, 0)} selected)</summary><p class="action-note">Use the message, rule, component and line to triage current source. Ownership, due date and live status are not changed by this snapshot.</p>${issueNote}${table(["Issue", "Message", "Software qualities", "Modern impact", "Lifecycle", "Raw status", "Legacy type", "Legacy severity", "Rule", "Component", "Line", "Effort", "Age", "Suggested next action"], issues.map((issue) => [e(issue.key), e(issue.message), e((issue.softwareQualities || []).join(", ")), e((issue.impactSeverities || []).join(", ")), e(label(lifecycle(issue))), e(label(issue.status)), e(label(issue.type)), e(label(issue.severity)), e(issue.rule), e(issue.component), e(issue.line), e(app.formatEffort(issue.effort)), issue.ageDays === null || issue.ageDays === undefined ? "Not available" : `${e(issue.ageDays)}d`, e(nextAction(issue))]), `Issue register for ${identity.name}`)}</details>` : "";
    return `<article id="${projectId(identity.key)}" class="project-detail" data-project-row data-state="${e(collectionState.outcome)}" data-search="${e(`${identity.name} ${identity.key} ${state.qualityGate}`.toLowerCase())}">
      <header><div><span class="eyebrow">${e(identity.branch || "Main branch")}</span><h3>${e(identity.name)}</h3><code>${e(identity.key)}</code></div><div class="project-badges">${collectionBadge(collectionState.outcome)} ${gateBadge(state.qualityGate)}</div></header>
      <p class="decision-boundary"><strong>Release readiness: Not determined.</strong> Collection outcome and raw SonarQube results are evidence inputs, not approval.</p>
      ${facts.length ? `<aside class="material-evidence"><strong>Material evidence requiring human review</strong><ul>${facts.map((fact) => `<li>${e(fact)}</li>`).join("")}</ul></aside>` : `<p class="material-clear">No configured attention indicator triggered; release readiness is still not inferred.</p>`}
      <div class="status-rail"><dl><div><dt>Security rating</dt><dd>${e(state.security)}</dd></div><div><dt>Reliability rating</dt><dd>${e(state.reliability)}</dd></div><div><dt>Maintainability rating</dt><dd>${e(state.maintainability)}</dd></div><div><dt>Coverage</dt><dd>${state.coverage === null || state.coverage === undefined ? "Not available" : `${n(state.coverage)}%`}</dd></div><div><dt>Duplication</dt><dd>${state.duplication === null || state.duplication === undefined ? "Not available" : `${n(state.duplication)}%`}</dd></div><div><dt>Technical debt</dt><dd>${state.technicalDebtMinutes === null || state.technicalDebtMinutes === undefined ? "Not available" : e(app.durationLabel(state.technicalDebtMinutes))}</dd></div><div><dt>Actionable issues</dt><dd>${summary.actionable === null || summary.actionable === undefined ? "Not available" : e(summary.actionable)}</dd></div><div><dt>Security hotspots</dt><dd>${state.securityHotspots === null || state.securityHotspots === undefined ? "Not available" : e(state.securityHotspots)}</dd></div><div><dt>Hotspots reviewed</dt><dd>${reviewed}</dd></div><div><dt>Unreviewed hotspots</dt><dd>${state.unreviewedSecurityHotspots === null || state.unreviewedSecurityHotspots === undefined ? "Not available" : e(state.unreviewedSecurityHotspots)}</dd></div><div><dt>Analysis age</dt><dd>${state.analysisAgeDays === null || state.analysisAgeDays === undefined ? "Not available" : `${e(state.analysisAgeDays)}d`}</dd></div></dl></div>
      <details${open}><summary>Raw SonarQube quality-gate evidence</summary>${failures.length ? table(["Metric", "Context", "Status", "Actual", "Comparator", "Threshold"], failures.map((failure) => [e(app.metricLabel(failure.metric)), e(label(failure.context)), badge(failure.status), e(failure.actual), e(failure.comparator), e(failure.threshold)]), `Quality gate conditions for ${identity.name}`) : `<p class="empty">No failed or warning condition was returned by SonarQube. This does not establish release readiness.</p>`}</details>
      <details${open}><summary>Issue analytics</summary>${table(["Lifecycle", "Issues"], (breakdowns.lifecycle || []).map((item) => [e(label(item.label)), e(item.count)]), `Issue lifecycle for ${identity.name}`)}${table(["Software quality", "Issues"], (breakdowns.softwareQuality || []).map((item) => [e(item.label), e(item.count)]), `Software quality impacts for ${identity.name}`)}${table(["Modern impact", "Issues"], (breakdowns.impactSeverity || []).map((item) => [e(item.label), e(item.count)]), `Modern impact severities for ${identity.name}`)}${table(["Legacy type", "Issues"], (breakdowns.legacyType || []).map((item) => [e(item.label), e(item.count)]), `Legacy issue types for ${identity.name}`)}</details>
      ${issueRegister}
      <details${open}><summary>Collection evidence and warnings</summary>${table(["Dataset", "Expected", "Retrieved", "Unique", "Status", "Reason"], (entry.collectionEvidence && entry.collectionEvidence.datasets || []).map((dataset) => [e(dataset.dataset), e(dataset.expected), e(dataset.retrieved), e(dataset.unique), badge(dataset.state), e(dataset.reason)]), `Collection evidence for ${identity.name}`)}${warnings.length ? `<ul>${warnings.map((warning) => `<li>${e(warning)}</li>`).join("")}</ul>` : `<p class="empty">No collection warning was recorded.</p>`}</details>
    </article>`;
  }

  function styles(accent) {
    return `
      :root{--ink:#132435;--navy:#11283d;--teal:${accent};--muted:#607080;--line:#d7e0e7;--paper:#f4f7f8;--white:#fff;--amber:#9a5b00;--red:#a62b2b;--green:#176b4d;font-family:Inter,"Segoe UI",Arial,sans-serif;color:var(--ink);background:var(--paper)}
      *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;overflow-wrap:anywhere}a{color:var(--teal)}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible,[tabindex="0"]:focus-visible{outline:3px solid #f3a712;outline-offset:3px}code,.eyebrow,.meta,dt{font-family:"IBM Plex Mono",Consolas,monospace}.skip-link{position:fixed;left:12px;top:8px;z-index:20;transform:translateY(-160%);background:#fff;color:#000;padding:10px 14px;border:2px solid #000}.skip-link:focus{transform:none}
      .print-toolbar{position:sticky;top:0;background:#fff;border-bottom:1px solid var(--line);padding:10px max(24px,calc((100vw - 1180px)/2));z-index:4}.print-toolbar button{background:var(--navy);color:#fff;border:0;padding:10px 16px;font-weight:700}.print-toolbar span{margin-left:10px;color:var(--muted)}.print-manifest{max-width:1180px;margin:18px auto 0;padding:18px 24px;border:2px solid var(--ink);background:#fff}.print-manifest h2{margin:0 0 10px}.print-manifest dl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0}.print-manifest dl div{border-left:3px solid var(--teal);padding-left:9px}.print-manifest dd{margin:4px 0 0;font-weight:700}
      .cover{background:var(--navy);color:#fff;padding:42px max(24px,calc((100vw - 1180px)/2));border-bottom:8px solid var(--teal)}.cover .eyebrow{color:#9fdad4;text-transform:uppercase;letter-spacing:.12em;font-size:12px}.cover h1{font-size:clamp(34px,5vw,64px);line-height:1;margin:12px 0;max-width:900px}.cover p{color:#d4e2eb;max-width:780px}.cover dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:28px}.cover dl div{border-left:2px solid var(--teal);padding-left:10px}.cover dt{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#a9bfcc}.cover dd{margin:3px 0;font-weight:700}.report-nav{background:#fff;border-bottom:1px solid var(--line);padding:10px max(24px,calc((100vw - 1180px)/2));display:flex;gap:8px;flex-wrap:wrap}.report-nav a{padding:8px 10px;color:var(--ink);font-weight:700;text-decoration:none;border-bottom:2px solid transparent}.report-nav a:hover{border-bottom-color:var(--teal)}
      .layout{max-width:1180px;margin:auto;padding:30px 24px 80px}.section{background:var(--white);border:1px solid var(--line);padding:24px;margin:0 0 18px}.section>h2{font-size:25px;margin:0 0 4px}.lead{color:var(--muted);margin:0 0 20px}.decision-frame{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--line);border:2px solid var(--ink);margin:18px 0}.decision-frame div{background:#fff;padding:16px}.decision-frame span{display:block;color:var(--muted);font-size:12px}.decision-frame strong{display:block;margin-top:5px}.kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line)}.kpi{background:#fff;padding:16px}.kpi span{display:block;color:var(--muted);font-size:12px}.kpi strong{display:block;font:700 29px/1.1 "IBM Plex Mono",Consolas,monospace;margin-top:8px}
      .badge{display:inline-block;border:1px solid;padding:3px 7px;border-radius:999px;font:700 11px/1.2 "IBM Plex Mono",Consolas,monospace;text-transform:uppercase;letter-spacing:.04em}.badge-success{color:var(--green);background:#eaf7f1;border-color:#96cbb7}.badge-warning{color:#7d4b00;background:#fff3d5;border-color:#dfbc67}.badge-danger{color:#922828;background:#ffeded;border-color:#daa0a0}.badge-neutral{color:#4d5d6c;background:#eef2f5;border-color:#bec9d1}.table-wrap{overflow:auto;margin:16px 0;border:1px solid var(--line)}table{border-collapse:collapse;width:100%;font-size:13px}caption{font-weight:700;text-align:left;padding:10px;background:#eef3f5}th,td{border-bottom:1px solid var(--line);padding:9px 10px;text-align:left;vertical-align:top}thead th{background:#f2f5f7;font-size:11px;text-transform:uppercase;letter-spacing:.04em}tbody th{background:#fff;font-size:inherit;text-transform:none;letter-spacing:normal;font-weight:700}tbody tr:last-child>*{border-bottom:0}.split{display:grid;grid-template-columns:1fr 1fr;gap:18px}
      .attention{list-style:none;padding:0;margin:0}.attention li{border-top:1px solid var(--line);padding:13px 0}.attention code{display:block;color:var(--muted);font-size:11px;margin-top:3px}.attention p,.method,.empty{color:var(--muted)}.bar{display:grid;grid-template-columns:minmax(160px,1fr) 3fr 54px;gap:9px;align-items:center;margin:8px 0}.bar i{height:8px;background:var(--teal);display:block}.bar strong{text-align:right}.bar-list+ .table-wrap{margin-top:18px}
      .project-tools{display:flex;gap:12px;flex-wrap:wrap;align-items:end}.project-tools label{display:grid;gap:4px;font-weight:700}.project-tools input,.project-tools select{min-height:44px;border:1px solid #768895;padding:8px;background:#fff}.project-detail{border:1px solid var(--line);background:#fff;padding:20px;margin:14px 0}.project-detail>header{display:flex;justify-content:space-between;gap:18px}.project-detail h3{margin:3px 0;font-size:22px}.project-badges{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start;justify-content:flex-end}.decision-boundary{border:2px solid var(--ink);padding:12px 14px;background:#f8fbfc}.material-evidence,.warning{border-left:4px solid var(--amber);background:#fff7e8;padding:12px 14px}.material-evidence strong{color:#714300}.material-evidence ul{margin-bottom:0}.material-clear{border-left:4px solid #81919d;background:#f3f6f8;padding:12px 14px}.action-note{border-left:4px solid var(--teal);background:#edf8f6;padding:12px 14px}.status-rail{margin:18px 0;background:#f1f5f6;border:1px solid var(--line)}.status-rail dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));margin:0}.status-rail dl div{padding:12px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.status-rail dt{font-size:9px;text-transform:uppercase;color:var(--muted)}.status-rail dd{margin:5px 0 0;font-weight:700}.project-detail details{border-top:1px solid var(--line);padding:10px 0}.project-detail summary{font-weight:700;cursor:pointer;min-height:40px;padding:8px 0}
      @media(max-width:900px){.cover dl,.print-manifest dl,.decision-frame{grid-template-columns:repeat(2,minmax(0,1fr))}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.split{grid-template-columns:1fr}.status-rail dl{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:520px){.layout{padding:16px 10px 60px}.cover{padding:28px 16px}.cover dl,.print-manifest dl,.decision-frame,.kpis,.status-rail dl{grid-template-columns:1fr}.project-detail{padding:15px 12px}.project-detail>header{display:block}.project-badges{justify-content:flex-start;margin-top:12px}.bar{grid-template-columns:minmax(0,1fr) 44px}.bar i{grid-column:1/-1}.report-nav{padding:8px 10px}.print-toolbar span{display:block;margin:8px 0 0}}
      @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
      @media(forced-colors:active){.badge,.section,.project-detail,.table-wrap,.decision-frame{border:1px solid CanvasText}}
      @page{size:landscape;margin:10mm}
      @media print{body{background:#fff;font-size:10pt}.print-toolbar,.project-tools,.report-nav,.skip-link{display:none!important}.print-manifest{margin:0 0 8mm;max-width:none}.cover{padding:10mm 0;color:#000;background:#fff;border-bottom:3px solid #000}.cover p,.cover dt{color:#333}.cover dl{grid-template-columns:repeat(3,1fr)}.layout{max-width:none;padding:0}.section{padding:5mm 0;margin:0;border:0;border-top:1px solid #999;break-inside:auto}.project-detail{break-inside:auto;border-color:#999}.kpi,.decision-frame div,.status-rail dl div{break-inside:avoid}.project-detail details{display:block}.project-detail details>*{display:block}.project-detail details>summary{display:list-item}.table-wrap{overflow:visible;break-inside:auto}table{font-size:8pt}thead{display:table-header-group}tr{break-inside:avoid}.status-rail dl{grid-template-columns:repeat(4,1fr)}a{color:#000;text-decoration:none}}
    `;
  }

  function buildPortfolioHtmlReport(report, inputTemplate, inputOptions) {
    const template = app.normalizeTemplate(inputTemplate, app.BUILTIN_TEMPLATES[4]);
    const options = inputOptions || {};
    const purpose = options.purpose === "print" ? "print" : "interactive";
    const mode = options.mode === "register" ? "register" : "summary";
    const issueScope = options.issueScope === "all" ? "all" : "active";
    const summary = report.portfolioSummary || {};
    const issue = report.aggregateIssueSummary || {};
    const projects = report.projects || [];
    const metrics = report.aggregateMetrics || {};
    const coverage = metrics.coverage || {};
    const duplication = metrics.duplication || {};
    const includeIssues = !!(template.sections && template.sections.issues) && (purpose !== "print" || mode === "register");
    const includeDrilldown = purpose !== "print" || mode === "register";
    const fullModelEmbedded = purpose === "interactive";
    const allIssues = projects.flatMap((entry) => entry.issues || []);
    const selectedIssues = includeIssues ? allIssues.filter((row) => selectedForScope(row, issueScope)) : [];
    const renderedIssueCount = includeIssues ? projects.reduce((total, entry) => total + Math.min(10000, (entry.issues || []).filter((row) => selectedForScope(row, issueScope)).length), 0) : 0;
    const collectedIssueCount = Number.isFinite(Number(issue.totalCollected)) ? Number(issue.totalCollected) : allIssues.length;
    const collectedComponentCount = projects.reduce((total, entry) => total + (entry.components || []).length, 0);
    const collectedAnalysisCount = projects.reduce((total, entry) => total + (entry.analyses || []).length, 0);
    const collectedTrendObservationCount = projects.reduce((total, entry) => total + (entry.trends || []).reduce((sum, series) => sum + ((series && series.observations) || []).length, 0), 0);
    const collectionIsComplete = report.collectionComplete !== undefined ? !!report.collectionComplete : !!report.complete;
    const artifactIsComplete = report.artifact && report.artifact.artifactComplete !== undefined ? !!report.artifact.artifactComplete : report.artifactComplete !== undefined ? !!report.artifactComplete : null;
    const representedCounts = {
      projects: projects.length,
      issues: fullModelEmbedded ? collectedIssueCount : renderedIssueCount,
      components: fullModelEmbedded ? collectedComponentCount : 0,
      analyses: fullModelEmbedded ? collectedAnalysisCount : 0,
      trendObservations: fullModelEmbedded ? collectedTrendObservationCount : 0
    };
    const declaredCounts = report.artifact && report.artifact.exportedCounts || {};
    const declaredCountMismatches = Object.keys(representedCounts).filter((key) => declaredCounts[key] !== undefined && Number(declaredCounts[key]) !== representedCounts[key]);
    const issueRegisterTruncated = renderedIssueCount < selectedIssues.length;
    const rendererArtifactComplete = artifactIsComplete === null ? null : artifactIsComplete && !issueRegisterTruncated && declaredCountMismatches.length === 0;
    const rendererArtifactLabel = rendererArtifactComplete === null ? "Not declared" : rendererArtifactComplete ? "Complete for the declared renderer envelope" : "Incomplete - renderer envelope does not reconcile";
    const combinedWarnings = [...new Set([...(report.warnings || []), ...((report.artifact && report.artifact.warnings) || [])])];
    const confidence = collectionIsComplete ? "Complete for selected portfolio scope" : `${n(summary.projectsComplete, 0)} of ${n(summary.projectsSelected, 0)} projects completed requested collection`;
    const ages = projects.map((entry) => entry.derived && entry.derived.statusModel && Number(entry.derived.statusModel.analysisAgeDays)).filter(Number.isFinite);
    const freshness = ages.length ? `${n(Math.max(...ages), 0)} days (oldest analysed project)` : "Not available";
    const scopeLabel = issueScope === "all" ? "All collected lifecycle states" : "Actionable lifecycle only";
    const modeLabel = mode === "register" ? "Evidence dossier + issue register" : "Evidence dossier summary";
    const printToolbar = purpose === "print" ? `<aside class="print-toolbar" aria-label="Print controls"><button id="print-now" type="button">Print / Save as PDF</button><span>In the browser print dialog, choose <strong>Save as PDF</strong>.</span></aside>` : "";
    const printManifest = purpose === "print" ? `<section class="print-manifest" aria-labelledby="print-manifest-title"><h2 id="print-manifest-title">Print export manifest</h2><dl><div><dt>Profile audience</dt><dd>${e(template.persona || "General")}</dd></div><div><dt>Mode</dt><dd>${e(modeLabel)}</dd></div><div><dt>Representation</dt><dd>Rendered print views only; full Model v3 is not embedded</dd></div><div><dt>Issue scope</dt><dd>${e(scopeLabel)}</dd></div><div><dt>Issue register rows</dt><dd>${n(renderedIssueCount, 0)} rendered / ${n(selectedIssues.length, 0)} selected / ${n(collectedIssueCount, 0)} collected</dd></div><div><dt>Collection confidence</dt><dd>${e(confidence)}</dd></div><div><dt>Renderer artifact completeness</dt><dd>${e(rendererArtifactLabel)}</dd></div><div><dt>Release readiness</dt><dd>Not determined</dd></div><div><dt>Snapshot freshness</dt><dd>${e(freshness)}; apply organizational policy</dd></div><div><dt>Report ID</dt><dd>${e(report.reportId)}</dd></div><div><dt>Generated</dt><dd>${e(date(report.generatedAt))}</dd></div></dl>${mode === "summary" ? `<p>Summary mode contains no detailed issue-register rows; the zero rendered and selected counts above match this document.</p>` : !template.sections.issues ? `<p>The selected template excludes the issue section, so no issue-register rows are present.</p>` : issueRegisterTruncated ? `<p class="warning">The print register exceeds the renderer limit: ${n(renderedIssueCount, 0)} rows are present and ${n(selectedIssues.length - renderedIssueCount, 0)} selected rows are omitted. Use a complete data artifact.</p>` : ""}${declaredCountMismatches.length ? `<p class="warning">Declared exported counts do not match this renderer envelope for: ${e(declaredCountMismatches.join(", "))}.</p>` : ""}</section>` : "";
    const scopeRows = projects.map((entry) => {
      const status = entry.derived && entry.derived.statusModel || {};
      const identity = entry.projectIdentity || {};
      const issueEvidence = entry.collectionEvidence && (entry.collectionEvidence.datasets || []).find((item) => item.dataset === "Issues");
      const projectName = includeDrilldown ? `<a href="#${projectId(identity.key)}">${e(identity.name)}</a>` : e(identity.name);
      return [projectName, `<code>${e(identity.key)}</code>`, e(identity.branch || "Main branch"), collectionBadge(entry.collectionState && entry.collectionState.outcome), gateBadge(status.qualityGate || "Unknown"), issueEvidence ? `${badge(issueEvidence.state)} ${e(issueEvidence.unique)} unique` : "Not available", status.analysisAgeDays === null || status.analysisAgeDays === undefined ? "Not available" : `${e(status.analysisAgeDays)} days`, e((entry.warnings || []).length)];
    });
    const projectMeasure = (entry, metric) => {
      const measure = (entry.measures || []).find((item) => item && item.metric === metric);
      if (!measure) return null;
      const raw = measure.value !== undefined && measure.value !== "" ? measure.value : measure.period && measure.period.value;
      return raw === null || raw === undefined || raw === "" || !Number.isFinite(Number(raw)) ? null : Number(raw);
    };
    const securityRows = projects.map((entry) => {
      const identity = entry.projectIdentity || {};
      const state = entry.derived && entry.derived.statusModel || {};
      const projectName = includeDrilldown ? `<a href="#${projectId(identity.key)}">${e(identity.name)}</a>` : e(identity.name);
      const securityIssues = (entry.issues || []).filter((row) => lifecycle(row) === "actionable" && (row.softwareQualities || []).some((quality) => app.text(quality).toLowerCase() === "security")).length;
      return [projectName, e(state.security), projectMeasure(entry, "vulnerabilities") === null ? "Not available" : e(n(projectMeasure(entry, "vulnerabilities"), 0)), e(n(securityIssues, 0)), state.securityHotspots === null || state.securityHotspots === undefined ? "Not available" : e(n(state.securityHotspots, 0)), state.reviewedSecurityHotspotsPercent === null || state.reviewedSecurityHotspotsPercent === undefined ? "Not available" : `${e(n(state.reviewedSecurityHotspotsPercent))}%`, state.unreviewedSecurityHotspots === null || state.unreviewedSecurityHotspots === undefined ? "Not available" : e(n(state.unreviewedSecurityHotspots, 0)), e(n(highImpactCount(entry), 0))];
    });
    const issueKpis = `<div class="kpis"><div class="kpi"><span>Total collected issues</span><strong>${n(issue.totalCollected, 0)}</strong></div><div class="kpi"><span>Actionable</span><strong>${n(issue.actionable, 0)}</strong></div><div class="kpi"><span>Accepted</span><strong>${n(issue.accepted, 0)}</strong></div><div class="kpi"><span>Closed</span><strong>${n(issue.closed, 0)}</strong></div><div class="kpi"><span>Unknown lifecycle</span><strong>${n(issue.unknown, 0)}</strong></div></div>`;
    const risk = report.aggregateRiskConcentrations || {};
    const debtValue = metrics.technicalDebtMinutes === null || metrics.technicalDebtMinutes === undefined ? "Not available" : e(app.durationLabel(metrics.technicalDebtMinutes));
    const rendererEnvelope = `<h3>Renderer envelope</h3><p class="lead">These counts describe records physically represented in this HTML artifact, independently of collection success.</p>${table(["Dataset", "Represented in this artifact", "Representation"], [
      ["Projects", n(representedCounts.projects, 0), "Rendered scope and project evidence"],
      ["Issues", n(representedCounts.issues, 0), fullModelEmbedded ? `${n(renderedIssueCount, 0)} register rows visible; all collected issue records embedded` : `${n(renderedIssueCount, 0)} register rows rendered`],
      ["Components", n(representedCounts.components, 0), fullModelEmbedded ? "Embedded in the inert Model v3 source payload" : "Not represented in this print artifact"],
      ["Analyses", n(representedCounts.analyses, 0), fullModelEmbedded ? "Embedded in the inert Model v3 source payload" : "Not represented in this print artifact"],
      ["Trend observations", n(representedCounts.trendObservations, 0), fullModelEmbedded ? "Embedded in the inert Model v3 source payload" : "Not represented in this print artifact"]
    ], "Portfolio HTML renderer envelope")}<p class="meta">Full Model v3 embedded: ${fullModelEmbedded ? "Yes" : "No"} | Register truncation: ${issueRegisterTruncated ? "Yes" : "No"} | Declared-count mismatches: ${declaredCountMismatches.length ? e(declaredCountMismatches.join(", ")) : "None"} | Artifact digest: ${e(report.artifact && report.artifact.artifactDigestState || "not declared")}</p>`;
    const nav = `<nav class="report-nav" aria-label="Report sections"><a href="#executive-summary">Decision summary</a><a href="#attention">Attention</a><a href="#scope">Scope</a><a href="#security-evidence">Security</a><a href="#issues">Issues</a><a href="#risk">Concentrations</a>${includeDrilldown ? `<a href="#project-drilldown">Project evidence</a>` : ""}<a href="#provenance">Provenance</a></nav>`;
    const drilldown = includeDrilldown ? `<section id="project-drilldown" class="section"><h2>Project evidence dossiers</h2><p class="lead">Search by project, key or raw SonarQube gate state. Each project separates collection outcome, source facts and the release-decision boundary. Issue scope: ${e(scopeLabel)}.</p>${purpose === "interactive" ? `<div class="project-tools"><label for="project-search">Search projects<input id="project-search" type="search" placeholder="Project name or key"></label><label for="project-status">Collection outcome<select id="project-status"><option value="">All outcomes</option><option value="complete">Complete</option><option value="partial">Partial</option><option value="failed">Failed</option><option value="permission_denied">Permission denied</option></select></label><p id="project-result-count" role="status" aria-live="polite"></p></div>` : ""}${projects.map((entry) => projectDetail(entry, includeIssues, issueScope, purpose === "print")).join("")}</section>` : "";
    const content = `${printToolbar}<a class="skip-link" href="#report-main">Skip to report content</a>${printManifest}<header class="cover"><span class="eyebrow">${e(template.persona || "General")} portfolio evidence dossier | Model v${e(report.modelVersion)}</span><h1>${e(template.title)}</h1><p>${e(template.intro)}</p><dl><div><dt>Report ID</dt><dd>${e(report.reportId)}</dd></div><div><dt>Generated</dt><dd>${e(date(report.generatedAt))}</dd></div><div><dt>Collection confidence</dt><dd>${e(confidence)}</dd></div><div><dt>Renderer artifact completeness</dt><dd>${e(rendererArtifactLabel)}</dd></div><div><dt>Representation</dt><dd>${fullModelEmbedded ? "Full Model v3 embedded" : "Rendered views only"}</dd></div><div><dt>Release readiness</dt><dd>Not determined</dd></div><div><dt>Snapshot freshness</dt><dd>${e(freshness)}</dd></div><div><dt>Issue scope</dt><dd>${e(scopeLabel)}</dd></div></dl></header>${nav}<main id="report-main" class="layout">
      <section id="executive-summary" class="section"><h2>Decision summary</h2><p class="lead">The report presents source evidence for human review. It does not turn a passed SonarQube gate or successful collection into release approval.</p><div class="decision-frame"><div><span>Intended audience</span><strong>${e(template.persona || "General")}</strong></div><div><span>Release readiness</span><strong>Not determined</strong></div><div><span>Collection confidence</span><strong>${e(confidence)}</strong></div><div><span>Renderer artifact completeness</span><strong>${e(rendererArtifactLabel)}</strong></div><div><span>Raw SonarQube gate evidence</span><strong>See distribution and project conditions</strong></div><div><span>Freshness</span><strong>${e(freshness)}; apply policy</strong></div></div><div class="kpis"><div class="kpi"><span>Projects selected</span><strong>${n(summary.projectsSelected, 0)}</strong></div><div class="kpi"><span>Projects analysed</span><strong>${n(summary.projectsAnalysed, 0)}</strong></div><div class="kpi"><span>Collection complete</span><strong>${n(summary.projectsComplete, 0)}</strong></div><div class="kpi"><span>Collection partial</span><strong>${n(summary.projectsPartial, 0)}</strong></div><div class="kpi"><span>Collection failed / denied</span><strong>${n((summary.projectsFailed || 0) + (summary.projectsPermissionDenied || 0), 0)}</strong></div></div><div class="split"><div><h3>Raw SonarQube gate distribution</h3>${distribution(summary.qualityGateDistribution, "No analysed project supplied a SonarQube gate state.")}<p class="method">A passed raw gate is one evidence input; this renderer does not infer release readiness.</p></div><div><h3>Weighted portfolio metrics</h3>${table(["Metric", "Value", "Projects represented", "Formula"], [["Coverage", coverage.value === null || coverage.value === undefined ? "Not available" : `${n(coverage.value)}%`, e(coverage.projectsIncluded), e(coverage.formula)], ["Duplication", duplication.value === null || duplication.value === undefined ? "Not available" : `${n(duplication.value)}%`, e(duplication.projectsIncluded), e(duplication.formula)], ["Technical debt", debtValue, e(metrics.technicalDebtProjectsIncluded), "Sum of available source sqale_index minutes"]], "Weighted aggregate metrics")}</div></div></section>
      <section id="attention" class="section"><h2>Projects requiring human attention</h2><p class="lead">Transparent factual ordering; no AI or composite health score is used.</p>${attention(report, includeDrilldown)}</section>
      <section id="scope" class="section"><h2>Analysis scope</h2><p class="lead">Every selected project is listed with independent collection and raw SonarQube gate outcomes. Missing data is not interpreted as healthy.</p>${table(["Project", "Key", "Branch / PR", "Collection outcome", "Raw SonarQube gate", "Issue collection", "Analysis age", "Warnings"], scopeRows, "Portfolio analysis scope")}</section>
      <section id="security-evidence" class="section"><h2>Security and counter-evidence</h2><p class="lead">For CISO and audit review: rating, vulnerability, hotspot-review and high-impact facts remain visible even when the raw quality gate passed. Not available is distinct from zero.</p>${table(["Project", "Security rating", "Vulnerabilities", "Actionable security issues", "Security hotspots", "Hotspots reviewed", "Unreviewed hotspots", "High-impact actionable"], securityRows, "Portfolio security review evidence")}</section>
      <section id="issues" class="section"><h2>Issue lifecycle landscape</h2><p class="lead">Lifecycle counts reconcile all collected issue records. Modern impact and software-quality semantics are separated from legacy type and severity in project registers.</p>${issueKpis}</section>
      <section id="risk" class="section"><h2>Risk concentrations</h2><div class="split"><div><h3>Top projects by actionable issues</h3>${bars(risk.topProjectsByActionableIssues, "Project")}</div><div><h3>Top project-rule concentrations</h3>${bars(risk.topRules, "Project and rule")}</div><div><h3>Actionable security concentration</h3>${bars(risk.topProjectsBySecurityIssues, "Project")}</div><div><h3>Actionable reliability concentration</h3>${bars(risk.topProjectsByReliabilityIssues, "Project")}</div></div></section>
      ${drilldown}
      <section id="provenance" class="section"><h2>Collection confidence, scope and provenance</h2><p class="lead">A partial or failed project prevents portfolio completeness. Counts are not extrapolated for missing projects, and this evidence snapshot does not determine release readiness.</p>${combinedWarnings.length ? `<h3>Collection and artifact warnings</h3><ul>${combinedWarnings.map((warning) => `<li>${e(warning)}</li>`).join("")}</ul>` : `<p>No collection or artifact warning was recorded.</p>`}${rendererEnvelope}<dl class="decision-frame"><div><dt>Collection started</dt><dd>${e(date(report.collectionStartedAt))}</dd></div><div><dt>Collection completed</dt><dd>${e(date(report.collectionCompletedAt))}</dd></div><div><dt>Requested project scope</dt><dd>${n(summary.projectsSelected, 0)} selected</dd></div><div><dt>Actual project scope</dt><dd>${n(summary.projectsAnalysed, 0)} analysed</dd></div></dl><p class="meta">Renderer ${e(report.rendererVersion)} | Plugin ${e(report.pluginVersion)} | Times are explicit UTC.</p><p>${e(template.footer)}</p></section>
    </main>`;
    const embeddedModel = fullModelEmbedded ? `<script type="application/json" id="portfolio-model-v3">${app.jsonForHtml(report)}</script>` : "";
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'sha256-${PORTFOLIO_RUNTIME_SHA256}'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-src 'none'"><title>${e(template.title)}</title><style>${styles(template.accentColor)}</style></head><body data-purpose="${purpose}" data-mode="${mode}" data-issue-scope="${issueScope}">${content}${embeddedModel}<script>${PORTFOLIO_RUNTIME}</script></body></html>`;
  }

  Object.assign(app, { PORTFOLIO_RUNTIME, PORTFOLIO_RUNTIME_SHA256, buildPortfolioHtmlReport });
})(window);

(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const MAX_PORTFOLIO_TOTAL_ISSUES = 25000;
  const MAX_PORTFOLIO_TOTAL_COMPONENTS = 50000;
  const DEFAULT_PORTFOLIO_ISSUES_PER_PROJECT = 500;
  const DEFAULT_PORTFOLIO_COMPONENTS_PER_PROJECT = 1000;
  const PORTFOLIO_UI_CSS = `
  .opf{--navy:#132b40;--teal:#0b6b69;--amber:#b06b00;--ink:#172738;--muted:#607080;--line:#d5dfe6;--paper:#f4f7f8;box-sizing:border-box;width:100%;max-width:1180px;height:var(--opf-height,calc(100dvh - 140px));margin:auto;overflow-y:scroll;scrollbar-gutter:stable;padding:0 24px 180px;color:var(--ink);font:14px/1.5 Inter,Segoe UI,Arial,sans-serif}.opf *{box-sizing:border-box}.opf-hero{background:var(--navy);color:#fff;margin:0 -24px 20px;padding:28px 32px;border-bottom:7px solid var(--teal);display:flex;justify-content:space-between;gap:24px}.opf-kicker{font:700 11px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.13em;text-transform:uppercase;color:#9bd8d1}.opf h1{font-size:34px;line-height:1.05;margin:8px 0}.opf h2{font-size:20px;margin:0}.opf h3{font-size:15px;margin:0}.opf p{margin:5px 0}.opf-hero p{color:#d4e3eb;max-width:720px}.opf-hero a{color:#a9e4dd}.opf-warning{border-left:5px solid var(--amber);background:#fff5dd;padding:12px 15px;margin-bottom:16px}.opf-form{display:grid;gap:15px}.opf-card{background:#fff;border:1px solid var(--line);padding:18px}.opf-step{display:flex;gap:14px;align-items:flex-start;margin-bottom:13px}.opf-step b{display:grid;place-items:center;min-width:30px;height:30px;background:var(--navy);color:#fff;font:700 12px ui-monospace,Consolas,monospace}.opf-step p,.opf-help{color:var(--muted)}.opf-mode{display:grid;grid-template-columns:1fr 1fr;gap:10px}.opf-mode>*{border:1px solid var(--line);padding:13px}.opf-mode .active{border-color:var(--teal);box-shadow:inset 5px 0 var(--teal);background:#eef9f7}.opf-tools{display:grid;grid-template-columns:minmax(220px,2fr) 1fr auto auto;gap:8px;align-items:end}.opf label{display:grid;gap:4px}.opf input[type=search],.opf input[type=number],.opf select{min-height:44px;border:1px solid #9baab5;background:#fff;padding:8px}.opf button{min-height:44px;border:1px solid #8697a4;background:#fff;color:var(--ink);font-weight:700;padding:8px 13px;cursor:pointer}.opf button:hover:not(:disabled){background:#edf2f4}.opf button:focus-visible,.opf input:focus-visible,.opf select:focus-visible{outline:3px solid #77c4be;outline-offset:2px}.opf button:disabled{opacity:.55;cursor:not-allowed}.opf-projects{border:1px solid var(--line);max-height:330px;overflow:auto;margin-top:12px}.opf-project{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--line)}.opf-project:last-child{border-bottom:0}.opf-project:hover{background:#f3f7f8}.opf-project input{width:18px;height:18px}.opf-project strong,.opf-project code{display:block}.opf-project code{font-size:11px;color:var(--muted)}.opf-count{font:700 12px ui-monospace,Consolas,monospace;color:var(--teal)}.opf-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.opf-choice{position:relative;border:1px solid var(--line);padding:13px;min-height:88px}.opf-choice input{position:absolute;right:12px;top:12px}.opf-choice strong,.opf-choice span{display:block;padding-right:22px}.opf-choice span{color:var(--muted);margin-top:4px}.opf-choice:has(input:checked){border-color:var(--teal);box-shadow:inset 0 0 0 1px var(--teal);background:#eef9f7}.opf-scope{display:grid;grid-template-columns:1fr 1fr;gap:18px}.opf fieldset{border:1px solid var(--line);padding:12px}.opf-check{display:flex!important;grid-template-columns:auto 1fr!important;gap:8px!important;min-height:38px;align-items:start;padding:5px 0}.opf-check input{width:18px;height:18px}.opf-output{grid-template-columns:repeat(4,1fr)}.opf-doc-options{background:var(--paper);padding:12px;margin-top:10px}.opf-submit{display:flex;gap:10px;align-items:center;background:#fff;border-top:1px solid var(--line);padding:14px 0;position:sticky;bottom:0}.opf-primary{background:var(--teal)!important;border-color:var(--teal)!important;color:#fff!important;min-width:210px}.opf-progress{flex:1;min-width:120px}.opf-status{margin-left:auto;white-space:pre-line;color:var(--muted);max-width:430px}.opf-status[data-kind=error]{color:#a52a2a;font-weight:700}.opf-status[data-kind=success]{color:#176b4d}.opf-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:var(--line);margin-top:12px}.opf-summary div{background:#fff;padding:10px}.opf-summary span{display:block;color:var(--muted);font-size:11px}.opf-summary strong{font:700 20px ui-monospace,Consolas,monospace}.opf-empty{padding:24px;color:var(--muted)}
  @media(max-width:800px){.opf-tools{grid-template-columns:1fr 1fr}.opf-grid,.opf-output{grid-template-columns:repeat(2,1fr)}.opf-scope{grid-template-columns:1fr}.opf-hero{display:block}.opf-summary{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.opf{padding:0 12px 140px}.opf-hero{margin:0 -12px 16px;padding:24px 16px}.opf-mode,.opf-grid,.opf-output,.opf-tools{grid-template-columns:1fr}.opf-project{grid-template-columns:28px 1fr}.opf-project>span{grid-column:2}.opf-submit{align-items:stretch;flex-direction:column}.opf-status{margin-left:0}.opf-summary{grid-template-columns:1fr}}
  `;

  function injectPortfolioStyle() {
    if (document.getElementById("opf-style")) return;
    const style = document.createElement("style");
    style.id = "opf-style";
    style.textContent = PORTFOLIO_UI_CSS;
    document.head.appendChild(style);
  }

  function freezePortfolioSnapshot(value, seen) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    const visited = seen || new WeakSet();
    if (visited.has(value)) return value;
    visited.add(value);
    Object.keys(value).forEach((key) => freezePortfolioSnapshot(value[key], visited));
    return Object.freeze(value);
  }

  function portfolioSnapshotSignature(projects, settings) {
    const source = settings || {};
    return JSON.stringify({
      projectKeys: (projects || []).map((project) => app.text(project && project.key)).filter(Boolean).sort(),
      includeIssues: !!source.includeIssues,
      includeComponents: !!source.includeComponents,
      includeAnalyses: !!source.includeAnalyses,
      includeTrends: !!source.includeTrends,
      includePeople: !!source.includePeople,
      maxIssues: Number(source.maxIssues),
      maxComponents: Number(source.maxComponents),
      concurrency: Number(source.concurrency),
      rankProjects: source.rankProjects !== false
    });
  }

  function portfolioActualCounts(report, issueScope) {
    const entries = (report && report.projects || []).filter((entry) => entry && entry.derived);
    const issues = entries.flatMap((entry) => entry.issues || []);
    const selectedIssues = issueScope !== "active" ? issues : issues.filter((issue) => {
      const lifecycle = app.text(issue && (issue.normalizedLifecycle || issue.lifecycleStatus)).toLowerCase();
      return lifecycle ? lifecycle === "actionable" : app.issueLifecycle ? app.issueLifecycle(issue) === "actionable" : true;
    });
    return {
      projects: (report && report.projects || []).length,
      issues: issues.length,
      selectedIssues: selectedIssues.length,
      components: entries.reduce((sum, entry) => sum + (entry.components || []).length, 0),
      analyses: entries.reduce((sum, entry) => sum + (entry.analyses || []).length, 0),
      trendObservations: entries.reduce((sum, entry) => sum + (entry.trends || []).reduce((trendSum, series) => trendSum + ((series && series.observations || []).length), 0), 0)
    };
  }

  function portfolioPreflight(format, projects, settings, documentOptions, report) {
    const source = settings || {};
    const options = documentOptions || {};
    const selectedCount = (projects || []).length;
    const actual = report ? portfolioActualCounts(report, options.issueScope) : null;
    const estimatedIssues = source.includeIssues ? selectedCount * Math.max(1, Number(source.maxIssues) || DEFAULT_PORTFOLIO_ISSUES_PER_PROJECT) : 0;
    const estimatedComponents = source.includeComponents ? selectedCount * Math.max(1, Number(source.maxComponents) || DEFAULT_PORTFOLIO_COMPONENTS_PER_PROJECT) : 0;
    const estimatedAnalyses = source.includeAnalyses ? selectedCount * 100 : 0;
    const estimatedTrendObservations = source.includeTrends ? selectedCount * 100 * ((app.TREND_METRICS || []).length || 8) : 0;
    const issueCount = actual ? actual.issues : estimatedIssues;
    const selectedIssueCount = actual ? actual.selectedIssues : estimatedIssues;
    const componentCount = actual ? actual.components : estimatedComponents;
    const analysisCount = actual ? actual.analyses : estimatedAnalyses;
    const trendObservationCount = actual ? actual.trendObservations : estimatedTrendObservations;
    const register = ["docx", "print"].includes(format) && options.mode === "register";
    const issueLimit = register ? Number(app.MAX_DOCX_ISSUES) || 2000 : MAX_PORTFOLIO_TOTAL_ISSUES;
    const errors = [];
    const warnings = [];
    const missingRequired = app.missingRequiredDatasets ? app.missingRequiredDatasets(options.template, report || source) : [];
    const issuesRequired = format === "csv" || register;
    if (missingRequired.length) errors.push(`The selected profile requires ${missingRequired.join(", ")}; enable that data before collection.`);
    if (issuesRequired && !source.includeIssues) errors.push(`${format === "csv" ? "CSV" : "The issue-register mode"} requires the Issues dataset.`);
    if ((register ? selectedIssueCount : issueCount) > issueLimit) {
      errors.push(`${format.toUpperCase()} supports at most ${issueLimit.toLocaleString()} issue rows for this mode; the ${actual ? "collected" : "requested worst-case"} scope is ${(register ? selectedIssueCount : issueCount).toLocaleString()}.`);
    }
    if (componentCount > MAX_PORTFOLIO_TOTAL_COMPONENTS) {
      errors.push(`Portfolio collection supports at most ${MAX_PORTFOLIO_TOTAL_COMPONENTS.toLocaleString()} component rows; the ${actual ? "collected" : "requested worst-case"} scope is ${componentCount.toLocaleString()}.`);
    }
    if (format === "docx" && options.template && options.template.sections) {
      const docxComponentLimit = Number(app.MAX_DOCX_COMPONENTS) || 2000;
      const docxAnalysisLimit = Number(app.MAX_DOCX_ANALYSES) || 5000;
      const docxTrendLimit = Number(app.MAX_DOCX_TREND_OBSERVATIONS) || 5000;
      if (options.template.sections.components && componentCount > docxComponentLimit) {
        errors.push(`DOCX supports at most ${docxComponentLimit.toLocaleString()} component evidence rows; this ${actual ? "collected" : "requested worst-case"} scope is ${componentCount.toLocaleString()}.`);
      }
      if (options.template.sections.analyses && analysisCount > docxAnalysisLimit) {
        errors.push(`DOCX supports at most ${docxAnalysisLimit.toLocaleString()} analysis rows; this ${actual ? "collected" : "requested worst-case"} scope is ${analysisCount.toLocaleString()}.`);
      }
      if (options.template.sections.trends && trendObservationCount > docxTrendLimit) {
        errors.push(`DOCX supports at most ${docxTrendLimit.toLocaleString()} historical observations; this ${actual ? "collected" : "requested worst-case"} scope is ${trendObservationCount.toLocaleString()}.`);
      }
    }
    const modelBytes = report && typeof TextEncoder === "function" ? new TextEncoder().encode(JSON.stringify(report)).byteLength : 0;
    const estimatedPackageBytes = format === "xlsx"
      ? Math.max(modelBytes * 5, 1024 * 1024 + issueCount * 1800 + componentCount * 350 + selectedCount * 65536)
      : ["docx", "print"].includes(format) ? Math.max(modelBytes, 512 * 1024 + (register ? selectedIssueCount * 3500 : selectedCount * 65536)) : 0;
    const packageLimit = format === "xlsx" ? Number(app.MAX_XLSX_BYTES) || 75 * 1024 * 1024
      : format === "docx" ? Number(app.MAX_DOCX_BYTES) || 50 * 1024 * 1024 : 0;
    if (packageLimit && estimatedPackageBytes > packageLimit) {
      errors.push(`The estimated ${format.toUpperCase()} package exceeds its ${Math.round(packageLimit / 1024 / 1024)} MiB safety budget. Reduce issues/components or choose another format.`);
    } else if (packageLimit && estimatedPackageBytes > packageLimit * 0.8) {
      warnings.push(`The estimated ${format.toUpperCase()} package is near its fixed ${Math.round(packageLimit / 1024 / 1024)} MiB safety budget; final byte checks still apply.`);
    }
    return Object.freeze({
      ok: errors.length === 0,
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings),
      estimated: Object.freeze({ projects: selectedCount, issues: estimatedIssues, components: estimatedComponents, analyses: estimatedAnalyses, trendObservations: estimatedTrendObservations, packageBytes: estimatedPackageBytes }),
      actual: actual ? Object.freeze(actual) : null,
      limits: Object.freeze({ issues: issueLimit, components: MAX_PORTFOLIO_TOTAL_COMPONENTS, packageBytes: packageLimit || null })
    });
  }

  function startPortfolio(root) {
    injectPortfolioStyle();
    let projects = [];
    let selected = new Set();
    let snapshot = null;
    let preparedSignature = "";
    let controller = null;
    let working = false;
    const template = app.normalizeTemplate(app.BUILTIN_TEMPLATES[4]);
    const contextPath = app.contextPathFromLocation ? app.contextPathFromLocation() : "";
    root.innerHTML = `<main class="page page-limited opf"><header class="opf-hero"><div><span class="opf-kicker">Portfolio reporting · current-user authority</span><h1>Engineering decision ledger</h1><p>Compare authorized projects without turning missing data into good news. Every selected project keeps its own collection outcome and evidence.</p></div><div><a href="/projects">Open a project for a single-project report</a></div></header><div class="opf-warning"><strong>Portable data warning:</strong> reports leave SonarQube access control after download. Source code is never collected; people identifiers remain off unless explicitly enabled.</div><form id="opf-form" class="opf-form"><section class="opf-card"><div class="opf-step"><b>01</b><div><h2>Report mode</h2><p>The supported global page provides portfolio reports. Single-project reporting remains in each project's Extensions menu.</p></div></div><div class="opf-mode"><div><strong>Single project</strong><p>Open from a project to retain its branch or pull-request context.</p></div><div class="active"><strong>Portfolio / multi-project</strong><p>Main-branch project comparison using only projects visible to this signed-in user.</p></div></div></section><section class="opf-card"><div class="opf-step"><b>02</b><div><h2>Projects</h2><p>Search and select up to ${app.MAX_PORTFOLIO_PROJECTS} visible projects. Duplicate identifiers are ignored.</p></div></div><div class="opf-tools"><label>Search projects<input id="opf-search" type="search" placeholder="Project name or key"></label><label>Filter<select id="opf-filter"><option value="">All visible projects</option><option value="selected">Selected only</option></select></label><button id="opf-select-visible" type="button">Select all visible</button><button id="opf-clear" type="button">Clear</button></div><p class="opf-count" id="opf-count">Loading visible projects…</p><div class="opf-projects" id="opf-projects" role="group" aria-label="Visible SonarQube projects"><div class="opf-empty">Reading the projects this user can browse…</div></div></section><section class="opf-card"><div class="opf-step"><b>03</b><div><h2>Data scope</h2><p>Portfolio exports are bounded to ${MAX_PORTFOLIO_TOTAL_ISSUES.toLocaleString()} requested issue rows and ${MAX_PORTFOLIO_TOTAL_COMPONENTS.toLocaleString()} component rows in total. Historical metrics are separate from analysis events.</p></div></div><div class="opf-scope"><fieldset><legend>Include per project</legend><label class="opf-check"><input id="opf-issues" type="checkbox" checked> Issues</label><label class="opf-check"><input id="opf-components" type="checkbox" checked> File/component inventory</label><label class="opf-check"><input id="opf-analyses" type="checkbox"> Analysis event timeline</label><label class="opf-check"><input id="opf-trends" type="checkbox"> Historical metric trends</label><label class="opf-check"><input id="opf-people" type="checkbox"> Assignee and author identifiers</label></fieldset><div><label>Maximum issues per project<input id="opf-max-issues" type="number" min="1" max="10000" value="${DEFAULT_PORTFOLIO_ISSUES_PER_PROJECT}"></label><label>Maximum components per project<input id="opf-max-components" type="number" min="1" max="10000" value="${DEFAULT_PORTFOLIO_COMPONENTS_PER_PROJECT}"></label><label>Concurrent projects<select id="opf-concurrency"><option value="1">1</option><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option></select></label><label class="opf-check"><input id="opf-ranking" type="checkbox" checked> Order projects by the documented factual attention comparator</label></div></div></section><section class="opf-card"><div class="opf-step"><b>04</b><div><h2>Report profile</h2><p>Profiles set minimum evidence requirements as well as presentation.</p></div></div><div class="opf-grid">${app.BUILTIN_TEMPLATES.map((item, index) => `<label class="opf-choice"><input type="radio" name="profile" value="${app.escapeHtml(item.id)}" ${index === 4 ? "checked" : ""}><strong>${app.escapeHtml(item.name)}</strong><span>${app.escapeHtml(item.description)}</span></label>`).join("")}</div></section><section class="opf-card"><div class="opf-step"><b>05</b><div><h2>Output</h2><p>Every format can reuse the same frozen Model v3 snapshot and report ID.</p></div></div><div class="opf-grid opf-output"><label class="opf-choice"><input type="radio" name="format" value="html" checked><strong>Offline HTML</strong><span>Interactive executive dashboard and drill-down.</span></label><label class="opf-choice"><input type="radio" name="format" value="xlsx"><strong>Excel</strong><span>Scorecard, evidence and issue analysis sheets.</span></label><label class="opf-choice"><input type="radio" name="format" value="docx"><strong>Word</strong><span>Bounded formal executive review.</span></label><label class="opf-choice"><input type="radio" name="format" value="print"><strong>PDF</strong><span>Print-ready HTML; choose Save as PDF.</span></label><label class="opf-choice"><input type="radio" name="format" value="csv"><strong>Issues CSV</strong><span>Machine-readable register with project columns.</span></label><label class="opf-choice"><input type="radio" name="format" value="json"><strong>JSON</strong><span>Full source, normalized, derived and evidence model.</span></label></div><div id="opf-doc-options" class="opf-doc-options" hidden><fieldset><legend>Document content</legend><label class="opf-check"><input type="radio" name="document-mode" value="summary" checked> Executive summary and project scorecard</label><label class="opf-check"><input type="radio" name="document-mode" value="register"> Summary plus compact issue register</label><div id="opf-issue-scope" hidden><label class="opf-check"><input type="radio" name="issue-scope" value="active" checked> Actionable issues only</label><label class="opf-check"><input type="radio" name="issue-scope" value="all"> All collected issues</label><small>Word refuses more than ${app.MAX_DOCX_ISSUES} selected issue rows.</small></div></fieldset></div></section><section class="opf-card"><div class="opf-step"><b>06</b><div><h2>Generate</h2><p>Collection continues across independent project failures. Cancel aborts compatible same-origin requests, stops local work, and never downloads a cancelled artifact.</p></div></div><div class="opf-submit"><button class="opf-primary" id="opf-create" type="submit">Create offline HTML</button><button id="opf-cancel" type="button" hidden>Cancel</button><progress id="opf-progress" class="opf-progress" max="1" value="0" hidden></progress><div id="opf-status" class="opf-status" role="status" aria-live="polite">Select projects to begin.</div></div><div id="opf-live-summary" class="opf-summary" hidden></div></section></form></main>`;
    root.querySelector(".opf-hero a").setAttribute("href", `${contextPath}/projects`);
    const find = (id) => root.querySelector(`#${id}`);
    const form = find("opf-form");
    const dataControls = ["opf-issues", "opf-components", "opf-analyses", "opf-trends", "opf-people", "opf-max-issues", "opf-max-components", "opf-concurrency", "opf-ranking"].map(find);
    const viewport = root.querySelector(".opf");
    function fit() { const top = Math.max(0, viewport.getBoundingClientRect().top); viewport.style.setProperty("--opf-height", `${Math.max(160, (global.visualViewport ? global.visualViewport.height : global.innerHeight) - top - 12)}px`); }
    global.addEventListener("resize", fit, { passive: true });
    if (global.visualViewport) global.visualViewport.addEventListener("resize", fit, { passive: true });
    fit();
    function setStatus(message, kind) { find("opf-status").textContent = message; find("opf-status").dataset.kind = kind || "info"; }
    function selectedValue(name) { const input = root.querySelector(`input[name="${name}"]:checked`); return input && input.value; }
    function visibleProjects() {
      const query = find("opf-search").value.trim().toLowerCase();
      const selectedOnly = find("opf-filter").value === "selected";
      return projects.filter((project) => (!query || `${project.name} ${project.key}`.toLowerCase().includes(query)) && (!selectedOnly || selected.has(project.key)));
    }
    function renderProjects() {
      const visible = visibleProjects();
      find("opf-projects").innerHTML = visible.length ? visible.map((project) => `<label class="opf-project"><input type="checkbox" data-project-key="${app.escapeHtml(project.key)}" ${selected.has(project.key) ? "checked" : ""}><span><strong>${app.escapeHtml(project.name)}</strong><code>${app.escapeHtml(project.key)}</code></span><span>${app.escapeHtml(app.qualifierLabel(project.qualifier))}</span></label>`).join("") : `<div class="opf-empty">No visible project matches this filter.</div>`;
      find("opf-count").textContent = `${selected.size} selected · ${visible.length} shown · ${projects.length} visible to this user`;
      find("opf-create").disabled = working || selected.size === 0;
    }
    function settings() {
      return {
        includeIssues: find("opf-issues").checked,
        includeComponents: find("opf-components").checked,
        includeAnalyses: find("opf-analyses").checked,
        includeTrends: find("opf-trends").checked,
        includePeople: find("opf-people").checked,
        maxIssues: Math.max(1, Math.min(10000, Number(find("opf-max-issues").value) || DEFAULT_PORTFOLIO_ISSUES_PER_PROJECT)),
        maxComponents: Math.max(1, Math.min(10000, Number(find("opf-max-components").value) || DEFAULT_PORTFOLIO_COMPONENTS_PER_PROJECT)),
        concurrency: Math.max(1, Math.min(4, Number(find("opf-concurrency").value) || 3)),
        rankProjects: find("opf-ranking").checked
      };
    }
    function chosenProjects() { return projects.filter((project) => selected.has(project.key)); }
    function currentSignature() { return portfolioSnapshotSignature(chosenProjects(), settings()); }
    function markStale() {
      if (!snapshot || preparedSignature === currentSignature()) return;
      setStatus("Prepared data is stale. Create again to recollect the changed project/data scope.", "stale");
    }
    function applyTemplateRequirements(selectedTemplate) {
      const enabled = [];
      (app.requiredDatasetKeys ? app.requiredDatasetKeys(selectedTemplate) : []).forEach((key) => {
        const control = find(`opf-${key}`);
        if (!control || control.checked || key === "people") return;
        control.checked = true;
        enabled.push(key);
      });
      return enabled;
    }
    async function ensurePortfolioSnapshot(projectSelection, collectionSettings) {
      const signature = portfolioSnapshotSignature(projectSelection, collectionSettings);
      if (snapshot && preparedSignature === signature) return snapshot;
      controller = new AbortController();
      const report = await app.collectPortfolio(projectSelection, collectionSettings, (progress) => {
        find("opf-progress").value = progress.completed || 0;
        setStatus(progress.message || `Analysing ${progress.completed} of ${progress.total} projects`);
        liveSummary(progress);
      }, controller.signal);
      if (controller.signal.aborted) throw new DOMException("Export cancelled", "AbortError");
      snapshot = freezePortfolioSnapshot(report);
      preparedSignature = signature;
      return snapshot;
    }
    function updateFormat() {
      const format = selectedValue("format") || "html";
      const labels = { html: "offline HTML", xlsx: "Excel workbook", docx: "Word document", print: "PDF print view", csv: "issues CSV", json: "JSON snapshot" };
      find("opf-create").textContent = `Create ${labels[format]}`;
      find("opf-doc-options").hidden = !["docx", "print"].includes(format);
      find("opf-issue-scope").hidden = selectedValue("document-mode") !== "register";
    }
    function setWorking(value, cancellable) {
      working = value;
      root.querySelectorAll("input,select,button").forEach((control) => { control.disabled = value; });
      find("opf-cancel").hidden = !value || cancellable === false;
      find("opf-cancel").disabled = !value || cancellable === false;
      find("opf-progress").hidden = !value;
      if (!value) renderProjects();
    }
    async function confirmDownloadAllowed() {
      await new Promise((resolve) => global.setTimeout(resolve, 0));
      if (controller && controller.signal.aborted) throw new DOMException("Export cancelled", "AbortError");
    }
    function liveSummary(progress) {
      const host = find("opf-live-summary");
      const outcomes = progress.outcomes || {};
      host.hidden = false;
      host.innerHTML = [["Complete", outcomes.complete || 0], ["Partial", outcomes.partial || 0], ["Failed", outcomes.failed || 0], ["Denied", outcomes.permission_denied || 0], ["Pending", Math.max(0, progress.total - progress.completed)]].map(([key, value]) => `<div><span>${key}</span><strong>${value}</strong></div>`).join("");
    }
    async function generate(event) {
      event.preventDefault();
      if (working || !selected.size) return;
      const format = selectedValue("format") || "html";
      const profileId = selectedValue("profile") || "portfolio";
      const chosenTemplate = app.normalizeTemplate(app.BUILTIN_TEMPLATES.find((item) => item.id === profileId) || template);
      const mode = selectedValue("document-mode") || "summary";
      const issueScope = selectedValue("issue-scope") || "active";
      const projectSelection = chosenProjects();
      const collectionSettings = settings();
      const signature = portfolioSnapshotSignature(projectSelection, collectionSettings);
      const reusable = snapshot && preparedSignature === signature ? snapshot : null;
      const initialPreflight = portfolioPreflight(format, projectSelection, collectionSettings, { mode, issueScope, template: chosenTemplate }, reusable);
      if (!initialPreflight.ok) {
        setStatus(initialPreflight.errors.join("\n"), "error");
        return;
      }
      let printWindow = null;
      if (format === "print") { try { printWindow = global.open("", "_blank"); } catch (_) { printWindow = null; } if (printWindow) { try { printWindow.opener = null; } catch (_) { /* retained reference is still used below */ } printWindow.document.write("<!doctype html><meta charset=utf-8><title>Preparing portfolio print view…</title><p>Collecting portfolio evidence…</p>"); } }
      setWorking(true, !reusable);
      find("opf-progress").max = projectSelection.length;
      find("opf-progress").value = 0;
      setStatus(reusable ? "Using the prepared portfolio snapshot…" : "Collecting the current portfolio scope…");
      try {
        const collected = await ensurePortfolioSnapshot(projectSelection, collectionSettings);
        if (controller && controller.signal.aborted) throw new DOMException("Export cancelled", "AbortError");
        const finalPreflight = portfolioPreflight(format, projectSelection, collectionSettings, { mode, issueScope, template: chosenTemplate }, collected);
        if (!finalPreflight.ok) throw new Error(finalPreflight.errors.join(" "));
        const actual = portfolioActualCounts(collected, issueScope);
        const artifactMode = format === "html" ? "interactive"
          : ["xlsx", "json"].includes(format) ? "full"
            : format === "csv" ? "register" : mode;
        const artifactIssueScope = ["xlsx", "json", "csv"].includes(format) ? "all-collected" : issueScope;
        const renderedOnly = format === "print";
        const renderedDatasets = renderedOnly && collectionSettings.includeIssues ? ["issues"] : [];
        const excludedDatasets = renderedOnly
          ? (app.requiredDatasetKeys ? app.requiredDatasetKeys(chosenTemplate) : []).filter((key) => !renderedDatasets.includes(key))
          : [];
        const renderedCounts = renderedOnly ? {
          projects: actual.projects,
          issues: mode === "register" && chosenTemplate.sections.issues ? actual.selectedIssues : 0,
          components: 0,
          analyses: 0,
          trendObservations: 0
        } : null;
        const report = app.createArtifactReport(collected, format, {
          template: chosenTemplate,
          purpose: format === "html" ? "interactive" : format === "print" ? "print" : ["csv", "json"].includes(format) ? "data" : "document",
          mode: artifactMode,
          issueScope: artifactIssueScope,
          exportedCounts: renderedCounts || undefined,
          scope: renderedOnly ? {
            fullModel: false,
            representedDatasets: renderedDatasets,
            excludedDatasets,
            exclusionReason: mode === "summary" ? "user_selected_print_summary" : "user_selected_print_register",
            representation: "rendered_views_only",
            representationByDataset: renderedDatasets.includes("issues") ? {
              issues: mode === "register" ? "raw_rows_and_reconciled_aggregates" : "reconciled_aggregates_only"
            } : {}
          } : format === "html" ? {
            fullModel: true,
            representation: "full_model_v3_and_rendered_views",
            visibleIssueScope: issueScope
          } : undefined,
          warnings: finalPreflight.warnings
        });
        const base = `sonarqube-portfolio-${new Date(report.exportedAt).toISOString().slice(0, 10)}`;
        let finalArtifactComplete = report.artifactComplete;
        let exporterWarnings = [...(report.artifact && report.artifact.warnings || [])];
        if (format === "html") {
          const html = app.buildHtmlReport(report, chosenTemplate, { purpose: "interactive", issueScope });
          await confirmDownloadAllowed();
          app.downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), app.safeFileName(base, "html"));
        } else if (format === "xlsx") {
          const result = app.buildXlsx(report);
          if (result && result.artifactComplete !== undefined) finalArtifactComplete = !!result.artifactComplete;
          exporterWarnings = [...new Set([...exporterWarnings, ...(result && Array.isArray(result.warnings) ? result.warnings : [])])];
          await confirmDownloadAllowed();
          app.downloadBlob(result.blob, app.safeFileName(base, "xlsx"));
        } else if (format === "docx") {
          const result = app.buildDocx(report, chosenTemplate, { includeIssueRegister: mode === "register", issueScope });
          await confirmDownloadAllowed();
          app.downloadBlob(result.blob, app.safeFileName(base, "docx"));
        } else if (format === "csv") {
          await confirmDownloadAllowed();
          app.downloadBlob(new Blob([app.toCsv(app.issueRows(report))], { type: "text/csv;charset=utf-8" }), app.safeFileName(`${base}-issues`, "csv"));
        } else if (format === "json") {
          const content = JSON.stringify({ manifest: app.reportManifest(report), report }, null, 2);
          await confirmDownloadAllowed();
          app.downloadBlob(new Blob([content], { type: "application/json" }), app.safeFileName(base, "json"));
        }
        else if (format === "print") {
          const html = app.buildHtmlReport(report, chosenTemplate, { purpose: "print", mode, issueScope });
          await confirmDownloadAllowed();
          if (printWindow && !printWindow.closed) { printWindow.document.open(); printWindow.document.write(html); printWindow.document.close(); }
          else app.downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), app.safeFileName(`${base}-print-view`, "html"));
        }
        const warningText = exporterWarnings.length ? ` Export warnings: ${exporterWarnings.join(" ")}` : "";
        setStatus(`${report.portfolioSummary.projectsAnalysed} of ${report.portfolioSummary.projectsSelected} projects analysed. Snapshot ${report.reportId} remains prepared for another format. ${finalArtifactComplete ? "This artifact is complete for its declared scope." : "This artifact contains partial evidence; review Data Confidence."}${warningText}`, finalArtifactComplete ? "success" : "error");
      } catch (error) {
        if (printWindow && !printWindow.closed) printWindow.close();
        setStatus(error && error.name === "AbortError" ? "Portfolio collection cancelled. No report was downloaded." : `Could not create portfolio report: ${error.message}`, error && error.name === "AbortError" ? "info" : "error");
      } finally { controller = null; setWorking(false); }
    }
    find("opf-search").addEventListener("input", renderProjects);
    find("opf-filter").addEventListener("change", renderProjects);
    find("opf-projects").addEventListener("change", (event) => {
      const key = event.target && event.target.dataset.projectKey;
      if (!key) return;
      if (event.target.checked) {
        if (selected.size >= app.MAX_PORTFOLIO_PROJECTS) { event.target.checked = false; setStatus(`Select at most ${app.MAX_PORTFOLIO_PROJECTS} projects.`, "error"); return; }
        selected.add(key);
      } else selected.delete(key);
      renderProjects();
      markStale();
    });
    find("opf-select-visible").addEventListener("click", () => { visibleProjects().forEach((project) => { if (selected.size < app.MAX_PORTFOLIO_PROJECTS) selected.add(project.key); }); renderProjects(); markStale(); if (visibleProjects().length > app.MAX_PORTFOLIO_PROJECTS) setStatus(`Selected the first ${app.MAX_PORTFOLIO_PROJECTS} visible projects; the supported portfolio boundary was reached.`); });
    find("opf-clear").addEventListener("click", () => { selected.clear(); renderProjects(); markStale(); setStatus("Project selection cleared."); });
    root.addEventListener("change", (event) => {
      if (["format", "document-mode"].includes(event.target.name)) updateFormat();
      if (event.target.name === "profile") {
        const selectedTemplate = app.normalizeTemplate(app.BUILTIN_TEMPLATES.find((item) => item.id === event.target.value) || template);
        const enabled = applyTemplateRequirements(selectedTemplate);
        if (enabled.length) setStatus(`Enabled profile-required data: ${enabled.join(", ")}.`);
        markStale();
      }
      if (dataControls.includes(event.target)) markStale();
    });
    find("opf-max-issues").addEventListener("input", markStale);
    find("opf-max-components").addEventListener("input", markStale);
    form.addEventListener("submit", generate);
    find("opf-cancel").addEventListener("click", () => { if (controller) controller.abort(); });
    setWorking(false);
    updateFormat();
    applyTemplateRequirements(template);
    app.listVisibleProjects(null, (progress) => setStatus(progress.message)).then((result) => { projects = result.projects; renderProjects(); setStatus(projects.length ? "Select the projects to include." : "No project is visible to this user.", projects.length ? "info" : "error"); }).catch((error) => { setStatus(`Could not list visible projects: ${error.message}`, "error"); find("opf-projects").innerHTML = `<div class="opf-empty">Project inventory is unavailable. Refresh after confirming the signed-in session.</div>`; });
    return () => { if (controller) controller.abort(); global.removeEventListener("resize", fit); if (global.visualViewport) global.visualViewport.removeEventListener("resize", fit); root.textContent = ""; };
  }

  Object.assign(app, {
    MAX_PORTFOLIO_TOTAL_ISSUES,
    MAX_PORTFOLIO_TOTAL_COMPONENTS,
    DEFAULT_PORTFOLIO_ISSUES_PER_PROJECT,
    DEFAULT_PORTFOLIO_COMPONENTS_PER_PROJECT,
    portfolioSnapshotSignature,
    portfolioPreflight,
    startPortfolio,
    freezePortfolioSnapshot,
    PORTFOLIO_UI_CSS
  });
})(window);

(function (global) {
  "use strict";

  if (typeof global.registerExtension !== "function") return;
  global.registerExtension("offlinereport/portfolio_page", function (options) {
    return global.OfflineReport.startPortfolio(options.el, options);
  });
})(window);
