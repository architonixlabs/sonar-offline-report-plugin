# SonarQube Offline Report Plugin

A thin SonarQube Community Build plugin that collects authorized data through public Web APIs and creates portable reports entirely in the browser. It preserves the project page and adds an optional global Portfolio Reporting page for up to 50 projects visible to the signed-in user. It does not access the SonarQube database, store reports on the server, or use a privileged service token.

Version `2.0.1` is a **production-hardening release candidate** targeting SonarQube Community Build `26.6.0.123539`. Report Model v3, portfolio reporting, persona evidence views, artifact-level completeness, cancellation-safe collection and cross-format reconciliation are implemented and automated locally. The Model v3 candidate has also passed a Linux Docker upgrade, route/static integrity check, rollback rehearsal and final reinstall; the exact published v2.0.1 artifact must still pass the post-publication deployment checks. Promotion still requires authenticated authorization, HTTPS, target-server load, desktop Office, accessibility and policy approval of the clean release evidence in [Enterprise readiness](docs/ENTERPRISE-READINESS.md).

Use only the clean-tag assets from the v2.0.1 GitHub prerelease. The earlier dirty-source Linux lab candidate is deployment evidence only and is deliberately excluded from the release assets. The v2.0.0 tag did not publish a release after its workflow correctly stopped at SBOM-attestation validation; it is superseded by v2.0.1 and must not be installed.

The major version is intentional: JSON advances from Report Model v2 to v3 and CSV is now a self-contained manifest envelope. Saved template schemas 1 and 2 remain import-compatible.

## What it exports

- A self-contained, interactive HTML report that works from `file://` with networking disabled.
- A professional XLSX workbook. Portfolio mode adds Executive Summary, Project Scorecard, Quality Gates, Measures, Issue Summary, Issues, Rules, Components, Trends, Analyses, Data Quality, Warnings, and Metadata sheets.
- An Excel-friendly UTF-8 CSV issue register with a mandatory manifest row, repeated provenance/completeness fields, and human-readable issue values.
- A macro-free DOCX report generated from a fixed, escaped OOXML profile.
- An honest **Print / Save as PDF** workflow. This invokes the browser print dialog; it is not advertised as deterministic direct-PDF generation.
- A JSON manifest containing the normalized snapshot and provenance.

The report distinguishes current actionable issues from accepted, closed and unknown lifecycle records; retains modern impacts and legacy taxonomies; explains quality-gate conditions; highlights stale analyses; and records exact scope and dataset health. Portfolio percentages use source-count weighting rather than naive averages. Optional historical trends come only from SonarQube metric history and remain distinct from the analysis-event timeline.

## Guided workflow

Single-project workflow:

1. Open a project and select **Extensions → Offline Report**.
2. Choose an executive, delivery, engineering, developer, application-security, QA/audit, or portfolio profile, then confirm its required evidence scope and output.
3. Select **Create report**. Presentation-only changes reuse the collected snapshot.
4. A data-scope change marks the snapshot stale and visibly recollects before export.

Portfolio workflow:

1. Open the global **Portfolio Reporting** page.
2. Search/filter the current user's visible projects and select 1–50 unique projects.
3. Choose bounded per-project datasets, a one-to-four worker concurrency, profile and output.
4. Generate. Progress and complete/partial/failed/denied outcomes remain visible per project; one ordinary project failure does not silently remove it or abort unrelated projects.

The page provides its own visible, resize-aware vertical scrollbar and a responsive single-column layout. It recalculates the available height after resize or browser zoom and reserves generous space after the final controls, so expanded Advanced settings remain reachable at 100% zoom. After an upgrade, use `Ctrl+F5` once because SonarQube caches plugin static assets for several minutes.

## Security and data model

- Fixed, relative, same-origin Web API calls run as the signed-in SonarQube user.
- Source code is never exported; assignee and author identifiers are disabled by default.
- One deeply frozen Model v3 snapshot feeds every format so identity, issue counts, gate state, report ID and completeness reconcile.
- Dataset states distinguish complete, partial, excluded, unavailable, and permission-denied data.
- Templates are bounded declarative JSON. Arbitrary HTML, JavaScript, active CSS, remote assets, and uploaded Office templates are unsupported.
- Offline HTML uses escaped content, a restrictive CSP, a pinned runtime hash, and `connect-src 'none'`.
- XLSX/DOCX contain no macros or external relationships; untrusted spreadsheet values never become formulas. CSV formula-like values are neutralized.
- Reports are sensitive portable artifacts outside SonarQube access control after download.

See [Reporting Model](docs/REPORTING-MODEL.md), [API contract](docs/API-CONTRACT.md), [Security](docs/SECURITY.md), and [Architecture](docs/ARCHITECTURE.md).

## Compatibility

The release is deliberately targeted to the deployed Community Build `26.6.0.123539` and Plugin API `13.7.0.4381`. Java uses only the public `Plugin`, `PageDefinition`, and `Page` contracts. It does not claim universal compatibility with other SonarQube/Plugin API major versions.

The v2.0.1 candidate is verified by the automated Model v3, persona, cross-format, browser-renderer and packaging suites. The Model v3 project/global routes and static bundles have passed target-server smoke and byte-integrity checks; authenticated current-user inventory, trend collection, portfolio limits and negative permissions still require exact-v2.0.1 target-server qualification. Desktop Word/Excel/LibreOffice checks also remain open. See [Compatibility and acceptance](docs/COMPATIBILITY.md) and the [deployment validation record](docs/DEPLOYMENT-VALIDATION-2026-08-22.md).

## Build

Requirements: Node.js 18+ for the dependency-free build/unit suite, Node.js 20.10+ for the mandatory real-browser regression (`--experimental-websocket`), and JDK 17 or newer. CI and the clean-tag release gate use Node 20. The checked-in Maven Wrapper downloads and verifies Maven 3.9.16.

```bash
npm ci
npm run build
npm run check
npm test
./mvnw clean verify
npm run test:browser
npm run benchmark
```

On Windows, use `mvnw.cmd clean verify` for the Maven step.

The release artifact is:

```text
target/sonar-offline-report-plugin-2.0.1.jar
```

The build derives the browser-visible plugin version from `pom.xml`, verifies the matching package version, fails when the committed static bundle is stale, and emits a CycloneDX JSON SBOM beside the JAR. The wrapper pins the Maven distribution and verifies its SHA-256 before execution.

## Installing the plugin

This is a third-party plugin and is not installed from the SonarQube Marketplace. A SonarQube administrator must acknowledge the third-party-plugin risk when prompted. The same installation rules apply to a new install, an upgrade, and a reinstall:

1. Confirm the SonarQube version is supported. Version `2.0.1` targets Community Build `26.6.0.123539` and Plugin API `13.7.0.4381`; do not assume compatibility with another Plugin API major version.
2. Download the JAR, its `.sha256` file, provenance manifest and CycloneDX SBOM assets from the [v2.0.1 release](https://github.com/architonixlabs/sonar-offline-report-plugin/releases/tag/v2.0.1).
3. Verify the checksum before copying the JAR to a server.
4. Back up and remove every older `sonar-offline-report-plugin-*.jar`. Only one JAR with the `offlinereport` plugin key may be present.
5. Put the JAR in `<sonarqubeHome>/extensions/plugins`, or in the persistent Docker volume mounted at `/opt/sonarqube/extensions`.
6. Restart SonarQube; a browser refresh alone does not load a plugin JAR.
7. Verify server health, the installed plugin version, and the project page.

For a current ZIP installation, first confirm the supported Java version in the SonarQube host requirements. Current Community Build documentation requires Java 21 or 25, but the requirement can change with the SonarQube release. Docker images already contain the required Java runtime.

### Download and verify the release

Linux:

```bash
PLUGIN_VERSION=2.0.1
RELEASE_URL="https://github.com/architonixlabs/sonar-offline-report-plugin/releases/download/v${PLUGIN_VERSION}"

curl -fLO "${RELEASE_URL}/sonar-offline-report-plugin-${PLUGIN_VERSION}.jar"
curl -fLO "${RELEASE_URL}/sonar-offline-report-plugin-${PLUGIN_VERSION}.jar.sha256"
curl -fLO "${RELEASE_URL}/sonar-offline-report-plugin-${PLUGIN_VERSION}.cdx.json"
curl -fLO "${RELEASE_URL}/sonar-offline-report-plugin-${PLUGIN_VERSION}.cdx.json.sha256"
sha256sum -c "sonar-offline-report-plugin-${PLUGIN_VERSION}.jar.sha256"
sha256sum -c "sonar-offline-report-plugin-${PLUGIN_VERSION}.cdx.json.sha256"
```

macOS uses `shasum` instead of `sha256sum`:

```bash
shasum -a 256 -c sonar-offline-report-plugin-2.0.1.jar.sha256
```

Windows PowerShell:

```powershell
$Version = "2.0.1"
$ReleaseUrl = "https://github.com/architonixlabs/sonar-offline-report-plugin/releases/download/v$Version"
$Jar = "sonar-offline-report-plugin-$Version.jar"
$Checksum = "$Jar.sha256"
$Sbom = "sonar-offline-report-plugin-$Version.cdx.json"
$SbomChecksum = "$Sbom.sha256"

Invoke-WebRequest "$ReleaseUrl/$Jar" -OutFile $Jar
Invoke-WebRequest "$ReleaseUrl/$Checksum" -OutFile $Checksum
Invoke-WebRequest "$ReleaseUrl/$Sbom" -OutFile $Sbom
Invoke-WebRequest "$ReleaseUrl/$SbomChecksum" -OutFile $SbomChecksum

$Expected = ((Get-Content -Raw $Checksum).Trim() -split "\s+")[0].ToUpperInvariant()
$Actual = (Get-FileHash $Jar -Algorithm SHA256).Hash
if ($Actual -ne $Expected) { throw "Plugin checksum verification failed" }
$ExpectedSbom = ((Get-Content -Raw $SbomChecksum).Trim() -split "\s+")[0].ToUpperInvariant()
$ActualSbom = (Get-FileHash $Sbom -Algorithm SHA256).Hash
if ($ActualSbom -ne $ExpectedSbom) { throw "SBOM checksum verification failed" }
Write-Host "JAR checksum verified: $Actual"
Write-Host "SBOM checksum verified: $ActualSbom"
```

### Linux server — ZIP or native installation

Use this procedure when SonarQube was extracted directly on a Linux server. SonarQube must run as a dedicated non-root account. The examples assume:

- SonarQube home: `/opt/sonarqube`
- Service account: `sonarqube`
- systemd service: `sonarqube.service`

Adjust those values for the server before running the commands.

```bash
export SONARQUBE_HOME=/opt/sonarqube
export PLUGIN_JAR="$PWD/sonar-offline-report-plugin-2.0.1.jar"
export PLUGIN_DIR="$SONARQUBE_HOME/extensions/plugins"
export PLUGIN_BACKUP="/var/backups/sonarqube-plugins/$(date -u +%Y%m%d-%H%M%S)"

# Confirm the source file and destination before stopping the service.
test -f "$PLUGIN_JAR"
sudo test -d "$PLUGIN_DIR"
sudo find "$PLUGIN_DIR" -maxdepth 1 -type f \
  -name 'sonar-offline-report-plugin-*.jar' -print

# Stop SonarQube gracefully and create a recoverable backup.
sudo systemctl stop sonarqube.service
sudo install -d -m 0750 "$PLUGIN_BACKUP"
sudo find "$PLUGIN_DIR" -maxdepth 1 -type f \
  -name 'sonar-offline-report-plugin-*.jar' \
  -exec cp -p -- '{}' "$PLUGIN_BACKUP/" \;

# Remove only this plugin's older JARs, then install the verified release.
sudo find "$PLUGIN_DIR" -maxdepth 1 -type f \
  -name 'sonar-offline-report-plugin-*.jar' -delete
sudo install -o sonarqube -g sonarqube -m 0644 \
  "$PLUGIN_JAR" "$PLUGIN_DIR/sonar-offline-report-plugin-2.0.1.jar"

sudo systemctl start sonarqube.service
sudo systemctl status sonarqube.service --no-pager
sudo journalctl -u sonarqube.service -n 200 --no-pager
```

If the instance is started from the ZIP scripts instead of systemd, run the scripts as the SonarQube account:

```bash
sudo -u sonarqube "$SONARQUBE_HOME/bin/linux-x86-64/sonar.sh" stop
# Perform the backup/removal/install steps above.
sudo -u sonarqube "$SONARQUBE_HOME/bin/linux-x86-64/sonar.sh" start
tail -n 200 "$SONARQUBE_HOME/logs/sonar.log"
```

Do not run SonarQube itself as `root`. If the service has a different name, discover it first rather than creating a second service definition.

### Linux Docker container

The extensions directory must be persistent. The official Docker guidance recommends a named volume mounted at `/opt/sonarqube/extensions`; a plugin copied only into a container's writable layer is lost when that container is replaced.

Assuming the container is named `sonarqube`:

```bash
CONTAINER=sonarqube
PLUGIN_JAR="$PWD/sonar-offline-report-plugin-2.0.1.jar"
BACKUP_DIR="$PWD/sonarqube-plugin-backup-$(date -u +%Y%m%d-%H%M%S)"

# Confirm the container and persistent extensions mount.
docker inspect "$CONTAINER" --format '{{range .Mounts}}{{println .Destination "->" .Name}}{{end}}'
docker exec "$CONTAINER" sh -c \
  'ls -l "$SONARQUBE_HOME"/extensions/plugins/sonar-offline-report-plugin-*.jar 2>/dev/null || true'

# Copy existing versions out of the container before replacing them.
mkdir -p "$BACKUP_DIR"
for old in $(docker exec "$CONTAINER" sh -c \
  'find "$SONARQUBE_HOME"/extensions/plugins -maxdepth 1 -type f -name "sonar-offline-report-plugin-*.jar" -exec basename "{}" ";"'); do
  docker cp "$CONTAINER:/opt/sonarqube/extensions/plugins/$old" "$BACKUP_DIR/$old"
done

# Remove only older versions of this plugin and copy the verified JAR.
docker exec "$CONTAINER" sh -c \
  'rm -f "$SONARQUBE_HOME"/extensions/plugins/sonar-offline-report-plugin-*.jar'
docker cp "$PLUGIN_JAR" \
  "$CONTAINER:/opt/sonarqube/extensions/plugins/sonar-offline-report-plugin-2.0.1.jar"

docker restart "$CONTAINER"
docker logs --tail 200 "$CONTAINER"
```

The mount inspection must include a line similar to:

```text
/opt/sonarqube/extensions -> sonarqube_extensions
```

If it does not, fix persistence before installing. A standard Docker Compose volume fragment is:

```yaml
services:
  sonarqube:
    # Keep the existing pinned image, database environment and network settings.
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs

volumes:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
```

Do not use `docker compose down -v` during normal maintenance because `-v` removes named volumes. Do not use the embedded H2 database for a production instance.

### Docker Compose installation

If the Compose service is named `sonarqube`, the equivalent workflow is:

```bash
docker compose ps sonarqube
docker compose exec -T sonarqube sh -c \
  'ls -l "$SONARQUBE_HOME"/extensions/plugins/sonar-offline-report-plugin-*.jar 2>/dev/null || true'

# Back up every installed version before removal.
CONTAINER_ID="$(docker compose ps -q sonarqube)"
BACKUP_DIR="$PWD/sonarqube-plugin-backup-$(date -u +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
for old in $(docker compose exec -T sonarqube sh -c \
  'find "$SONARQUBE_HOME"/extensions/plugins -maxdepth 1 -type f -name "sonar-offline-report-plugin-*.jar" -exec basename "{}" ";"'); do
  docker cp "$CONTAINER_ID:/opt/sonarqube/extensions/plugins/$old" "$BACKUP_DIR/$old"
done

docker compose exec -T sonarqube sh -c \
  'rm -f "$SONARQUBE_HOME"/extensions/plugins/sonar-offline-report-plugin-*.jar'
docker compose cp sonar-offline-report-plugin-2.0.1.jar \
  sonarqube:/opt/sonarqube/extensions/plugins/sonar-offline-report-plugin-2.0.1.jar

docker compose restart sonarqube
docker compose logs --tail 200 sonarqube
```

For an image-based immutable deployment, build a small derived image containing the JAR, while still keeping the complete extensions directory persistent only if that matches the deployment's established lifecycle. Never bake credentials or `sonar.properties` secrets into the image.

### Windows server — ZIP installation or Windows service

The supported Windows distribution is x64. Run the following in an elevated PowerShell session after downloading and verifying the JAR. Adjust `C:\sonarqube` if the installation uses another directory.

```powershell
$SonarHome = "C:\sonarqube"
$PluginDir = Join-Path $SonarHome "extensions\plugins"
$Jar = (Resolve-Path ".\sonar-offline-report-plugin-2.0.1.jar").Path
$BackupDir = Join-Path "C:\sonarqube-backups\plugins" (Get-Date -Format "yyyyMMdd-HHmmss")
$ServiceScript = Join-Path $SonarHome "bin\windows-x86-64\SonarService.bat"

if (-not (Test-Path $PluginDir -PathType Container)) { throw "Plugin directory not found: $PluginDir" }

# Review installed versions, then stop the Windows service gracefully.
$Existing = Get-ChildItem -LiteralPath $PluginDir -Filter "sonar-offline-report-plugin-*.jar" -File
$Existing | Select-Object FullName, Length, LastWriteTime
& $ServiceScript stop

# Back up only this plugin, remove its older JARs, and install the new release.
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$Existing | Copy-Item -Destination $BackupDir
$Existing | Remove-Item -Force
Copy-Item -LiteralPath $Jar -Destination (Join-Path $PluginDir "sonar-offline-report-plugin-2.0.1.jar")

& $ServiceScript start
& $ServiceScript status
Get-Content (Join-Path $SonarHome "logs\sonar.log") -Tail 200
```

If SonarQube runs interactively through `StartSonar.bat`, stop that console process gracefully, install the JAR using the same backup/copy steps, and start it again with:

```powershell
& "C:\sonarqube\bin\windows-x86-64\StartSonar.bat"
```

Do not attempt to copy or replace the plugin while an upgrade script or another administrator is modifying the same installation.

### macOS server — ZIP installation

SonarQube supports macOS x64 and Apple Silicon. For a native ZIP installation, adjust `SONARQUBE_HOME`, then use the universal macOS script:

```bash
export SONARQUBE_HOME=/opt/sonarqube
export PLUGIN_DIR="$SONARQUBE_HOME/extensions/plugins"
export BACKUP_DIR="$HOME/sonarqube-plugin-backup-$(date -u +%Y%m%d-%H%M%S)"

"$SONARQUBE_HOME/bin/macosx-universal-64/sonar.sh" stop
mkdir -p "$BACKUP_DIR"
find "$PLUGIN_DIR" -maxdepth 1 -type f \
  -name 'sonar-offline-report-plugin-*.jar' \
  -exec cp -p '{}' "$BACKUP_DIR/" \;
find "$PLUGIN_DIR" -maxdepth 1 -type f \
  -name 'sonar-offline-report-plugin-*.jar' -delete
install -m 0644 sonar-offline-report-plugin-2.0.1.jar "$PLUGIN_DIR/"
"$SONARQUBE_HOME/bin/macosx-universal-64/sonar.sh" start
tail -n 200 "$SONARQUBE_HOME/logs/sonar.log"
```

Docker Desktop is usually simpler for a workstation evaluation. Use the Docker procedure and a named `sonarqube_extensions` volume; do not treat an ephemeral container as a durable installation.

### Other operating systems and Kubernetes

Current SonarQube Community Build host documentation supports Linux x64/AArch64, Windows x64, and macOS x64/AArch64. For another host operating system, run a supported Linux Docker or Kubernetes environment rather than trying to execute an unsupported ZIP distribution.

For the official SonarQube Helm chart, declare the release JAR URL under `plugins.install` and apply it with `helm upgrade`. Pin both the chart and SonarQube versions, review the chart's plugin-download security behavior, and make the same change to every environment through version-controlled values. Consult the official plugin-installation page before using this mechanism because Helm values and chart behavior can change.

### Verify the installation on every platform

Wait until the server reports `UP`:

```bash
SONAR_URL="https://sonarqube.example.com"
curl -fsS "$SONAR_URL/api/system/status"
curl -fsS "$SONAR_URL/api/server/version"
```

Then verify all of the following:

1. Log in as a SonarQube administrator and acknowledge the third-party-plugin warning if prompted.
2. Open **Administration → Marketplace** and confirm `Offline Report` version `2.0.1` appears in the installed plugins.
3. Open a project and select **Extensions → Offline Report**.
4. Create a small HTML report and confirm the download opens with networking disabled.
5. Review `logs/sonar.log`, `logs/web.log`, and the container/service logs for plugin-loading or linkage errors.
6. Press `Ctrl+F5` once if the browser still shows the previous UI; SonarQube caches plugin static assets for several minutes.

If the page is absent, confirm that the user has Browse permission on the project, that exactly one plugin JAR exists, and that the server completed a full restart.

### Upgrade, rollback, and uninstall

To upgrade, repeat the platform-specific procedure: verify the new checksum, stop or prepare the instance for restart, back up the current JAR, remove every older `sonar-offline-report-plugin-*.jar`, install the new one, and restart.

To roll back:

1. Stop SonarQube or prepare the Docker container for restart.
2. Remove the failed plugin JAR only.
3. Restore the previously backed-up JAR into the same `extensions/plugins` directory or persistent extensions volume.
4. Ensure only one version remains.
5. Restart and repeat the health, log, and project-page checks.

To uninstall, remove all `sonar-offline-report-plugin-*.jar` files from the plugin directory and restart SonarQube. Browser-saved presentation templates can be removed separately with **Delete saved template**; they never contain collected report data.

Official references:

- [Installing a plugin](https://docs.sonarsource.com/sonarqube-community-build/server-installation/plugins/install-a-plugin)
- [Preparing a Docker installation and persistent volumes](https://docs.sonarsource.com/sonarqube-community-build/server-installation/from-docker-image/prepare-installation)
- [Starting a Docker container](https://docs.sonarsource.com/sonarqube-community-build/server-installation/from-docker-image/set-up-and-start-container)
- [Starting and stopping a ZIP installation](https://docs.sonarsource.com/sonarqube-community-build/server-installation/from-zip-file/starting-stopping-server/from-zip-file)
- [Running SonarQube as a service](https://docs.sonarsource.com/sonarqube-community-build/server-installation/from-zip-file/starting-stopping-server/running-as-a-service)
- [Server host requirements](https://docs.sonarsource.com/sonarqube-community-build/server-installation/server-host-requirements)

## Supported scope and limitations

- Single-project reports support the selected project branch/pull-request context. The global portfolio page supports 1–50 visible projects, deliberately uses main branches only, and records every complete/partial/denied project outcome.
- Up to the public API's 10,000-result issue window. Breaches, changed totals, duplicates, or analysis changes are recorded as partial rather than silently treated as complete.
- Cancellation aborts the primary same-origin `fetch` transport. On hosts that require the legacy `SonarRequest` fallback it rejects locally and ignores late results, but cannot claim wire-level abort.
- Personal template storage is origin-wide browser `localStorage`; the UI warns shared-browser users and offers deletion.
- DOCX is intentionally narrow and static, with a bounded issue appendix. No arbitrary Word templates, images, fields, hyperlinks, or active content.
- Browser Print / Save as PDF is not PDF/A, PDF/UA, encrypted, signed, or deterministic.
- Shared organization templates, schedules, portfolios beyond the bounded 50-project browser workflow, durable audit/storage/signing, and deterministic server-side document rendering belong in a separately secured companion service.

## Project documentation

- [Architecture and reviewed decisions](docs/ARCHITECTURE.md)
- [Compatibility and acceptance matrix](docs/COMPATIBILITY.md)
- [Enterprise readiness](docs/ENTERPRISE-READINESS.md)
- [Security policy](SECURITY.md)
- [Third-party notices](docs/THIRD-PARTY-NOTICES.md)
- [Changelog](CHANGELOG.md)

## Release policy

Git tags use `vMAJOR.MINOR.PATCH`. A tag push runs one non-cancelling job per tag, refuses an existing release, requires a clean exact tag/commit reachable from the default branch, removes checkout credentials before build code runs, and revalidates the remote tag immediately before attestation and publication. It stamps verified source and bundle digests, builds the Maven package, finalizes a deterministic CycloneDX UUID v5 identity bound to repository/tag/commit, verifies the packaged frontends, reruns the real-browser persona suite and bounded maximum benchmark, and publishes the JAR, CycloneDX JSON SBOM, provenance manifest, and checksummed validation-evidence archive with GitHub artifact and SBOM attestations. A repository administrator must separately protect `refs/tags/v*` from update and deletion; the workflow detects movement during publication but cannot establish repository governance. Candidate builds are marked as GitHub prereleases until the manual gates in [Enterprise readiness](docs/ENTERPRISE-READINESS.md) are closed.
