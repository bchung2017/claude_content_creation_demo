# Social-media research workflow

1. Complete `SETUP.md` and load approved memory from `research/` when present.
2. Run `route` locally.
3. If the result is `needs_specialist`, stop, identify the missing package, and
   ask before building it from `specialists/template`.
4. Run `init`; retain the generated `JOB-*` id and log the research work period.
5. Run `doctor` and pick a discovery mode: browser when a browser is
   available, otherwise web-search. Log the choice with `decision-log` when it
   is not the default.
6. Use that mode as the first external action.
7. Open a supplied social URL, then sweep X → Digg → Reddit. Use the fallback
   provider only when all three required searches are non-useful.
8. Treat discovery results as leads and open stronger underlying evidence.
   In web-search mode, capture each result as a snippet and open whatever the
   environment permits.
9. Record the trace with `browser-log` (browser mode) or `search-log`
   (web-search mode). Every evidence URL must appear in the trace.
10. Follow `skills/social-media-research/SKILL.md` and fill `evidence.json`
   before drawing conclusions.
11. Log scope, source-selection, interpretation, and stopping decisions with
    `decision-log`.
12. Fill `analysis.json` and `assets/manifest.json` from supported evidence.
13. Capture explicit feedback with `learning-capture`, tell the user, and ask
    before implementing any package-scoped learning. Record the response with
    `learning-decide`.
14. Run `validate`, correct every error, then run `brief` and inspect
    `RESEARCH.md`.
15. Run `packet` only for an explicit VibeTasks handoff.

Keep every investigation under its job directory and append to ledgers instead
of rewriting history.
