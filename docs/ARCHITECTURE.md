# Architecture and reviewed decisions

## Product boundary

The plugin remains deliberately thin and project-scoped. Java registers one component page. Its browser application uses the signed-in user's session to read documented public Web APIs, normalizes one immutable snapshot, and creates files locally.

```text
SonarQube project page
        |
        | same-origin public Web APIs, current-user authorization
        v
bounded collector -> Report Model v2 -> HTML / XLSX / CSV / DOCX / JSON
                         |                       |
                         |                       +-> browser download
                         +-> printable view -> Print / Save as PDF
                         +-> declarative Template Schema v2
```

There is no direct database access, Sonar internal API, service token, server filesystem report store, background scheduler, or Office/browser renderer inside SonarQube.

## Multi-role design agreement

Architecture, product/UX, development, and security/QA reviews agreed on these decisions before the 1.2.0 implementation:

- Preserve the thin supported extension boundary and exact 26.6 target.
- Use a guided preset → format → scope → review → collect/export workspace with normal page scrolling.
- Treat data selection and presentation separately. Scope changes invalidate the snapshot; format/template changes reuse it.
- Use orthogonal state: workflow (`Idle`, `Collecting`, `Ready`, `Generating`, `Failed`), snapshot validity (`Current`, `Invalidated`), and data health (`Complete`, `Partial`).
- Generate HTML/XLSX/CSV/DOCX/JSON from the same model. PDF remains an explicitly labelled browser Print / Save as PDF flow.
- Keep templates declarative and bounded; reject arbitrary HTML/JS/CSS, remote assets, and user-supplied Office packages.
- Defer shared templates, schedules, multi-project reporting, durable audit/storage/signing, and deterministic PDF to a companion service.

## Main components

### Java registration

`OfflineReportPlugin` registers `OfflineReportPageDefinition`, which exposes `offlinereport/report_page` for project components. There is no scanner or compute-engine extension.

### Public API adapter

The browser adapter uses fixed relative public actions for system status, measures, quality gate, issues, components, and project analyses. It uses the current documented `components` issue parameter and asks only for required rule additions.

Collection is bounded and uses an explicit best-effort stable sort plus first-seen issue-key deduplication. It records raw rows, unique rows, duplicates removed, first/last totals, termination reason, and reconciliation. Changed totals, unreconciled counts, API search-window boundaries, configured limits, or changed analysis identity produce an explicit partial snapshot. Concurrent mutation can still move equal-sort-key records between pages, so an unchanged total alone is not treated as transactional proof.

### Report Model v2

One immutable normalized model carries:

- schema, plugin, renderer, and template versions;
- random report ID and canonical manifest/provenance data;
- server, project, branch, analysis, collection, and generation identity;
- exact selected scope and per-dataset state/count/limit/reason;
- quality gate, overall/new-code measures, issues, rules, components, analyses, and warnings;
- both modern and legacy issue status/type/severity fields with an explicit lifecycle classification.

Every exporter consumes this object; no exporter reads live UI controls as data scope.

### Guided page and lifecycle

The UI provides Executive summary, Detailed technical, and Issues only presets; professional format cards; collapsed advanced data/appearance settings; labelled collection progress; and a single dynamic primary action. Word and print formats separately offer an optional compact issue-register mode. Scope changes mark the cached snapshot stale; the next Create action visibly recollects before exporting.

It uses a dedicated, resize-aware vertical viewport that recalculates its available height after browser resize or zoom. A stable scrollbar and bottom clearance keep expanded controls reachable. Controls meet a 44px target, reflow to one column, expose visible focus, and do not encode status by color alone.

### HTML and print

The offline HTML embeds escaped JSON, local CSS, and one audited runtime pinned by CSP hash. It performs no network calls and renders untrusted data through text nodes. It separates quality-gate failure, export health, and analysis freshness; presents actionable KPIs and normalized measures; and offers filtering, sorting, pagination, detail disclosures, provenance, and print styling.

Print includes report ID, UTC timestamp, exact filter/scope, exported versus collected counts, and completeness. The product says **Print / Save as PDF**, not direct PDF generation or PDF/A/PDF/UA compliance.

### XLSX and CSV

XLSX uses human labels, professional column sizing/styles, frozen/filterable headers, finite typed numeric/date cells, UTC date semantics, and literal inline strings for untrusted content. It contains no formulas, macros, hyperlinks, or external relationships. CSV follows RFC 4180, includes a UTF-8 BOM, and neutralizes formula-like content after whitespace/control normalization.

### DOCX

DOCX uses a deliberately narrow fixed macro-free OOXML profile with escaped `w:t` content, fixed internal relationships, repeating table headers, and a bounded 2,000-row issue appendix. It does not support raw XML, fields, altChunk, macros, external relationships, hyperlinks, images, attached templates, OLE, ActiveX, or arbitrary uploaded Word templates.

## Enterprise topology later

Capabilities requiring persistence, organization-level policy/workflow, schedules, high-volume rendering, centralized audit, signing, retention, or distribution belong in a separately deployed reporting API/worker/object-store/template-registry stack. That service must use public SonarQube APIs and vault-managed least-privilege credentials, never Sonar's database or installation directory.

## Release posture

Version 1.3.0 is an enterprise candidate/pilot. The implementation boundary is approved, but enterprise GA remains blocked by the concrete evidence gates in [Compatibility](COMPATIBILITY.md) and [Enterprise readiness](ENTERPRISE-READINESS.md).
