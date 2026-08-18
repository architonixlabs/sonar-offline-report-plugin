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
