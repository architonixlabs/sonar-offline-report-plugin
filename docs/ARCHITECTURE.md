# Architecture and reviewed decisions

## Product boundary

The plugin remains deliberately thin and client-side. Java registers the existing component page plus a non-admin global Portfolio Reporting page. Both browser applications use the signed-in user's session to read public Web APIs, normalize one immutable snapshot, and create files locally.

```text
project page                 global portfolio page
     |                                |
     | current project/branch         | visible-project inventory
     +---------------+----------------+
                     |
         same-origin public Web APIs
         current-user authorization
                     |
           bounded project collector
                     |
        Report Model v3 project entries
                     |
       single snapshot / portfolio envelope
                     |
       HTML / XLSX / CSV / DOCX / JSON
                     |
           browser download or
             Print / Save as PDF
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
- Defer shared templates, schedules, durable audit/storage/signing and deterministic PDF to a companion service. Bounded, user-initiated portfolio reporting remains safe in the browser and is included.

## Main components

### Java registration

`OfflineReportPlugin` registers `OfflineReportPageDefinition`, which exposes `offlinereport/report_page` for project components and `offlinereport/portfolio_page` at global scope. The global page is not an admin page. There is no scanner or compute-engine extension.

### Public API adapter

The browser adapter uses fixed public actions for system status, visible-project inventory, measures, quality gate, issues, components, project analyses and metric history. Requests go through same-origin credentialed `fetch` using the discovered SonarQube context path, with the host `SonarRequest.getJSON` helper retained only as a compatibility fallback. It uses the current documented `components` issue parameter and asks only for required rule additions. The inventory uses `/api/components/search`, whose results remain constrained by the signed-in user's Browse visibility; it does not use the system-admin `/api/projects/search` action.

Portfolio selection is bounded to 50 unique projects. Main-branch collection uses one to four workers (default three), preserves the existing per-request retry/timeout behavior and continues after an independent project failure. Required 401/403 failures become an explicit permission-denied project entry. See [API contract](API-CONTRACT.md).

Collection is bounded and uses an explicit best-effort stable sort plus first-seen issue-key deduplication. It records raw rows, unique rows, duplicates removed, first/last totals, termination reason, and reconciliation. Changed totals, unreconciled counts, API search-window boundaries, configured limits, or changed analysis identity produce an explicit partial snapshot. Concurrent mutation can still move equal-sort-key records between pages, so an unchanged total alone is not treated as transactional proof.

### Report Model v3

One deeply frozen normalized model carries:

- schema, plugin, renderer, and template versions;
- random report ID and canonical manifest/provenance data;
- server, project, branch, analysis, collection, and artifact-generation identity;
- exact selected scope and per-dataset state/count/limit/reason;
- quality gate, overall/new-code measures, issues, rules, components, analyses, optional metric trends and warnings;
- both modern and legacy issue status/type/severity fields with an explicit lifecycle classification.
- deterministic issue age/effort dimensions, status model, risk concentrations, reconciliation and collection evidence.

Portfolio mode wraps independently collected project entries with requested/actual scope, selected/attempted/analysed/outcome counts, weighted source-denominator aggregates and an optional documented lexicographic attention order. Unavailable values remain null and failed projects remain present. The formulas and missing-data behavior are authoritative in [Reporting Model](REPORTING-MODEL.md).

Every exporter consumes this object; no exporter reads live UI controls as data scope.

### Guided page and lifecycle

Both UIs provide eight evidence contracts: Executive, Executive + Technical, Detailed Technical, Issues Only, Portfolio Review, Delivery, Application Security, and QA / Data Audit. Each declares a persona and minimum datasets separately from presentation. The project page retains stale-scope invalidation. The global page adds project search/filter/select/clear, actual multi-project progress/outcomes, bounded concurrency and cancellation. Word and print formats offer an optional compact issue-register mode.

It uses a dedicated, resize-aware vertical viewport that recalculates its available height after browser resize or zoom. A stable scrollbar and bottom clearance keep expanded controls reachable. Controls meet a 44px target, reflow to one column, expose visible focus, and do not encode status by color alone.

### HTML and print

The offline HTML embeds escaped data, local CSS and an audited runtime pinned by CSP hash. It performs no network calls. Single mode offers issue filtering, sorting, pagination, trends, detail disclosures and provenance. Portfolio mode begins with scope/confidence, gate distribution, weighted metrics and attention ordering, then provides accessible table-backed concentrations and per-project drill-down. Both have print styling.

Print includes report ID, UTC timestamp, exact filter/scope, exported versus collected counts, and completeness. The product says **Print / Save as PDF**, not direct PDF generation or PDF/A/PDF/UA compliance.

### XLSX and CSV

XLSX uses human labels, professional column sizing/styles, frozen/filterable headers, finite typed numeric/date cells, UTC date semantics, and literal inline strings for untrusted content. It contains no formulas, macros, hyperlinks, or external relationships. CSV follows RFC 4180, includes a UTF-8 BOM, begins with a mandatory manifest record, repeats provenance and completeness on data rows, and neutralizes formula-like content after whitespace/control normalization.

### DOCX

DOCX uses a deliberately narrow fixed macro-free OOXML profile with escaped `w:t` content, fixed internal relationships, repeating table headers, and a bounded 2,000-row issue appendix. It does not support raw XML, fields, altChunk, macros, external relationships, hyperlinks, images, attached templates, OLE, ActiveX, or arbitrary uploaded Word templates.

## Enterprise topology later

Capabilities requiring persistence, organization-level policy/workflow, schedules, high-volume rendering, centralized audit, signing, retention, or distribution belong in a separately deployed reporting API/worker/object-store/template-registry stack. That service must use public SonarQube APIs and vault-managed least-privilege credentials, never Sonar's database or installation directory.

## Release posture

Version 2.0.1 is the first publishable production-hardening release candidate for Model v3. Its automated source, cross-format, persona, packaging, provenance and SBOM-attestation gates must pass before deployment; controlled pilot and enterprise GA remain blocked by the exact-artifact live evidence gates in [Compatibility](COMPATIBILITY.md), [Performance](PERFORMANCE.md), [Persona validation](PERSONA-VALIDATION.md), and [Enterprise readiness](ENTERPRISE-READINESS.md).
