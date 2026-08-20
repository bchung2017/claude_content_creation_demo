# Workflow

1. Confirm Chrome, signed-in X/Reddit/Digg accounts, and a working Codex browser
   connection or official Claude in Chrome extension/connector.
2. Search the main parent workspace for a brand guide. Use one guide as the
   primary source. If no single complete guide is available, ask the user for
   every missing brand choice.
3. Initialize a project and complete `brand.json` from the guide or answers.
4. Run the installed Content Research Agent through its validated
   `RESEARCH.md` output.
5. Use `research-import` to convert the completed job into the content
   project's `research.json` while preserving browser and governance records.
6. Route brand context and completed `research.json` to the Hook Writer Agent.
7. Route the brand, research, and selected hook to the Carousel Maker Agent.
8. During carousel creation, use `media-route` to prefer an installed FrameGrab
   CLI, or use the browser fallback for public X/Twitter posts. Register the
   saved file in `assets/manifest.json`.
9. Render every slide as a 1080×1350 PNG and register each file with
    `slide-register`. The carousel remains incomplete until every planned slide
    has a valid numbered PNG.
10. Route the brand, research, hook, and completed carousel to the Caption
    Writer Agent.
11. Validate the complete graph of brand context, claims, sources, hooks,
    captions, slides, PNG files, and assets.
12. Generate `CAROUSEL.md` and return it with every `output/slide-NN.png` path.

An agent stops at its own boundary and returns an invalid upstream artifact to
its owner. The workspace stops when evidence is missing, required asset rights
are unclear, or a claim cannot be safely published.
