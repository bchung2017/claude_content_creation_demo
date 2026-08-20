# Artifact contract

The zero-install storage layout is defined in `STORAGE.md`. Every initialized
job uses the same stable `JOB-*` id across its governed artifacts.

## `job.json`

The job identity and current lifecycle state: `active` until validated brief
generation changes it to `completed`.

## `request.json`

The topic, research goal, seed URLs, timestamp, and job id. Do not put fetched
page bodies, credentials, or unrelated personal information here.

## `route.json`

The production `social-media` route, confidence, reasons, maturity, and skill.
Non-social requests never receive a project; the router returns
`needs_specialist` before initialization.

## `browser.json`

The mandatory social browser trace:

- `status` is `completed` and `first_research_action` is `browser`;
- `agent` and `tool` identify the host and browser capability;
- `discovery_sites` is `x.com`, `digg.com`, `reddit.com` in order;
- `searches` begins with the three matching site-targeted queries;
- `discovery_outcomes` contains one aligned status per site;
- `opened_urls` contains every supplied social URL and evidence page opened;
- `google_fallback` is populated only when all three sites are non-useful.

Snippets, popularity, raw HTTP, and model output are not evidence.

## `evidence.json`

The canonical source, claim, date, and gap table. Every claim links to source
ids and records evidence text, verification state, attribution, as-of date, and
publishability. Use `verified` only when opened evidence directly supports the
claim. `corroborated` requires at least two distinct evidence locations and two
explicit publisher identities. Keep company-reported, unverified, and disputed
boundaries visible.

## `analysis.json`

The evidence-backed social analysis: scope, platform findings, firsthand
signals, narrative patterns, disagreements, verification sources, coverage
gaps, structured sample definition, time window, ranking method, stopping rule,
and per-platform unique-author and qualifying-post counts. It may not add
unsupported claims.

## Governance ledgers

- `sessions.ndjson`: append-only `SES-*` work-period events.
- `decisions.ndjson`: append-only `DEC-*` material choices and rationales.
- `learnings.ndjson`: job-local `LRN-*` feedback and consent events.
- `research/JOBS.csv`: append-only created/completed job table.
- `research/LEARNING-EVENTS.ndjson`: shared cross-job learning memory.

Captured learning begins pending. Job-scoped feedback can guide the current
job. Reusable package changes require an appended `approved` decision; silence
is not approval.

## `assets/manifest.json`

Every saved file records id, kind, source id, rights status, intended usage,
local path, and notes. Provenance does not grant publication rights.

## Generated outputs

`RESEARCH.md` is created only after validation and is a build-ready projection
of the evidence, analysis, and governance records. `VIBETASKS-TASKS.json` is an
optional export-only task bundle.
