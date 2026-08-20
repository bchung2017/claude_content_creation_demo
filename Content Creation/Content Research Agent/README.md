# Social Media Research Agent

A standalone, open-source agent package that turns a social-media topic, post,
thread, account, or conversation into a verified, build-ready research brief.

```text
request
  → local router
  → social-media specialist
  → browser discovery: X → Digg → Reddit → conditional Google
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
├── docs/                     setup, browser, storage, and learning rules
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

## Browser behavior

Routing is local and happens first. A non-social request stops with a clear
missing-specialist response. For a routed social job, the first external
research action must use the host browser:

1. Initialize the local job and governance ledgers.
2. Open a supplied social-media URL in the browser.
3. Search X.
4. Search Digg.
5. Search Reddit.
6. Use Google only if all three produced no useful lead.
7. Open underlying sources and verify material claims.

If browser access itself is unavailable, the agent stops rather than relying on
model memory. An optional local model never replaces browsing. See
`docs/BROWSER-FIRST.md`.

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

After browser research, use the exact project path returned by `init`:

```text
node bin/content-research-agent.js browser-log <project-path-returned-by-init> --agent "Codex" --tool "browser tool name" --discovery "x.com" --discovery "digg.com" --discovery "reddit.com" --outcome "useful" --outcome "no-useful-results" --outcome "useful" --query "site:x.com local AI agents" --query "site:digg.com local AI agents" --query "site:reddit.com local AI agents" --opened "https://example.com/source"
node bin/content-research-agent.js session-log <project-path-returned-by-init> --agent "Codex" --summary "Completed discovery and source verification"
node bin/content-research-agent.js decision-log <project-path-returned-by-init> --agent "Codex" --title "Evidence cutoff" --decision "Use sources published this year" --rationale "The question concerns current adoption"
node bin/content-research-agent.js learning-capture <project-path-returned-by-init> --agent "Codex" --feedback "Prioritize firsthand operator posts" --learning "Rank firsthand operator evidence above reposts" --scope "package"
node bin/content-research-agent.js learning-decide <project-path-returned-by-init> --agent "Codex" --learning-id "LRN-..." --decision "approved"
node bin/content-research-agent.js validate <project-path-returned-by-init>
node bin/content-research-agent.js brief <project-path-returned-by-init>
```

`brief` refuses to create `RESEARCH.md` until browser, evidence, identity, and
governance checks pass.

## Optional Gemma 4

`doctor` detects Ollama but never installs it. `docs/LOCAL-MODEL.md` contains
the opt-in process. The assistant must explain model size and machine impact,
then request explicit approval before an install or download. A declined or
failed setup does not affect the normal Codex/Claude workflow.

The same doctor detects a real Chrome or supported Chromium executable. For a
nonstandard install, set `CONTENT_CREATION_CHROME` to the executable path. It
still asks the user to confirm browser control and X, Reddit, and Digg sign-in.

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
- Blocking gaps and missing browser traces stop brief generation.
- Every saved asset records provenance and rights status.

## Development

```text
npm test
npm run check
npm run public-safety
```

By TheVibeFounder
