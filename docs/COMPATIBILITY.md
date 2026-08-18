# Compatibility and acceptance matrix

## Release baseline

| Concern | Baseline |
|---|---|
| Release classification | `1.2.1` enterprise candidate/pilot |
| Target SonarQube Community Build | `26.6.0.123539` |
| Plugin API compile/minimum | `13.7.0.4381` |
| Java bytecode | 11 |
| Java API surface | `Plugin`, `PageDefinition`, `Page` |
| Browser integration | `registerExtension`, `SonarRequest.getJSON` |
| Tested deployment | Linux Docker lab deployment; endpoint omitted from public documentation |

This artifact targets the exact deployed 26.6 instance. It is not advertised as compatible across untested SonarQube or Plugin API major versions.

## Target deployment evidence — 2026-08-18

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
| 0/1/501/9,999/10,000/10,001 and mutable/duplicate live fixtures | Pending |
| Live 429/503, Retry-After, timeout, and cancellation fault injection | Pending |
| Firefox offline and accessibility/reflow/manual keyboard checks | Pending |
| Microsoft Word and LibreOffice DOCX no-repair smoke | Pending |
| Microsoft Excel and LibreOffice XLSX no-repair smoke | Pending |
| Open XML SDK validation and large-document resource tests | Pending |
| Atomic upgrade and rollback/removal acceptance | Pending |
| Approved SBOM, signing/provenance, support, and vulnerability process | Pending |

Until these close, publish this build as a controlled candidate/pilot, not enterprise GA.

## API and upgrade policy

- Use only public Web API actions and parameters documented by the installed instance.
- Do not use internal APIs, SonarQube database access, privileged credentials, or server-side report storage.
- Normalize legacy and modern issue taxonomies while retaining raw values and explicit unknown states.
- Capability-test `registerExtension`, `SonarRequest.getJSON`, and every action contract after an upgrade.
- Review SonarQube API deprecation logs and rerun the full acceptance matrix before changing the support statement.

Primary references:

- [Official plugin basics](https://docs.sonarsource.com/sonarqube-community-build/extension-guide/developing-a-plugin/plugin-basics)
- [Official custom-page guide](https://docs.sonarsource.com/sonarqube-community-build/extension-guide/developing-a-plugin/adding-pages-to-the-webapp)
- [Official Web API guide](https://docs.sonarsource.com/sonarqube-community-build/extension-guide/web-api)
- [Sonar Plugin API compatibility table](https://github.com/SonarSource/sonar-plugin-api#compatibility)
