# v2.0.1 clean-release Linux Docker deployment validation

Date: 2026-08-22 UTC

This record covers the exact JAR downloaded back from the published GitHub
prerelease and installed on the qualified Linux Docker target. It closes the
clean-artifact installation, startup, route and static-byte-integrity checks.
It does not claim authenticated report collection, authorization isolation,
representative portfolio load, persona-owner acceptance, or enterprise GA.

## Release identity

| Item | Verified value |
|---|---|
| GitHub release | [`v2.0.1 - Enterprise Candidate`](https://github.com/architonixlabs/sonar-offline-report-plugin/releases/tag/v2.0.1), prerelease, not draft |
| Tag | annotated `v2.0.1` |
| Source revision | `313686aee88e24b076ea5e8259c3c5c28f964c37` |
| Release workflow | [run 32573376193](https://github.com/architonixlabs/sonar-offline-report-plugin/actions/runs/32573376193), successful |
| Published assets | JAR, CycloneDX SBOM, provenance manifest, validation archive, and four SHA-256 sidecars |
| JAR | `sonar-offline-report-plugin-2.0.1.jar`, 184,561 bytes |
| JAR SHA-256 | `1B75A14D6447938CD314B8BF2F6720B1AF26573CD47372598C2DBE4B92AD72B1` |
| SBOM SHA-256 | `B1DFA7404A789E28F315001FB99B7950EE3F055E6FD7B533B4DE912CB1759B5F` |
| SBOM serial | `urn:uuid:f33e5be8-bd86-540f-9ca1-f55b60f719ce` |
| Provenance SHA-256 | `54C8C8E2037874D560C8A4E579671E8A080D33E58023A0BECB5E236E825B2437` |
| Validation archive SHA-256 | `C273127843C8F0A409E7C3EC4485904BB17F3608E0387A3F06CE0CFB98C9B650` |

All four primary assets matched their published checksum sidecars after they
were downloaded to an independent local directory and again after upload to
the target. GitHub artifact attestations verified for all eight published
files against the repository, `release.yml`, `refs/tags/v2.0.1`, and the exact
source revision. The separate CycloneDX predicate bound the finalized SBOM to
the JAR.

## Target and pre-upgrade state

| Item | Verified value |
|---|---|
| Endpoint | private Linux Docker lab endpoint (redacted from the public record) |
| Host | private Linux host (redacted from the public record) |
| SonarQube | Community Build `26.6.0.123539` |
| Container/image | `sonarqube-sonarqube-1` / `sonarqube:community` |
| Persistent extension mount | `sonarqube_sonar-extensions` at `/opt/sonarqube/extensions` |
| Pre-upgrade status | API `UP`; container running; restart count `0` |
| Pre-upgrade active JAR | exactly one `sonar-offline-report-plugin-2.0.0.jar` |
| Pre-upgrade JAR SHA-256 | `9D0A21BA54B94E23F2B444CED7BA2F9ADAC1765A51DD6C62BC37E9FA9A0F7168` |
| Release staging | `<operator-release-root>/20260822T124036Z-v2.0.1/` |
| Rollback backup | `<operator-backup-root>/20260822T124036Z-pre-v2.0.1/sonar-offline-report-plugin-2.0.0.jar` |

The rollback backup was copied before replacement and independently hashed.
It matched the active pre-upgrade JAR exactly.

## Atomic deployment sequence

1. Downloaded all eight release assets from GitHub rather than using a local
   build output.
2. Verified all four primary assets against their `.sha256` sidecars locally
   and after upload to the target staging directory.
3. Copied the new JAR to a hidden staging name in the persistent plugin volume
   and verified `1B75A...72B1` before making it active.
4. Moved the existing v2.0.0 JAR aside, atomically exposed
   `sonar-offline-report-plugin-2.0.1.jar`, and confirmed exactly one active
   `sonar-offline-report-plugin-*.jar` glob match.
5. Restarted the SonarQube container and polled the system API until it returned
   `UP`.
6. Checked startup logs, both extension routes, both served browser bundles,
   the active plugin inventory and its checksum.
7. Verified the hidden pre-upgrade copy and the host rollback backup had the
   same old-JAR digest, then removed only the hidden copy from the active
   plugin volume. The host rollback backup remains recoverable.

## Final steady state

| Check | Result |
|---|---|
| SonarQube API | `UP`; version `26.6.0.123539` |
| Container | `running`; restart count `0` |
| Startup log | `Deploy SonarQube Offline Report Plugin / 2.0.1` |
| Web/compute engine | both operational; SonarQube operational |
| Active plugin inventory | exactly one `sonar-offline-report-plugin-2.0.1.jar` |
| Active JAR checksum | `1B75A14D...72B1`, exact published checksum |
| Project route | HTTP 200 |
| Portfolio route | HTTP 200 |
| Project served bundle | `424240D66CE37178EB69A7F95F63052AF2B87DFBC180114642FE2C63A5117533`, exact packaged hash |
| Portfolio served bundle | `6B96BE9FEA4C3C6032CF6C58AAD51837D5FF0090FA093608BC6939BDAA7FB808`, exact packaged hash |
| Post-restart web/compute errors | none in the reviewed startup slices |
| Rollback artifact | verified and retained outside the active volume |

The server emitted its existing warning that OAuth authentication should use
HTTPS. That warning is unrelated to plugin startup, but it confirms HTTPS is a
real promotion blocker for this target rather than a documentation-only item.
No plugin startup exception was observed.

## Rollback boundary

An exact v2.0.1 restore/reinstall cycle was not forced after successful smoke
testing because it would add avoidable target downtime. The same Docker volume
procedure was previously rehearsed end to end with the model-equivalent v2.0.0
candidate and v1.3.0. For this deployment, the immediately previous v2.0.0 JAR
is retained at the verified backup digest above and the plugin has no database
migration or server-side report data. A rollback must stop/restart SonarQube,
replace the active JAR with that exact backup, and repeat health, inventory,
log, route and checksum checks.

## What remains unproven

- ordinary authenticated Browse/no-Browse, private-project, anonymous/public,
  cross-project tampering, and revoked/expired-session behavior;
- authenticated global-page inventory and mixed complete/partial/denied
  portfolio outcomes;
- live 1/10/25/50-project load, server impact, cancellation and 429/503 fault
  injection;
- Firefox, assistive-technology, desktop Word/Excel/LibreOffice and Open XML
  acceptance;
- HTTPS, privacy, records-management, vulnerability/license-policy,
  observability/support and accountable persona-owner approval;
- administrator-enforced protection against update or deletion of `v*` tags.

Until those gates close, v2.0.1 remains a monitored enterprise-candidate
prerelease, not an enterprise-GA release.
