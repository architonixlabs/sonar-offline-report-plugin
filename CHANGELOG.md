# Changelog

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and intends to use [Semantic Versioning](https://semver.org/).

## [Unreleased]

## 2.0.1 - 2026-08-22 (enterprise candidate)

### Fixed

- Finalized the Maven-generated CycloneDX document with a deterministic RFC 4122 UUID v5 serial bound to the repository, release tag and source commit before provenance, checksums and attestation are created.
- Added release-time validation for the CycloneDX serial required by GitHub's SBOM attestation contract.
- Preserved the public, unpublished v2.0.0 tag after its release workflow stopped before publication; v2.0.1 is the first publishable Model v3 candidate and contains no report-model compatibility change from v2.0.0.

## 2.0.0 - 2026-08-22 (unpublished tagged enterprise candidate)

No GitHub release or assets were published for this tag. Its workflow passed build, browser, benchmark, provenance, checksum and general-attestation gates, then stopped safely when SBOM-specific attestation required a CycloneDX serial number. It is superseded by v2.0.1.

### Added

- Added a non-admin global Portfolio Reporting page while preserving the existing project-scoped page.
- Added Report Model v3 with independent per-project outcomes, collection evidence, deterministic issue analytics, age/effort dimensions, quality-gate reasons, weighted portfolio coverage/duplication and optional factual attention ordering.
- Added Browse-filtered project inventory, main-branch multi-project collection for up to 50 unique projects, a one-to-four worker pool, actual progress/outcomes and responsive local cancellation.
- Added optional historical metric trends from the public measure-history API, explicitly separate from analysis events.
- Added executive and technical portfolio HTML, thirteen-sheet portfolio XLSX, bounded portfolio DOCX, project-aware CSV and full JSON manifest/model output.
- Added authoritative reporting formulas, API contract, performance boundaries and eight-persona/data-auditor validation documents.
- Added immutable per-artifact provenance (`format`, purpose, mode, issue scope, export time, exported counts and artifact completeness) while retaining collection time, collection completeness and report identity.
- Added same-origin, credentialed Fetch transport with context-path discovery, real transport cancellation and a compatibility fallback for older hosts.
- Added test-execution metrics, new-code coverage denominators and bounded per-file coverage/duplication/complexity measures without collecting source content.
- Added portfolio collect-once/export-many reuse and format-specific preflight budgets of 25,000 issues and 50,000 components in total; Word issue registers remain capped at 2,000 rows.

### Changed

- Advanced the machine-readable report contract from Model v2 to Model v3 and replaced the flat CSV-only contract with a self-contained manifest envelope. This is a deliberate breaking change for automated consumers and is the reason for the 2.0 major version.
- Kept imported report-template schemas 1 and 2 compatible; the major version change applies to generated report artifacts, not saved template migration.

### Fixed

- Fixed branch-scoped reports being marked incomplete when SonarQube omitted `analysisDate` from the repeated measures response; consistency now uses a deterministic before/after measure fingerprint.
- Treated the explicitly selected latest-100 analysis-event scope as complete when all 100 requested events are reconciled, while retaining the server's total as provenance.
- Preserved missing XLSX numeric values as empty instead of coercing them to zero.
- Corrected Model v3 issue-column typing after the developer register expansion.
- Corrected the portfolio DOCX renderer contract found by cross-format reconciliation testing.
- Fixed cancellation being converted into an incomplete report by optional collectors; cancelled work can no longer reach a download operation.
- Separated collection completion timestamps from artifact export timestamps and preserved one report ID when exporting multiple formats from a prepared snapshot.

### Security

- Retained same-origin current-user authorization, the fixed API allowlist, people opt-in, zero-network hashed-CSP HTML, hostile-content escaping, formula neutralization and fixed macro-free/no-external-relationship Office packages.
- Pinned Maven lifecycle plugins and added keyless GitHub artifact attestations, source-revision/digest stamping, provenance manifests and SHA-256 release checksums.
- Hardened clean-tag publication with non-persisted checkout credentials, per-tag non-cancelling concurrency, default-branch ancestry enforcement and remote-tag revalidation immediately before attestation and publication.

### Tests

- Expanded the Node suite with formula, lifecycle, trends, visible-inventory, duplicate project, boundary, transport cancellation, provenance, preflight, bounded concurrency, guided UI/deep-freeze, snapshot completeness, mixed-outcome and six-format reconciliation coverage.
- Added a dependency-free real-Chrome gate for all eight built-in profiles, project and portfolio print-scope/PDF reconciliation, a bounded four-scenario export benchmark, and a checksummed release archive retaining the browser and benchmark evidence.

## 1.3.0 - 2026-08-21 (enterprise candidate)

### Changed

- Added prompt local request cancellation, a 45-second request timeout,
  abortable bounded retry delays, and `Retry-After` parsing when the SonarQube
  request error exposes response headers.
- Added explicit best-effort issue/component sorting and a hard stop before the
  issue API's 10,000-row search-window boundary.
- Excluded unsupported branch/pull-request analysis history and now verifies
  branch snapshot identity through a repeated branch-aware measures request.
- Unified DOCX/print actionable filtering on the normalized issue lifecycle.
- Hardened CSV formula neutralization for full-width initiators and XML output
  for invalid Unicode scalars and surrogate-safe XLSX truncation.
- Added pre-assembly ZIP path, entry-count and package-size checks for DOCX and
  XLSX.
- Added a SHA-256-pinned Maven Wrapper, build-environment enforcement, CycloneDX
  SBOM generation, immutable GitHub Action revisions, and release checks for
  LICENSE/NOTICE/SBOM artifacts.
- Replaced fixed delays in the live browser helper with bounded DOM-state waits
  and corrected its required environment-variable diagnostics.

### Tests

- Added request cancellation/timeout/backoff parsing, 10,000-row boundary,
  stable-sort, branch-scope, Unicode, package-budget, and cross-format lifecycle
  regression coverage.

## 1.2.1 - 2026-08-18 (enterprise candidate)

### Fixed

- Replaced the fragile fixed-delay PDF print trigger with a load-driven print
  view that opens its own browser print dialog.
- Added a visible **Print / Save as PDF** retry control inside the print view.
- Added a downloadable print-ready HTML fallback when the browser blocks the
  popup, so report collection is not lost.
- Clarified PDF status messages and format wording in the plugin page.

### Documentation

- Expanded installation, verification, rollback, and uninstall guidance for
  Linux native/server, Docker, Docker Compose, Windows, macOS, and other
  supported deployment environments.

## 1.2.0 - 2026-08-18 (enterprise candidate)

The 1.2.0 release is a controlled pilot candidate, not an enterprise
general-availability release. Its scope includes:

- a guided collection/export state machine with stale-scope invalidation;
- a resize/zoom-aware page scrollbar and bottom clearance after expanded controls;
- normalized modern issue status, quality-gate, paging, and provenance data;
- a report ID, plugin version, and machine-readable JSON manifest;
- dependency-free, macro-free DOCX generation from fixed escaped OOXML parts;
- honest browser **Print / Save as PDF** behavior with visible export scope;
- typed trusted XLSX values while keeping untrusted content non-formula text;
- expanded enterprise governance, security, compatibility, and test evidence.

Direct PDF generation, server-side report generation, arbitrary DOCX templates,
external OOXML relationships, and remote report assets are explicitly deferred.

Enterprise GA remains blocked by the open gates in
[`docs/ENTERPRISE-READINESS.md`](docs/ENTERPRISE-READINESS.md), including HTTPS,
authorization testing, browser and Office interoperability, OpenXML validation,
large-export testing, rollback, signing, and SBOM approval.

## 1.1.1 - 2026-08-18

### Added

- Human-readable terminology and formatting across HTML, XLSX, and CSV.
- Styled spreadsheet sheets and a more structured offline HTML report.
- Explicit new-code values and active-versus-historical issue presentation.

### Fixed

- Report scrolling and viewport sizing.
- Durable browser download cleanup.
- Cross-page rule merging and output completeness presentation.

### Security

- Retained the exact same-origin API allowlist, declarative bounded templates,
  offline HTML CSP, escaped content, CSV formula neutralization, and XLSX
  active-content exclusions.

### Known limitations

- Permission-matrix, Firefox, desktop Office, large-fixture, and rollback tests
  were not closed for enterprise GA.
- The documented pilot endpoint used plain HTTP and is not an approved
  enterprise deployment pattern.

## 1.1.0 - 2026-08-18

### Added

- Initial offline HTML, XLSX, and CSV export workflow with bounded collection,
  report completeness metadata, presentation templates, and client-side file
  generation.
