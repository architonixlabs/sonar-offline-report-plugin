# Security model

## Trust boundaries

SonarQube remains the authorization authority. The plugin makes public, relative Web API requests with the active browser session. It never accepts a server URL/token, uses an administrator or service credential, accesses the database, or generates files on the server.

Once downloaded, a report is outside SonarQube's access controls. The UI states this before collection. Source code is excluded; author and assignee identifiers require an explicit opt-in.

## Threats and mitigations

| Threat | Mitigation |
|---|---|
| Permission bypass/data leakage | Current-user session only; fixed public API paths; no backend proxy/cache/token |
| SSRF/path traversal | Exact endpoint allowlist; no URL/template asset imports or filesystem paths |
| Issue/template XSS | Declarative schema, bounded text, strict hex color, escaped JSON/XML/HTML, `textContent` rendering |
| Offline report exfiltration | No remote assets, `default-src 'none'`, `connect-src 'none'`, hashed script |
| Spreadsheet formula injection | XLSX inline-string cells only; CSV prefixes dangerous leading characters |
| Macros/external workbook links | Writer emits no formula, macro, hyperlink, or external relationship parts |
| Resource exhaustion | 10,000 issue/component bounds, stable paging, cooperative cancel, bounded retries |
| Silent partial report | API expected/exported counts, `complete` flag, Metadata and Warnings sheets/section |
| Shared browser template leakage | Presentation-only storage, visible warning, explicit delete action, 64 KiB limit |

## Security tests

The JavaScript tests include closing-script/image-handler payloads, CSS URL input, future template versions, oversized templates, metadata/localhost-style URL attempts, CSV formulas with leading control/whitespace, and XLSX active-content inspection. Workbook bytes are checked for formula elements, macros, hyperlinks, and external links.

## Operational checks still required

- Validate Browse/no-Browse/private-project behavior on the real server.
- Intercept all requests while opening a downloaded report under `file://` in Chromium and Firefox.
- Check browser console CSP violations.
- Open XLSX with Excel and LibreOffice.
- Review SonarQube deprecation logs after every upgrade.
- Treat generated HTML/XLSX/CSV as sensitive artifacts in retention, email, and ticketing systems.

## Reporting a problem

Do not attach a generated report to a public issue. Provide the plugin version, SonarQube version, browser version, sanitized reproduction steps, and server/browser logs with project data removed.
