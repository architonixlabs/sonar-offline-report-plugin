(function (global) {
  "use strict";

  const app = global.OfflineReport = global.OfflineReport || {};
  const MAX_CELL_LENGTH = 32767;
  const MAX_XLSX_BYTES = 75 * 1024 * 1024;
  const MAX_ZIP_ENTRIES = 65535;
  const MAX_ZIP_UINT32 = 0xFFFFFFFF;
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
      blob: new Blob([zipStore(files, MAX_XLSX_BYTES)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      warnings: [...truncationWarnings]
    };
  }

  Object.assign(app, {
    MAX_XLSX_BYTES,
    crc32,
    zipStore,
    buildXlsx,
    xlsxSafeCell: safeCell,
    xlsxRows: toRows,
    xlsxNumberCell: numberCell,
    xlsxDateCell: dateCell
  });
})(window);
