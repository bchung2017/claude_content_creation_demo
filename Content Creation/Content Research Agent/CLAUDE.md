# Claude entrypoint

Read and follow `AGENTS.md` and `NOTICE.md`. Preserve the credit
`By TheVibeFounder`. This is a social-media research agent, not a
general-purpose research system.

Run setup and load approved learning memory, then route locally. If the route
needs a report, repository, recording, product, webpage, or custom specialist,
stop and ask whether the user wants that package built from
`specialists/template`.

For a routed social job, initialize its local job and governance ledgers. Then
the first external research action must use Claude's browser or web-navigation
capability. Open a supplied social URL first, then search X, Digg, and Reddit in
that order. Use Google only if all three are non-useful. Stop if browser access
itself is unavailable; do not substitute memory, snippets, raw HTTP, or an
optional local model.

Record the browser trace, sessions, decisions, and explicit feedback. Tell the
user when a learning is captured and obtain explicit approval before applying
any package-level learning to reusable files.
