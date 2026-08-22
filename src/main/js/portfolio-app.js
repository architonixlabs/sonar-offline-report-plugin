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
