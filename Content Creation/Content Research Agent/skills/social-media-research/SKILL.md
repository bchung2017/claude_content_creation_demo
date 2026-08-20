---
name: social-media-research
description: Research a topic, post, thread, account, trend, or public conversation across social media. Use when Codex or Claude must discover signals on X, Digg, and Reddit, recover conversation context, distinguish firsthand reports from repetition, follow claims to stronger sources, and produce a validated social-media research brief.
---

# Social Media Research

## Start

1. Read `../../docs/BROWSER-FIRST.md`, `../../docs/OPERATING-PROTOCOL.md`, and
   `references/profile.md`.
2. Confirm the user is already signed in to X, Digg, and Reddit through Chrome
   and that the Codex browser connection or official Claude in Chrome
   extension/connector is enabled. Never create accounts or handle credentials.
3. Initialize the job and log the active research work period.
4. Use the host browser as the first external action and complete the
   X → Digg → Reddit discovery sweep.
5. Use Google only when all three required discovery outcomes are non-useful.
6. Stop when browser access itself is unavailable.
7. Record every opened evidence URL in the browser trace.

## Investigate

1. Define the topic, date window, region, accounts, and terminology in scope.
2. Inspect complete accessible posts and conversations, not screenshots or
   snippets alone.
3. Separate original observations, expert interpretation, promotional claims,
   reposts, and unsupported repetition.
4. Record timestamps, stable URLs, author relationship to the subject, visible
   edits, engagement context, and linked material.
5. Treat popularity as a signal, never verification.
6. Follow material claims to opened primary, official, or independent sources.
7. Map patterns, disagreement, counter-signals, and missing communities instead
   of collapsing everything into one sentiment score.
8. Rank repeated claims by evidence quality first, then number of distinct
   firsthand authors, cross-platform repetition, and recency. Engagement is
   context or a tie-breaker, never proof.
9. Define and log the sample, time window, and stopping rule. Record a coverage
   gap instead of implying representativeness when the sample is too thin.
10. Record unique-author and qualifying-post counts for X, Digg, and Reddit,
    including zeros for blocked or non-useful platforms.
11. Broad Google discovery is reserved for an all-three-non-useful sweep. When
    a useful social lead has no linked or directly known verification source,
    record the claim as unverified or as a gap; do not use broad Google to
    bypass the fallback rule.
12. Fill all artifacts, log material decisions, validate, and generate the brief.

## Learn

Capture explicit user feedback with `learning-capture` without waiting for
permission. Tell the user what was recorded. Ask before changing reusable agent
behavior, and record that answer with `learning-decide`. Never implement a
package-level learning without explicit approval.
