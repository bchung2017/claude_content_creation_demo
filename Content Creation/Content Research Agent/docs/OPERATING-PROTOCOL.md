# Operating protocol

## Job lifecycle

1. Run setup and read approved learning memory when `research/` exists.
2. Route the request locally; routing is not an external research action.
3. Stop on `needs_specialist`; ask before building a new package.
4. Initialize the job. This creates a `JOB-*` id, a `SES-*` session
   event, and a `DEC-*` routing decision automatically.
5. Log the active agent's research work period.
6. Choose a discovery mode: browser when the host has one, otherwise
   web-search. Use it as the first external research action and record the
   completed discovery trace.
7. Log material scope, source, or interpretation decisions.
8. Capture explicit user feedback as a learning event.
9. Validate all evidence and governance artifacts.
10. Generate `RESEARCH.md`; successful generation completes the job.

## Sessions

Append a session event when a new agent or meaningful work period begins,
progress changes, work is blocked, or the job completes. Never rewrite prior
events. Every event has a stable `SES-YYYYMMDD-xxxxxxxx` id.

## Decisions

Record choices that change scope, source selection, interpretation, stopping
conditions, or reusable behavior. Include the decision and its rationale.
Every decision has a stable `DEC-YYYYMMDD-xxxxxxxx` id.

## Learnings and consent

When the user expresses a preference, correction, rejection, or durable lesson:

1. Capture it immediately with `learning-capture` and tell the user what was
   recorded.
2. Apply job-scoped learnings to the current job.
3. For package-scoped learnings, ask: “I recorded this learning. Should I
   implement it in the reusable agent?”
4. Record the answer with `learning-decide`.
5. Implement a reusable change only after an `approved` decision.
6. Run tests and safety gates after implementation.

Learning capture is automatic; self-modification is not. Never treat silence
as approval.

## Integrity

- Keep runtime user data under the ignored `research/` directory.
- Do not copy credentials, private files, or user identity into the reusable
  package.
- Never edit or delete earlier NDJSON events; append a correction.
- Browser absence drops research to web-search mode, where snippet-only
  sources cannot carry a verified claim. Losing both a browser and host web
  search hard-stops research. An optional local model never replaces
  discovery, source opening, or claim verification.
