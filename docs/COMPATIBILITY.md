# Compatibility and acceptance matrix

## Release baseline

| Concern | Baseline |
|---|---|
| Release classification | `2.0.1` production-hardening release candidate |
| Target SonarQube Community Build | `26.6.0.123539` |
| Plugin API compile/minimum | `13.7.0.4381` |
| Java bytecode | 11 |
| Java API surface | `Plugin`, `PageDefinition`, `Page` |
| Browser integration | `registerExtension`, context-path-aware credentialed `fetch`; `SonarRequest.getJSON` fallback |
| Tested deployment | Model-equivalent dirty v2.0.0 lab candidate on the exact Linux Docker target; upgrade, page/static smoke and rollback rehearsal pass; exact published v2.0.1 deployment pending |

This artifact targets the same 26.6 instance used for the Model v3 lab qualification. It is not advertised as compatible across untested SonarQube or Plugin API major versions; exact published-v2.0.1 deployment evidence is recorded separately after publication.

## Model v3 compatibility posture

Version 2.0.1 preserves the qualified project page and adds a public `Page.Scope.GLOBAL` page. Automated registration verifies both pages and confirms the portfolio page is not admin-only. The browser bundle adds `/api/components/search` for Browse-filtered inventory and `/api/measures/search_history` for optional trends; both actions and global-page rendering still require exact-candidate qualification against `26.6.0.123539` before controlled pilot.

Portfolio mode intentionally supports main branches only. Single-project branch/pull-request behavior is unchanged. Template Schema v2 remains accepted; Model v3 adds fields and does not promise that an older renderer can understand a v3 JSON snapshot.

## Historical v1.2.1 target deployment evidence — 2026-08-18

| Check | Result |
|---|---|
| Server starts and reports `UP` | Pass |
| Container remains running with restart count 0 | Pass |
| Installed JAR manifest reports `offlinereport` `1.2.1` | Pass |
| Exactly one `offlinereport` JAR is installed | Pass |
| Static application and component report route load | Pass |
| Live browser page has a plugin-owned resize-aware scrollbar and 128–220 px bottom clearance | Pass; verified in served asset |
| HTML, XLSX, DOCX, Print, CSV, and JSON actions are present | Pass |
| PDF print view opens after loading, exposes a visible retry action, and has a popup-blocked HTML fallback | Pass; verified in served asset and automated tests |
| Current documented issue parameter `components` is accepted | Pass |
| Narrow `additionalFields=rules` is accepted and supplies rules | Pass |
| Live collection reconciles 2,147/2,147 issues | Pass |
| Duplicate count is 0 and analysis snapshot is consistent | Pass |
| Live HTML, XLSX, and DOCX files download successfully | Pass |
| Offline HTML renders through `file://` in Chromium | Pass |
| XLSX/DOCX XML parses with DTD prohibited | Pass |
| XLSX/DOCX active-content/external-relationship scan | Pass: 0 findings |
| Java registration test | Pass: 1/1 |
| Browser/export unit tests | Pass: 19/19 |

Deployed JAR SHA-256: `269A73BBFC54652229810C17BCB586BA590C49BC6CDB4EB8E60001658F4F7CA4`.

Live static bundle SHA-256: `05D3F10FC3FCB8522E546DA96144F47C4E846D5D258653150A8FD0DAE4262584`.

The installation path and rollback locations are intentionally retained in the private operational runbook rather than this public repository. The deployment was performed against a persistent Docker extensions volume with a dated rollback copy.

## Enterprise-GA gates still open

| Required check | Status |
|---|---|
| Private project export by an ordinary user with Browse | Pending |
| No-Browse user receives no project data or existence oracle | Pending |
| Cross-project key/URL tampering cannot expose another private project | Pending |
| Anonymous/public-project policy is decided and tested | Pending |
| Revoked/expired permission during collection fails closed | Pending |
| HTTPS reverse proxy, secure cookies, and production authentication | Pending |
| Main-branch user-context test beyond the admin smoke | Pending |
| Global portfolio page loads for an ordinary authenticated user | Pending |
| Visible-project inventory exactly matches Browse permissions | Pending |
| Mixed complete/partial/denied portfolio on the target server | Pending |
| Metric-history availability and branch semantics on target API | Pending |
| 1/10/25/50 project load and cancellation benchmark | Pending |
| 0/1/501/9,999/10,000/10,001 and mutable/duplicate live fixtures | Pending |
| Live 429/503, Retry-After, timeout, and cancellation fault injection | Pending |
| Firefox offline and accessibility/reflow/manual keyboard checks | Pending |
| Microsoft Word and LibreOffice DOCX no-repair smoke | Pending |
| Microsoft Excel and LibreOffice XLSX no-repair smoke | Pending |
| Open XML SDK validation and large-document resource tests | Pending |
| Atomic v2.0.0 upgrade, v1.3.0 restore and final v2.0.0 reinstall | Pass on exact Linux Docker target; removal/uninstall remains a separate operational check |
| Approved SBOM, signing/provenance, support, and vulnerability process | Pending |

Until these close, publish this build as a controlled candidate/pilot, not enterprise GA.

## Automated source evidence

- Browser/export tests: 81/81 source tests pass in the v2.0.1 implementation run, including timeout, transport cancellation, bounded retry/concurrency, project inventory, mixed outcomes, pagination-window, branch scope, weighted formulas, null/zero trends, exact HTML dataset-state disclosure, schema/persona/provenance/SBOM contracts, Unicode, ZIP budgets, hostile content and cross-format reconciliation.
- Local Chrome 151 regression: 224/224 checks across all eight built-in profiles at desktop/390px, CSP/offline enforcement, 16 deterministic screenshots, three deterministic print PDFs, and complete project/portfolio print-scope reconciliation with all 19 artifact hashes independently verified. This is renderer evidence, not target-server authorization or native-dialog evidence.
- Java page-registration test verifies both project and global page definitions.
- The Maven Wrapper verifies Maven 3.9.16; Maven Enforcer requires Maven 3.9+
  and JDK 17+ while emitted plugin bytecode remains Java 11.
- The build verifies the generated browser bundle and required JAR contents and
  emits a validated CycloneDX 1.6 JSON SBOM.
- GitHub Actions use immutable commit revisions and the workflows pass
  `actionlint` 1.7.12.

These automated results do not replace authenticated live qualification of the
exact tagged artifact. The historical table and digests above apply only to
v1.2.1. The v2.0.0 exact-candidate upgrade, asset-integrity check, rollback
rehearsal and final reinstall are recorded in
[the 2026-08-22 deployment validation](DEPLOYMENT-VALIDATION-2026-08-22.md);
ordinary-user authorization, data collection and production-policy gates remain open.

## API and upgrade policy

- Use only public Web API actions and parameters documented by the installed instance.
- Do not use internal APIs, SonarQube database access, privileged credentials, or server-side report storage.
- Normalize legacy and modern issue taxonomies while retaining raw values and explicit unknown states.
- Capability-test `registerExtension`, context-path discovery, credentialed `fetch`, the compatibility fallback, and every action contract after an upgrade.
- Review SonarQube API deprecation logs and rerun the full acceptance matrix before changing the support statement.

Primary references:

- [Official plugin basics](https://docs.sonarsource.com/sonarqube-community-build/extension-guide/developing-a-plugin/plugin-basics)
- [Official custom-page guide](https://docs.sonarsource.com/sonarqube-community-build/extension-guide/developing-a-plugin/adding-pages-to-the-webapp)
- [Official Web API guide](https://docs.sonarsource.com/sonarqube-community-build/extension-guide/web-api)
- [Sonar Plugin API compatibility table](https://github.com/SonarSource/sonar-plugin-api#compatibility)
