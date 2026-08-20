# Optional local model: Gemma 4

Gemma 4 is optional. The research agent works fully through Codex or Claude
without it. A local model may help classify feedback, summarize already-opened
evidence, or review learning records; it never satisfies browser-first or
verification requirements.

Google's official Gemma documentation lists Ollama and LM Studio as beginner
local runtimes. This package uses Ollama only when the user explicitly opts in.

Official references:

- https://ai.google.dev/gemma/docs/core
- https://ai.google.dev/gemma/docs/integrations/ollama
- https://ai.google.dev/gemma/docs/run

## Safe setup

1. Run `ollama --version` to detect an existing installation.
2. If Ollama is absent, explain that the runtime and model are optional. Show
   the official installer path and request approval before installing anything.
3. Inspect the machine's available memory, storage, and accelerator. Explain
   the selected Gemma 4 size before downloading it.
4. Prefer the smallest suitable instruction-capable local variant. For a light
   first test, the official Ollama integration currently lists `gemma4:e2b` and
   `gemma4:e4b` alongside larger `gemma4:26b` and `gemma4:31b` variants.
5. After approval, download only the selected model, for example:

   ```text
   ollama pull gemma4:e2b
   ```

6. Verify with `ollama list` and a harmless local prompt.

Do not use an opaque download script, install a runtime silently, or download a
model without informed approval. Failure or refusal leaves local-model status
`optional-unavailable` and does not block the research workflow.
