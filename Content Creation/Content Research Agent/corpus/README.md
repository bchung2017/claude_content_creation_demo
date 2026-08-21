# Local corpus

Captured web-search snippets, stored so research can be re-run, audited, and
extended without repeating live searches.

This corpus was gathered in web-search mode (see `../docs/WEB-SEARCH-FIRST.md`)
because this host has no browser and its egress proxy blocks page fetches.

## What is here

```text
corpus/
├── manifest.json          totals, coverage, and the limits that apply to all of it
└── sweeps/                one file per sub-topic, each a full three-platform sweep
    ├── xr-meetup-and-demo-night.json
    ├── xr-first-time-and-demo-reaction.json
    ├── xr-education-and-educators.json
    └── xr-platform-and-developer-signal.json
```

Each sweep file records the query used per platform, the outcome per platform,
a note on what went wrong where it did, and the snippets themselves. Every
snippet carries its site, query, title, URL, snippet text, and retrieval time.

## Using it

A sweep file is directly consumable by `search-log`, because its `snippets` key
is exactly the format `--snippets-file` expects:

```text
node bin/content-research-agent.js search-log <project> --agent "Claude" --tool "host web search" --discovery x.com --discovery digg.com --discovery reddit.com --outcome useful --outcome no-useful-results --outcome blocked --query "site:x.com ..." --query "site:digg.com ..." --query "site:reddit.com ..." --snippets-file corpus/sweeps/xr-meetup-and-demo-night.json
```

Combine several sweeps by concatenating their `snippets` arrays. Snippet ids
must be unique within a single `search-log` call; the prefixes here (`MEET-`,
`FIRST-`, `EDU-`, `PLAT-`) keep the four sweeps disjoint.

`examples/xr-guild-social-signal/` is a complete validated job built from all
four sweeps.

## What this corpus is not

Every snippet is **discovery-grade**. A snippet identifies a source; it does not
prove what that source says. Nothing here was opened, so nothing here can
support a claim marked `verified` — `validate` enforces that.

Three limits are worth restating because they shape any finding drawn from it:

- **Single platform.** x.com is the only platform that produced on-domain
  results. Digg returned nothing on topic; Reddit is unreachable from this host,
  refusing both the search user agent (HTTP 400) and direct fetch (HTTP 403).
  This corpus is not representative of XR conversation overall.
- **Domain filters leak.** The host treats a domain filter as a ranking hint,
  not a constraint, so sweeps returned arxiv.org and uspto.gov results. Those
  were discarded rather than filed as platform signal. `search-log` rejects any
  snippet whose URL is not hosted on the site it is filed under, so this cannot
  be re-introduced by accident.
- **Point in time.** Snippets are frozen at capture. Re-run the sweeps rather
  than treating these files as current.

Vendor and platform accounts appear throughout and are promotional sources.
Their claims are recorded as `company-reported` where the account owns the
product, and as `unverified` where a third party is summarising someone else.

## Re-running

Re-run each sweep with the queries stored in the sweep file's `site_queries`,
then rewrite the sweep file and regenerate `manifest.json`. Keep the previous
capture if you need to compare: the corpus is evidence, and overwriting it
silently loses the record of what was true when a brief was written.
