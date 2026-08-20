# Brand guide workflow

By TheVibeFounder

Content Creation is meant to sit inside a larger main folder beside the user's
brand guide:

```text
Main workspace/
├── Brand Guide.md
└── Content Creation/
```

## Discovery

From `Content Creation`, run:

```bash
node bin/content-creation.js brand-discover
```

The default search root is the folder containing `Content Creation`. The search
is recursive, does not follow symbolic links, skips generated and environment
folders, and excludes the reusable Content Creation package itself.

Use an explicit main folder when the package is nested more deeply:

```bash
node bin/content-creation.js brand-discover --workspace <main-folder>
```

The search recognizes common brand-guide, brand-book, brand-kit, brand-system,
and visual-identity names in document or directory form.

## Decision

- One result: use it as the primary source for every brand choice it defines.
- Several results: ask which guide applies.
- No result: use [`BRAND-GUIDE-TEMPLATE.md`](../templates/BRAND-GUIDE-TEMPLATE.md)
  for a structured interview. Save the completed guide beside `Content
  Creation`, where it can be reused for future projects.
- Incomplete guidance: ask only the questions returned by `brand-check`, then
  update the user-owned guide and the project’s `brand.json`.

The fictional [`Signal Garden`](../examples/FICTIONAL-BRAND-GUIDE.md) guide is
a worked example of completeness. It is not a style benchmark and must not be
used as the student’s default brand.

Do not start research or writing until the project-local `brand.json` is
complete. Do not copy the source guide, logos, fonts, or identity assets into
the reusable package.

## Project profile

Each project begins with `brand.json`. It records a small working profile:

```json
{
  "schema_version": "1.0",
  "status": "completed",
  "source": {
    "type": "guide",
    "path": "<runtime-guide-path>",
    "priority": "primary"
  },
  "name": "Example Brand",
  "audience": "The intended reader",
  "voice": ["clear", "direct"],
  "visual": {
    "direction": "Minimal and evidence-led",
    "colors": ["near-black background", "warm accent"],
    "typography": ["approved sans serif"],
    "imagery": ["source-led screenshots"],
    "logo_usage": "Use the supplied mark in the footer"
  },
  "content_rules": {
    "do": ["Be useful"],
    "avoid": ["Hype"]
  },
  "cta_style": "Invite a practical next step",
  "notes": ""
}
```

Do not set `status` to `completed` while these visual fields are blank. Read the
guide first, then ask the user about anything it does not establish.

Run the completeness check against a project folder or a direct JSON file:

```bash
node bin/content-creation.js brand-check <project-folder>
node bin/content-creation.js brand-check <path-to-brand.json>
```

The result checks eleven items: brand name, audience, voice, colors,
typography, logo rules, imagery, visual direction, content do rules, content
avoid rules, and CTA style. It prints a short question for each missing item.
Research starts only after all eleven pass and the profile status is
`completed`.

The Hook Writer applies the voice and content rules. The Carousel Maker applies
the voice, visual
direction, colors, typography, imagery, logo rules, and do/avoid rules. Brand
preferences never override factual support, attribution, or media permission.
The Caption Writer runs last and applies the voice and CTA style to the final
slide sequence.

By TheVibeFounder
