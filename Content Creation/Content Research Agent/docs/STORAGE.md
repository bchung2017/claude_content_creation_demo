# File-based research database

No database server or package installation is required. The filesystem is the
database, JSON/NDJSON are the canonical records, and CSV is the job table.

```text
research/
├── JOBS.csv
├── LEARNING-EVENTS.ndjson
└── <job-slug>-<unique-id>/
    ├── job.json
    ├── request.json
    ├── route.json
    ├── browser.json
    ├── evidence.json
    ├── analysis.json
    ├── sessions.ndjson
    ├── decisions.ndjson
    ├── learnings.ndjson
    ├── assets/manifest.json
    └── RESEARCH.md
```

## Tables

### `JOBS.csv`

Append-only lifecycle table. Each row records a `created` or `completed` event
with job id, status, timestamp, content type, topic, and project directory. The
latest row for a job is its current table state.

### `sessions.ndjson`

One JSON object per line. Required fields: `session_id`, `job_id`, `status`,
`agent`, `summary`, and `created_at`.

### `decisions.ndjson`

One JSON object per line. Required fields: `decision_id`, `job_id`, `title`,
`decision`, `rationale`, `made_by`, and `created_at`.

### `learnings.ndjson`

Job-local feedback and approval events. Captures use stable `LRN-*` ids.
Decisions append another event with the same id; prior history is preserved.

### `LEARNING-EVENTS.ndjson`

Shared memory across jobs in the same `research/` folder. The `memory` command
reconstructs approved, pending, and declined learnings from these events.

## Portability

All records are UTF-8 text. They can be inspected with an editor, imported into
a spreadsheet, committed separately by a user, or migrated to SQLite/MySQL
later without changing the research artifact contract.
