# First prompt for Codex or Claude

Give people the complete folder, open it in Codex or Claude, and paste this:

```text
Use the Social Media Research Agent in this folder.

Read these files completely before acting:
- AGENTS.md
- docs/SETUP.md
- docs/OPERATING-PROTOCOL.md
- docs/BROWSER-FIRST.md
- docs/STORAGE.md
- docs/LOCAL-MODEL.md
- skills/content-research-router/SKILL.md

My research request:
[topic, social-media URL, post, thread, account, or question]

My goal:
[what I need to understand or verify]

FIRST-RUN SETUP
1. Detect the operating system and shell.
2. Check for Node.js 20 or newer. If it is missing or too old, explain the
   trusted installation method, request any required approval, install a
   current Node.js LTS release, and verify the version.
3. Read package.json. Install npm dependencies only if it declares any. This
   release declares zero, so do not run npm install and do not install browser
   automation or scraping packages.
4. Run: node bin/content-research-agent.js doctor
5. Ask the user to confirm that Google Chrome is installed and that they have
   X, Reddit, and Digg accounts already signed in within Chrome. Never create
   an account, request a password, or store account details.
6. Confirm that Codex has its browser connection enabled, or that the official
   Claude in Chrome extension/connector is installed and enabled. Do not claim
   there is a separate Codex Chrome extension, and do not install an unknown
   browser substitute. If browser control is unavailable, stop.
7. Report a short required-setup summary.

JOB PROTOCOL
1. If a research/ folder exists, run:
   node bin/content-research-agent.js memory research
   Apply only approved reusable learnings. Never apply pending or declined
   package changes.
2. Route the request locally before any external research:
   node bin/content-research-agent.js route --topic "[input]" --goal "[goal]"
3. Continue only when status is "routed" and content_type is "social-media".
   If status is "needs_specialist", stop and explain which package is missing.
   Point to specialists/template and ask whether I want that reusable
   specialist built. Do not browse, initialize, or reinterpret it as social
   research.
4. For a routed social job, check the optional local-model status reported by
   doctor. If Ollama/Gemma 4 is unavailable, briefly offer the option described
   in docs/LOCAL-MODEL.md. Explain the download and hardware/storage impact and
   obtain explicit approval before installing Ollama or downloading a model.
   Declining or failing this optional setup must not block research. A local
   model never replaces browser research or evidence verification.
5. Initialize the routed job under research/ and note its JOB-* id:
   node bin/content-research-agent.js init --topic "[input]" --goal "[goal]"
   Using the returned project path, record a research work period:
   node bin/content-research-agent.js session-log "[project path]" --agent "[Codex or Claude]" --summary "Started the routed social-media investigation" --status "progress"
   These are local actions.
6. The first external research action must use the
   host browser. If the input is a social URL, open that exact URL first.
7. In the browser, use host web search constrained to each domain in this exact
   order (this is the required social discovery sweep, not broad Google
   fallback):
   a. site:x.com [topic]
   b. site:digg.com [topic]
   c. site:reddit.com [topic]
   Record each outcome as useful, no-useful-results, or blocked. Treat social
   posts and popularity as leads, not proof. Open useful posts and their
   underlying sources.
8. Use broad Google discovery only when all three required sites are non-useful.
   If Google also yields no openable source, stop and report the research gap.
   If browser access itself is unavailable, stop; do not continue from memory.
   If a social site is useful but a claim has no linked or directly known
   verification source, leave it unverified or record a gap; do not use broad
   Google to bypass this fallback rule.
9. Record the completed browser trace with browser-log. Include the three
   discovery sites, queries, aligned outcomes, every opened URL, and the
   conditional Google fields when required.
10. Read and follow skills/social-media-research/SKILL.md. Every URL used in
   evidence must be opened and included in the browser trace. Record claim-level
   evidence, provenance, dates, uncertainty, disagreements, and gaps. Log each
   meaningful work period with session-log and every material choice with
   decision-log.
11. When I express a correction, preference, rejection, or durable lesson,
    capture it immediately with learning-capture and tell me exactly what was
    recorded. Apply job-scoped feedback to this job. For a package-scoped
    learning, ask: "I recorded this learning. Should I implement it in the
    reusable agent?" Record my answer with learning-decide. Never modify the
    reusable package without explicit approval.
12. Run validate and fix every error. Then run brief. Stop at the research
    brief; do not create any downstream publication or media deliverable.
13. Return the RESEARCH.md path, JOB-* id, main findings, sources opened,
    unresolved gaps, and any learning recorded.
```

The bracketed input and goal are the only parts a normal user needs to edit.
