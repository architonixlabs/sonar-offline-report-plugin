# Project context: SonarQube Offline Report Plugin

Generated from repository revision `a628c8691748e8d64d0a73037e2b8292da185da3`
(`v1.2.1`, 2026-08-18) and locally reviewed on 2026-08-21.

This document is a self-contained technical handoff for independent review. It
separates facts verified in source from claims recorded in project documents and
from work that is still open. It is not a certification, security assessment, or
substitute for testing the exact release artifact in its target environment.

> **Post-review note (2026-08-21):** This document describes the original
> `v1.2.1` baseline used by the external reviewer. Release `v1.3.0` contains the
> validated hardening changes. See
> `docs/REVIEW-IMPLEMENTATION-2026-08-21.md` for the finding-by-finding
> disposition, implementation record, fresh test results, and remaining gates.

## 1. Executive summary

`sonar-offline-report-plugin` is a third-party, project-scoped SonarQube
Community Build plugin. Its Java side only registers a project extension page.
The page's dependency-free browser application uses the signed-in user's
SonarQube session to call a fixed set of same-origin public Web APIs, builds one
normalized project snapshot in memory, and creates reports locally in the
browser.

Supported output paths are:

- self-contained interactive HTML;
- XLSX workbook;
- UTF-8 CSV issue register;
- macro-free DOCX;
- JSON containing a manifest and the normalized report model; and
- a print-ready HTML view that invokes the browser's **Print / Save as PDF**
  workflow.

It does **not** implement a direct or deterministic PDF generator. It also has
no server-side report endpoint, database access, scanner/compute-engine
extension, service token, scheduler, report repository, signing service, or
arbitrary Office/template execution.

The declared release posture is **enterprise candidate / controlled pilot**, not
enterprise general availability. The target validated by the maintainers is
SonarQube Community Build `26.6.0.123539`, using Plugin API `13.7.0.4381`.

## 2. Repository identity and observed baseline

| Item | Observed value |
|---|---|
| Repository | `https://github.com/architonixlabs/sonar-offline-report-plugin.git` |
| Branch | `main` |
| Reviewed commit | `a628c8691748e8d64d0a73037e2b8292da185da3` |
| Commit subject | `Fix PDF print export workflow` |
| Commit date | `2026-08-18T23:59:27+05:30` |
| Nearest/current tag | `v1.2.1` |
| Maven coordinates | `com.architonix.sonarqube:sonar-offline-report-plugin:1.2.1` |
| npm package | `sonar-offline-report-plugin-ui`, version `1.2.1`, private |
| License | Apache License 2.0 |
| Plugin key | `offlinereport` |
| Plugin entry point | `com.architonix.sonarqube.offlinereport.OfflineReportPlugin` |
| Page key | `offlinereport/report_page` |
| Page scope | Component page, project qualifier only |
| Report/model schema | v2 |
| Renderer version | 2 |
| Template schema | v2; schema v1 inputs are accepted and normalized |
| Java bytecode target | Java 11 |
| CI Java runtime | Temurin 17 |
| Node requirement | Node.js 18+; CI uses Node 20 |
| npm runtime/dev dependencies | None |
| Release classification | Prerelease enterprise candidate/pilot |

Artifact evidence already present in the working copy and also recorded in
`docs/COMPATIBILITY.md`:

- `target/sonar-offline-report-plugin-1.2.1.jar` SHA-256:
  `269A73BBFC54652229810C17BCB586BA590C49BC6CDB4EB8E60001658F4F7CA4`.
- `src/main/resources/static/report_page.js` SHA-256:
  `05D3F10FC3FCB8522E546DA96144F47C4E846D5D258653150A8FD0DAE4262584`.
- Generated browser bundle size: 162,568 bytes at this revision.
- Existing JAR size: 47,630 bytes.

The hashes above establish identity only. A reviewer should still reproduce the
build from a clean checkout and compare results or explain any non-reproducible
metadata.

## 3. Product goals and explicit non-goals

### Goals

- Give an authorized project user a portable snapshot without requiring
  SonarQube Enterprise Edition reporting features.
- Preserve SonarQube as the authorization authority by using the current browser
  session and relative same-origin requests.
- Generate all formats from the same normalized in-memory model so identity,
  counts, data scope, completeness, and warnings can reconcile.
- Mark excluded, unavailable, permission-denied, truncated, inconsistent, and
  complete datasets distinctly.
- Keep source code out of exports and make people identifiers opt-in.
- Make HTML genuinely offline and prevent its embedded project data from making
  network requests.
- Keep Office outputs macro-free and free of external relationships.

### Non-goals / deferred capabilities

- deterministic direct PDF, PDF/A, or PDF/UA;
- server-side rendering or durable server-side storage;
- multi-project or portfolio reporting;
- schedules, email/distribution, retention workflow, or central audit trail;
- shared organization template registry;
- arbitrary HTML/CSS/JavaScript templates;
- uploaded DOCX/XLSX templates or arbitrary OOXML import;
- digital signatures, report encryption, release signing, or attestation;
- access to the SonarQube database or installation filesystem; and
- compatibility claims outside the specifically validated SonarQube baseline.

The architecture documentation proposes a separate reporting API/worker/object
store/template-registry service if those enterprise capabilities are later
required.

## 4. High-level architecture and trust boundaries

```text
SonarQube project page
  -> Java page registration (no business/data logic)
  -> generated static browser bundle
  -> fixed relative SonarQube Web API allowlist
  -> current user's authenticated same-origin session
  -> normalized Report Model v2 in browser memory
  -> HTML | XLSX | CSV | DOCX | JSON | print-ready HTML
  -> browser download / browser print dialog
```

Trust boundaries:

1. **SonarQube authorization boundary.** The plugin does not grant access. The
   APIs are expected to enforce the active user's Browse permissions.
2. **Browser application boundary.** Collection, normalization, templating, and
   file construction occur in the user's browser. There is no plugin backend.
3. **Downloaded artifact boundary.** Once downloaded, a report is no longer
   protected by SonarQube access control. The UI warns the user about this.
4. **Untrusted project-data boundary.** Project names, messages, paths, users,
   tags, rules, and API-returned values must be treated as attacker-controlled
   when inserted into HTML, CSV, XML, ZIP/OOXML, filenames, or UI markup.
5. **Local presentation-template boundary.** Template JSON is browser-origin
   local storage or a user-selected file. It is declarative, allowlisted,
   sanitized, and limited to 64 KiB.

## 5. Source tree and responsibility map

| Path | Responsibility |
|---|---|
| `pom.xml` | Maven plugin packaging, Java/API/test dependency versions, plugin metadata |
| `package.json` | Browser build/check/test commands and Node engine |
| `scripts/build.mjs` | Concatenates browser modules in a fixed order and injects plugin version |
| `scripts/live-browser-check.mjs` | Optional Chrome DevTools Protocol smoke helper for a live SonarQube instance |
| `src/main/java/.../OfflineReportPlugin.java` | Plugin entry point; registers one extension |
| `src/main/java/.../OfflineReportPageDefinition.java` | Declares project-scoped `Offline Report` page |
| `src/main/resources/org/sonar/l10n/offlinereport.properties` | Page name and description |
| `src/main/js/core.js` | Schemas, templates, escaping, CSV, labels, manifest, common formatting |
| `src/main/js/api.js` | API allowlist, retries, paging, normalization, snapshot collection |
| `src/main/js/xlsx.js` | Minimal ZIP writer and XLSX generation |
| `src/main/js/docx.js` | Fixed-profile DOCX generation using the ZIP writer |
| `src/main/js/html-report.js` | Self-contained HTML/print document, CSS, embedded runtime and CSP hash |
| `src/main/js/app.js` | SonarQube page UI, state, snapshot reuse, template storage, output dispatch |
| `src/main/js/index.js` | Calls `registerExtension` for the page key |
| `src/main/resources/static/report_page.js` | Generated deployable browser bundle; must not be edited manually |
| `test/*.test.mjs` | Node unit/structural tests for API, core, UI and exporters |
| `src/test/java/...OfflineReportPageDefinitionTest.java` | Java registration test |
| `.github/workflows/verify.yml` | PR/main verification pipeline |
| `.github/workflows/release.yml` | Tag-triggered prerelease build/checksum/publish pipeline |
| `docs/` | Architecture, compatibility evidence, release readiness, security and notices |

Browser bundle order is significant:

```text
core.js -> xlsx.js -> docx.js -> api.js -> html-report.js -> app.js -> index.js
```

`docx.js` depends on the `zipStore` implementation exported by `xlsx.js`.

## 6. Java/SonarQube integration

The Java integration is intentionally minimal:

- `OfflineReportPlugin#define` adds only
  `OfflineReportPageDefinition.class`.
- `OfflineReportPageDefinition#define` adds one page named `Offline Report`.
- The page uses `Page.Scope.COMPONENT` and only `Page.Qualifier.PROJECT`.
- There are no settings, sensors, web services, compute-engine tasks, servlet
  filters, database operations, background jobs, or server-side export classes.
- Browser registration is performed by:
  `registerExtension("offlinereport/report_page", callback)`.
- When SonarQube does not provide `registerExtension`, `index.js` returns without
  starting the application.

The Maven configuration declares:

- packaging: `sonar-plugin`;
- `sonar-packaging-maven-plugin` `1.23.0.740`;
- Plugin API `13.7.0.4381` with `provided` scope;
- minimum Plugin API `13.7.0.4381`;
- compiler release 11;
- JUnit `4.13.2` and AssertJ `3.25.3`, test scope; and
- inclusion of `LICENSE` and `NOTICE` under `META-INF`.

## 7. Browser UI and workflow

The browser page is built with plain JavaScript and CSS; there is no framework
or npm dependency. It renders a guided form with:

- three implemented presets: `Executive summary`, `Detailed technical`, and
  `Issues only`;
- primary format choices: Offline HTML, Excel, Word, and PDF;
- data-only formats under a disclosure: CSV and JSON;
- document modes for Word/print: executive summary or summary plus compact
  issue register;
- issue scope for document registers: actionable only or all collected;
- data switches for issues, components, analyses, and people identifiers;
- a maximum issue setting from 1 to 10,000;
- appearance fields for title, subtitle, accent, introduction, footer and
  included sections; and
- save/use/delete/export/import actions for the presentation template.

Defaults:

- the `Detailed technical` template is selected;
- HTML is selected;
- issues, components and the last 100 analyses are included;
- people identifiers are excluded;
- maximum issues and components are both 10,000.

State behavior verified in source:

- a data signature covers project, branch/PR, dataset switches, people switch,
  issue limit, and component limit;
- presentation/format changes do not change that signature;
- a collected snapshot is recursively frozen and reused while the signature is
  unchanged;
- changing data scope marks the prepared snapshot stale;
- submitting after a stale change automatically recollects before exporting;
- `AbortController` changes local control flow to cancelled, although it does
  not currently abort an already-running `SonarRequest.getJSON` call;
- the page maintains a resize/zoom-aware internal scroll viewport, stable
  scrollbar gutter, 44 px control targets, and 128-220 px bottom clearance; and
- Blob download URLs and hidden anchors are retained for 30 seconds to avoid
  cancelling downloads in Firefox/browser shells.

Template storage key is `sonarqube-offline-report-template-v2`. Only normalized
presentation settings are stored; report/project data is not deliberately
written to local storage.

## 8. Data collection and API contract

### Exact endpoint allowlist

`api.js` rejects any path that is not exactly one of:

| Logical dataset | Relative path |
|---|---|
| Server status/version | `/api/system/status` |
| Measures/project metadata | `/api/measures/component` |
| Quality gate | `/api/qualitygates/project_status` |
| Issues and related rule metadata | `/api/issues/search` |
| File/component inventory | `/api/components/tree` |
| Analysis history/snapshot identity | `/api/project_analyses/search` |

Calls use `window.SonarRequest.getJSON(path, params)` and therefore rely on the
active SonarQube browser session. The application accepts neither a token nor a
base/server URL.

### Request parameters

- Measures: `component`, `metricKeys`, plus `branch` or `pullRequest`.
- Quality gate: `projectKey`, plus `branch` or `pullRequest`.
- Issues: `components`, `additionalFields=rules`, branch/PR, `p`, `ps=500`.
- Components: `component`, `qualifiers=FIL`, `strategy=leaves`, branch/PR,
  `p`, `ps=500`.
- Analyses: `project`, normally `p=1`, `ps=100`; snapshot identity checks use
  `ps=1`.

Branch mapping is based on the object given by SonarQube: an object with `name`
maps to `branch=<name>`; otherwise an object with `key` maps to
`pullRequest=<key>`. Analysis-history and before/after consistency requests do
not currently receive the branch/PR parameters.

### Requested measures

The fixed metric set is:

```text
alert_status, ncloc, coverage, duplicated_lines_density, complexity,
cognitive_complexity, bugs, vulnerabilities, code_smells,
reliability_rating, security_rating, sqale_rating, sqale_index,
security_hotspots, security_hotspots_reviewed, security_review_rating,
new_security_hotspots, new_coverage, new_duplicated_lines_density,
new_bugs, new_vulnerabilities, new_code_smells, new_violations,
new_security_hotspots_reviewed
```

### Retry, paging and bounds

- A request is retried up to two times only for HTTP 429 or 503.
- Backoff is `300 * 2^attempt` milliseconds plus 0-99 ms jitter.
- `Retry-After` is not read.
- No real per-request timeout is implemented.
- Abort is checked before a request, after it returns, and between retries. The
  underlying Sonar request helper receives no abort signal.
- Issue/component paging uses `ps=500`, stable first-seen identity deduplication,
  and a safety page cap of `ceil(limit / 500) + 2`.
- Identity preference is `key`, then `id`, then `uuid`.
- The collector records expected totals, raw and unique counts, duplicates,
  pages, first/last totals, limit, truncation, termination reason, and whether
  totals/reconciliation stayed stable.
- Issues and components are capped at 10,000 by the UI.
- Analysis history is a single page capped at 100 and is explicitly marked
  incomplete if more exists.

### Required versus optional collection

- Project measures/metadata are required; failure rejects the export.
- Server version is optional and produces a warning/dataset state on failure.
- Quality gate is optional and falls back to `UNKNOWN` with a warning.
- Issue collection is requested by default and is not wrapped as optional;
  failure rejects collection.
- Components and analyses are optional datasets; failures become warnings and
  explicit states.
- A final analysis lookup attempts to detect an analysis change during
  collection.

Dataset states used by the implementation include:

```text
complete
not_requested
permission_denied       # HTTP 401 or 403
not_available           # HTTP 404 or missing analysis identity
partial_limit           # expected rows exceed exported rows
partial_error           # other failures, unreconciled paging, changed snapshot
```

Overall `report.complete` is true only when every requested dataset state is
`complete`. A mandatory failure may reject report creation instead of returning
an incomplete model.

## 9. Normalized Report Model v2

The collector returns one object with these top-level fields:

```text
schemaVersion
modelVersion
rendererVersion
pluginVersion
reportId
generatedAt
collectionStartedAt
collectionCompletedAt
complete
datasetStates
serverVersion
branchLabel
collectionScope
project
analysisDateBeforeCollection
analysisDateAfterCollection
analysisSnapshotConsistent
qualityGate
measures
issues
rules
components
analyses
issuePaging
componentPaging
analysisPaging
warnings
```

Important nested semantics:

- `reportId` is UUID-shaped random data generated with Web Crypto when
  available, with `Math.random` fallback.
- `collectionScope` has booleans for `issues`, `components`, `analyses`, and
  `people`.
- `project` has normalized string fields `key`, `name`, `qualifier`, `version`,
  and `analysisDate`.
- `qualityGate` contains `status`, raw `conditions`, and `ignoredConditions`.
- `measures` retain SonarQube's measure objects, including period/new-code data.
- issues are normalized; people fields are blank unless explicitly selected.
- rules are merged across issue pages by rule key.
- components retain only key, name, path, qualifier and language.
- analyses retain key, date, project version, revision and events.

Normalized issue fields are:

```text
key, rule, type, severity, impacts, status, issueStatus, legacyStatus,
lifecycleStatus, resolution, message, component, project, line, textRange,
effort, assignee, author, tags, creationDate, updateDate, closeDate,
cleanCodeAttribute
```

Modern `issueStatus` is preferred over legacy `status`. If legacy type/severity
are absent, the implementation derives display values from impact entries.
Lifecycle mapping is:

- actionable: `OPEN`, `CONFIRMED`, `REOPENED`, `TO_REVIEW`, `IN_REVIEW`;
- accepted: `ACCEPTED`;
- closed: `FIXED`, `FALSE_POSITIVE`, `WONTFIX`, `CLOSED`, `RESOLVED`, `REMOVED`,
  or selected closed resolutions; and
- unknown: every unrecognized/future state. Unknown is not silently actionable.

The separate manifest (`manifestVersion: 1`) records product/disclaimer,
versions, report ID, timestamps, server/project/branch identity, scope,
completeness, dataset states, paging counts, and warnings. It intentionally
contains no credential or cookie.

## 10. Presentation Template Schema v2

The allowlisted normalized template fields are:

```text
schemaVersion, id, name, description, title, subtitle, accentColor,
intro, footer, sections, issuePageSize
```

Rules and limits:

- input must be a JSON object no larger than 65,536 UTF-8 bytes;
- schema versions 1 and 2 are accepted; other explicit versions are rejected;
- accent color must match exactly `#[0-9a-fA-F]{6}`;
- single-line fields remove control characters and have explicit length caps;
- introduction is capped at 2,000 characters and footer at 1,000;
- issue page size is restricted to 50, 100, or 250;
- section flags are normalized to booleans; and
- unknown properties are discarded.

The schema cannot carry raw HTML, JavaScript, CSS URLs, external assets, paths,
Office parts, or executable content.

## 11. Exporter behavior

### Interactive HTML

- One HTML file contains CSS, escaped report/template JSON, and an embedded
  runtime.
- The runtime SHA-256 is pinned in the CSP and tested against the source string.
- CSP includes `default-src 'none'`, `connect-src 'none'`, `base-uri 'none'`,
  `object-src 'none'`, and a hash-only script policy; inline style is allowed.
- There are no remote scripts, styles, fonts, images, or API requests.
- Runtime rendering uses DOM creation and `textContent` for project data.
- It presents quality-gate status, export completeness, analysis age, measures,
  issue summaries, rules/files risk concentrations, and provenance.
- Issues support search, severity/status/type filters, risk/newest/oldest/file
  sorting, pagination, hash navigation, and detailed disclosures.
- Components and analyses are shown only when selected by the template; data
  exclusion is labeled rather than rendered as a false zero.
- The analyses section is explicitly an audit timeline, not metric trend data.
- The document includes print CSS, responsive CSS, reduced-motion handling,
  forced-colors handling, accessible table captions/regions and focus styles.

### Print / Save as PDF

- The parent opens a blank window synchronously to reduce popup blocking.
- After report generation it writes a print-purpose HTML document into that
  window.
- The print document calls `window.print()` after its own load event and exposes
  a visible retry button.
- If the popup is blocked, a print-ready HTML file is downloaded instead.
- The print manifest shows mode, issue scope, exported/collected counts,
  completeness, report ID and UTC time.
- This is not deterministic PDF generation and does not choose a printer,
  destination, filename, page profile, encryption, or signature.

### XLSX

- A custom dependency-free ZIP/OOXML writer creates eight sheets:
  `Metadata`, `Quality Gate`, `Measures`, `Issues`, `Rules`, `Components`,
  `Analyses`, and `Warnings`.
- Headers are styled, frozen and filterable; columns have bounded custom widths;
  gridlines are hidden.
- Valid finite numbers and dates use numeric cells; dates use a UTC Excel number
  format. Untrusted strings use inline strings.
- Overall and new-code measures are paired and labeled.
- Formula-like strings beginning (after controls/whitespace) with `=`, `+`, `-`,
  or `@` receive a leading apostrophe.
- Cells longer than Excel's 32,767-character limit are truncated with a warning.
- The generated package intentionally has no formulas, macros, hyperlinks,
  shared external links, or external relationships.
- The ZIP writer uses the `store` method (no compression).

### CSV

- Exports the normalized issue register only.
- Uses an UTF-8 BOM, CRLF rows/newlines, quoted cells, doubled quotes, and a final
  CRLF.
- Uses human-readable labels and UTC timestamps.
- Applies the same formula-prefix neutralization described above.
- If issues were excluded from collection, CSV generation is rejected.

### DOCX

- Uses a fixed macro-free WordprocessingML package, not an uploaded template.
- Contains title/subtitle/project identity, collection status, executive
  summary, gate conditions, selected measures, optional issue register,
  optional files/analyses, provenance, warnings and footer.
- Supports actionable-only or all-collected issue register scope.
- Repeating table header rows are emitted.
- All text is escaped into `w:t`; disallowed XML control characters are removed.
- Relationships are fixed and internal. There are no hyperlinks, images,
  fields, `altChunk`, macros, OLE, ActiveX, attached templates, embeddings, or
  external relationships.
- Issue registers over 2,000 rows are refused, not silently truncated.
- The completed package is refused if it exceeds 50 MiB, but that check occurs
  after package construction.
- A4 page dimensions and fixed margins are used.

### JSON

- Downloads `{ "manifest": ..., "report": ... }` as pretty-printed JSON.
- It is the fullest machine-readable export and includes the collected model,
  including people fields only when those fields were selected during
  collection.

### File naming

Primary exports use:

```text
<project-key>-<YYYY-MM-DD>-sonarqube-report.<extension>
```

CSV uses `<project-key>-issues.csv`. Unsafe filename characters are normalized,
the base is capped at 90 characters, and a generic fallback is available.

## 12. Security controls verified in code

- Exact relative API-path allowlist.
- No user-supplied server URL or token in the production UI.
- Current-user browser session; no privileged backend proxy.
- Source code is not requested or modeled.
- People identifiers are opt-in and default off.
- Template allowlist, type normalization, byte and string caps.
- Context-specific HTML, embedded-JSON and XML escaping.
- Offline HTML has a no-network CSP and hash-pinned runtime.
- CSV/XLSX formula-prefix neutralization.
- XLSX untrusted values are inline strings, not formulas.
- Fixed OOXML parts and internal relationships only.
- Explicit paging limits, deduplication, reconciliation and incomplete states.
- Random report ID rather than project/user-derived identity.
- Visible warning that downloaded reports are portable sensitive data.

These controls reduce risk but do not prove authorization isolation, desktop
Office safety/interoperability, browser coverage, accessibility conformance, or
resource safety at enterprise boundary sizes.

## 13. Build and generated-asset flow

Developer commands documented by the project:

```bash
npm ci
npm run build
npm run check
npm test
mvn clean verify
```

Command behavior:

- `npm run build` reads the plugin version from `pom.xml`, requires the matching
  `package.json` version, concatenates the seven JS inputs, injects
  `window.OfflineReportBuild.pluginVersion`, and overwrites
  `src/main/resources/static/report_page.js`.
- `npm run check` reconstructs the bundle in memory and fails if the committed
  generated file differs.
- `npm test` first rebuilds the static asset and then runs Node's test runner
  over `test/*.test.mjs`.
- `mvn clean verify` compiles the Java 11 bytecode, runs the Java test, and
  packages the static resource into the Sonar plugin JAR.

Build output is `target/sonar-offline-report-plugin-1.2.1.jar`.

## 14. CI and release automation

### Verify workflow

Runs for pull requests, pushes to `main`/`master`, and manual dispatch:

1. checkout;
2. Node 20 with npm cache;
3. `npm ci`;
4. Temurin Java 17 with Maven cache;
5. verify `package.json` and `pom.xml` versions agree;
6. `npm test`;
7. `npm run check` and ensure the generated bundle has no Git diff;
8. `mvn clean verify`;
9. inspect the JAR for the plugin entry class and static page asset; and
10. print the artifact SHA-256 plus an enterprise-readiness reminder.

The job has read-only contents permission, cancellation for superseded runs,
and a 20-minute timeout.

### Release workflow

Runs for tags matching `v*.*.*`:

1. sets up Node 20 and Temurin 17;
2. requires tag, npm version and Maven version to match;
3. runs the browser and Maven test/build paths;
4. requires the generated asset to be committed;
5. creates a `.jar.sha256` file; and
6. creates a GitHub **prerelease** with the JAR and checksum, unless that release
   already exists.

The workflow has `contents: write` and a 25-minute timeout. It does not sign the
artifact, emit an SBOM/provenance attestation, or upload test/security reports.

## 15. Tests and current verification result

### Node tests (19 total)

API tests cover:

- path allowlisting;
- hard-limit pagination;
- rule metadata merge across pages;
- duplicate removal and reconciliation;
- changed API totals; and
- modern/legacy issue status lifecycle mapping.

Core tests cover:

- HTML and embedded JSON escaping;
- bounded declarative template validation;
- CSV formula injection and RFC 4180 behavior;
- human-readable CSV values; and
- delayed Blob URL cleanup.

Exporter tests cover:

- offline CSP/runtime hash and inert malicious HTML data;
- typed XLSX cells and active-content exclusions;
- fixed escaped DOCX content and relationship exclusions;
- DOCX 2,000-row refusal;
- print manifest/scope/retry behavior;
- excluded-dataset labels; and
- new-code and historical/actionable semantics.

UI tests are mainly source/structure assertions for scroll layout, workflow
labels and snapshot signatures/freeze behavior. They do not run a real browser
DOM interaction suite.

### Java test (1 total)

The Java test asserts exactly one page with the expected key, name, component
scope, and project qualifier.

### Verification performed while creating this context

Environment:

- Node `v24.19.0`;
- npm `11.15.0`;
- Temurin OpenJDK `17.0.20`; and
- Maven unavailable on `PATH`.

Results on 2026-08-21:

- `npm test`: **19/19 passed**;
- `npm run check`: **passed**;
- generated bundle Git diff: **clean**;
- `mvn clean verify`: **not run because `mvn` is not installed**.

The repository's compatibility evidence records a prior Java result of 1/1 and
a live Linux Docker target validation. Those are maintainer-recorded claims,
not freshly reproduced by this context-generation session.

## 16. Maintainer-recorded live evidence

`docs/COMPATIBILITY.md` records these results for the target deployment on
2026-08-18:

- server `UP`, container restart count 0;
- exactly one installed v1.2.1 plugin JAR;
- page route and static asset load;
- browser layout/scroll behavior;
- all output actions present;
- print view/retry/fallback present;
- issue API `components` and `additionalFields=rules` accepted;
- live issue reconciliation 2,147/2,147 with zero duplicates;
- consistent analysis snapshot;
- live HTML, XLSX and DOCX downloads;
- Chromium `file://` offline HTML rendering;
- XML parse with DTD prohibited;
- OOXML active-content/external-relationship scan with zero findings;
- Node tests 19/19 and Java test 1/1.

No raw evidence bundle, scripts/results for every item, target URL, or CI run URL
is stored alongside this context. An independent reviewer should request those
artifacts before treating the table as reproducible evidence.

## 17. Known limitations and open enterprise gates

The project itself lists these GA blockers:

- real permission/isolation matrix for Browse, no-Browse, private projects,
  cross-project key tampering, anonymous/public behavior, and revoked sessions;
- production HTTPS/reverse proxy, HSTS and secure-cookie review;
- Chromium and Firefox end-to-end coverage;
- Microsoft Excel/Word and LibreOffice no-repair/round-trip coverage;
- Open XML SDK validation;
- 0/1/501/9,999/10,000/10,001 and mutable/duplicate live fixtures;
- 429/503, `Retry-After`, timeout and cancellation fault injection;
- browser memory, duration, file size and cancellation budgets;
- accessibility automation plus keyboard, screen reader, forced colors, 320 px
  and 400% reflow review;
- atomic upgrade, uninstall and rollback rehearsal;
- signing, clean-build provenance and release attestation;
- machine-readable SBOM, vulnerability scan and license approval;
- privacy classification, retention, deletion, DLP and transfer policy; and
- privacy-safe audit/error/retry/timing observability.

Pilot controls require named users/projects, HTTPS, people collection disabled
unless approved, review of every incomplete warning, encrypted approved storage,
retention handling, monitoring, and a known-good rollback JAR.

## 18. Evidence-backed gaps and review hypotheses

This section goes beyond restating the roadmap. It identifies concrete source,
test, documentation, or automation gaps visible at the reviewed revision. Each
item should be independently confirmed before changing code.

### High priority

1. **Cancellation is cooperative but not an in-flight network abort.**
   `apiGet` checks `AbortSignal` around `SonarRequest.getJSON`, but does not pass
   it to the request helper. A hung request can therefore outlive Cancel.
2. **No request timeout exists.** The readiness document requires an actual
   timeout, but `apiGet` awaits the Sonar request without a timer/race.
3. **`Retry-After` is ignored.** 429/503 retries use local exponential delay
   only. The required bounded/fault-injected behavior is not implemented or
   tested.
4. **Authorization/isolation is assumed from SonarQube and remains unproven for
   the plugin route and query-key workflow.** In particular, no-Browse,
   cross-project `id` tampering, private-project ordinary users, anonymous
   policy, and permission revocation need real-server evidence.
5. **Resource controls are incomplete relative to documented invariants.** DOCX
   checks issue count and final size, but only after building the package. The
   custom ZIP writer does not expose general per-part, total preflight,
   compression-ratio, part-count, path, or integer-overflow policy checks.
   XLSX has no explicit total package/memory limit.
6. **Desktop Office/OpenXML validation is not automated.** Structural byte-text
   assertions are useful but are not schema validation or proof that Word,
   Excel and LibreOffice will open every boundary/adversarial output without
   repair.

### Medium priority

7. **Branch/PR snapshot consistency may be ambiguous.** Measures, gate, issues
   and components receive branch/PR parameters, while analysis-history and
   before/after analysis-identity requests do not. Confirm the target API's
   branch semantics and whether snapshot checks can compare the wrong analysis.
8. **Deterministic ordering is claimed more strongly than implemented.** Paging
   deduplicates deterministically in first-seen order, but the client does not
   explicitly request an API sort key/direction. Confirm server defaults remain
   stable under concurrent issue mutation.
9. **DOCX actionable-scope logic does not use the normalized lifecycle field.**
   `activeIssue` recomputes state from `issue.status` without passing
   `issue.resolution`, while normalization and other exporters can use both or
   the stored `lifecycleStatus`. Adversarial/legacy combinations could therefore
   produce cross-format count/scope differences and need a reconciliation test.
10. **Documentation and UI preset names/counts have drifted.** README and
   architecture text describe Executive, Standard, Detailed, and Issue Register
   presets. Source implements three presets: Executive summary, Detailed
   technical, and Issues only. Word/print separately expose a register mode.
11. **Documented stale-state wording does not exactly match behavior.** Docs say
    exports are disabled until recollection. The UI marks data stale, then the
    same Create action recollects automatically. Align terminology and tests.
12. **UI tests are mostly regular-expression/source assertions.** There is no
    jsdom or browser-run test for event wiring, focus, cancellation, popup
    behavior, local storage failures, keyboard navigation, reflow, screen
    readers, downloads, or actual SonarQube integration.
13. **The live CDP helper uses fixed sleeps.** It waits 7 seconds for page load
    and 15 seconds for collection, which can be flaky or silently too short. It
    should wait for explicit DOM/download states with bounded timeouts.
14. **The live CDP helper's required-variable error is inconsistent with its
    actual variable names.** It reads `OFFLINE_REPORT_PROJECT` and
    `OFFLINE_REPORT_DOWNLOADS`, but the error says `PROJECT`, `TOKEN`, and
    `DOWNLOADS`, complicating operator diagnosis.
15. **Schema migration/compatibility coverage is narrow.** Template v1 is
    accepted, while report model/version compatibility and old exported-report
    rendering are not exercised across versions.
16. **Unknown/adversarial Unicode coverage is incomplete.** The enterprise plan
    calls for bidi text, lone surrogates, huge cells, archive/path attacks, and
    active OOXML part corpus tests. Current tests cover a smaller malicious
    sample and selected control/formula cases.

### Release/process/documentation priority

17. **No Maven wrapper is present.** Local Java verification depends on a
    separately installed Maven version, reducing build reproducibility.
18. **No SBOM, vulnerability scan, signature, provenance attestation or release
    evidence bundle is produced.** Checksums alone prove integrity after a
    trusted digest is obtained; they do not establish publisher identity.
19. **GitHub Actions are version-tag pinned, not immutable commit-SHA pinned.**
    This is a supply-chain hardening opportunity.
20. **Future release metadata can drift.** CI checks npm and Maven versions, and
    release CI checks the tag, but does not validate every version mention,
    changelog entry, compatibility baseline, release note, or the SCM `<tag>`.
21. **Support/vulnerability commitments are intentionally weak.** The security
    policy offers no support window or response/remediation SLA. That is
    acceptable for a community pilot but must not be represented as enterprise
    support.
22. **Documented live evidence is not self-verifying.** The public repository
    records hashes and pass statements but not all raw logs, fixtures, browser
    versions, Office versions, screenshots, XML validator output, approval
    records, or rollback transcripts.
23. **Compatibility is intentionally narrow.** The code compiles against a
    specific Plugin API and the browser depends on `registerExtension` and
    `SonarRequest.getJSON`, both of which require capability/contract testing on
    every SonarQube upgrade.

## 19. Suggested validation matrix

An independent review should produce evidence in at least these categories:

| Area | Minimum independent checks |
|---|---|
| Clean build | Fresh checkout; pinned Node/JDK/Maven; build twice; compare bundle/JAR contents and explain timestamp differences |
| Java integration | Plugin manifest/classes/resources; page visibility; correct project-only scope; startup/removal |
| API contracts | Target-server API documentation and live calls for every endpoint/parameter; branch and PR cases; deprecations |
| Authorization | Admin, ordinary Browse, no-Browse, private, public/anonymous, cross-project tamper, revoked session |
| Paging | Boundary totals, duplicates, changing totals/order, empty/short pages, 10k cap, analysis >100 |
| Resilience | 401/403/404/429/503, Retry-After, offline, hung request, slow response, cancel, popup block |
| Data semantics | Modern/legacy statuses, unknown enums, quality-gate comparators, periods/new code, missing metadata |
| HTML | Chromium and Firefox offline; CSP console; zero network; malicious corpus; print and popup fallback |
| XLSX | Schema validation, ZIP inspection, Excel/LibreOffice open and round trip, formulas/links/macros absent |
| DOCX | Open XML validation, Word/LibreOffice no-repair, active/external parts absent, 2,000/2,001 rows, 50 MiB behavior |
| CSV/JSON | Formula prefixes, quoting/newlines, Unicode, people opt-in, manifest reconciliation |
| Performance | Peak memory/time/file size for all boundary datasets; cancellation recovery; repeated exports |
| Accessibility | Automated scan, keyboard/focus, screen reader, 320 CSS px, 400% zoom, forced colors, print |
| Operations | Linux/Docker/Windows install, exactly one JAR, upgrade, rollback, uninstall, cache refresh |
| Supply chain | SBOM, license inventory, vulnerability scan, action pinning, signed artifact/provenance |
| Privacy | Classification, minimization, consent/purpose for people fields, storage, sharing, retention/deletion |

## 20. Key decisions that should not be accidentally reversed

- Keep SonarQube as the sole authorization authority.
- Do not add database access or a privileged server token to the plugin.
- Keep report generation client-side unless a separately reviewed service is
  explicitly introduced.
- Never describe the current PDF path as direct/deterministic PDF generation.
- Never silently truncate a dataset and call the report complete.
- Keep source code excluded.
- Keep people identifiers opt-in.
- Preserve modern and legacy issue data plus explicit unknown lifecycle states.
- Keep offline HTML zero-network and its runtime hash synchronized.
- Keep spreadsheet values non-formula and Office packages macro/external-link
  free.
- Keep templates declarative and reject arbitrary executable/OOXML content.
- Re-run target compatibility and permission tests after any SonarQube upgrade.

## 21. Questions requiring product/owner decisions

These cannot be resolved safely from source code alone:

1. Which SonarQube versions, browsers and Office suites will be contractually
   supported, and for how long?
2. Is anonymous export of public projects allowed?
3. Which issue states count as actionable for the organization's workflows?
4. Is a partial report ever acceptable as audit/compliance evidence?
5. What memory/time/file-size budgets define a supported client workstation?
6. What privacy purpose and retention rules permit assignee/author export?
7. Must artifacts or releases be digitally signed, encrypted, watermarked, or
   centrally logged?
8. Is browser Print / Save as PDF sufficient, or is a separate deterministic
   rendering service required?
9. Who owns vulnerability response, compatibility testing and release approval?
10. What evidence and risk exceptions are mandatory before pilot or GA use?

## 22. Source-of-truth precedence for reviewers

When claims conflict, use this order:

1. executable source and generated artifact inspection;
2. reproducible automated/live test evidence for the exact digest;
3. build and workflow configuration;
4. compatibility/release evidence linked to the exact digest;
5. architecture, README, changelog and roadmap statements.

Do not infer implementation from a requirement written in
`docs/ENTERPRISE-READINESS.md`; many entries are deliberate future gates.

## 23. Cross-validation prompt for another AI model

Copy the prompt below and attach this file. If possible, also attach the full
repository at the reviewed commit so the model can verify file-level claims.

```text
Act as an independent principal engineer, application-security reviewer,
SonarQube plugin specialist, QA architect, and release-governance reviewer.

Review the attached PROJECT_CONTEXT.md for sonar-offline-report-plugin. If the
repository is also available, inspect the actual source and build configuration
at commit a628c8691748e8d64d0a73037e2b8292da185da3. Do not assume that README or
roadmap statements are implemented. Prefer source code and reproducible evidence.
Do not invent missing facts.

Objectives:
1. Cross-check every material architecture, API, data-model, exporter, security,
   compatibility, test, build, release, and operational claim.
2. Find contradictions between code, tests, generated artifacts, README/docs,
   release automation, and the context document.
3. Identify missing requirements, bugs, security/privacy risks, authorization
   risks, data-integrity errors, truncation/completeness problems, API-version
   risks, browser/Office interoperability risks, accessibility gaps, performance
   hazards, supply-chain gaps, and weak or non-reproducible evidence.
4. Pay special attention to in-flight cancellation, real timeouts, Retry-After,
   paging order/mutation, branch and pull-request semantics, project-key URL
   tampering, no-Browse behavior, unknown issue taxonomy, spreadsheet formula
   injection, HTML/CSP escape boundaries, OOXML active/external content, ZIP and
   memory limits, stale snapshot behavior, and PDF wording/workflow.
5. Distinguish: (a) verified implementation, (b) tested behavior, (c) documented
   claim only, (d) open owner decision, and (e) speculation needing evidence.
6. Propose a prioritized remediation and validation plan without silently
   changing the product boundary (thin client-side plugin, no database/service
   token, no claim of direct PDF).

Return:
- an executive verdict and confidence level;
- a claim-by-claim discrepancy table with severity, evidence/file reference,
  impact, and recommended correction;
- newly discovered gaps not already listed in section 18;
- false positives or overstated gaps in section 18;
- a threat model and data-flow critique;
- a test-coverage matrix and exact missing tests/fixtures;
- a build/release/supply-chain assessment;
- a prioritized P0/P1/P2/P3 action plan, separating code changes, tests,
  documentation, operations, and owner decisions;
- a list of questions that must be answered before controlled pilot and before
  enterprise GA; and
- a final go/no-go recommendation for development, controlled pilot, and GA.

For every finding, cite the exact supplied evidence. If repository access is
not available, label code-level conclusions as unverified and state which files
or commands are needed. Avoid generic best-practice lists that are not tied to
this project.
```
