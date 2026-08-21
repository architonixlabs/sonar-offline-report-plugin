# Independent review validation and implementation record

Date: 2026-08-21

Input: the external review titled *Comprehensive Architecture, Security, and
Release Governance Review: sonar-offline-report-plugin*, based on the original
`v1.2.1` context at commit
`a628c8691748e8d64d0a73037e2b8292da185da3`.

This record documents what was independently confirmed, refuted, implemented,
or left as an evidence/owner gate. The review was assessed from three separate
perspectives: SonarQube API/data integrity, application security/file formats,
and QA/release governance. Recommendations were not implemented when they
conflicted with the target Web API or overstated the evidence.

## Outcome

The code-level hardening that is safe within the existing thin client-side
product boundary has been implemented. The plugin remains an enterprise
candidate, not enterprise GA. Real-server authorization and fault injection,
real Chromium/Firefox offline enforcement, desktop Office/OpenXML validation,
accessibility, performance budgets, attestation/signing, privacy approval, and
operational rollback evidence remain open.

## Finding disposition

| Review finding | Validation | Disposition |
|---|---|---|
| Cancel does not stop a pending `SonarRequest` | Confirmed for caller control; transport behavior unproven | Implemented prompt local abort and abortable retry wait. No unsupported third argument is passed to `getJSON`. Transport abort remains an explicit evidence gap. |
| No request timeout | Confirmed | Implemented a typed 45-second local timeout. A timed-out transport is not retried, preventing overlapping unresolved requests. |
| `Retry-After` ignored | Confirmed when error headers are available | Implemented delta-seconds and HTTP-date parsing, combined with bounded exponential jitter and an abortable maximum 30-second delay. Target error-shape testing remains open. |
| Paging lacks explicit sort | Confirmed; absolute stability cannot be guaranteed | Added target-supported `CREATION_DATE` ascending issue sort and `path` ascending component sort. Documentation now says best-effort because equal keys/concurrent mutation remain possible. |
| Append branch/PR to `project_analyses/search` | Recommendation refuted | The public endpoint has no branch/PR parameter. Branch/PR reports now exclude that unsupported history and perform before/after identity checks through the branch-aware measures endpoint. |
| Ordinary 10,001 issues cause page 21 failure or silent truncation | Refuted | Normal collection already stopped at 10,000 and marked `partial_limit`. A real duplicate-driven edge could request page 21; it is now stopped explicitly with `api_search_window`. |
| Add `componentKeys` fallback for old servers | Out of declared scope | Current release intentionally targets 26.6 and live-validates `components`. No speculative version parsing/fallback was added. |
| Require Execute Analysis permission | Refuted as a platform requirement | Read APIs use SonarQube Browse authorization. A stronger organization export policy is an owner decision, not an API security fix. |
| Tab/CR/LF CSV formula bypass | Refuted | The existing leading `U+0000-U+0020` regex and test already covered them. |
| Full-width formula initiators | Confirmed as locale hardening | Added `＝`, `＋`, `－`, and `＠` to neutralization and table-driven regression tests. This prevents formula interpretation; no claim of guaranteed command execution is made. |
| OOXML text can inject an external relationship | Refuted | Text is XML-escaped and relationship parts are fixed. Schema validation remains an interoperability requirement, not evidence of this exploit path. |
| Invalid Unicode can corrupt OOXML | Newly confirmed | XML output now admits only valid XML 1.0 scalars and replaces invalid controls, noncharacters, and unpaired surrogates. XLSX truncation no longer splits surrogate pairs. |
| DOCX/XLSX memory bounds are late/incomplete | Confirmed | The shared ZIP writer now rejects unsafe paths, excessive entry count, ZIP32 overflow, and configured size excess before final package concatenation. DOCX uses 50 MiB; XLSX uses 75 MiB. Streaming/peak-memory evidence remains open. |
| DOCX lifecycle can diverge | Confirmed as contract consistency, lower severity | Added a shared normalized lifecycle helper and use it for DOCX and print counting. |
| Stale-state docs differ from UI | Confirmed as minor documentation drift | README/architecture now state that Create visibly recollects stale scope and then exports; stale data is never exported. |
| JDK 11 build must fail because modern SonarQube uses newer Java | Refuted | The review conflated host runtime, build JDK, and emitted bytecode. CI/build uses JDK 17+ while the plugin deliberately emits Java 11 bytecode. |
| No Maven Wrapper/build constraints | Confirmed | Added Maven Wrapper 3.3.4 configured for Maven 3.9.16 with distribution SHA-256 verification, plus Maven Enforcer rules for JDK 17+ and Maven 3.9.x. |
| No SBOM | Confirmed | Maven verify now generates and schema-validates a CycloneDX 1.6 JSON SBOM; CI checks it and release automation publishes it with a checksum. Vulnerability/license approval remains manual. |
| Mutable GitHub Action tags | Confirmed as supply-chain hardening | Checkout, Node setup, and Java setup are pinned to full commit SHAs while retaining version comments. An updater should maintain those pins. |
| LICENSE/NOTICE release evidence | Existing referenced JAR was questionable; fresh build is correct | Fresh Maven build includes both entries. CI now asserts them explicitly so a future release cannot omit them silently. |

## Implemented code controls

### API and data integrity

- `REQUEST_TIMEOUT_MS = 45000`.
- `MAX_RETRY_DELAY_MS = 30000`.
- Prompt local abort for pending requests and retry waits.
- No timeout retry while an unresolved transport may still be active.
- Bounded `Retry-After` handling when the error exposes headers.
- Explicit issue/component sorts supported by the target API.
- Explicit stop before issue offset 10,000, even when deduplication prevents the
  unique-row target from being reached.
- Branch/PR analysis history is marked `not_available` rather than mislabeled as
  branch data; consistency uses repeated branch-aware measures.

### Export and Unicode safety

- Full-width formula-prefix neutralization.
- Valid XML 1.0 scalar filtering with replacement of invalid input.
- Surrogate-pair-safe XLSX truncation.
- Shared issue lifecycle semantics.
- ZIP path/entry/ZIP32/size bounds.
- 50 MiB DOCX and 75 MiB XLSX package budgets before final concatenation.

### Build and release governance

- SHA-256-verified Maven 3.9.16 Wrapper.
- JDK 17+ and Maven 3.9.x enforcement while retaining Java 11 bytecode.
- CycloneDX JSON SBOM generation/validation.
- Immutable GitHub Action revisions.
- CI checks for entry class, browser asset, `META-INF/LICENSE`,
  `META-INF/NOTICE`, and SBOM.
- Release publishing of JAR, JAR checksum, SBOM, and SBOM checksum.
- Live-browser smoke checks now wait on bounded page/workflow states instead of
  fixed sleeps and report the exact required environment-variable names.

## Automated evidence after implementation

Validated locally on 2026-08-21:

- Node/browser/export tests: **31/31 passed**.
- Generated bundle freshness: passed after `npm test` rebuilt it.
- Maven Wrapper: downloaded Maven 3.9.16 and verified distribution SHA-256
  `5af3b743dd8b876b5c45da33b676251e5f1687712644abb4ee519ca56e1d89ce`.
- Maven Enforcer: Java and Maven rules passed under JDK 21.
- Java page registration: **1/1 passed**.
- Sonar plugin packaging: passed.
- Required JAR entries: plugin class, static report page, LICENSE, NOTICE passed.
- CycloneDX 1.6 JSON SBOM generation and plugin validation: passed.

These results apply to the source prepared for `v1.3.0`, not the historical
published `v1.2.1` digest. The tag release workflow rebuilds and rechecks the
artifact; all live/manual gates must still be rerun for its exact digest.

## Deliberately not implemented

- Unsupported `branch`/`pullRequest` parameters on
  `/api/project_analyses/search`.
- Undocumented arguments to `SonarRequest.getJSON`.
- Automatic retry after a local timeout while the old transport may still run.
- Date/severity slicing around the 10,000-row issue search window. That is a
  separate product design requiring snapshot semantics and boundary proof.
- Version-string-based `components`/`componentKeys` negotiation outside the
  declared target baseline.
- An Execute Analysis permission requirement not present in the read API
  contract.
- Claims that schema validation alone prevents external relationships.
- Claims that formula interpretation guarantees arbitrary command execution.

## Remaining release blockers

Repository automation cannot close these without external environments,
authority, or owner decisions:

1. Confirm the target `SonarRequest` error/header shape and whether its transport
   can be truly aborted.
2. Real-server Browse/no-Browse/private/cross-project/anonymous/revoked-session
   matrix over authenticated HTTPS.
3. Live 401/403/404/429/503, timeout, disconnect, mutation, duplicate, and
   boundary fixtures for the exact artifact.
4. Chromium and Firefox hostile `file://` report testing with all network
   requests and CSP violations treated as failures.
5. Open XML SDK schema validation plus explicit relationship/content-type
   allowlist scanning.
6. Microsoft Excel/Word and LibreOffice no-repair round trips.
7. Peak-memory/time/file-size measurements at issue/component boundaries.
8. Automated browser accessibility plus keyboard, screen-reader, forced-colors,
   320 CSS px, 400% zoom, and print review.
9. Artifact attestation/signing policy and verification instructions.
10. SBOM vulnerability/license review and approval.
11. Privacy, DLP, retention, deletion, support SLA, promotion, rollback, and
    exception-owner decisions.

## Primary external contracts checked

- SonarQube current Web API metadata for `api/issues/search`,
  `api/components/tree`, and `api/project_analyses/search`.
- [SonarQube plugin basics](https://docs.sonarsource.com/sonarqube-community-build/extension-guide/developing-a-plugin/plugin-basics).
- [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection).
- [Microsoft Open XML validation](https://learn.microsoft.com/en-us/office/open-xml/word/how-to-validate-a-word-processing-document).
- [Apache Maven Wrapper](https://maven.apache.org/tools/wrapper/).
- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use).
- [CycloneDX Maven plugin](https://github.com/CycloneDX/cyclonedx-maven-plugin).
