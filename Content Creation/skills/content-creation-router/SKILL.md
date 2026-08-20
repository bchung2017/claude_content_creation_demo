---
name: content-creation-router
description: Discover runtime brand context and route a topic, link, or validated research brief through the carousel-only content workflow. Use when starting a content job or deciding which specialist should act next.
---

# Content creation router

Classify the input as one of:

- `new-research`: topic or link with no trustworthy brief;
- `research-handoff`: validated evidence is already supplied;
- `revision`: an existing project needs a hook, caption, slide, or asset fix.

Before routing content, search the main parent workspace with `brand-discover`.
Use one brand guide as the primary source, ask the user to choose among several,
or ask the required brand questions when none exists. Ask about any color,
typography, logo, imagery, voice, or visual choice that the guide leaves
missing or ambiguous. Complete the ignored project's `brand.json`.

Always set the output format to `carousel`. Route the work in this order: brand
profile → research → hook → carousel creation with media intake → PNG
rendering and registration → caption → validation. Do not report completion when the
project has only `CAROUSEL.md` and no final PNG slides.
Do not route to a video, article, thread, email, or script specialist.
