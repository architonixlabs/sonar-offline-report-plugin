# Third-party notices

This file records direct dependencies declared by the project as of the 1.2.0
enterprise-candidate work. It is not a substitute for the machine-generated,
transitive SBOM and license review required for an enterprise release.

## Runtime/API dependency

| Component | Version | Use/distribution | Declared license | Project |
|---|---:|---|---|---|
| Sonar Plugin API | 13.7.0.4381 | Compile-time API with Maven `provided` scope; supplied by SonarQube rather than bundled intentionally | GNU Lesser General Public License v3.0 | https://github.com/SonarSource/sonar-plugin-api |

## Test-only dependencies

| Component | Version | Use/distribution | Declared license | Project |
|---|---:|---|---|---|
| JUnit 4 | 4.13.2 | Java tests; not intended for the plugin JAR | Eclipse Public License 1.0 | https://github.com/junit-team/junit4 |
| AssertJ Core | 3.25.3 | Java tests; not intended for the plugin JAR | Apache License 2.0 | https://assertj.github.io/ |

The browser exporter currently declares no npm runtime or development
dependencies. Node.js is used as a build/test tool and is not bundled in the
plugin JAR.

## Release obligations

Before promotion to enterprise GA, the release owner must:

1. Generate an SBOM from a clean build for the exact source revision and include
   all Maven plugins and transitive dependencies relevant to the shipped JAR.
2. Confirm by archive inspection which third-party classes or resources, if any,
   are actually bundled.
3. Run vulnerability and license-policy review and resolve or approve every
   finding through the organizational process.
4. Include this project's LICENSE and NOTICE, plus all third-party license and
   notice texts required by the resulting distribution inventory, in the source
   and release artifact.
5. Retain the SBOM, scan output, approvals, artifact digest, and signature with
   the release record.

Product and company names are the property of their respective owners. Their
appearance here identifies interoperability or development dependencies and
does not imply endorsement.
