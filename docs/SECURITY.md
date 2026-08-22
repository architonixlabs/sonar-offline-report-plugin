# Security model

## Trust boundaries

SonarQube remains the authorization authority. The plugin makes allowlisted, context-path-aware, same-origin Web API requests with the active browser session. It never accepts a server URL/token, uses an administrator or service credential, accesses the database, or generates files on the server.

Once downloaded, a report is outside SonarQube's access controls. The UI states this before collection. Source code is excluded; author and assignee identifiers require an explicit opt-in.

## Threats and mitigations

| Threat | Mitigation |
|---|---|
| Permission bypass/data leakage | Current-user session only; fixed public API paths; no backend proxy/cache/token |
| Cross-project enumeration | Global inventory comes from Browse-filtered `/api/components/search`; no admin inventory action, guessed key, URL manipulation, token, or privilege escalation |
| SSRF/path traversal | Exact endpoint allowlist; no URL/template asset imports or filesystem paths |
| Issue/template XSS | Declarative schema, bounded text, strict accessible accent colors, escaped JSON/XML/HTML, `textContent` rendering |
| Offline report exfiltration | No remote assets, `default-src 'none'`, `connect-src 'none'`, hashed script |
| Spreadsheet formula injection | XLSX inline-string cells only; CSV prefixes dangerous leading characters |
| Macros/external workbook links | Writer emits no formula, macro, hyperlink, or external relationship parts |
| Resource exhaustion | Maximum 50 unique portfolio projects, one-to-four workers, 10,000 issue/component bounds per project, 25,000 issues and 50,000 components per portfolio artifact, stable paging, cancellation, timeout and bounded retries |
| Silent partial report | Separate collection/artifact completeness, API expected/collected/exported counts, persona-required datasets, manifest/provenance and explicit warnings in every format including CSV |
| Shared browser template leakage | Presentation-only storage, visible warning, explicit delete action, 64 KiB limit |

## Security tests

The JavaScript tests include closing-script/image-handler payloads, CSS URL input, future template versions, oversized templates, metadata/localhost-style URL attempts, CSV formulas with leading control/whitespace, XLSX active-content inspection, global-inventory allowlisting, mixed permission outcomes, bounded concurrency, trend divide-by-zero and six-format portfolio reconciliation. Workbook bytes are checked for formula elements, macros, hyperlinks, and external links.

## Operational checks still required

- Validate Browse/no-Browse/private-project behavior on the real server.
- Validate that the global page lists no project the user cannot Browse and that mid-collection revocation remains an explicit denied/partial entry.
- Intercept all requests while opening a downloaded report under `file://` in Chromium and Firefox.
- Check browser console CSP violations.
- Open XLSX with Excel and LibreOffice.
- Review SonarQube deprecation logs after every upgrade.
- Treat generated HTML/XLSX/CSV as sensitive artifacts in retention, email, and ticketing systems.

Cancellation aborts an already-running request when the primary same-origin `fetch` transport is available. With the legacy `SonarRequest.getJSON` fallback it still prevents additional work, rejects promptly and ignores late results, but does not claim wire-level cancellation. Portfolio mode collects main branches only; project mode retains branch/pull-request scope.

## Reporting a problem

Do not attach a generated report to a public issue. Provide the plugin version, SonarQube version, browser version, sanitized reproduction steps, and server/browser logs with project data removed.
