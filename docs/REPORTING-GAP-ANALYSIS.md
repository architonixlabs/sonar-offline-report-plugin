# Reporting enhancement gap analysis

Date: 2026-08-22

Baseline: `v1.3.0`, Report Model v2, commit
`eccf14b6a625de5cfebb4a47d05a23ed839979a1`.

This analysis was completed before implementation. It compares the reviewed
source, generated browser asset, Java page registration, tests, build/release
automation and current documentation with the executive and engineering
reporting mission. Requirements in readiness documents are not treated as
implemented behavior.

## Architecture decision

Use two supported SonarQube page extensions:

- retain `offlinereport/report_page` as a component-scoped project page; and
- add `offlinereport/portfolio_page` as a non-admin global page.

The global page inventories projects through the public
`/api/components/search` action. This action is appropriate because results are
limited by the current user's Browse visibility. `/api/projects/search` is not
used because its current contract requires Administer System. Each selected
project is then collected independently through the existing same-origin,
current-session adapter.

Historical metrics use the public `/api/measures/search_history` action, which
requires Browse on the component and supports branch/pull-request scope. Trend
collection is optional and failures become explicit dataset states. Analysis
events remain an audit timeline and are never represented as metric history.

This preserves the thin client-side boundary: no backend, token, database,
filesystem, source-code access or permission proxy is introduced.

## Gap matrix

| Current capability | Gap | Required change | Primary risk | Files affected | Tests required |
|---|---|---|---|---|---|
| One project component page | No supported multi-project entry point | Register a second global page and separate generated bundle | Accidental admin-only inventory or URL-based permission bypass | Java page definition, build script, new portfolio entry/UI | Java page scope; bundle registration; UI structure |
| Fixed six-action API allowlist | No visible-project inventory or metric history | Add only `/api/components/search` and `/api/measures/search_history` | Broadening the network boundary or using internal/admin APIs | `api.js`, security/API docs | Exact allowlist; inventory paging/dedup; trend failure |
| One project collector | No per-project isolation or bounded orchestration | Add a small worker pool; classify complete/partial/permission-denied/failed/skipped; continue safely | Load spikes, abort ambiguity, silently omitted projects | `api.js`, new portfolio orchestration | 0/1/many, mixed outcomes, duplicates, cancel, concurrency bound |
| Report Model v2 | No report mode, portfolio scope, source/normalized/derived distinction or first-class analytics | Evolve additively to Model v3 and retain compatible single-project fields | Cross-export divergence and untraceable calculations | `core.js`, new analytics module, collector | Schema invariants, v2 template compatibility, deterministic formulas |
| Current measures and issue rows | Missing weighted-aggregate source counts, age, quality dimensions and full evidence | Collect stable coverage/duplication count metrics; derive analytics once | Naive averaging, unavailable-as-zero, double counting | `api.js`, analytics | Weighted coverage/duplication, null data, classification reconciliation |
| Analysis event timeline | No historical metric series | Optionally collect supported measure history and label exact source/period | Presenting analyses as trends or deriving unsupported change | `api.js`, analytics, reports | absent/partial history, zero previous value, null points, branch params |
| Three presentation presets | Persona coverage is incomplete | Add Executive, Executive + Technical, Detailed Technical, Issues Only and Portfolio Review profiles | Overloaded reports and stored-template regression | `core.js`, both UIs | template v1/v2 normalization; profile behavior |
| Single-project HTML | No portfolio landing page or hierarchy; limited age/quality analytics | Add an evidence-first portfolio dashboard and enhanced project drill-down with accessible text/table equivalents | Misleading executive summaries, inaccessible charts, CSP regression | `html-report.js`, portfolio exporter | offline CSP/hash, hostile strings, totals, filters, print |
| Eight-sheet XLSX | No project scorecard, aggregate issue summary, trends or data quality | Add decision-valued portfolio sheets using precomputed values | Formula injection, invalid OOXML, contradictory totals | `xlsx.js` | sheet presence, safe strings, reconciliation, package bounds |
| Management DOCX | No portfolio scorecard or project summaries | Add bounded executive portfolio document and optional issue appendix | Oversized Word tables, relationship/XML regression | `docx.js` | counts, row refusal, XML/relationship scan |
| Project CSV register | No project discriminator | Add Project and Branch/PR columns for portfolio rows | Cross-project ambiguity and formula injection | `core.js`, UI | headers, values, hostile project names |
| JSON contains manifest + v2 report | No explicit portfolio/derived/trend contract | Emit the complete v3 object and expanded manifest | Hidden derivation or missing evidence | `core.js`, UIs | manifest/report reconciliation |
| Data completeness is present but secondary | Executives can mistake partial data for health | Make per-project and portfolio confidence prominent and non-numeric | False assurance | analytics, all exporters | mixed state summaries, unavailable never zero/pass |
| Tests cover core single-project risks | No portfolio, aggregation or cross-format fixture | Add mathematical invariants and one canonical cross-export fixture | Correct-looking but inconsistent reports | all test files plus new tests | lifecycle sum, count inequalities, exporter agreement |
| Documentation describes v2 | No authoritative metric/formula reference | Add `docs/REPORTING-MODEL.md` and reconcile all project docs | Future semantic drift | README, docs, changelog, context | Documentation/source grep checks where useful |

## Required invariants

1. Every selected project appears exactly once in the portfolio result.
2. `actionable + accepted + closed + unknown == unique collected issues`.
3. Exported rows never exceed collected unique rows; collected unique rows do
   not exceed the stable expected total unless the API total changed, in which
   case the dataset is partial.
4. Missing values remain unavailable; they are never converted to zero or pass.
5. Portfolio percentages are weighted only when their source denominators are
   available. Otherwise the report shows a distribution or unavailable state.
6. Every exporter consumes the same frozen model and does not recollect data.
7. Project failures are isolated; cancellation stops scheduling new work and
   promptly stops local waiting without claiming transport abort.
8. Unknown issue states and qualities remain explicit unknown categories.
9. Trends contain source observations and declared comparisons only; no current
   versus new-code substitution is permitted.
10. Offline HTML retains `connect-src 'none'`; Office outputs retain fixed
    internal relationships and non-formula untrusted cells.

## Initial release risk assessment

- P0: authorization boundary regression, wrong aggregate formulas, omitted
  projects, cross-format count disagreement, CSP/OOXML/formula regression.
- P1: missing confidence, missing project comparison, issue lifecycle/quality
  misclassification, unbounded concurrency, misleading trends.
- P2: richer filtering, visual density, additional historical periods and
  performance refinements.
- P3: organization policy presets, deterministic PDF and server-side scheduling;
  these remain outside the current product boundary.

Implementation may proceed only with the architecture and invariants above.
