# Security policy

## Supported status

Version 1.2.1 is the currently documented deployed candidate. It is intended
for controlled pilot use and is not approved for enterprise general
availability until every mandatory gate in
[`docs/ENTERPRISE-READINESS.md`](docs/ENTERPRISE-READINESS.md) is closed with
recorded evidence.

Security fixes are normally applied to the latest maintained release. No
support period or security service-level agreement is implied unless one is
published with a release.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability and do not attach an
exported report, authentication token, cookie, project identifier, source-code
fragment, user identifier, internal URL, or server log containing sensitive
data.

Use the repository host's private security-advisory channel. If that channel is
not enabled, contact the repository owner through a previously established
private organizational security channel. Include only:

- affected plugin and SonarQube versions;
- impact and required permissions;
- minimal, sanitized reproduction steps;
- whether the behavior reproduces on a non-production project; and
- a safe way to coordinate any sensitive supporting material.

The maintainers should acknowledge receipt, establish a private tracking
record, assess severity and affected versions, and coordinate remediation and
disclosure. No response or remediation deadline is promised by this community
project.

## Operator responsibilities

- Serve SonarQube over authenticated HTTPS. Plain HTTP is not an approved
  enterprise deployment because browser credentials and report data may be
  exposed in transit.
- Grant SonarQube Browse permission using least privilege. The plugin must not
  be treated as an authorization boundary separate from SonarQube.
- Classify, retain, transmit, and dispose of downloaded reports as sensitive
  portable data. A downloaded report is no longer protected by SonarQube's
  access controls.
- Keep author and assignee collection disabled unless the business purpose and
  retention policy permit processing those identifiers.
- Verify the published artifact digest/signature before installation and retain
  the immediately previous tested artifact for rollback.

The implementation threat model and current mitigations are documented in
[`docs/SECURITY.md`](docs/SECURITY.md). Security test results and operational
exceptions belong in release evidence, not in this policy.
