# Social-media research workflow

1. Complete `SETUP.md` and load approved memory from `research/` when present.
2. Run `route` locally.
3. If the result is `needs_specialist`, stop, identify the missing package, and
   ask before building it from `specialists/template`.
4. Run `init`; retain the generated `JOB-*` id and log the research work period.
5. Use the host browser as the first external action.
6. Open a supplied social URL, then search X → Digg → Reddit. Use Google only
   when all three required searches are non-useful.
7. Treat discovery results as leads and open stronger underlying evidence.
8. Record every opened evidence URL in the trace with `browser-log`.
9. Follow `skills/social-media-research/SKILL.md` and fill `evidence.json`
   before drawing conclusions.
10. Log scope, source-selection, interpretation, and stopping decisions with
    `decision-log`.
11. Fill `analysis.json` and `assets/manifest.json` from supported evidence.
12. Capture explicit feedback with `learning-capture`, tell the user, and ask
    before implementing any package-scoped learning. Record the response with
    `learning-decide`.
13. Run `validate`, correct every error, then run `brief` and inspect
    `RESEARCH.md`.
14. Run `packet` only for an explicit VibeTasks handoff.

Keep every investigation under its job directory and append to ledgers instead
of rewriting history.
