# Performance boundaries and validation

## Enforced boundaries

| Resource | Boundary |
|---|---|
| Selected portfolio projects | 1–50 unique keys |
| Concurrent projects | 1–4; default 3 |
| Issues per project | 1–10,000 configured; API search-window stop at 10,000 |
| Components per project | 1–10,000 configured |
| Issues per portfolio artifact | 25,000 total; oversized scopes are refused before export |
| Components per portfolio artifact | 50,000 total; oversized scopes are refused before export |
| Analysis events per project | 100 |
| Retained trend observations per metric | latest page, at most 100 |
| DOCX issue register | refused above 2,000 rows |
| XLSX/DOCX package | fixed writer byte budgets |

These are safety ceilings, not a claim that 50 projects each containing every per-project maximum dataset is supported. The default portfolio scope is 500 issues and 1,000 components per project with three workers, which exactly reaches the 25,000/50,000 total preflight boundaries at 50 projects.

## Automated evidence

The Node suite verifies bounded worker concurrency, prompt pre-start cancellation, 50/51 selection behavior, duplicate project elimination, 10,000 issue search-window behavior, retries/timeouts, package budgets and cross-format generation. These tests are deterministic and do not simulate real SonarQube latency or browser rendering cost.

`npm run benchmark` performs a deterministic synthetic Model v3 plus HTML/XLSX/CSV/JSON generation pass. It asserts project/issue reconciliation, non-empty exports, successful below-budget XLSX generation, and the expected fixed-budget XLSX refusal at the maximum scenario. It deliberately does not impose environment-sensitive timing or memory thresholds. On 2026-08-22 with Node 24.19 on the implementation host it produced:

| Scenario (issue/component counts are portfolio totals) | Model ms | Export ms | Sampled heap MiB | RSS after MiB | HTML bytes | XLSX bytes / result | CSV bytes | JSON bytes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 project / 100 issues / 200 components | 14.7 | 52.0 | 10.2 | 60.1 | 179,018 | 508,151 | 85,759 | 143,917 |
| 10 projects / 1,000 issues / 10,000 components | 32.1 | 711.2 | 91.1 | 196.2 | 4,522,817 | 14,183,561 | 1,081,603 | 4,357,735 |
| 25 projects / 10,000 issues / 25,000 components | 224.8 | 3,123.1 | 158.1 | 550.8 | 15,749,253 | 52,757,036 | 15,072,235 | 14,775,434 |
| 50 projects / 25,000 issues / 50,000 components | 849.7 | 7,429.1 | 614.9 | 1,115.5 | 34,461,802 | Refused: estimated 113 MiB exceeds 75 MiB package limit | 55,197,035 | 32,140,171 |

Timing and memory are observations, not service-level guarantees. Heap is sampled between generation stages rather than profiler-grade peak memory. The maximum synthetic envelope completed HTML/CSV/JSON generation; XLSX correctly refused before package construction because its estimated 113 MiB exceeded the fixed 75 MiB limit. The benchmark makes zero API calls and zero retries, so meaningful collection time, server API cost, retry rate, browser peak memory and cancellation latency remain controlled-pilot gates on the intended server and browser. It does not validate 10,000 issues *per project* across 50 projects.

## Pilot benchmark procedure

For each scenario record:

1. exact project/data limits and whether numbers are per project or total;
2. SonarQube/browser/host versions and available memory;
3. request count by endpoint, response status and retries;
4. collection start/completion and cancellation acknowledgement latency;
5. browser peak JavaScript heap where supported;
6. HTML/XLSX/DOCX generation time and output bytes;
7. report completeness, warnings and reconciliation;
8. server response time/error changes against a no-report baseline.

Stop and lower the supported boundary if the browser becomes unresponsive, the server begins throttling persistently, evidence cannot reconcile, or output exceeds the fixed package limits. Do not raise concurrency above four without a separate server-load review.
