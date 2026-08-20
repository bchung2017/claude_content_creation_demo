# Add a research specialist

The router is extensible, but only `social-media` ships as production-ready.
Requests for reports, repositories, recordings, product records, webpages, or
custom research return `needs_specialist` until that package is implemented.

To add one:

1. Copy `specialists/template/` into a new working folder.
2. Give the specialist a lowercase hyphenated id.
3. Create `skills/<id>/SKILL.md`, its profile reference, and `agents/openai.yaml`.
4. Define its analysis fields in `src/profiles.js`.
5. Add its route signals and production registry entry.
6. Add positive, ambiguous, blocked, and validation tests.
7. Run every skill validator, `npm run check`, and `npm run public-safety`.
8. Change its registry status to `production` only after a clean forward test.

Do not copy social-media assumptions into a document or software specialist.
Reuse the shared identity, session, decision, learning, evidence, and validation
contracts; keep source judgment inside the specialist.
