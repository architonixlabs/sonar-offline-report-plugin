# Changelog

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and intends to use [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
