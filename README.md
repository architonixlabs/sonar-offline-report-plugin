# SonarQube Offline Report Plugin

A thin, project-scoped SonarQube Community Build plugin that collects authorized project data through public Web APIs and creates portable reports entirely in the browser. It does not access the SonarQube database, store reports on the server, or use a privileged service token.

Version `1.2.0` is validated as an **enterprise candidate/pilot** on SonarQube Community Build `26.6.0.123539`. It is not enterprise GA until the open authorization, HTTPS, browser/Office, large-data, accessibility, rollback, signing, and SBOM gates in [Enterprise readiness](docs/ENTERPRISE-READINESS.md) are closed.

## What it exports

- A self-contained, interactive HTML report that works from `file://` with networking disabled.
- A professional XLSX workbook with Metadata, Quality Gate, Measures, Issues, Rules, Components, Analyses, and Warnings sheets.
- An Excel-friendly UTF-8 CSV issue register with human-readable headers and values.
- A macro-free DOCX report generated from a fixed, escaped OOXML profile.
- An honest **Print / Save as PDF** workflow. This invokes the browser print dialog; it is not advertised as deterministic direct-PDF generation.
- A JSON manifest containing the normalized snapshot and provenance.

The report distinguishes current actionable issues from historical exported records, pairs overall and new-code measures, explains quality-gate conditions, highlights stale analyses, ranks risks/rules/files, and records the exact selected scope and dataset health.

## Guided workflow

1. Open a project and select **Extensions → Offline Report**.
2. Choose an Executive, Standard, Detailed, or Issue Register preset.
3. Select a format and review the data scope. Advanced data and appearance settings remain collapsed unless needed.
4. Select **Create report**. The collected snapshot is reused for presentation-only changes.
5. If a data-affecting option changes, every export is disabled until the data is recollected.

The page provides its own visible, resize-aware vertical scrollbar and a responsive single-column layout. It recalculates the available height after resize or browser zoom and reserves generous space after the final controls, so expanded Advanced settings remain reachable at 100% zoom. After an upgrade, use `Ctrl+F5` once because SonarQube caches plugin static assets for several minutes.

## Security and data model

- Fixed, relative, same-origin Web API calls run as the signed-in SonarQube user.
- Source code is never exported; assignee and author identifiers are disabled by default.
- One immutable normalized model feeds every format so project identity, issue counts, gate state, report ID, and completeness reconcile.
- Dataset states distinguish complete, partial, excluded, unavailable, and permission-denied data.
- Templates are bounded declarative JSON. Arbitrary HTML, JavaScript, active CSS, remote assets, and uploaded Office templates are unsupported.
- Offline HTML uses escaped content, a restrictive CSP, a pinned runtime hash, and `connect-src 'none'`.
- XLSX/DOCX contain no macros or external relationships; untrusted spreadsheet values never become formulas. CSV formula-like values are neutralized.
- Reports are sensitive portable artifacts outside SonarQube access control after download.

See [Security](SECURITY.md) and [Architecture](docs/ARCHITECTURE.md).

## Compatibility

The release is deliberately targeted to the deployed Community Build `26.6.0.123539` and Plugin API `13.7.0.4381`. Java uses only the public `Plugin`, `PageDefinition`, and `Page` contracts. It does not claim universal compatibility with other SonarQube/Plugin API major versions.

The server, route, page asset, public API contracts, live collection, and HTML/XLSX/DOCX creation have been validated on the target. The negative permission matrix and desktop Word/LibreOffice/Firefox checks remain open. See [Compatibility and acceptance](docs/COMPATIBILITY.md).

## Build

Requirements: Node.js 18+, JDK 17 or 21, and Maven 3.9+.

```bash
npm ci
npm run build
npm run check
npm test
mvn clean verify
```

The release artifact is:

```text
target/sonar-offline-report-plugin-1.2.0.jar
```

The build derives the browser-visible plugin version from `pom.xml`, verifies the matching package version, and fails when the committed static bundle is stale.

## Linux Docker installation

Download `sonar-offline-report-plugin-1.2.0.jar` from the [v1.2.0 release](https://github.com/architonixlabs/sonar-offline-report-plugin/releases/tag/v1.2.0), verify its published SHA-256, and copy it into the persistent SonarQube extensions volume. Keep exactly one JAR with the `offlinereport` plugin key, pin the SonarQube image/JAR versions, and back up the previous artifact before restart.

```bash
docker compose stop sonarqube
install -m 0644 target/sonar-offline-report-plugin-1.2.0.jar \
  /persistent/sonar-extensions/plugins/
docker compose start sonarqube
docker logs --tail 200 sonarqube
```

Every release includes a `.sha256` asset for verifying the downloaded JAR.

For rollback, stop the service, replace only this JAR with the approved backup, ensure only one `offlinereport` JAR remains, restart, and verify `/api/system/status`, the installed-plugin version, and the project page.

## Supported scope and limitations

- One project and Community Build main branch per collection; no native portfolio/application claim.
- Up to the public API's 10,000-result issue window. Breaches, changed totals, duplicates, or analysis changes are recorded as partial rather than silently treated as complete.
- Cancellation is cooperative between legacy `SonarRequest` calls; it cannot abort an already in-flight request.
- Personal template storage is origin-wide browser `localStorage`; the UI warns shared-browser users and offers deletion.
- DOCX is intentionally narrow and static, with a bounded issue appendix. No arbitrary Word templates, images, fields, hyperlinks, or active content.
- Browser Print / Save as PDF is not PDF/A, PDF/UA, encrypted, signed, or deterministic.
- Shared organization templates, schedules, multi-project aggregation, durable audit/storage/signing, and deterministic server-side document rendering belong in a separately secured companion service.

## Project documentation

- [Architecture and reviewed decisions](docs/ARCHITECTURE.md)
- [Compatibility and acceptance matrix](docs/COMPATIBILITY.md)
- [Enterprise readiness](docs/ENTERPRISE-READINESS.md)
- [Security policy](SECURITY.md)
- [Third-party notices](docs/THIRD-PARTY-NOTICES.md)
- [Changelog](CHANGELOG.md)

## Release policy

Git tags use `vMAJOR.MINOR.PATCH`. A tag push runs the release workflow, rebuilds and verifies the browser bundle and Maven package, and publishes the JAR plus SHA-256 checksum. Candidate builds are marked as GitHub prereleases until the manual gates in [Enterprise readiness](docs/ENTERPRISE-READINESS.md) are closed.
