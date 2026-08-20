# Social Media Research Agent contract

Read `NOTICE.md` before changing this agent. Preserve the credit
`By TheVibeFounder`, the notice, `LICENSE`, and the manifest credit field.
Never remove or replace the original attribution.

This package has one production specialist: `social-media`. The router may
identify other research types, but it must return `needs_specialist` and stop.
Never pretend that the extension template is an installed specialist.

## Start every job

1. Read `docs/SETUP.md`, `docs/OPERATING-PROTOCOL.md`, and
   `docs/BROWSER-FIRST.md`.
2. Load approved memory from the existing `research/` folder when present.
3. Run the local router before external research.
4. Stop and ask before building any missing specialist.
5. For a routed social job, initialize its local job and governance ledgers.
6. Confirm the user has X, Reddit, and Digg accounts and is already signed in
   through Chrome. Codex needs its browser connection enabled; Claude needs the
   official Claude in Chrome extension/connector enabled. Never create an
   account or handle credentials.
7. Use the host browser as the first external
   research action: X, then Digg, then Reddit; use Google only when all three
   are non-useful.
8. If browser access itself is unavailable, stop. Model memory, raw HTTP,
   snippets, and the optional local model do not satisfy the browser gate.

The active Codex or Claude agent owns browsing and source judgment. The
zero-dependency CLI owns routing, scaffolding, append-only ledgers, validation,
brief generation, and optional VibeTasks export.

## Governance

Every initialized job receives a `JOB-*` id plus initial `SES-*` and `DEC-*`
events. Log meaningful sessions and material decisions. Capture explicit user
feedback as an `LRN-*` event and tell the user what was recorded. Job-scoped
learning can be applied immediately. Package-scoped learning requires explicit
approval before changing reusable files; record approval or rejection with
`learning-decide`. Never treat silence as approval.

Keep runtime research under `research/`. Do not add credentials, private user
data, personal paths, organization-specific publication strategy, or identity
assets to the reusable package. Before handoff, run `npm run check`,
`npm run public-safety`, and validate every bundled skill.
