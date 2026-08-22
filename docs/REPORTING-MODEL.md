# Reporting Model v3

This document is the authoritative definition of numbers emitted by the plugin. Report Model v3 is additive to the single-project snapshot and introduces a portfolio envelope. Source values are retained; normalized and derived fields are explicitly separated by path and documented below.

## Model layers

| Layer | Main paths | Meaning |
|---|---|---|
| Source | `qualityGate`, `measures`, raw fields within `issues`, `rules`, `components`, `analyses`, trend observations | Values returned by SonarQube public Web APIs, apart from safe string copying and privacy removal |
| Normalized | `issues[].normalizedLifecycle`, `softwareQualities`, `impactSeverities`, `language`; canonical project identity | Deterministic representation for cross-version consistency; unknown inputs stay unknown |
| Derived | `derived`, `portfolioSummary`, `aggregateIssueSummary`, `aggregateRiskConcentrations`, `aggregateMetrics` | Plugin calculations using Formula Version 1 |
| Evidence | `datasetStates`, paging objects, `collectionEvidence`, `warnings`, `complete` | Requested scope, actual records, limits, termination and reconciliation |

JSON is the fullest representation. It wraps the report with `manifest`, while the report retains source, normalized, derived and evidence paths. The machine-readable envelope contract is [Report Model v3 JSON Schema](report-model-v3.schema.json).

## Identity and timestamps

- `reportId` is generated once per collected single-project or portfolio snapshot and is reused by every output from that snapshot.
- `collectionStartedAt`, `collectionCompletedAt` and `collectedAt` are ISO-8601 UTC collection facts. `collectedAt` is the frozen reference time for age/freshness calculations.
- `exportedAt` is the ISO-8601 UTC creation time of one artifact. For backward compatibility, an artifact report's top-level `generatedAt` aliases `exportedAt`; the immutable collected snapshot's `generatedAt` aliases `collectedAt`.
- `collectionComplete` describes API collection and reconciliation. `artifactComplete` separately describes whether the chosen format/scope represents every persona-required dataset. Neither can turn a partial collection into a complete artifact.
- A portfolio has its own ID. Each successful project entry retains its independent collection evidence and source report identity.
- Portfolio collection is non-transactional. A before/after analysis identity check is recorded per project; a missing or changed identity makes that project incomplete.

## Project inventory and state

`portfolioSummary` counts every unique selected key exactly once:

- `projectsSelected`: unique valid requested keys;
- `projectsAttempted`: selected entries not explicitly skipped;
- `projectsAnalysed`: entries that produced a Model v3 project report;
- `projectsComplete`, `projectsPartial`, `projectsFailed`, `projectsPermissionDenied`, `projectsSkipped`: mutually exclusive collection outcomes.

A portfolio is `complete` only when at least one project was selected and every selected project is complete. Permission-denied, failed, skipped or partial projects are never interpreted as healthy and are never silently omitted. Portfolio mode collects main branches only; single-project mode retains its branch or pull-request context.

## Issue lifecycle

The source `issueStatus` is preferred over legacy `status`. The source resolution is retained. Normalization is:

| Normalized lifecycle | Recognized source values |
|---|---|
| Actionable | `OPEN`, `CONFIRMED`, `REOPENED`, `TO_REVIEW`, `IN_REVIEW` |
| Accepted | `ACCEPTED` |
| Closed | `FIXED`, `FALSE_POSITIVE`, `WONTFIX`, `CLOSED`, `RESOLVED`, `REMOVED`, or a known closing resolution |
| Unknown | Missing or unrecognized future value |

Unknown is not actionable and is not pass. Reports expose both `Raw SonarQube Status` and `Normalized Lifecycle`.

The invariant is:

```text
Actionable + Accepted + Closed + Unknown = Total collected unique issues
```

`derived.reconciliation.lifecycleReconciles` and portfolio `aggregateIssueSummary.reconciles` record the assertion.

## Issue dimensions

- Modern `impacts` are normalized independently into Software Quality (`Security`, `Reliability`, `Maintainability`, `Unknown`) and impact severity.
- Legacy type and severity remain present. If modern impacts are absent, legacy Vulnerability/Bug/Code Smell supplies a conservative quality classification; missing/unrecognized values remain `Unknown`.
- Security Hotspots are measures, not Vulnerability issue rows, and are never merged into issue totals.
- Language is joined from the collected component inventory. No reliable join means unavailable, not a guessed language.
- Tags and Clean Code attribute are source-backed.
- Assignee and author are copied only when people collection is explicitly selected.

### Issue age

```text
ageDays = floor(max(0, collectedAt - creationDate) / 86,400,000 ms)
```

Invalid or missing dates produce Unknown age. Buckets are inclusive: 0–7, 8–30, 31–90, 91–180, 181–365, greater than 365, and Unknown.

### Effort

Recognized source effort forms are `Nmin`, `Nh`, and `Nd`.

```text
minutes = N                  for min
minutes = N × 60             for h
minutes = N × 480            for d
```

One working day is an explicit reporting convention of eight hours. Unparseable effort remains unknown. Known effort is summed; unknown effort is counted separately and never treated as a known zero.

## Project status model

The project status model keeps Quality Gate, Security, Reliability, Maintainability, Coverage, Duplication, Technical Debt, Security Hotspots, actionable issues, new-code condition availability, analysis age and report completeness independent. Missing values are `null`/unavailable.

Ratings map SonarQube numeric 1–5 to A–E. No rating is synthesized from issue counts.

`unreviewedSecurityHotspots` is a labelled estimate when both source hotspot count and reviewed percentage exist:

```text
round(security_hotspots × (100 - security_hotspots_reviewed) / 100)
```

It is not a source count and is never presented as one.

## Test, new-code and per-file evidence

- Project measures retain source-backed unit-test counts, errors, failures, skipped tests, execution time and success density when SonarQube provides them. Missing measures remain unavailable; the plugin does not infer test execution from coverage.
- New-code coverage retains its source percentage together with new lines/conditions-to-cover and uncovered denominators. A percentage without its denominator is displayed as limited evidence, not as equivalent to a fully explained ratio.
- When Components is selected, each file entry can retain bounded source measures for coverage, line/branch coverage, coverage denominators, duplication, NCLOC, cyclomatic complexity and cognitive complexity. Source contents are never collected.
- QA / Data Audit and engineering personas declare these evidence requirements in their template contract. A format that cannot represent a required selected dataset is artifact-incomplete unless that omission is explicitly declared as excluded scope.

## Quality Gate reasons

Only SonarQube-returned conditions with `ERROR` or `WARN` status appear under “Why This Project Failed the Quality Gate.” The report retains metric, status, comparator, actual value and threshold. A metric name beginning `new_` is labelled new-code context; otherwise the context remains overall/server-defined.

## Aggregate metrics

Project percentages are never averaged naively.

### Portfolio coverage

Only projects with a usable source numerator and denominator contribute:

```text
covered lines      = lines_to_cover - uncovered_lines
covered conditions = conditions_to_cover - uncovered_conditions

portfolio coverage =
  sum(covered lines + covered conditions)
  / sum(lines_to_cover + conditions_to_cover)
  × 100
```

Lines or conditions contribute independently when their paired source values exist. A non-positive total denominator yields unavailable. The result includes numerator, denominator and number of represented projects.

### Portfolio duplication

```text
portfolio duplication =
  sum(duplicated_lines) / sum(ncloc) × 100
```

Only projects with both source values and positive `ncloc` contribute. Missing denominators yield unavailable rather than zero.

### Portfolio technical debt

```text
portfolio technical debt minutes = sum(available sqale_index minutes)
```

The represented-project count must be read with the result; unavailable projects are not assigned zero debt.

### Issue and concentration aggregates

Issue summaries are sums over analysed projects only. Top projects, rules and components count normalized actionable issue rows. Portfolio rule/component keys include project identity to prevent unrelated projects from being collapsed accidentally.

## Attention ordering

Ranking is optional. It is a deterministic lexicographic comparison, not a weighted, composite or AI health score. Earlier indicators dominate later indicators:

1. failed Quality Gate;
2. worse Security rating;
3. worse Reliability rating;
4. more Blocker/Critical/High impact issues;
5. more derived unreviewed hotspots;
6. more technical debt minutes;
7. lower available coverage;
8. higher duplication;
9. older analysis;
10. incomplete project data;
11. project name for deterministic ties.

The report lists factual reasons that triggered. Disable ranking to return no attention order.

## Historical trends

Trends come only from `/api/measures/search_history`; project analysis events are not metric history. For each metric, the last two usable retained observations define:

```text
absolute change   = current - previous
percentage change = absolute change / abs(previous) × 100
```

Percentage change is unavailable when the previous value is zero. A zero absolute and percentage change is reported only when both values exist and are equal. One usable observation has no previous/change. Missing history says not requested or unavailable, never no change.

The period is the previous observation date through the current observation date. The collector declares the latest 100 observations per metric as the requested scope. It records the server total and `olderAvailable`; older observations outside that declared scope do not make a fully reconciled latest-100 dataset partial.

## Completeness and evidence

Dataset states are:

- `complete`;
- `partial_limit`;
- `partial_error`;
- `permission_denied`;
- `not_available`;
- `not_requested`.

For each requested paged dataset the evidence records expected, raw retrieved, unique, exported, duplicates, pages, limit, termination reason and reconciliation. Expected totals changing during pagination or a mismatched unique count make reconciliation false. Exported cannot exceed collected unique records; collected cannot exceed a stable expected total unless the report explicitly records a changing total.

An excluded dataset is “Not requested,” not zero. A denied/unavailable dataset is not complete. Warnings are carried into HTML, XLSX, DOCX, JSON and print views. CSV begins with a mandatory manifest record and repeats core provenance, dataset state and completeness fields on issue records so the register remains self-describing after row extraction.

## Output scope differences

- Interactive HTML and JSON embed the full collected Model v3 envelope within configured limits. HTML presents persona-prioritized sections without deleting the underlying evidence.
- XLSX contains all collected rows subject to the Office package and cell safeguards, plus Metadata, Data Quality and Warnings evidence.
- CSV contains a manifest record followed by issue records; portfolio issue records include project identity. A zero-issue export still contains its manifest.
- DOCX contains provenance, confidence, gate/measure/trend/QA/component evidence selected by the template. Its optional issue register is refused above 2,000 selected rows rather than silently truncated.
- Print / Save as PDF is browser rendering of a declared print scope. The print manifest records rendered versus collected counts; filtering prints every matching row, not only the current interactive page.

All formats consume the same frozen report object. Profiles declare persona, required datasets and presentation independently. Presentation-only changes do not recollect or alter evidence; a changed data requirement marks the snapshot stale before export.
