# Project context: SonarQube Offline Report Plugin v2.0.1

Last consolidated: 2026-08-22. This document describes the v2.0.1 source tree,
the Model v3 reporting contract, and the historical Linux Docker qualification
evidence recorded for its model-equivalent dirty v2.0.0 lab candidate. Exact
published-v2.0.1 deployment evidence is recorded after publication. This is a
technical handoff, not a certification or enterprise-GA declaration.

## 1. Status and decision

The plugin is a third-party SonarQube Community Build extension that generates
portable reports in the signed-in user's browser. Version 2.0.1 is a
**production-hardening release candidate**:

- development and deterministic local validation: **GO**;
- the exact dirty pre-release candidate's Linux Docker installation,
  route/static smoke test, rollback, and final reinstall: **PASS**;
- controlled production pilot: **NO-GO until the authenticated target-server
  authorization and representative portfolio-load gates close**;
- enterprise GA: **NO-GO** while the security, privacy, Office, accessibility,
  clean-release provenance, SBOM-policy, and operational gates in section 16
  remain open.

The successful deployment does not change the release decision. It proved that
one exact JAR loads and can be rolled back on the target Docker instance. It did
not prove ordinary-user data isolation, authenticated report collection, or
enterprise operational readiness.

### Current identity

| Item | Current v2.0.1 value |
|---|---|
| Repository | `https://github.com/architonixlabs/sonar-offline-report-plugin` |
| Maven coordinates | `com.architonix.sonarqube:sonar-offline-report-plugin:2.0.1` |
| npm package | `sonar-offline-report-plugin-ui` `2.0.1`, private |
| License | Apache License 2.0 |
| Plugin key/class | `offlinereport` / `com.architonix.sonarqube.offlinereport.OfflineReportPlugin` |
| Project page | `offlinereport/report_page`, component scope, project qualifier |
| Portfolio page | `offlinereport/portfolio_page`, global scope, not admin-only |
| Target SonarQube | Community Build `26.6.0.123539` |
| Plugin API | compile and minimum `13.7.0.4381` |
| Java | Java 11 bytecode; JDK 17+ build requirement |
| Node | Node.js 18+ package/build floor; Node.js 20.10+ for the mandatory real-browser gate; CI uses Node 20; no npm runtime/development dependencies |
| Maven | SHA-256-verified Wrapper 3.3.4; Maven 3.9.16 |
| Report contract | schema/model v3, renderer v3, Formula Version 1 |
| Presentation templates | schema v2; schema v1 and v2 imports normalize to v2 |
| Formats | offline HTML, XLSX, CSV, DOCX, JSON, browser Print / Save as PDF |
| Release posture | controlled-candidate development; not enterprise GA |

Use only the v2.0.1 clean-tag GitHub prerelease assets for installation. The
dated dirty-source deployment candidate is deliberately excluded from that
release and remains historical lab evidence only. The retained, currently
unmoved v2.0.0 tag has no GitHub release/assets and is superseded after its
workflow stopped at the SBOM-specific attestation gate. Administrator-owned
tag update/deletion protection remains an open governance control.

`pom.xml`, `package.json`, `package-lock.json`, and the POM SCM tag all declare
2.0.1. The working tree used for the dated deployed candidate was based on the
v1.3.0 commit but contained the v2.0.0 implementation. That makes v1.3.0 a
historical base/rollback version, not the current product version; see section
18.

## 2. Product boundary

### What the plugin does

- Registers an existing-project report page and a global portfolio page.
- Calls a fixed set of public, same-origin SonarQube Web APIs with the current
  browser session and current user's permissions.
- Collects a bounded single-project or multi-project snapshot in browser
  memory, normalizes it to Report Model v3, and derives documented analytics.
- Reuses one deeply frozen collection snapshot and report ID for multiple
  artifact formats until a data-affecting option changes.
- Creates downloadable files locally. No report content is generated or stored
  by a plugin backend.

### What it deliberately does not do

- No direct SonarQube database, installation-filesystem, scanner, or
  compute-engine access.
- No service/admin token, user-supplied server URL, backend proxy, scheduled
  job, email delivery, central report repository, or durable audit trail.
- No source-code collection.
- No arbitrary HTML/CSS/JavaScript templates and no uploaded Office templates.
- No macros, embedded objects, remote images, or external Office relationships.
- No direct or deterministic PDF generator, PDF/A, PDF/UA, encryption, report
  signature, or downloaded-artifact digest.
- No claim of compatibility beyond the explicitly qualified SonarQube target.

Schedules, shared organization templates, durable storage/retention,
centralized audit, signing, distribution, and high-volume rendering require a
separately secured reporting service using public SonarQube APIs. They do not
belong in this thin browser plugin.

## 3. Architecture and trust boundaries

```text
Project extension page                 Global Portfolio Reporting page
  current project + branch/PR            Browse-filtered project inventory
                    \                    /
                     current browser session
                   same-origin public API allowlist
                              |
                    bounded project collector
                              |
                  normalized Report Model v3
                   source + normalized + derived
                       + evidence/provenance
                              |
                    deeply frozen snapshot
                              |
                    artifact envelope clone
                              |
       HTML | XLSX | CSV | DOCX | JSON | print-ready HTML
                              |
                    browser download/print dialog
```

The principal trust boundaries are:

1. **SonarQube authorization.** SonarQube remains authoritative. The plugin does
   not grant access or elevate the current user.
2. **Browser application.** Collection, analytics, presentation, and file
   construction execute in the browser. The Java layer only registers pages.
3. **Untrusted returned data.** Project names, issue text, paths, tags, rule
   names, identities, and all other API strings are treated as hostile when
   inserted into HTML, CSV, XML, filenames, or the live UI.
4. **Portable artifact.** A downloaded file is outside SonarQube access control.
   It must be handled as sensitive project information.
5. **Local template.** A saved/imported template is declarative presentation
   data only, normalized through an allowlist and limited to 64 KiB.

## 4. Runtime components and source ownership

| Path | Responsibility |
|---|---|
| `pom.xml` | Sonar plugin packaging, API baseline, pinned Maven lifecycle, SBOM |
| `package.json` / `package-lock.json` | dependency-free browser build/test contract and version agreement |
| `src/main/java/.../OfflineReportPlugin.java` | registers the single page-definition extension |
| `src/main/java/.../OfflineReportPageDefinition.java` | declares the project and global pages |
| `src/main/js/core.js` | versions, persona templates, escaping, CSV, manifest, labels, template normalization |
| `src/main/js/analytics.js` | Model v3 enrichment, formulas, reconciliation, portfolio aggregates/attention order |
| `src/main/js/api.js` | API allowlist, transport, retry, paging, normalization, collection, artifact envelope |
| `src/main/js/xlsx.js` | fixed ZIP writer and single/portfolio XLSX generation |
| `src/main/js/docx.js` | bounded fixed-profile DOCX generation using the ZIP writer |
| `src/main/js/html-report.js` | single-project offline/print document and pinned runtime |
| `src/main/js/portfolio-html.js` | portfolio offline/print document and pinned runtime |
| `src/main/js/app.js` | project-page state, snapshot reuse, templates, dispatch/download |
| `src/main/js/portfolio-app.js` | global inventory/selection, preflight, concurrency, cancellation, dispatch |
| `src/main/js/index.js` / `portfolio-index.js` | SonarQube `registerExtension` entry points |
| `src/main/resources/static/*.js` | generated deployable page bundles; never edit manually |
| `scripts/build.mjs` | ordered bundle generation and source/bundle provenance metadata |
| `scripts/release-provenance.mjs` | exact packaged-bundle/JAR/SBOM verification and release manifest |
| `scripts/browser-regression.mjs` | dependency-free real-Chrome offline, CSP, layout, and print regression |
| `scripts/benchmark.mjs` | deterministic synthetic Model v3/export boundary benchmark |
| `scripts/live-browser-check.mjs` | opt-in authenticated live project-page smoke helper |
| `test/*.test.mjs` | Node contracts for API, model, personas, UI, formats, security, and provenance |
| `.github/workflows/verify.yml` | PR/main build, test, package, SBOM, and provenance verification |
| `.github/workflows/release.yml` | clean tag build, checksums, provenance, attestations, prerelease publication |

Browser bundle order is a contract:

```text
common:
  core.js -> analytics.js -> xlsx.js -> docx.js -> api.js
  -> html-report.js -> portfolio-html.js

project:
  common -> app.js -> index.js

portfolio:
  common -> portfolio-app.js -> portfolio-index.js
```

`docx.js` intentionally depends on the fixed ZIP writer exported by `xlsx.js`.
`npm run check` must prove both generated static bundles match this order and
their current source bytes.

## 5. Java and SonarQube integration

The server-side integration is intentionally small:

- `OfflineReportPlugin#define` registers only
  `OfflineReportPageDefinition.class`.
- `Offline Report` has `Page.Scope.COMPONENT` and
  `Page.Qualifier.PROJECT`.
- `Portfolio Reporting` has the default `Page.Scope.GLOBAL` and
  `isAdmin=false`.
- There are no plugin settings, Web API endpoints, sensors, servlet filters,
  database operations, background tasks, or server-side exporter classes.
- The browser entry points fail closed when SonarQube does not expose a
  compatible extension-registration/request environment.

Maven packages a `sonar-plugin`, uses `sonar-packaging-maven-plugin`
`1.23.0.740`, emits Java 11 bytecode, includes `LICENSE` and `NOTICE` under
`META-INF`, and generates a CycloneDX JSON SBOM during `verify`.

## 6. User workflows and snapshot lifecycle

### Single project

1. Open a project and choose **Extensions -> Offline Report**.
2. Select a persona profile, output, and data/presentation options.
3. The profile enables its minimum non-people evidence requirements.
4. Collection uses the current project and SonarQube-provided branch or pull
   request context.
5. The normalized result is deeply frozen. Presentation/format changes reuse
   it; a project, branch, dataset, people, issue-limit, or component-limit
   change invalidates it and forces recollection before download.

Single-project defaults are Detailed Technical, offline HTML, issues,
components, and the latest 100 analysis events; trends and people identifiers
are off; issue/component collection is capped at 10,000.

### Portfolio

1. Open the non-admin global Portfolio Reporting page.
2. Search/filter the inventory returned by the current user's
   `/api/components/search` call and select 1-50 unique projects.
3. Choose per-project datasets, limits, concurrency, persona, and output.
4. Collection is main-branch only and uses 1-4 workers (default 3).
5. Each selected project retains a complete, partial, failed,
   permission-denied, or skipped outcome. One ordinary failure does not cancel
   unrelated projects or disappear from the final envelope.
6. The frozen portfolio can be exported repeatedly while its collection
   signature remains unchanged.

Portfolio defaults are Portfolio Review, offline HTML, issues and components,
500 issues/project, 1,000 components/project, three workers, factual attention
ordering on, and analyses/trends/people off.

Cancellation aborts the primary Fetch transport, stops new portfolio work, and
prevents a cancelled operation from reaching download. With the legacy
`SonarRequest.getJSON` fallback, cancellation rejects locally and ignores late
results because that helper exposes no dependable transport-abort handle.

Templates use browser-origin `localStorage` key
`sonarqube-offline-report-template-v2`. Only bounded presentation/profile data
is stored; collected report data is not deliberately stored there. The UI
provides save/use/delete/export/import actions and warns about shared browsers.

## 7. Personas and evidence contracts

Profiles separate the intended audience and required datasets from the visible
sections. `I`, `C`, `A`, and `T` below mean issues, components, analysis events,
and metric trends. People identifiers are never a built-in requirement.

| Profile | Persona | Required | Primary decision/evidence focus |
|---|---|---|---|
| Executive Summary | CTO / CIO | I, T | quality gate, headline status, trends, confidence |
| Executive + Technical | Engineering leadership | I, C, A, T | decision summary followed by engineering drill-down |
| Detailed Technical | Engineering manager / architect | I, C, A, T | measures, issue drivers, aging, effort, files, history |
| Issues Only | Developer / technical lead | I, C | actionable remediation register with component/language context |
| Portfolio Review | CTO / delivery leadership | I, C, T | project outcomes, weighted metrics, attention, confidence |
| Delivery and Program | Delivery / program manager | I, C, A, T | priorities, age, debt, change evidence, approved ownership fields |
| Application Security | Application security architect | I, C, T | vulnerabilities, impacts, hotspot-review evidence, aging |
| QA and Data Audit | QA lead / data auditor | I, C, A, T | coverage/test denominators, file gaps, reconciliation, provenance |

Current persona validation has no unresolved P0 data-model/cross-format
finding. Remaining P1 work is operational: live authorization/load,
authenticated downloads/cancellation, Firefox/assistive-technology/zoom, and
desktop Office interoperability. Portable reports never determine release
readiness; they present source-backed evidence for a human process.

## 8. Output contracts

All outputs are derived from the same artifact-ready Model v3 object, but they
are not intended to contain identical presentations. Each artifact declares
its format, purpose, mode, issue scope, represented/excluded datasets, exported
counts, warnings, and artifact completeness.

| Format | Contract and intended use | Integrity/completeness behavior |
|---|---|---|
| Offline HTML | One self-contained interactive file; executive/engineering sections, issue filters/paging, trends, drill-down, data health, provenance; full collected model embedded | Escaped inert data, no remote assets, hashed runtime CSP with `connect-src 'none'`; works from `file://`; print styling included |
| XLSX | Typed workbook for analysis; portfolio has 13 sheets: Executive Summary, Project Scorecard, Quality Gates, Measures, Issue Summary, Issues, Rules, Components, Trends, Analyses, Data Quality, Warnings, Metadata | 75 MiB fixed package budget; numeric/date values typed only after validation; no formulas/macros/hyperlinks/external relationships. Excel's 32,767-character cell limit is disclosed in Metadata and Warnings and marks the workbook artifact incomplete; use CSV/JSON for the original long value |
| CSV | UTF-8 BOM, RFC 4180 issue register; project-aware in portfolio mode | Stable header; a mandatory `MANIFEST` row exists even with zero issues; each `ISSUE` row repeats core provenance/completeness; formula-like values are neutralized after leading control/whitespace detection |
| DOCX | Fixed macro-free management report; summary or summary plus compact issue register | Refuses, rather than truncates, more than 2,000 selected issue rows, 2,000 component rows, 5,000 analyses, 5,000 trend observations, or a 50 MiB package; no fields, images, hyperlinks, altChunk, OLE, ActiveX, attached templates, macros, or external relationships |
| JSON | Pretty-printed `{ manifest, report }` | Full source, normalized, derived, evidence, collection, artifact, server, and build-provenance paths; fullest machine-readable output; governed by the Model v3 schema |
| Print / Save as PDF | Print-ready HTML summary or optional register; opens the browser print dialog and offers a downloadable print-view HTML fallback if popups are blocked | Rendered-only scope and row counts are recorded in a visible print manifest. It is not deterministic direct PDF, PDF/A, PDF/UA, encrypted, or signed |

HTML/JSON/XLSX are treated as full-model artifact classes within their enforced
bounds. CSV is deliberately an issue-register envelope. DOCX and print are
declared document scopes. A deliberate exclusion is not called zero and is
recorded separately from an unavailable or failed collection.

## 9. Public API contract

Only these exact relative paths are accepted. Absolute URLs,
protocol-relative URLs, traversal-like paths, and all other actions are
rejected.

| Path | Purpose / principal parameters | Failure semantics |
|---|---|---|
| `/api/system/status` | server version/provenance | optional warning/state; contributes to collection confidence |
| `/api/components/search` | Browse-filtered project inventory; `qualifiers=TRK`, `p`, `ps=500` | portfolio selection unavailable; no key guessing or admin inventory fallback |
| `/api/measures/component` | identity, analysis timestamp, fixed project measures; `component`, `metricKeys`, branch/PR | required; project attempt fails |
| `/api/qualitygates/project_status` | raw gate and conditions; `projectKey`, branch/PR | fallback `UNKNOWN`, warning, project incomplete |
| `/api/issues/search` | issues plus narrow rule metadata; `components`, `additionalFields=rules`, `s=CREATION_DATE`, `asc=true`, `p`, `ps=500`, branch/PR | required when selected; project attempt fails |
| `/api/components/tree` | files, language, bounded per-file measures; `component`, `qualifiers=FIL`, `strategy=leaves`, `s=path`, `asc=true`, paging, branch/PR | optional dataset becomes partial/denied |
| `/api/project_analyses/search` | main-branch latest analysis events and snapshot identity; `project`, `p`, `ps` | optional timeline can be unavailable/partial; identity failure lowers confidence |
| `/api/measures/search_history` | fixed historical metric list; `component`, `metrics`, `p`, `ps=100`, branch/PR when supported | optional trends become unavailable/partial |

The primary transport is context-path-aware `fetch` with
`credentials: "same-origin"`, JSON accept header, and an abort signal. The host
`SonarRequest.getJSON` helper is compatibility-only. No API call accepts a token
or external server URL.

### Requested metrics

Project measures:

```text
alert_status, ncloc, files, coverage, lines_to_cover, uncovered_lines,
line_coverage, branch_coverage, conditions_to_cover, uncovered_conditions,
new_lines_to_cover, new_uncovered_lines, new_conditions_to_cover,
new_uncovered_conditions, duplicated_lines_density, duplicated_lines,
complexity, cognitive_complexity, bugs, vulnerabilities, code_smells,
tests, test_errors, test_failures, skipped_tests, test_execution_time,
test_success_density, reliability_rating, security_rating, sqale_rating,
sqale_index, security_hotspots, security_hotspots_reviewed,
security_review_rating, new_security_hotspots, new_coverage,
new_duplicated_lines_density, new_bugs, new_vulnerabilities,
new_code_smells, new_violations, new_security_hotspots_reviewed
```

Per-file component measures:

```text
ncloc, coverage, line_coverage, branch_coverage, lines_to_cover,
uncovered_lines, conditions_to_cover, uncovered_conditions,
duplicated_lines_density, duplicated_lines, complexity,
cognitive_complexity
```

Trend metrics:

```text
coverage, duplicated_lines_density, bugs, vulnerabilities, code_smells,
sqale_index, security_hotspots, ncloc
```

Missing measure values remain unavailable. The plugin does not infer test
execution from coverage and never assigns zero to an absent value.

## 10. Bounds, paging, retry, and branch behavior

| Resource | Enforced boundary |
|---|---|
| Visible-project inventory | at most 10,000 returned projects |
| Selected portfolio projects | 1-50 unique keys |
| Concurrent project workers | 1-4; default 3 |
| Issues/project | 1-10,000 configured; never request beyond the 10,000 API search window |
| Components/project | 1-10,000 configured |
| Prepared portfolio artifact | at most 25,000 issues and 50,000 components total |
| Issue/component page | 500 rows; stable first-seen identity de-duplication |
| Main-branch analysis events | declared latest-100 scope |
| Trend history | declared latest 100 observations per metric; older count retained |
| Request | 45-second local timeout |
| Retry | at most two retries, only HTTP 429/503; exponential jitter and `Retry-After`, capped at 30 seconds |
| Template file | 64 KiB |
| XLSX package | 75 MiB; ZIP path/count/ZIP32 guards |
| DOCX package | 50 MiB plus the row limits in section 8 |

Paging records expected totals, raw rows, unique rows, duplicates, pages,
first/last totals, configured limit, termination reason, and reconciliation.
Issue identity preference is key, then id, then UUID. A changing total,
duplicate-driven mismatch, empty/short page before the target, safety cap,
configured/API limit, or changed analysis identity cannot be called complete.
The collection is non-transactional; equal-sort-key records can still move
during concurrent SonarQube mutation.

Single-project mode preserves SonarQube branch or pull-request context. The
public project-analysis timeline is not branch-aware, so branch/PR analysis
events are `not_available` instead of being mislabeled as main-branch history.
Branch snapshot consistency uses a repeated branch-aware measures fingerprint.
Portfolio mode is main-branch only. Trend-history branch capability must still
be verified on the target server.

## 11. Report Model v3 and formulas

Model v3 has four explicit layers:

| Layer | Representative paths | Meaning |
|---|---|---|
| Source | `qualityGate`, `measures`, source fields in issues/rules/components/analyses, trend observations | public-API values after safe copying/privacy removal |
| Normalized | issue lifecycle, software quality, impact severity, language, canonical project identity | deterministic cross-version interpretation; unknown remains unknown |
| Derived | `derived`, portfolio summary/concentrations/metrics | Formula Version 1 calculations |
| Evidence | `datasetStates`, paging, `collectionEvidence`, warnings/completeness | what was requested, obtained, excluded, denied, limited, or unreconciled |

### Single-project model

The single-project snapshot includes version/report identity, collection and
server provenance, project/branch/analysis identity, collection scope,
dataset states, quality gate/conditions, overall and new-code measures, issues,
rule metadata, files with measures, analysis events, optional trends, four
paging records, deterministic derived analytics, collection evidence, and
warnings.

### Portfolio model

The portfolio envelope adds requested and actual scope, selected/attempted/
analysed/outcome counts, independent project entries, aggregate issue summary,
risk concentrations, weighted metrics, optional factual attention order, and
portfolio-level evidence. Failed and denied projects remain present with null
derived data; they are not silently removed or treated as healthy.

### Key definitions

- Lifecycle prefers modern `issueStatus` over legacy `status` and keeps both.
  Actionable recognizes OPEN, CONFIRMED, REOPENED, TO_REVIEW, and IN_REVIEW;
  ACCEPTED is separate; known closing statuses/resolutions are Closed; future or
  missing values are Unknown. Unknown is never actionable or pass.
- The invariant is `Actionable + Accepted + Closed + Unknown = total collected
  unique issues` at both project and portfolio levels.
- Age is the floored non-negative UTC day difference between collection and
  creation. Invalid/missing dates are Unknown; buckets are 0-7, 8-30, 31-90,
  91-180, 181-365, over 365, and Unknown.
- Effort accepts `Nmin`, `Nh`, and `Nd`; hours multiply by 60 and an explicit
  eight-hour working day multiplies by 480. Unknown effort is counted, never
  converted to zero.
- Ratings map SonarQube 1-5 to A-E. No rating is inferred from issue counts.
- Estimated unreviewed hotspots are
  `round(hotspots * (100 - reviewedPercent) / 100)` only when both inputs exist;
  the report labels this as derived, not a source count.
- Portfolio coverage uses summed covered-line and covered-condition numerators
  divided by summed usable denominators. Portfolio duplication uses summed
  duplicated lines divided by summed positive NCLOC. Percentages are never
  averaged naively.
- Technical debt is the sum of available `sqale_index` minutes and always
  carries the represented-project count.
- Trend absolute change is current minus previous. Percentage change divides by
  the absolute previous value and is unavailable when previous is zero. One
  point is not called no change.
- Attention ordering is optional, deterministic, and lexicographic: failed
  gate, worse security, worse reliability, high-impact issues, estimated
  unreviewed hotspots, debt, lower coverage, duplication, analysis age,
  incomplete data, then project name. It is not an AI/composite health score.

The normative narrative is `docs/REPORTING-MODEL.md`. The closed Draft
2020-12 artifact-envelope schema is
`docs/report-model-v3.schema.json`. Standard JSON Schema cannot express runtime
immutability or equality/reconciliation across fields, so those invariants are
documented in `x-crossFieldInvariants` and enforced by Node contract tests.

## 12. Collection, artifact, and manifest envelopes

The model intentionally separates collection truth from artifact truth:

```text
deeply frozen collected snapshot
  reportId + collectionStartedAt/CompletedAt + collectedAt
  collectionComplete + datasetStates + paging/evidence
  artifact = null
          |
          | createArtifactReport(snapshot, format, context)
          v
immutable artifact-ready clone
  same reportId and collection timestamps
  exportedAt; generatedAt aliases exportedAt for compatibility
  artifact = {
    format, purpose, mode, issueScope, exportedAt,
    collectionComplete, artifactComplete, exportedCounts,
    warnings, scope, artifactDigest: null,
    artifactDigestState: "not_computed"
  }
          |
          +--> JSON download wrapper: { manifest, report }
```

| Field | Meaning |
|---|---|
| `reportId` | random UUID generated once per collection and reused across exports |
| `collectionStartedAt` / `collectionCompletedAt` | API collection interval |
| `collectedAt` | frozen reference timestamp for age/freshness calculations |
| `exportedAt` | creation time of one format-specific artifact |
| `generatedAt` | compatibility alias: collection time before export, `exportedAt` in artifact clone |
| `complete` / `collectionComplete` | requested API datasets and reconciliation were complete |
| `artifactComplete` | collection was complete and this format/scope represented or explicitly excluded every relevant profile requirement without renderer loss |
| `artifact.exportedCounts` | projects, issues, components, analyses, and trend observations represented by that artifact class |

Dataset states are `complete`, `partial_limit`, `partial_error`,
`permission_denied`, `not_available`, and `not_requested`.
`not_requested` means excluded scope, not zero. Denied or unavailable means not
complete. A required-call failure may reject collection entirely, so no
artifact is created. A portfolio is complete only when at least one project was
selected and every selected project is complete.

Warnings and evidence are embedded in HTML, XLSX, DOCX, JSON, and print. CSV's
manifest/repeated envelope preserves them with extracted rows. The generic
phrase "Incomplete report" must therefore appear only when the evidence really
is partial or the chosen artifact loses/omits required content; it is not a
decorative default. Users must inspect the accompanying dataset reason and
counts rather than treating a partial artifact as audit evidence.

### Provenance fields

- `serverBaseUrl` is captured only as validated HTTP(S) origin plus discovered
  SonarQube context path; `serverBaseUrlScope` says unavailable, origin-only, or
  origin-and-context-path.
- `sourceRevision` is populated only when a valid exact revision is available.
- `sourceDigest` is a SHA-256 framed digest of the defined plugin build inputs.
  It identifies input bytes, not the JAR or downloaded report.
- `pluginArtifactDigest` is a runtime hook and is currently null unless an
  external process supplies a valid digest.
- `artifactDigest` is deliberately null/`not_computed` in v2.0.1. No report may
  imply that it is signed or tamper-evident.
- Release JAR/SBOM/checksum/attestation identity is external release provenance
  and must not be confused with the report-level artifact envelope.

## 13. Security and privacy controls

- Current-user, same-origin, credentialed requests and an exact endpoint
  allowlist; no SSRF-capable URL input or privileged inventory action.
- Source code is never collected. Assignee and author fields are empty unless
  People is explicitly selected and organizationally approved.
- HTML/template strings are bounded and escaped; embedded report JSON escapes
  closing-script-sensitive characters; the runtime inserts hostile data through
  text-safe paths.
- Offline HTML has no remote assets and uses `default-src 'none'`,
  `connect-src 'none'`, and a pinned script hash.
- CSV neutralizes ASCII and full-width formula initiators after leading control
  and whitespace characters. XLSX uses literal inline strings for untrusted
  values and contains no formulas.
- XLSX/DOCX writers reject unsafe ZIP paths, excessive parts/bytes, ZIP32
  overflows, macros, external relationships, hyperlinks, and active-content
  part names. DOCX XML is fixed and escaped.
- Invalid XML 1.0 scalars are replaced safely; XLSX truncation does not split a
  Unicode surrogate pair.
- Blob URLs and hidden anchors remain for 30 seconds so Firefox/browser shells
  can begin a download before cleanup.
- Reports are sensitive after download. Do not attach them to public issues;
  use approved encrypted storage, transfer, retention, and deletion controls.

The plugin is not a DLP, access-control, signing, malware-scanning, or records-
management system. Those remain organizational responsibilities.

## 14. Build, automated evidence, and performance

### Mandatory source gate

```bash
npm ci
npm test
npm run check
npm run test:browser
./mvnw --batch-mode --no-transfer-progress clean verify
npm run benchmark
```

Use `mvnw.cmd` on Windows. `npm test` rebuilds both browser bundles and runs all
Node tests. `npm run check` is the non-writing stale-bundle check. Maven Enforcer
requires Maven 3.9.x and JDK 17+; the packaged classes remain Java 11.

The expanded current-source Chrome gate passes 224/224 checks across all eight
built-in profiles (`executive`, `executive-technical`, `technical`, `issues`,
`portfolio`, `delivery`, `security`, and `qa-audit`) at desktop and 390 px. It
produces 16 deterministic screenshots and three deterministic print PDFs, and
independently verifies all 19 artifact hashes. Project printing reconciles 127
actionable rows from 137 collected; portfolio active/all printing reconciles
56/86 and 86/86 rows, including actionable/accepted/closed/unknown lifecycle
counts. A clean tag archives this evidence with the benchmark results.

The current v2.0.1 Node gate passes 81/81 tests, including four deterministic
CycloneDX identity/fail-closed finalization checks added after the unpublished
v2.0.0 release attempt.

The dated deployed-candidate qualification recorded:

- 77/77 Node tests across API, model/schema, analytics, UI, personas,
  cross-format reconciliation, security, package bounds, and provenance;
- Chrome `151.0.7922.170`: 126/126 checks across executive, developer/
  engineering, application-security, QA/audit, and portfolio fixtures at
  desktop and 390 px, with ten deterministic screenshots;
- zero external requests under offline emulation, pinned CSP runtime execution,
  blocked unpinned script/external fetch, no global horizontal overflow, and
  complete Ctrl+P issue-row expansion/restoration;
- a normalized deterministic 26-page browser PDF as test evidence, not a
  release format guarantee;
- Java page-registration 1/1 and Maven clean verification;
- both generated bundles and LICENSE/NOTICE present in the JAR; a separate
  CycloneDX 1.6 JSON SBOM emitted; exact packaged frontend bytes verified.

These counts are dated evidence, not a substitute for rerunning the commands on
the exact source/tag being promoted.

### Synthetic performance boundary

On Node 24.19, the recorded 50-project/25,000-issue/50,000-component synthetic
model completed HTML, CSV, and JSON generation. It used roughly 1.1 GiB RSS at
the end of the run. XLSX correctly refused before construction because the
estimated 113 MiB package exceeded its fixed 75 MiB budget. This proves bounded
refusal, not target-server collection capacity. The benchmark makes no API
calls and provides no SLA; live server request cost, throttling, browser peak
memory, and cancellation latency remain pilot gates.

The benchmark asserts portfolio counts, non-empty outputs, below-budget XLSX
success, and the expected maximum-scope XLSX safety refusal; observed time and
memory remain measurements rather than environment-independent thresholds.

## 15. Build and release provenance

### Normal source build

`scripts/build.mjs` verifies `pom.xml`, `package.json`, and both package-lock
version fields agree. It hashes framed, named build inputs and each ordered
bundle input set. Generated bundles contain `OfflineReportBuild` metadata.

- A normal unstamped source build records the source digest but does not claim
  an exact Git revision.
- A provenance build on a dirty tree records `sourceState=dirty`, an unverified
  base revision, and `sourceRevision=null`; it never presents HEAD as exact.
- `--require-clean` fails unless Git state is available, clean, stable through
  the build, and matches the requested revision.
- `npm run build:release` invokes the provenance and clean-source flags inside
  the package script so npm versions cannot consume them as CLI configuration.
- The final input digest is recomputed after generation to detect changes while
  building.

### Verification workflow

The verification workflow uses immutable action commit SHAs, Node 20, Temurin
17, `npm ci`, version agreement, browser build/tests, stale-bundle diff, Maven
clean verify, required JAR-entry inspection, CycloneDX output, exact packaged
frontend verification, the real-Chrome persona/print/CSP suite, the bounded
maximum export benchmark, retained browser/benchmark evidence, and recorded
SHA-256 digests. CI success explicitly does not confer enterprise GA status.

### Tag release workflow

For `vMAJOR.MINOR.PATCH`, the workflow:

1. verifies tag, Git commit, POM/npm/lock/SCM versions, and release notes;
2. serializes each `v*` tag without cancellation, requires the commit
   to be reachable from the default branch, and refuses to preserve or replace
   an already-existing GitHub release;
3. builds/tests, proves generated assets were committed, and requires a clean
   working tree after removing the privileged checkout credential;
4. rebuilds with clean exact source revision and source-input digests;
5. packages the JAR and CycloneDX SBOM, then finalizes an RFC 4122 UUID v5
   serial deterministically from repository, tag, and full source revision;
6. reruns the real-browser persona suite and bounded export benchmark against
   the clean release inputs;
7. packages screenshots, print PDFs, browser evidence JSON, and run-specific
   benchmark assertions into an archive with normalized archive metadata;
8. verifies the JAR manifest and exact packaged frontend bytes, then creates a
   provenance manifest binding source, JAR, SBOM, validation archive, and
   packaged frontend digests;
9. writes exact SHA-256 checksum files;
10. re-resolves the still-matching remote tag, creates GitHub build attestations for
   every release subject, and separately
   binds the finalized CycloneDX SBOM to the JAR;
11. re-resolves the remote tag again and publishes the candidate as a GitHub
   prerelease.

Expected assets are the JAR, JAR checksum, CycloneDX JSON SBOM, SBOM checksum,
provenance JSON, provenance checksum, validation-evidence archive, and
validation-archive checksum. An approved clean-tag run and organizational
verification are still required before calling those controls closed for a
production release.

The workflow detects remote-tag movement during its own publication window,
but repository-wide update/deletion protection for `refs/tags/v*` is an
administrator-owned external control and remains a promotion gate.

## 16. Compatibility and open production gates

### Compatibility statement

The support statement is intentionally narrow: SonarQube Community Build
`26.6.0.123539` and Plugin API `13.7.0.4381`. The Java code uses only `Plugin`,
`PageDefinition`, and `Page`, but that does not establish compatibility with
another SonarQube/Plugin API release. Requalify page registration, all eight API
actions/parameters, authentication, context-path behavior, reports, logs, and
rollback after every target upgrade.

Model v3 and the CSV manifest envelope are breaking machine-readable changes
from v1.3.0/Model v2 and justify the major version. Older consumers must migrate
to the v3 schema. Saved template schema 1 and 2 files remain import-compatible.
Portfolio is main-branch only; single-project branch/PR behavior is retained.

### Honest open gates

| Gate | Current evidence and remaining work |
|---|---|
| HTTPS/authentication | **Open.** The qualified endpoint is plain HTTP. Prove supported TLS reverse proxy, HSTS/secure cookies, and production authentication |
| Permission/isolation | **Open; pilot blocker.** Ordinary Browse/no-Browse, private, anonymous/public policy, cross-project tampering, revoked/expired session, and existence-leak tests |
| Portfolio authorization/load | **Open; pilot blocker.** Ordinary-user global page/inventory, mixed denied/partial projects, trends, and live 1/10/25/50-project load with 1-4 workers/server impact |
| Browser integration | **Open for GA.** Local Chrome renderer/CSP/reflow/print passes; authenticated target flow, Firefox, popup/download/cancellation, and target CSP remain |
| Excel/LibreOffice | **Open.** No-repair open/round-trip, typed values, hostile cells, external-link scan |
| Word/LibreOffice/OpenXML | **Open.** No-repair open/round-trip, Open XML validation, malicious corpus, accessibility/relationship scan |
| Large/live mutation/faults | **Open.** Live 0/1/501/9,999/10,000/10,001, changing/duplicate pages, 429/503, `Retry-After`, timeout, cancellation, memory/time and recovery |
| Accessibility | **Open.** Screen reader, keyboard-only, forced colors, Firefox, 200%/400% zoom, 320 CSS px, and print review |
| Upgrade/rollback | **Partially closed.** Exact Linux Docker upgrade, rollback, and reinstall pass; clean release artifact, production change approval, removal/uninstall, and any other supported operating model still require acceptance |
| Signing/provenance | **Workflow implemented, release gate open.** The deployed JAR is a dirty-source candidate and has no clean-tag GitHub attestation |
| SBOM/license/vulnerability | **Open.** SBOM generated, but exact release scan, license-policy review, vulnerability approval, and retention record are outstanding |
| Privacy/records | **Open.** Data classification, people-field purpose, retention/deletion, approved transfer/DLP, and public-project policy |
| Observability/support | **Open.** Privacy-safe actor/project/scope/result audit, actionable timing/error telemetry, support ownership, vulnerability response |
| Persona acceptance | **Open.** Source/fixture review passes with findings; accountable target users have not signed off every applicable format |

No exception may conceal a critical/high authorization, exfiltration,
active-content, integrity, or availability risk. Until these gates close, use
only approved data and named users in a monitored lab/controlled evaluation,
keep People off, review every partial warning, and retain a verified rollback
artifact.

## 17. Exact Linux Docker deployment evidence (2026-08-22)

This section records immutable facts about the installed lab candidate. It is
not a claim that the current worktree or a future release has the same bytes.

### Target and artifact

| Item | Verified value |
|---|---|
| Endpoint | private Linux Docker lab endpoint (redacted from the public record) |
| SonarQube | Community Build `26.6.0.123539` |
| Container/image | `sonarqube-sonarqube-1` / `sonarqube:community` |
| Persistent extension mount | `sonarqube_sonar-extensions` at `/opt/sonarqube/extensions` |
| Active file | `sonar-offline-report-plugin-2.0.0.jar` only |
| Active JAR size | 184,359 bytes |
| Active JAR SHA-256 | `9D0A21BA54B94E23F2B444CED7BA2F9ADAC1765A51DD6C62BC37E9FA9A0F7168` |
| CycloneDX JSON | 8,288 bytes; SHA-256 `A8568FEC6E12C32E1FD7A671F632DC16CAEB24510C8DF1106995E80194CEC6F3` |
| Project served bundle SHA-256 | `1FF2387E65BC509F40E1385085E60E4C432240681C352E359184212457E084A5` |
| Portfolio served bundle SHA-256 | `4270264B062CEA5C010F3A6003DD3E1F108D148B13B4F1BC0E6E3615C2C531B7` |
| Original v1.3.0 rollback backup | `<operator-backup-root>/20260822T093921Z` |
| Superseded v2 candidate backup | `<operator-backup-root>/20260822T095300Z-final` |

### Provenance boundary

The deployed JAR was built while implementation inputs were uncommitted. Its
embedded metadata correctly says:

```text
sourceState          = dirty
sourceRevision       = null
sourceRevisionBase   = eccf14b6a625de5cfebb4a47d05a23ed839979a1
sourceRevisionVerified = false
sourceDigest         = sha256:ab3b57ec2f7a4b0f3be70ab3193a6687590d5ee9abefec25809bde662ca61de7
pluginArtifactDigest = null / not_computed
```

The independently measured JAR SHA-256 above identifies the installed bytes.
The embedded source digest identifies the defined build-input set. Neither is a
clean-tag attestation. This JAR must never be represented as a published,
clean-source, signed, or enterprise-GA release.

### Upgrade, rollback, and final state

The operator:

1. backed up the original v1.3.0 JAR to the `20260822T093921Z` path;
2. deployed and exercised an earlier v2 candidate, including a successful
   v1.3.0 rollback and v2 reinstall;
3. after the final HTML/provenance correction, backed up the superseded v2
   candidate to `20260822T095300Z-final`;
4. installed the checksum-verified `9D0A...7168` final dirty candidate and
   confirmed SonarQube `UP`, plugin deployment, both page routes, and both
   static assets;
5. restored the exact backed-up v1.3.0 JAR, restarted, and verified its prior
   checksum and operational state;
6. reinstalled the same `9D0A...7168` bytes, removed v1.3.0 from the active
   directory, restarted, and repeated the health and byte-integrity checks.

Final observed steady state:

| Check | Result |
|---|---|
| API/server | `UP`; web server operational |
| Container | running; restart count `0` |
| Startup log | `Deploy SonarQube Offline Report Plugin / 2.0.0` |
| Active plugin inventory | exactly one v2.0.0 JAR |
| Active checksum | matches `9D0A21...7168` |
| Project page route | HTTP 200 |
| Portfolio page route | HTTP 200 |
| Project static asset | HTTP 200; byte hash matched verified bundle |
| Portfolio static asset | HTTP 200; byte hash matched verified bundle |
| Startup errors | none observed in the reviewed deployment log slice |
| Rollback | rehearsed successfully; backup remains recoverable |

Operational invariants are: use a persistent extensions volume, verify the
exact JAR checksum, keep exactly one `offlinereport` JAR active, back up before
replacement, perform a full restart, verify `UP`/logs/routes/assets, and never
use `docker compose down -v` for ordinary maintenance. Detailed commands and
platform variants are in `README.md`; exact evidence is in
`docs/DEPLOYMENT-VALIDATION-2026-08-22.md`.

## 18. Historical v1.3.0 context (not current)

Version 1.3.0 was the prior enterprise-candidate source/tag and the plugin
active before the v2.0.0 Docker upgrade. It used the earlier generated-report
contract (Model v2) and did not represent the current Model v3 portfolio/CSV
contract. Its source commit
`eccf14b6a625de5cfebb4a47d05a23ed839979a1` is only the base revision recorded
by the dirty v2.0.0 candidate.

The installed v1.3.0 JAR was backed up, restored during the successful rollback
rehearsal, and then removed from the active plugin directory after v2.0.0 was
reinstalled. It remains a recoverable rollback artifact at the original
`20260822T093921Z` backup path in section 17. Do not describe the repository,
declared package version, active plugin, report schema, or current feature set
as v1.3.0.

Historical release notes remain in `docs/releases/v1.3.0.md` and the changelog.
They are not the source of truth for v2.0.1 behavior.

## 19. Documentation map and maintenance rules

| Document | Authority |
|---|---|
| `README.md` | user workflow, installation, upgrade/rollback overview |
| `docs/ARCHITECTURE.md` | product boundary and component decisions |
| `docs/API-CONTRACT.md` | endpoint, paging, retry, and upgrade contract |
| `docs/REPORTING-MODEL.md` | authoritative formulas and missing-data semantics |
| `docs/report-model-v3.schema.json` | machine-readable artifact-envelope structure |
| `docs/PERSONA-VALIDATION.md` | persona/data-auditor findings |
| `docs/PERFORMANCE.md` | hard limits, benchmark evidence, pilot procedure |
| `docs/TESTING.md` | mandatory gates and risk coverage |
| `docs/SECURITY.md` | trust model, threats, controls, operational checks |
| `docs/COMPATIBILITY.md` | supported baseline and acceptance matrix |
| `docs/ENTERPRISE-READINESS.md` | release-state policy and mandatory GA gates |
| `docs/DEPLOYMENT-VALIDATION-2026-08-22.md` | exact deployed-candidate facts and rollback record |
| `docs/releases/v2.0.1.md` | v2.0.1 candidate release notes |
| `docs/releases/v2.0.0.md` | unpublished v2.0.0 tag record; superseded by v2.0.1 |
| `CHANGELOG.md` | versioned functional/security history |

When changing the project, update this context only for a contract or evidence
change, not every refactor. Specifically review it when any of these change:

- POM/npm version, Plugin API/SonarQube support baseline, page keys, or Java
  level;
- allowed API paths/parameters, metric lists, paging, retry, cancellation, or
  resource limits;
- report/model/renderer/template version, formulas, lifecycle taxonomy,
  completeness semantics, or the JSON schema;
- persona requirements, output representation, refusal/truncation behavior, or
  security boundary;
- build/release provenance, release assets, test evidence, or GA decision;
- deployed JAR digest, target version/endpoint, backup, rollback, or final
  route/static health.

For a new deployment, add a dated evidence record rather than overwriting the
2026-08-22 facts. Always distinguish source-tree validation, a locally built
candidate, a clean tagged release, and bytes actually active on a server.
