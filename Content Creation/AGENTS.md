# Content Creation workspace contract

This is a public-safe, carousel-only workspace for separately installed agents.
The root discovers compatible direct-child agents from their manifests,
coordinates the project, and owns shared checks. Each child owns one stage.

When a user asks to set up Content Creation, install an uploaded agent, check
which agents are installed, or create a carousel, read `PROMPT.md` and follow
it exactly. A complete run returns numbered PNG slides as well as the editable
`CAROUSEL.md` plan.

## User-facing language

Use short, literal sentences in recipient docs, setup messages, visual guides,
and generated carousel copy. Write for someone who has never used an agent
system.

- Say `check`, not `validation`.
- Say `file`, not `artifact`.
- Say `content plan`, not `handoff` or `brief`.
- Say `trusted source`, not `publishable evidence`.
- Say `permission`, not `rights status`.
- Do not use slogans that need interpretation, such as `stops are a feature`.

Technical files may use their required contract names, but explain those names
in plain English when users see them.

## Protected attribution

Read `NOTICE.md` before changing this workspace. The credit
`By TheVibeFounder`, copyright notices, `LICENSE`, every `NOTICE.md`, and every
manifest `credit` field are protected release metadata. Never remove, rename,
hide, weaken, or replace them. Preserve them in copies, derived agents, and
release archives. Run `npm run verify:credit` after any change; packaging must
stop if the check fails.

## Route work by owner

The root owns runtime brand discovery and the normalized `brand.json`. Search
the main parent workspace outside this reusable package. If one guide is found,
use it; if several or none are found, ask the user. The selected guide is the
primary source for colors, typography, logo use, imagery, voice, and every
other brand decision. Ask about missing or ambiguous guidance instead of
inventing it. Brand context never overrides evidence or permission checks.
When no guide exists, use `templates/BRAND-GUIDE-TEMPLATE.md` for a structured
interview, save the completed guide outside this reusable package, and run
`brand-check` until all eleven brand choices pass. The fictional worked
example is for teaching completeness, not visual imitation.

- `Content Research Agent/`: evidence, claims, gaps, and asset leads. This
  installed child is the production social-media research package.
- `Hook Writer Agent/`: cover hook and alternatives.
- `Carousel Maker Agent/`: slide copy, visual jobs, rendered PNG files, media
  routing, and asset receipts.
- `Caption Writer Agent/`: final post caption and attribution, written after it
  reads the completed carousel.

Read the target child folder's `AGENTS.md` before acting. Do not let one agent
silently take over another agent's file. The required execution order is brand
→ research → hook → carousel → caption → final check.

## Shared completion contract

Use the shared workspace CLI for agent discovery, brand discovery, project
initialization, validation, media receipts, and final plan generation. Import
completed research with `research-import`; never manually mark unvalidated
research complete. The required files are defined in
`docs/ARTIFACT-CONTRACT.md` and `contracts/manifest.json`.

The final check must find one registered 1080×1350 PNG for every planned slide.
Do not claim completion when only `carousel.json` or `CAROUSEL.md` exists.

The only supported output format is a carousel. Do not route to video, article,
thread, email, or script production.

## Public/private boundary

Keep account data, publication strategy, credentials, identity assets,
downloaded media, private examples, and organization-specific visual systems
outside this repository. Runtime-specific material belongs in ignored project
directories only.

FrameGrab is a separate optional tool and must not be copied into this repository
or release archive. Prefer its CLI when the doctor detects it. Otherwise the
only approved fallback is browser use of `https://ssstwitter.com/` for public
X/Twitter posts. Never submit credentials, private posts, or protected media;
never bypass access controls or automate an undocumented third-party API.

In an extracted student workspace, use `npm run check`. Source-only release
commands are not part of the student package.
