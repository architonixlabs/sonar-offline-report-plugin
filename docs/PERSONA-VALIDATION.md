# Model v3 persona validation

Date: 2026-08-22. Scope: source review, deterministic fixtures, cross-format generated-file inspection, and a local real-Chrome offline/render/print pass. Authenticated target-server authorization and desktop-Office application checks remain explicit external gates.

| Persona | Result | Evidence | Remaining finding / priority |
|---|---|---|---|
| CTO/CIO | PASS WITH FINDINGS | Executive landing shows selected/analysed/complete/partial/failed, gate distribution, weighted metrics, attention list and confidence before drill-down | P2: validate five-minute comprehension with representative executives |
| Delivery / Program Manager | PASS WITH FINDINGS | Project comparison, actionable volume, age, debt, optional trends and independently failed projects are visible | P2: durable remediation tracking is outside a portable snapshot |
| Engineering Manager | PASS | Top actionable projects/rules/components, effort, impact, aging and gate reasons are source-backed | No blocker |
| Developer | PASS | Issue key, rule/name, message, component, line, lifecycle/raw status, impact/legacy severity, effort, age and tags are exported | No blocker |
| Application Security Architect | PASS WITH FINDINGS | CSP hash and zero-network policy, escaping, fixed API allowlist, privacy opt-in, formula neutralization, macro/external-link exclusions and package guards are tested | P1: live private/no-Browse authorization matrix; P2: desktop Office active-content scan |
| SonarQube Administrator | PASS WITH FINDINGS | Visible-project inventory, maximum 50 selection, one-to-four worker pool, 429/503 retry behavior, paging evidence and per-project failures are bounded/tested | P1: load/fault-injection validation on the target server |
| QA / Data Auditor | PASS | Lifecycle reconciliation, deduplication/changing totals, weighted aggregates, null/zero trends, mixed outcomes and six-format fixture reconciliation pass | No P0 finding remains |
| Accessibility / UX reviewer | PASS WITH FINDINGS | Native controls, labels, live status, keyboard-sized targets, visible focus, narrow reflow, reduced motion, forced colors and table equivalents are present; Chrome passed zero-overflow checks at 390px and complete Ctrl+P row expansion | P1: screen-reader, keyboard-only, forced-colors, Firefox and 200%/400% zoom pass; P2: user study of dense tables |

## “What is still missing?” review

- P0: none after fixing the cross-format portfolio DOCX body contract, perpetual latest-history partial state, artifact/collection identity ambiguity, print pagination scope, CSV provenance and XLSX warning propagation.
- P1: target-server permission matrix; live 429/503 and large-portfolio load; authenticated download/popup/cancellation capture; Firefox/screen-reader/zoom checks; Excel/LibreOffice and Word/LibreOffice no-repair smoke.
- P2: durable ownership/action tracking, organizational freshness thresholds, richer interactive issue filters in portfolio HTML, and direct usability sessions.
- P3: deterministic PDF, signed reports and scheduled distribution. These require a separate architecture decision.

## Independent data-auditor pass

| Suspicion | Result |
|---|---|
| Percentages averaged naively | No; coverage and duplication use source denominators |
| Missing values converted to zero | XLSX null-cell bug fixed; Model v3 uses null/unavailable. Debt sums must be read with represented projects |
| Partial values called complete | No; every requested dataset contributes to per-project and portfolio completeness |
| Unknown status classified as open/pass | No; it remains Unknown |
| Issue/project double counting | Stable issue-key and selected-project-key deduplication tested |
| Trend divide-by-zero | Percentage change is unavailable when previous is zero |
| Export disagreements | Known portfolio fixture reconciles report ID, projects, counts, completeness and issue rows across HTML/XLSX/DOCX/CSV/JSON/print |
| Mature projects always partial because history exceeds 100 points | Fixed; the explicitly declared latest-100 metric-history scope reconciles as complete while the older server count remains disclosed |
| Misleading priority score | No composite score; documented lexicographic factual ordering can be disabled |

## Release implication

Development and the local production-hardening candidate are GO. Controlled pilot and Enterprise GA remain NO-GO until their target authorization, Office, accessibility and operational acceptance gates close; see [Enterprise readiness](ENTERPRISE-READINESS.md).
