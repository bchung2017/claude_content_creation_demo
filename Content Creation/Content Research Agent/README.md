# Social Media Research Agent

A standalone, open-source agent package that turns a social-media topic, post,
thread, account, or conversation into a verified, build-ready research brief.

```text
request
  → local router
  → social-media specialist
  → discovery sweep: X → Digg → Reddit → conditional fallback
    (browser mode opens pages; web-search mode captures snippets)
  → structured evidence + governance records
  → validated RESEARCH.md
```

## One finished specialist, room to expand

This release is intentionally narrow. `social-media` is the only production
specialist. It investigates public conversation, distinguishes firsthand
signals from repetition, follows material claims to stronger sources, records
disagreement and gaps, and produces a validated brief.

The router also recognizes requests that need a report, repository, recording,
product, webpage, or custom specialist. Those routes return
`needs_specialist`; they do not run a weaker general-purpose fallback. The
included `specialists/template/` and `docs/EXTENDING.md` show an LLM how to add
the next specialist while reusing the same evidence and governance core.

## What people receive

```text
Social-Media-Research-Agent/
├── PROMPT.md                 copy/paste first prompt
├── AGENTS.md                 Codex contract
├── CLAUDE.md                 Claude entrypoint
├── bin/                      zero-dependency CLI
├── skills/
│   ├── content-research-router/
│   └── social-media-research/
├── specialists/
│   ├── registry.json
│   └── template/             extension starter
├── corpus/                   captured search snippets with provenance
├── docs/                     setup, discovery modes, storage, learning rules
├── examples/                 a complete validated job as a worked reference
└── src/                      deterministic shared core
```

The active Codex or Claude agent supplies browsing and source judgment. The
Node.js CLI supplies local routing, job scaffolding, append-only session and
decision ledgers, feedback memory, evidence validation, brief generation, and
optional VibeTasks export. It has no npm dependencies, hosted service,
telemetry, credentials, or bundled user data.

## Basic use

This is the first school install. Its ZIP also bootstraps the shared Content
Creation root files around this agent. It declares workspace API 1.0 and
artifact contract 1.0 in `agent.json`. It also
remains usable as a standalone research package.

1. Unzip the folder.
2. Open that folder in Codex or Claude.
3. Open `PROMPT.md`, copy the fenced prompt, replace the topic and goal, and
   send it.
4. Approve required Node.js installation only if Node 20+ is missing.
5. Optionally approve Ollama/Gemma 4 only after the agent explains the model
   download and machine impact. The agent works without it.
6. Review the returned `RESEARCH.md`, sources, gaps, and learning record.

The first prompt performs setup checks, loads approved memory, routes the job,
and enforces all research and consent rules.

## Discovery behavior

Routing is local and happens first. A non-social request stops with a clear
missing-specialist response. For a routed social job, the first external
research action must be real — never model memory:

1. Initialize the local job and governance ledgers.
2. Open a supplied social-media URL.
3. Search X.
4. Search Digg.
5. Search Reddit.
6. Use the fallback provider only if all three produced no useful lead.
7. Open underlying sources and verify material claims.

Two modes satisfy that gate. `doctor` reports which the host offers.

| | browser mode | web-search mode |
| --- | --- | --- |
| First external action | host browser opens pages | host web search |
| Evidence captured | opened pages | result snippets |
| Fallback provider | `google.com` | `open-web` |
| Record with | `browser-log` | `search-log` |
| Can support a `verified` claim | yes | only via an opened source |

Browser mode is the default and the stronger contract. Web-search mode exists
for hosts with no browser, or environments whose network policy blocks page
fetches. In that mode a snippet is discovery-grade: it identifies a source
without proving its contents, so `validate` rejects any `verified` claim whose
sources are all snippets. Downgrade to `corroborated` (two distinct publishers)
or `unverified` instead of restating a snippet as proof.

Host domain filters are a ranking hint, not a guarantee, so `search-log`
rejects a snippet whose URL is not hosted on the site it is filed under. Zero
on-domain results is a real finding, recorded as `no-useful-results`; a
platform that refuses the host is recorded as `blocked`.

If neither a browser nor host web search is available, the agent stops rather
than relying on model memory. An optional local model never replaces either.
See `docs/BROWSER-FIRST.md` and `docs/WEB-SEARCH-FIRST.md`.

## Local corpus

`corpus/` holds captured web-search snippets with their query, platform,
outcome, and retrieval time, so research can be re-run and audited without
repeating live searches. Each sweep file feeds straight into `search-log` via
`--snippets-file`. `corpus/README.md` records what the corpus is and, more
importantly, what it is not.

`examples/xr-guild-social-signal/` is a complete validated job built from it:
27 snippets, zero pages opened, and therefore no verified claim.

## Structured storage

No database installation is required. JSON and append-only NDJSON are the
canonical database; CSV is the human-readable job table.

```text
research/
├── JOBS.csv
├── LEARNING-EVENTS.ndjson
└── <job-slug>-<unique-id>/
    ├── job.json
    ├── request.json
    ├── route.json
    ├── browser.json
    ├── evidence.json
    ├── analysis.json
    ├── sessions.ndjson
    ├── decisions.ndjson
    ├── learnings.ndjson
    ├── assets/manifest.json
    └── RESEARCH.md
```

Each job receives a stable `JOB-*` id. Work periods use `SES-*`, material
choices use `DEC-*`, and user feedback uses `LRN-*`. The shared learning log
lets later jobs load approved preferences without silently rewriting the
agent.

When the user gives feedback, the agent records it and tells them what it
learned. Job-level feedback is applied to the current job. A reusable package
change is implemented only after the user explicitly approves it.

## CLI examples

Node.js 20+ is required. Commands are single-line and portable across
PowerShell, cmd, bash, and zsh.

```text
node bin/content-research-agent.js doctor
node bin/content-research-agent.js profiles
node bin/content-research-agent.js route --topic "What are founders saying about local AI agents?" --goal "Find firsthand adoption signals and verify repeated claims"
node bin/content-research-agent.js init --topic "What are founders saying about local AI agents?" --goal "Find firsthand adoption signals and verify repeated claims"
```

After research, use the exact project path returned by `init`. In browser mode:

```text
node bin/content-research-agent.js browser-log <project-path-returned-by-init> --agent "Codex" --tool "browser tool name" --discovery "x.com" --discovery "digg.com" --discovery "reddit.com" --outcome "useful" --outcome "no-useful-results" --outcome "useful" --query "site:x.com local AI agents" --query "site:digg.com local AI agents" --query "site:reddit.com local AI agents" --opened "https://example.com/source"
```

In web-search mode, capture the results in a JSON array and record them
instead:

```text
node bin/content-research-agent.js search-log <project-path-returned-by-init> --agent "Claude" --tool "host web search" --discovery "x.com" --discovery "digg.com" --discovery "reddit.com" --outcome "useful" --outcome "no-useful-results" --outcome "blocked" --query "site:x.com local AI agents" --query "site:digg.com local AI agents" --query "site:reddit.com local AI agents" --snippets-file snippets.json --notes "reddit.com refuses this host's search user agent"
```

Each snippet needs `site`, `query`, `title`, `url`, and `snippet`; `id` and
`retrieved_at` default. The remaining commands are the same in both modes:

```text
node bin/content-research-agent.js session-log <project-path-returned-by-init> --agent "Codex" --summary "Completed discovery and source verification"
node bin/content-research-agent.js decision-log <project-path-returned-by-init> --agent "Codex" --title "Evidence cutoff" --decision "Use sources published this year" --rationale "The question concerns current adoption"
node bin/content-research-agent.js learning-capture <project-path-returned-by-init> --agent "Codex" --feedback "Prioritize firsthand operator posts" --learning "Rank firsthand operator evidence above reposts" --scope "package"
node bin/content-research-agent.js learning-decide <project-path-returned-by-init> --agent "Codex" --learning-id "LRN-..." --decision "approved"
node bin/content-research-agent.js validate <project-path-returned-by-init>
node bin/content-research-agent.js brief <project-path-returned-by-init>
```

`brief` refuses to create `RESEARCH.md` until discovery, evidence, identity,
and governance checks pass. The generated brief records which mode ran and
grades every source as `opened` or `snippet`.

## Optional Gemma 4

`doctor` detects Ollama but never installs it. `docs/LOCAL-MODEL.md` contains
the opt-in process. The assistant must explain model size and machine impact,
then request explicit approval before an install or download. A declined or
failed setup does not affect the normal Codex/Claude workflow.

The same doctor detects a real Chrome or supported Chromium executable and
reports which discovery modes are available. For a nonstandard install, set
`CONTENT_CREATION_CHROME` to the executable path. When a browser is present it
still asks the user to confirm browser control and X, Reddit, and Digg sign-in;
when none is found it reports that research will run in web-search mode.

## VibeTasks handoff

VibeTasks is optional. Place the complete folder inside a VibeTasks checkout or
keep it standalone; the research package imports no parent code and edits no
parent files. After a brief passes validation:

```text
node bin/content-research-agent.js packet <project-path-returned-by-init>
vibetasks import <project-path-returned-by-init>/VIBETASKS-TASKS.json
```

The import remains an explicit user action.

## Evidence boundaries

- A URL alone is not evidence; record the exact support for every claim.
- Social popularity is a lead, never verification.
- Direct quotations require an exactness marker.
- Time-sensitive claims require an as-of date.
- Interested-party claims remain visibly attributed.
- Unverified or disputed claims cannot be marked publishable.
- Blocking gaps and missing discovery traces stop brief generation.
- Every saved asset records provenance and rights status.

## Development

```text
npm test
npm run check
npm run public-safety
```

By TheVibeFounder
