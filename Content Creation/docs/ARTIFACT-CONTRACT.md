# Artifact contract

Every project is self-contained and has these files:

```text
project/
├── request.json
├── brand.json
├── route.json
├── research.json
├── hook.json
├── caption.json
├── carousel.json
├── assets/
│   └── manifest.json
├── output/
│   ├── slide-01.png
│   └── slide-NN.png
└── CAROUSEL.md
```

## Required invariants

- The shared workspace and every installed agent use workspace API 1.0 and artifact
  contract 1.0.

- `request.json.format` is exactly `carousel`.
- `brand.json` is completed from a runtime brand guide or explicit user
  answers before content work begins. A selected guide has `priority: primary`
  and controls every available brand choice; missing choices return to the user.
- Every writing and carousel agent uses the brand profile without changing
  factual meaning, source attribution, or media permission rules.
- `research.json.status` is `completed`.
- Imported research records its originating `JOB-*` id, browser trace,
  evidence-backed analysis, and session/decision/learning ledgers.
- Every claim has at least one known source and an explicit verification state.
- A claim may be publishable only when it is supported, attributed when needed,
  and not blocked by a gap.
- `hook.json`, `caption.json`, and `carousel.json` may reference only known
  claim ids.
- The Carousel Maker reads brand, research, and hook files. It does not depend
  on `caption.json`.
- The Caption Writer runs after the Carousel Maker and reads the completed
  `carousel.json` so the final caption matches the rendered content.
- `caption.carousel_sha256` must match the final `carousel.json`. Create it with
  `caption-register` after the final PNGs are registered.
- Each slide has a role, readable copy, and a visual job.
- Each slide has exactly one registered, checksum-matched 1080×1350 PNG under
  `output/`. A slide plan without its PNG files is incomplete.
- Each asset has provenance, rights status, and usage notes. Provenance does
  not grant publication rights.
- `CAROUSEL.md` is generated only after validation passes.

Create `research.json` with `research-import`, not by copying or relabeling an
unfinished job. The bridge requires a passing research validation, completed
job state, and generated `RESEARCH.md`.

## Minimal downstream shapes

The bridge supplies the full `research.json` envelope: schema `2.0`, matching
content `project_id`, a `JOB-*` origin, completed browser trace, specialist
analysis, and session/decision/learning governance. The matching `route.json`
records `input_kind: "validated-research-handoff"` and the same research job id.
The abbreviated research object below shows only its evidence fields; it is not
a valid hand-written replacement for `research-import`.

```json
{
  "brand": {
    "status": "completed",
    "source": {"type": "guide", "path": "<runtime-path>", "priority": "primary"},
    "name": "Example Brand",
    "audience": "The intended reader",
    "voice": ["clear", "direct"],
    "visual": {
      "direction": "Minimal and evidence-led",
      "colors": ["brand color directions"],
      "typography": ["brand type directions"],
      "imagery": ["brand image directions"],
      "logo_usage": "approved logo rule"
    },
    "content_rules": {"do": ["Be useful"], "avoid": ["Hype"]}
  },
  "research": {
    "schema_version": "2.0",
    "status": "completed",
    "sources": [{"id": "src-1", "url": "https://example.com", "title": "Source", "source_type": "official"}],
    "claims": [{"id": "claim-1", "text": "A supported fact.", "verification": "verified", "source_ids": ["src-1"], "publishable": true}],
    "gaps": []
  },
  "hook": {"status": "completed", "primary": "The supported hook.", "claim_ids": ["claim-1"]},
  "caption": {"status": "completed", "text": "The caption.", "claim_ids": ["claim-1"]},
  "carousel": {
    "status": "completed",
    "slides": [{"id": "slide-1", "role": "cover", "headline": "The hook", "body": "The proof", "visual_job": "Show the evidence", "claim_ids": ["claim-1"], "asset_ids": []}],
    "rendered_slides": [{"slide_id": "slide-1", "file": "output/slide-01.png", "width": 1080, "height": 1350, "sha256": "<sha256>"}]
  }
}
```
