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
