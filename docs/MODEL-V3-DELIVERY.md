# v2.0.0 Model v3 delivery record

## Implementation and architecture

The existing project page is preserved. A second non-admin global page provides Browse-filtered main-branch portfolio reporting. Both remain client-side, same-origin and current-user authorized. Model v3 adds normalized lifecycle/impact/age/effort, independent project states, evidence, weighted aggregates, risk concentrations and optional metric history. A maximum of 50 unique projects and one-to-four workers prevent unbounded fan-out.

## API additions

- `/api/components/search`: project inventory with `qualifiers=TRK` and bounded paging.
- `/api/measures/search_history`: optional current/previous retained metric observations for the fixed trend list.

Every endpoint and failure rule is in [API contract](API-CONTRACT.md).

## Report feature matrix

| Feature | HTML | XLSX | DOCX | CSV | JSON | Print |
|---|---|---|---|---|---|---|
| Portfolio executive summary | Persona-prioritized interactive view; full model embedded | Executive Summary sheet | Formal summary | Manifest only | Full model | Declared print layout |
| Analysis scope/project outcomes | Table + drill-down | Scorecard/Data Quality | Scorecard/confidence | Manifest + repeated row provenance | Full | Table |
| Gate distribution/conditions | Full | Gate sheets | Gate reasons | Manifest only | Full source + derived | Full |
| Weighted coverage/duplication/debt | Full | Summary + source measures | Selected summary/status | Manifest only | Numerator/denominator/formula paths | Full |
| Lifecycle/quality/impact/age/effort | Charts/tables/register | Summary + Issues | Summary + optional register | Full row dimensions | Full | Summary/optional register |
| Top projects/rules/components/issues | Executive subset + project details | Scorecard/rules/components/issues | Attention list | Sortable externally | Full concentration model | Executive subset |
| Historical metric trends | Accessible table | Trends sheet | Trend evidence | Manifest only | Full observations/change | Table when selected |
| Collection evidence/warnings | Full per project | Data Quality/Warnings/Metadata | Confidence/warnings/provenance | Manifest + repeated row evidence | Full | Full |
| Issue register maximum | 10,000 collected/project; disclosed | Collected rows within package bound | Optional; refuses >2,000 selected rows | Collected rows | Collected rows | Optional document scope |
| Zero-network after export | Yes | Not applicable | Not applicable | Not applicable | Not applicable | Yes |

`—` means the format's intended purpose does not include that feature; it is not represented as zero.

## Metric definition matrix

| Metric | Source | Derived | Formula | Missing behavior | Portfolio aggregation |
|---|---|---|---|---|---|
| Quality Gate | `qualitygates/project_status` | Display normalization only | None | Unknown, never pass | Distribution of analysed projects |
| Security/Reliability/Maintainability rating | component measures | 1–5 mapped A–E | Direct mapping | Unavailable | Project distribution/attention comparator; no average |
| Coverage | count measures | Yes | covered lines + conditions / total lines + conditions | Unavailable without usable paired counts | Source-denominator weighted |
| Duplication | `duplicated_lines`, `ncloc` | Yes | sum duplicated / sum NCLOC | Unavailable without both/positive NCLOC | Source-denominator weighted |
| Technical debt | `sqale_index` minutes | Sum | sum available minutes | Null when no source values; represented-project count retained | Sum available values |
| Actionable/Accepted/Closed/Unknown | issue status/resolution | Normalized | documented lifecycle map | Unknown category | Sum over analysed projects; reconciliation required |
| Issue age | creation/report timestamp | Yes | floored elapsed UTC days | Unknown age | Buckets/counts |
| Effort | issue effort | Yes | min; h×60; d×480 | Unknown counted separately | Sum known minutes |
| Trends | measure history | Yes | current−previous; percentage divided by abs(previous) | No history = unavailable; prior zero = no percentage | Per project; no synthetic portfolio trend |

Full definitions are in [Reporting Model](REPORTING-MODEL.md).

## Accuracy and security evidence

- 77/77 Node tests pass, including weighted formulas, missing values, lifecycle reconciliation, null/zero trends, duplicate project/issue handling, mixed complete/partial/denied outcomes, exact HTML dataset-state disclosure, Model v3 schema/provenance/persona requirements, bounded concurrency/transport cancellation and cross-format fixtures.
- Chrome 151 passes 224/224 generated-report checks over all eight built-in profiles at desktop and 390px, including CSP/offline blocking, 16 deterministic screenshots, and complete project plus portfolio active/all print-scope reconciliation across three deterministic PDFs.
- Maven clean verification and the Java page test pass.
- The generated project and portfolio bundles pass freshness checks and both ship in the JAR with LICENSE/NOTICE and a CycloneDX 1.6 SBOM.
- The prior API allowlist, privacy opt-in, hostile-content escaping, CSP/hash/zero-network HTML, CSV/XLSX formula protection and fixed macro-free/no-external-relationship Office controls remain tested.

## Remaining limitations

- Portfolio mode is main-branch only.
- Project selection is capped at 50; a prepared artifact is capped at 25,000 issues and 50,000 components in total in addition to per-project bounds.
- Trend retention is the latest bounded history page and does not create a portfolio-wide trend series.
- Cancellation aborts the primary same-origin `fetch` transport; the legacy host-helper fallback rejects locally and ignores late results without claiming a wire-level abort.
- No schedule, backend repository, central audit, organizational workflow, deterministic PDF, report signature or encryption is added.
- Live target-server authorization/load/fault injection, authenticated download/popup behavior, Firefox/screen-reader/zoom review and desktop Office no-repair tests remain open. Local Chrome renderer/reflow/CSP/print behavior is automated.

## Release recommendation

| Stage | Recommendation | Reason |
|---|---|---|
| Development | **GO** | Automated correctness, security regression, packaging and synthetic generation checks pass |
| Controlled Pilot | **NO-GO** | Target global-page authorization, mixed-permission and 1/10/25/50-project live load evidence is open |
| Enterprise GA | **NO-GO** | Pilot gates plus Firefox/Office/accessibility, HTTPS, signing, privacy and operational gates remain open; exact-target upgrade/rollback already passes |
