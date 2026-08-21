# Examples

Worked references. These are committed package content, not runtime user data —
live jobs belong under the gitignored `research/` directory.

## `xr-guild-social-signal/`

A complete, validated research job run in **web-search mode** against the local
corpus in `../corpus/`. Every artifact the agent produces is present: the
discovery trace, evidence and claim ledgers, the specialist analysis, the
governance ledgers, and the generated `RESEARCH.md`.

Worth reading for how the evidence ceiling actually lands:

- 27 snippets, **zero pages opened**, so no claim is marked `verified`.
- Two claims reach `corroborated` — each backed by distinct publishers.
- One claim is `company-reported`, because the platform owner is describing its
  own product.
- Six are `unverified` and therefore not `publishable`; the agent rejects a
  claim that is both unverified and publishable.
- Reddit is recorded as `blocked`, and the brief says plainly that the gap
  weakens the newcomer finding rather than listing it as a neutral footnote.

Regenerate it end to end:

```text
node bin/content-research-agent.js validate examples/xr-guild-social-signal
node bin/content-research-agent.js brief examples/xr-guild-social-signal
```
