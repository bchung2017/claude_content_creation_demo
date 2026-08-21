# Web-search-first contract

This is the fallback discovery contract for hosts that cannot drive a browser.
It applies to Codex, Claude, and any other host agent.

Browser mode remains the default and the stronger contract. Read
`BROWSER-FIRST.md` first and use this document only when the browser gate
genuinely cannot be met.

## When this mode applies

Use web-search mode when, and only when, one of these is true:

- no Chrome or Chromium is installed on the host (`doctor` reports
  `discovery.modes_available` without `browser`);
- the host cannot control a browser, or the user declines to enable it;
- the environment's network policy blocks page fetches, so a page can be found
  but never opened.

Do not choose this mode for convenience. If the browser is available, opening
pages produces stronger evidence and web-search mode forfeits it.

## Required order

1. Read the package instructions and approved learning memory.
2. Route the request locally. Routing is not external research.
3. If the route is `needs_specialist`, stop and ask before building that
   package. Do not search or initialize a job.
4. Initialize the routed job and log the research work period.
5. Use host web search as the first external research action.
6. Sweep X, then Digg, then Reddit in that exact order, one query per site,
   scoped to that site. Record each query in `site:x.com …` form even when the
   host scopes by a domain-filter parameter, so the trace stays portable.
7. Capture the returned results as snippets: site, query, title, URL, snippet
   text, and retrieval time.
8. Record each site as `useful`, `no-useful-results`, or `blocked`. If all three
   are non-useful, run one unscoped open-web query and capture at least one
   `open-web` snippet.
9. Open any result the environment does permit, and record it in `opened_urls`.
   Opening is not required in this mode, but every opened page upgrades the
   evidence it supports.
10. Record the completed trace with `search-log`.

## Two evidence grades

Web-search mode makes an existing rule enforceable rather than advisory:

| Grade | How it was obtained | What it can support |
| --- | --- | --- |
| opened | the page was fetched and read | any claim, including `verified` |
| snippet | only a search result was seen | `corroborated`, `company-reported`, `unverified`, `disputed` |

`validate` rejects any claim marked `verified` whose sources are all
snippet-grade. Downgrade the claim or open a source; do not restate a snippet
as proof. `corroborated` still requires two distinct evidence locations and two
distinct publishers, so two snippets from one account never corroborate.

A search snippet is a search engine's summary of a page, not the page. It can
be stale, truncated, or rewritten. Quote it as a snippet, attribute it to its
result URL, and never present it as the underlying source's exact words.

## Domain filters are a hint, not a guarantee

Host web search treats a domain filter as a ranking preference. A sweep scoped
to `digg.com` routinely returns results from other domains entirely.

`search-log` therefore rejects any snippet whose URL host does not match the
site it is filed under. An off-domain result is not a platform signal: file it
under `open-web` when the fallback is in use, or drop it. Recording zero
on-domain results as `no-useful-results` is the correct and honest outcome.

Some platforms refuse the host's search user agent outright. Record that site
as `blocked` with a note naming the refusal. `blocked` is a real finding about
coverage; never paper over it with an off-domain substitute.

## Unreachable supplied URLs

When the user supplies a URL that can neither be opened nor surfaced in search,
record it with `--unreachable` and explain why in `--notes`. Validation accepts
a supplied URL that is cited or explicitly recorded as unreachable, and rejects
one that is silently dropped. Add a matching entry to `evidence.gaps`.

## Record the trace

After `init`, run one `search-log` command:

```text
node bin/content-research-agent.js search-log research/<job> --agent "Claude" --tool "host web search" --discovery "x.com" --discovery "digg.com" --discovery "reddit.com" --outcome "useful" --outcome "no-useful-results" --outcome "blocked" --query "site:x.com topic" --query "site:digg.com topic" --query "site:reddit.com topic" --snippets-file snippets.json --notes "reddit.com refuses this host's search user agent"
```

`--snippets-file` takes a JSON array (or `{"snippets": [...]}`). Each entry
needs `site`, `query`, `title`, `url`, and `snippet`; `id` and `retrieved_at`
default to a positional id and the trace start time. A single result can also
be passed inline as `--snippet '{"site":"x.com",…}'`.

When all three sites are non-useful, add `--fallback-query "topic"` and at
least one snippet whose `site` is `open-web`.

`validate`, `brief`, and `packet` remain blocked until the trace is complete.

## What still does not count

Model memory, copied text with no recorded query and URL, and a local model do
not satisfy this gate any more than they satisfy the browser gate. If neither
a browser nor host web search is available, stop and tell the user. Do not
continue offline.
