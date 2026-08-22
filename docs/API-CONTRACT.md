# Public API contract

The browser collector uses only the fixed paths below. Its primary transport is same-origin credentialed `fetch` resolved against the SonarQube context path; `SonarRequest.getJSON` is a compatibility fallback. It does not accept a base URL or token. The current browser session and SonarQube Browse permissions remain authoritative.

| Path | Purpose | Principal parameters | Failure behavior |
|---|---|---|---|
| `/api/system/status` | Server version/provenance | none | Optional warning; project collection continues |
| `/api/components/search` | Global visible-project inventory | `qualifiers=TRK`, `p`, `ps=500` | Portfolio selection unavailable; no project keys are guessed |
| `/api/measures/component` | Project identity, analysis timestamp and source measures | `component`, fixed `metricKeys`; branch or pull request in single mode | Required; project attempt fails |
| `/api/qualitygates/project_status` | Overall gate and source conditions | `projectKey`; branch or pull request where applicable | Project becomes partial |
| `/api/issues/search` | Issues and narrow rule metadata | `components`, `additionalFields=rules`, stable creation-date sort, `p`, `ps=500`; branch/PR where applicable | Required when selected; project attempt fails |
| `/api/components/tree` | File/component inventory and language join | `component`, `qualifiers=FIL`, `strategy=leaves`, stable path sort, paging; branch/PR | Optional dataset becomes partial/denied |
| `/api/project_analyses/search` | Main-branch analysis event timeline and snapshot identity | `project`, `p`, `ps` | Optional timeline partial; identity failure makes confidence incomplete |
| `/api/measures/search_history` | Historical metric observations | `component`, fixed metric list, `p`, `ps=100`; branch/PR when supported by target API | Optional trend dataset becomes unavailable/partial |

The allowlist rejects absolute URLs, protocol-relative URLs, traversal-like paths and every unlisted action.

## Portfolio behavior

The global page lists only projects returned to the signed-in user by `/api/components/search`. The user selects up to 50 unique keys. Collection uses main-branch scope and a configurable worker pool of one to four projects; the default is three. Each project executes the same single-project collector and retains an independent outcome.

HTTP 401/403 on a required project call is `permission_denied`. Another required failure is `failed`. Optional dataset failures produce a partial project. One project's ordinary failure does not abort the others.

## Paging and limits

- Issues and components use stable 500-row pages, first-seen stable-key deduplication and a configured maximum no greater than 10,000 per project.
- Issue search stops before requesting beyond the 10,000-result API search window.
- Project inventory is capped at 10,000 visible projects, while report selection is capped at 50.
- Analysis events retain at most 100.
- Trend history declares the latest 100 observations per metric as its bounded scope. Older server observations are counted and labelled `olderAvailable`, while a fully reconciled latest-100 scope is complete rather than silently or permanently partial.
- Evidence records the first/last totals, raw/unique/exported counts, duplicates, pages, limit and termination reason.

## Retry and cancellation

HTTP 429 and 503 are retried at most twice with bounded exponential jitter. `Retry-After` seconds or HTTP dates are honored up to 30 seconds. Each local wait/request has abort handling and requests time out locally after 45 seconds.

Cancellation stops new portfolio work and rejects retry waits. It aborts the primary `fetch` request on the wire. When the compatibility helper is used, cancellation rejects locally and ignores late results because that helper exposes no dependable transport-abort handle.

## Upgrade acceptance

These actions and parameters must be capability-tested on the target SonarQube release. Any deprecation or authorization change requires an update to [Compatibility](COMPATIBILITY.md), tests and the allowlist before the support statement changes.
