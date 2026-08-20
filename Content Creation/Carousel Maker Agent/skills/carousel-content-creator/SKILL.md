---
name: carousel-content-creator
description: Turn verified research and a selected hook into brand-aligned carousel copy and final PNG slides. Use when planning, designing, rendering, checking, or revising carousel slides and their visual jobs.
---

# Carousel content creator

Read the completed runtime `brand.json`, then create a compact sequence of 1–10
slides. Give each slide one job, such as
cover, context, proof, mechanism, comparison, caveat, or conclusion. Every
slide must include:

- a role;
- headline or body copy;
- a visual job;
- claim ids for factual copy;
- asset ids for required media.

Keep copy readable and let the evidence determine the number of slides. Do not
turn a caveat into the hook, use illustrative media as proof, or add a visual
claim that is not represented in the research and asset manifests.

Treat the selected brand guide as the primary source for tone, colors,
typography, logo use, imagery, spacing, visual direction, and do/avoid rules.
Ask about any missing or ambiguous choice before designing. Do not invent brand
rules or copy the source guide into the reusable package.

Acquire requested media while creating the carousel through the workspace media
router. Do not silently save files or reference unrecorded paths.

## Render

1. Set `carousel.json.status` to `rendering` after the slide plan is ready.
2. Render every slide as a real 1080×1350 PNG with the host's supported design
   and browser tools. Never use a blank or text-only placeholder unless the
   approved brand direction itself is text-only.
3. Register each output from the Content Creation folder:
   `node bin/content-creation.js slide-register <project> --slide <slide-id> --file <png>`.
4. Run the final validation. It must find exactly one correctly sized,
   checksum-matched PNG for every planned slide.
5. Return every `output/slide-NN.png` path together with `CAROUSEL.md`. A plan
   without the PNG files is incomplete.
