---
name: content-research-router
description: Route research requests to installed specialist packages, with social-media research as the only production specialist in this release. Use when a user supplies a topic, post, thread, account, URL, report, repository, recording, product record, or custom research request and the agent must either select the social-media package or identify the missing specialist template needed.
---

# Content Research Router

## Route

1. Read `../../docs/BROWSER-FIRST.md`, `../../docs/OPERATING-PROTOCOL.md`, and
   `references/routes.md`.
2. Run `route` locally from the repository root. This is not an external
   research action.
3. When the result is `routed`, use `skills/social-media-research/SKILL.md` and
   complete its browser-first discovery before gathering evidence.
4. When the result is `needs_specialist`, stop. Explain that the requested
   package is not installed and point to `specialists/template`.
5. Ask before implementing a new reusable specialist package. Do not silently
   reinterpret a report, repository, recording, or webpage as social research.
6. Initialize only production routes and finish only after validation passes.

## Learn

Capture explicit user feedback into the job learning ledger. Ask before
implementing any package-level change.
