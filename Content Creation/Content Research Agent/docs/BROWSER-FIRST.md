# Browser-first contract

This contract applies to Codex, Claude, and any other host agent.

## Choosing a discovery mode

Research must begin with a real external action. Two modes satisfy that gate:

- **browser** — this document. The host opens pages. Opened sources are
  proof-grade and can support a `verified` claim. This is the default whenever
  a browser is available.
- **web-search** — `WEB-SEARCH-FIRST.md`. The host runs web search and captures
  result snippets. Snippet-only sources are discovery-grade and can never
  support a `verified` claim.

Run `doctor` to see which modes the host offers. Prefer browser mode whenever
it is available; drop to web-search mode only when it genuinely is not.

## Required order

1. Read the package instructions and approved learning memory.
2. Route the request locally. Routing is not external research.
3. If the route is `needs_specialist`, stop and ask before building that
   package. Do not browse or initialize a job.
4. Initialize the routed job and log the research work period. These are local
   actions and preserve the browser as the first external action.
5. Use the host browser as the first external research action.
   Before this step, the user must be signed in to X, Digg, and Reddit in
   Chrome and must have enabled the host's browser connection. The agent never
   creates accounts or handles credentials.
6. If the input is a social-media URL, open that exact URL first.
7. Search X, then Digg, then Reddit using host web search constrained by
   `site:x.com`, `site:digg.com`, and `site:reddit.com` in that exact order.
   This provider-neutral, domain-scoped sweep is distinct from broad Google
   fallback. Open useful results and their linked or underlying sources.
8. Record each site as `useful`, `no-useful-results`, or `blocked`. If all three
   are non-useful, search Google next in the browser and open an underlying
   result. Do not use Google fallback when any required site is useful.
9. Record the completed trace with `browser-log`.

Social posts, engagement, and search snippets are discovery signals, not proof.
Verify material claims against opened primary, official, or credible independent
sources, and include every evidence URL in `opened_urls`. A blocked individual
discovery site can be recorded before continuing to the next required site. If
Google is required but yields no openable source, stop and report the evidence
gap.

Model memory, copied snippets, raw HTTP commands, and a local model do not
satisfy the browser-first gate. If browser access itself is unavailable or
approval to use it is denied, switch to the web-search contract in
`WEB-SEARCH-FIRST.md` and record the switch with `decision-log`. If neither a
browser nor host web search is available, stop and tell the user. Do not
continue offline.

## Record the trace

After `init`, run one `browser-log` command containing the three discovery
sites, three aligned outcomes, three ordered queries, and every opened URL:

```text
node bin/content-research-agent.js browser-log research/<job> --agent "Codex" --tool "browser tool name" --discovery "x.com" --discovery "digg.com" --discovery "reddit.com" --outcome "useful" --outcome "no-useful-results" --outcome "useful" --query "site:x.com topic" --query "site:digg.com topic" --query "site:reddit.com topic" --opened "https://example.com/source"
```

When all outcomes are `no-useful-results` or `blocked`, also pass
`--google-query "topic"` and one `--google-opened "https://..."` per underlying
Google result opened. Use `--agent "Claude"` when appropriate.

Broad Google discovery is not a later verification escape hatch. If any social
site was useful, follow links or open a directly known primary source. When no
such source is available, keep the claim unverified or record a gap.

`validate`, `brief`, and `packet` remain blocked until the trace is complete.
