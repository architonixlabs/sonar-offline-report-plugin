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
    const packageBytes = app.zipStore(files, MAX_DOCX_BYTES);
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
