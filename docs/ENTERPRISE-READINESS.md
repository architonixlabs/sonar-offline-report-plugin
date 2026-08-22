# Enterprise readiness

## Decision

Version 2.0.0 is a **production-hardening release candidate for controlled pilot use only**. It
must not be represented as enterprise general availability, compliance
certified, or suitable for unattended regulated reporting until every GA
blocker below is closed and approved by the accountable security, privacy,
operations, and product owners.

The plugin remains thin: it uses the current browser session and public,
same-origin SonarQube Web APIs, then generates files locally. It has no server
report endpoint, service credential, database access, report repository, direct
PDF generator, or arbitrary DOCX-template execution surface.

The Model v3 implementation is **development GO only**. Controlled pilot is
NO-GO until the global page, Browse-filtered inventory, mixed permissions,
bounded 1/10/25/50-project load and cancellation are proven on the exact target
server and supported browsers. It does not inherit historical single-project
deployment evidence automatically.

## Release states

| State | Permitted use | Required evidence |
|---|---|---|
| Development | Local/non-production data | Automated unit and build checks |
| Enterprise candidate / pilot | Named users, approved projects, monitored deployment, documented rollback | All candidate gates below; open GA gates accepted in writing with expiry |
| Enterprise GA | Production use under organizational policy | Every mandatory GA gate closed; no unexpired critical/high exception |

Passing automated CI is necessary but does not promote a build to pilot or GA.
The release owner records the decision, approvers, artifact digest, evidence
links, exceptions, and rollback result for each promoted artifact.

## Mandatory GA gates

| Gate | Required evidence | 2.0.0 status |
|---|---|---|
| HTTPS and authentication | Supported TLS reverse-proxy configuration; HSTS and secure-cookie review; no production plain HTTP | **Open — GA blocker** |
| Permission and isolation matrix | Real target-server tests for Browse/no-Browse, private projects, cross-project key tampering, anonymous/public policy, and expired/revoked sessions; no existence or data leak | **Open — GA blocker** |
| Portfolio authorization and load | Global page for ordinary users; inventory exactly matches Browse; mixed denied/partial projects remain visible; 1/10/25/50-project load with one-to-four workers and server impact recorded | **Open — pilot and GA blocker** |
| Chromium and Firefox | End-to-end collection, stale-state, cancellation, CSP/no-network, navigation, filtering, download, and print tests on supported versions | **Local Chrome renderer/reflow/CSP/print gate passes; authenticated target flow and Firefox remain open — GA blocker** |
| Excel and LibreOffice | XLSX opens without repair; row/value/type round trip; adversarial strings never become formulas or links | **Open — GA blocker** |
| Word and OpenXML | DOCX opens without repair in Word and LibreOffice; Open XML validation; fixed-part and relationship scan; malicious corpus and accessibility review | **Open — GA blocker** |
| Large exports and API mutation | 0/1/501/9,999/10,000/10,001 cases, duplicate/changing pages, partial-data policy, browser memory/time budgets, abort and recovery | **Open — GA blocker** |
| Accessibility | Automated checks plus keyboard, screen-reader, forced-colors, 320 CSS px/400% reflow and print review | **Open — GA blocker** |
| Upgrade and rollback | Atomic install/upgrade, exactly one plugin JAR/key, startup smoke test, removal, and restore of the immediately previous verified artifact | **Pass on the exact Linux Docker target: v2 upgrade, v1.3.0 restore, final v2 reinstall, one active JAR, restart count 0; formal production change approval remains operational** |
| Artifact signing and provenance | Approved signing identity, signature verification instructions, SHA-256 digest, source revision, clean-build provenance, release attestation and repository protection against version-tag update/deletion | **Workflow implemented; exact-candidate attestation approval and administrator-owned `v*` tag protection remain open — GA blocker** |
| SBOM and license approval | Machine-readable SBOM for shipped artifact, transitive inventory, vulnerability and license-policy review, LICENSE/NOTICE inclusion verified in source and JAR | **Open — GA blocker** |
| Privacy and records management | Data classification, PII purpose, retention/deletion, approved transfer channels, DLP handling, and public-project export decision | **Open — GA blocker** |
| Observability | Privacy-safe audit event for actor/project/scope/count/format/result and actionable error/retry/timing telemetry; no tokens or report content | **Open — GA blocker** |

## Candidate implementation invariants

These are release requirements, even when an individual check is automated.

### Authorization and data lifecycle

- SonarQube remains the sole authorization authority. Requests use exact
  same-origin allowlisted API paths and the active user session; the plugin
  accepts no server URL or token.
- Collection produces an immutable snapshot. Changing any data-affecting option
  marks it stale and disables all exports until recollection.
- Portfolio selection is de-duplicated and capped at 50; concurrency is capped
  at four. A failed or denied project remains in the final model and makes the
  portfolio incomplete.
- Every output shows its exact project, UTC collection/export times, report ID,
  plugin/schema/server versions, selected datasets, applied filter, exported
  versus collected counts, and completeness reasons.
- Reports are portable sensitive records after download. People fields remain
  opt-in and must be excluded unless the recorded purpose permits them.

### Output safety

- Untrusted spreadsheet text is emitted as text. Numeric/date/boolean cell types
  are used only after schema validation; CSV formula-prefix neutralization is
  retained.
- DOCX is macro-free and constructed only from fixed, escaped OOXML parts. Raw
  XML, fields, `altChunk`, macros, ActiveX, OLE/embeddings, attached templates,
  external relationships, remote images, and arbitrary DOCX imports are
  forbidden.
- DOCX generation enforces per-part, total-byte, part-count, path, compression,
  and integer-size limits. XML validation disables DTD and external entities.
- HTML remains self-contained with no remote assets and a restrictive CSP.
- The UI says **Print / Save as PDF**. It does not claim deterministic PDF,
  PDF/A, PDF/UA, encryption, signing, or direct PDF generation. The printed
  document visibly records the applied scope and count.
- The JSON manifest contains report metadata and counts but never credentials,
  cookies, workstation paths, or unnecessary personal data. The report ID is
  random rather than derived from project or user information.

### Correctness and resilience

- Legacy and modern issue statuses are preserved and mapped by a documented
  taxonomy; unknown values remain visibly unknown.
- Ignored quality-gate conditions, threshold kind, new-code period, timezone,
  and duration units have consistent cross-format definitions.
- Portfolio coverage and duplication use documented source denominators, never
  naive percentage averages. Missing values remain unavailable; lifecycle and
  aggregate reconciliation assertions must pass.
- Paging uses an explicit best-effort sort, deduplication, count reconciliation
  and mutation indicators. Limit breaches cannot be presented as complete;
  equal-sort-key concurrent mutation remains a documented non-transactional risk.
- Requests have bounded retries, bounded `Retry-After` handling, an actual local
  timeout, and prompt cancellation. The primary same-origin `fetch` transport
  propagates an abort signal; the compatibility `SonarRequest.getJSON` fallback
  rejects locally and ignores late results because that helper exposes no abort
  handle. Export generation has bounded package construction, cleanup, and
  recoverable failure state.

## Required automated and manual evidence

The release record must include:

1. A clean CI run that builds the browser bundle before Maven packaging, checks
   that generated assets are unchanged, confirms version consistency, and runs
   JavaScript and Java tests.
2. Malicious-input tests covering HTML/XML/script payloads, formula prefixes
   including leading whitespace/control characters, Unicode and bidirectional
   text, lone surrogates, huge cells, path traversal, archive bombs, external
   OOXML relationships and active-content part names.
3. Offline HTML execution with all network access blocked and CSP violations
   treated as failures.
4. OOXML archive/relationship inspection, schema validation, desktop-application
   open/round-trip checks, and a failure on any application repair prompt.
5. Performance results with stated workstation/browser limits, peak memory,
   duration, file size and cancellation behavior for the boundary fixtures.
6. The signed approval record and a successful rollback rehearsal using the
   exact candidate and rollback artifact digests.

## Pilot controls while GA gates are open

- Use only non-production or explicitly approved projects and named users.
- Put SonarQube behind HTTPS; do not accept plain HTTP as a pilot exception.
- Disable People collection unless privacy approval is recorded.
- Review every incomplete report warning and do not use a partial artifact as
  audit evidence.
- Keep exported files only in approved encrypted storage and delete them under
  the applicable retention schedule.
- Monitor server/browser errors and retain the previous verified JAR. Stop the
  pilot on suspected authorization bypass, active-content generation, silent
  truncation, or unrecoverable resource exhaustion.

## Promotion and exception policy

A gate can be marked closed only by linking reproducible evidence for the exact
artifact digest. An exception must identify the risk owner, affected scope,
compensating controls, review date, and expiry. Critical or high authorization,
data-exfiltration, active-content, integrity, or availability risks are not
eligible for a GA exception.
