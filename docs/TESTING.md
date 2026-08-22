# Testing strategy

## Mandatory local gate

```bash
npm test
npm run check
npm run test:browser
./mvnw --batch-mode --no-transfer-progress clean verify
npm run benchmark
```

On Windows use `mvnw.cmd`. Node.js 18+ supports the build/unit suite; the mandatory `test:browser` gate requires Node.js 20.10+ because it uses the built-in experimental WebSocket client, and CI uses Node 20. `npm test` rebuilds both page bundles before running Node tests. `npm run check` compares generated content with both committed bundles. `npm run test:browser` finds an installed Chrome/Chromium browser, writes deterministic fixtures under `target/browser-regression`, and validates the actual generated HTML through Chrome DevTools. Maven compiles Java 11 bytecode using JDK 17+, runs page-registration tests, packages both static assets and produces a CycloneDX JSON SBOM. The clean-tag workflow then adds the deterministic repository/tag/revision serial required for GitHub's SBOM attestation before provenance and checksums are generated.

## Automated risk coverage

| Area | Evidence |
|---|---|
| API boundary | Exact relative allowlist; absolute/protocol-relative/traversal-like path rejection |
| Paging | configured limits, 500-row boundaries, duplicates, changing totals, 10,000 issue window, stable sorts |
| Requests | timeout, primary-transport abort, compatibility-fallback cancellation, 429/503 retry and bounded `Retry-After` |
| Portfolio | 0/51 rejection, duplicate keys, inventory paging, 1–4 concurrency, mixed complete/partial/denied, cancellation |
| Analytics | lifecycle invariant, age buckets, effort conversion, impact/quality normalization, gate reasons, weighted formula and null behavior |
| Trends | missing/null history, zero previous value, zero change |
| Cross-format | known Model v3 fixture through HTML/XLSX/DOCX/CSV/JSON/print with shared identity/projects/counts/completeness |
| Security | hostile HTML/XML/formula input, CSP hashes, no network capability, macro/external-link exclusion, ZIP path/size guards |
| UI structure | guided single/portfolio workflow, viewport/reflow/focus-size/live-status patterns, deep snapshot freeze |
| Contract | Draft 2020-12 Model v3 schema, representative single/portfolio envelopes and cross-field invariants |
| Release integrity | exact source/tag/version binding, deterministic CycloneDX UUID v5 identity, idempotence and foreign-serial refusal |
| Real browser | all eight built-in profiles at 1440px and 390px, zero overflow, runtime/CSP/offline checks, 16 deterministic screenshots, project and portfolio active/all print-scope reconciliation, and three deterministic PDF artifacts |

The current implementation run passes 81/81 Node tests. The local Chrome 151 regression passes 224/224 checks across all eight built-in profiles, 16 deterministic screenshots and three deterministic print PDFs; all 19 artifact hashes are independently verified. The Java registration test is 1/1; the clean Maven result is recorded with the exact packaged candidate.

## Browser integration

`scripts/browser-regression.mjs` is dependency-free and launches a local Chrome/Chromium instance itself. On Chrome `151.0.7922.170`, it validated `executive`, `executive-technical`, `technical`, `issues`, `portfolio`, `delivery`, `security`, and `qa-audit` reports at 1440×1000 and 390×844. The generated reports made no external request under offline emulation, the pinned runtime executed under CSP, an unpinned script and external fetch were blocked, and no global horizontal overflow or runtime error occurred. Project printing expanded 100 screen rows to all 127 actionable rows out of 137 collected and restored pagination afterward. Portfolio active/all printing reconciled 56/86 and 86/86 issue scopes and lifecycle counts without embedding the full model. Evidence is written to `target/browser-regression/evidence.json`; ordinary local-run artifacts remain under `target`, while the clean-tag workflow publishes them inside the checksummed validation-evidence archive.

`scripts/live-browser-check.mjs` remains the authenticated opt-in target-server check for the project page. It requires a separately launched browser, target URL, project, credentials and download directory. The synthetic real-browser gate does not replace this live authorization/API/download test.

Before pilot, extend/run live checks for the global page: ordinary-user inventory, project selection, filters, downloads, local storage, popup-blocked fallback, in-progress cancellation, keyboard traversal, 200%/400% zoom and target-host CSP behavior. The local `file://` zero-network, 390px reflow and complete-print-row checks are already automated.

## Manual Office and server gates

- Excel and LibreOffice: open without repair, inspect typed values, hostile cells and relationships.
- Word and LibreOffice: open without repair, inspect optional register scope and relationship/active-content scan.
- SonarQube: private/no-Browse/revoked permission matrix, global page visibility, history capability, 429/503 fault injection and server-load comparison.
- Accessibility: screen reader, forced colors, keyboard-only, narrow viewport and printed document review.

See [Performance](PERFORMANCE.md), [Persona validation](PERSONA-VALIDATION.md), and [Enterprise readiness](ENTERPRISE-READINESS.md).
