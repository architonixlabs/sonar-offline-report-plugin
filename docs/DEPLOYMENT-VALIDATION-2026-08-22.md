# v2.0.0 Linux Docker deployment validation

## Decision scope

This record qualifies the exact locally built candidate for installation and
unauthenticated route/static smoke testing on the target Linux Docker instance.
It does **not** close ordinary-user authorization, private/no-Browse isolation,
authenticated collection, desktop Office, accessibility, HTTPS, clean-release
attestation, or organizational approval gates.

## Target and artifact identity

| Item | Verified value |
|---|---|
| Target | private Linux Docker lab endpoint (redacted from the public record) |
| SonarQube | Community Build `26.6.0.123539` |
| Container | `sonarqube-sonarqube-1` (`sonarqube:community`) |
| Extensions mount | persistent `sonarqube_sonar-extensions` at `/opt/sonarqube/extensions` |
| Plugin | `sonar-offline-report-plugin-2.0.0.jar` |
| JAR SHA-256 | `9D0A21BA54B94E23F2B444CED7BA2F9ADAC1765A51DD6C62BC37E9FA9A0F7168` |
| JAR size | 184,359 bytes |
| CycloneDX JSON SHA-256 | `A8568FEC6E12C32E1FD7A671F632DC16CAEB24510C8DF1106995E80194CEC6F3` |
| CycloneDX JSON size | 8,288 bytes |
| Project bundle SHA-256 | `1FF2387E65BC509F40E1385085E60E4C432240681C352E359184212457E084A5` |
| Portfolio bundle SHA-256 | `4270264B062CEA5C010F3A6003DD3E1F108D148B13B4F1BC0E6E3615C2C531B7` |

The workspace contained uncommitted implementation changes during this
qualification. Build metadata therefore truthfully records `sourceState=dirty`,
`sourceRevision=null`, base revision
`eccf14b6a625de5cfebb4a47d05a23ed839979a1`, and source digest
`sha256:ab3b57ec2f7a4b0f3be70ab3193a6687590d5ee9abefec25809bde662ca61de7`.
This candidate must not be represented as a clean tagged release. A release
promotion must rebuild from an immutable clean revision and publish its new
digest and attestation.

## Pre-deployment verification

- 77/77 Node tests passed.
- Chrome `151.0.7922.170` passed 126/126 checks over executive,
  developer/engineering, application-security, QA/audit, and portfolio
  fixtures at desktop and 390 px, with ten deterministic screenshots.
- Offline/CSP enforcement, zero external requests, issue-row print expansion
  and restoration, and a deterministic normalized 26-page PDF passed.
- Maven clean verification passed using JDK 21, with Java registration 1/1,
  Java 11 bytecode, both browser bundles packaged, and CycloneDX 1.6 output.
- The release verifier matched the exact JAR, SBOM, and packaged frontend bytes.
- The 50-project/25,000-issue/50,000-component synthetic boundary completed;
  HTML, CSV and JSON exported, while XLSX correctly refused its fixed 75 MiB
  package budget instead of truncating or claiming completeness.

## Upgrade and rollback sequence

1. Confirmed the container was running with restart count 0 and exactly one
   active v1.3.0 plugin JAR.
2. Copied that JAR to the recoverable UTC-stamped backup directory:
   `<operator-backup-root>/20260822T093921Z/`.
3. Uploaded and installed the checksum-verified v2.0.0 candidate, removing the
   old active JAR, then restarted SonarQube.
4. Confirmed API status `UP`, the v2.0.0 deployment log, both page routes and
   both static assets.
5. Rehearsed rollback by restoring the backed-up v1.3.0 JAR, removing v2.0.0,
   restarting, and confirming v1.3.0 was operational.
6. Reinstalled v2.0.0, removed v1.3.0 from the active plugin directory,
   restarted, and repeated the health and integrity checks.
7. The final persona audit then identified a contradictory HTML provenance-row
   label for partial/permission-denied data. After the focused fix and 77/77
   regression pass, rebuilt the final candidate identified above. The previous
   active v2.0.0 JAR was preserved at
   `<operator-backup-root>/20260822T095300Z-final/`.
8. Installed the final `9D0A21...7168` candidate and verified its live assets.
9. Rehearsed rollback of that exact final candidate to the checksum-verified
   v1.3.0 backup; SonarQube returned `UP` with exactly one v1.3.0 JAR.
10. Reinstalled the exact final candidate, removed v1.3.0 from the active
    directory, restarted, and repeated all final health and byte-integrity checks.

The old active JAR was removed only from the plugin directory; the timestamped
backup remains recoverable.

## Final steady state

| Check | Result |
|---|---|
| SonarQube API status | `UP` |
| Container | `running` |
| Restart count | `0` |
| Startup log | `Deploy SonarQube Offline Report Plugin / 2.0.0` |
| Web server | operational |
| Active plugin files | exactly one v2.0.0 JAR |
| Active JAR checksum | matches `9D0A21...7168` |
| Project static asset | HTTP 200; byte hash matches verified bundle |
| Portfolio static asset | HTTP 200; byte hash matches verified bundle |
| Project report route | HTTP 200 |
| Portfolio report route | HTTP 200 |
| Startup errors | none observed in the deployment log slice |

## Remaining release gates

Before controlled production use, run the exact clean release candidate with an
ordinary authenticated user and the private/Browse/no-Browse/revoked-session
matrix. Verify visible-project inventory, metric history, mixed portfolio
outcomes, downloads, cancellation and target-server load. Before enterprise GA,
also close HTTPS/security/privacy approval, Firefox and assistive-technology
coverage, Excel/Word/LibreOffice no-repair checks, SBOM policy/signing, and the
support/observability process documented in
[Enterprise readiness](ENTERPRISE-READINESS.md).
