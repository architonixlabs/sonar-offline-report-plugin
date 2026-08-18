# Changelog

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and intends to use [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
