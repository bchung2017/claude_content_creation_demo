---
name: social-media-research
description: Research a topic, post, thread, account, trend, or public conversation across social media. Use when Codex or Claude must discover signals on X, Digg, and Reddit, recover conversation context, distinguish firsthand reports from repetition, follow claims to stronger sources, and produce a validated social-media research brief.
---

# Social Media Research

## Start

1. Read `../../docs/BROWSER-FIRST.md`, `../../docs/WEB-SEARCH-FIRST.md`,
   `../../docs/OPERATING-PROTOCOL.md`, and `references/profile.md`.
2. Run `doctor` and choose a discovery mode. Prefer browser mode. Drop to
   web-search mode only when no browser is available or the environment
   forbids opening pages, and log that switch with `decision-log`.
3. In browser mode, confirm the user is already signed in to X, Digg, and
   Reddit through Chrome and that the Codex browser connection or official
   Claude in Chrome extension/connector is enabled. Never create accounts or
   handle credentials.
4. Initialize the job and log the active research work period.
5. Use the chosen mode as the first external action and complete the
   X → Digg → Reddit discovery sweep.
6. Use the fallback provider only when all three required discovery outcomes
   are non-useful.
7. Stop when neither a browser nor host web search is available.
8. Record the trace with `browser-log` or `search-log`. Every evidence URL must
   appear in it.

## Investigate

1. Define the topic, date window, region, accounts, and terminology in scope.
2. Inspect complete accessible posts and conversations, not screenshots or
   snippets alone. In web-search mode a snippet is all that is available for
   most results: treat it as a pointer to a source, not as the source, and say
   so in the claim evidence.
3. Separate original observations, expert interpretation, promotional claims,
   reposts, and unsupported repetition.
4. Record timestamps, stable URLs, author relationship to the subject, visible
   edits, engagement context, and linked material.
5. Treat popularity as a signal, never verification.
6. Follow material claims to opened primary, official, or independent sources.
   Only an opened source can support a `verified` claim. When nothing can be
   opened, the honest ceiling is `corroborated` from two distinct publishers,
   or `unverified`. Validation enforces this; do not restate a snippet as proof.
7. Map patterns, disagreement, counter-signals, and missing communities instead
   of collapsing everything into one sentiment score.
8. Rank repeated claims by evidence quality first, then number of distinct
   firsthand authors, cross-platform repetition, and recency. Engagement is
   context or a tie-breaker, never proof.
9. Define and log the sample, time window, and stopping rule. Record a coverage
   gap instead of implying representativeness when the sample is too thin.
10. Record unique-author and qualifying-post counts for X, Digg, and Reddit,
    including zeros for blocked or non-useful platforms. A host domain filter
    is only a ranking hint, so a result that is not hosted on the platform is
    not that platform's signal. Zero on-domain results is a real finding.
11. Broad open-web discovery is reserved for an all-three-non-useful sweep.
    When a useful social lead has no linked or directly known verification
    source, record the claim as unverified or as a gap; do not use broad
    open-web search to bypass the fallback rule.
12. Record a supplied URL that can be neither opened nor found as unreachable,
    explain why in the trace notes, and add a matching evidence gap.
13. Fill all artifacts, log material decisions, validate, and generate the brief.

## Learn

Capture explicit user feedback with `learning-capture` without waiting for
permission. Tell the user what was recorded. Ask before changing reusable agent
behavior, and record that answer with `learning-decide`. Never implement a
package-level learning without explicit approval.
