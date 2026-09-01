# Phase 5 — Iterative refinement API

Phase 1–4 always produced a brand-new project per prompt. Phase 5 adds a second LangGraph pipeline
that edits a project that already exists on disk, so a conversation can evolve one codebase.

```text
Fresh generation:  planner → architect → coder → tester → qa → doc_writer
Refinement:        refine_planner → refine_coder → tester → qa → doc_writer
```

The source of truth for the current code is the filesystem
(`generated-projects/<project_name>/`), not MongoDB — MongoDB stores run metadata only.

## Pipeline

1. **Load** — `services/file_manager.load_project_files()` reads every text file in the project
   folder, skipping `node_modules`, `.git`, `__pycache__`, `dist`, `build`, `.venv`, and truncating
   each file to 20 000 characters so the LLM context stays bounded. Project names are resolved
   against `generated-projects/` and path traversal is rejected.
2. **Refine Planner** — chooses the minimal set of files to modify plus any new files to create.
   `modify_files` entries that are not part of the loaded project are discarded.
3. **Refine Coder** — rewrites only those files; every other file is carried through untouched.
4. **Tester / QA / Doc Writer** — unchanged agents, re-run against the updated file set.
5. **Save** — only the changed files are written back to the same project folder.

Without an API key the refinement runs in deterministic mock mode: it appends a traceable change
note to the targeted files instead of writing real feature code. Real edits require
`GEMINI_API_KEY` or `OPENAI_API_KEY`.

## AI engine endpoints

### `GET /api/projects`

```json
{ "projects": ["task-management-app", "todo-list-app"] }
```

### `POST /api/refine`

```json
{
  "prompt": "Add a dark mode toggle and persist the preference in localStorage",
  "project_name": "task-management-app",
  "provider": "gemini"
}
```

Response — same shape as `/api/generate`, plus `mode` and `changed_files`:

```json
{
  "status": "completed",
  "project_name": "task-management-app",
  "tech_stack": "HTML/CSS/JS",
  "tasks": ["Add a theme toggle button", "Persist the theme in localStorage"],
  "saved_files": ["app.js", "index.html", "styles.css", "README.md"],
  "changed_files": ["app.js", "styles.css"],
  "output_dir": "/app/generated-projects/task-management-app",
  "review_results": { "passed": true, "issues": [], "recommendations": [] },
  "documentation": "# Task Management App ...",
  "logs": [{ "agent": "RefinePlannerAgent", "status": "completed", "message": "..." }],
  "llm": { "provider": "gemini", "mode": "live", "model": "gemini-3.6-flash" },
  "mode": "refine"
}
```

| Status | Cause |
| --- | --- |
| `400` | Empty prompt |
| `404` | No generated project with that name, or the folder has no readable files |
| `502` | The refinement graph reported an error |

## Backend endpoint

### `POST /api/agents/refine`

```json
{ "prompt": "Add a dark mode toggle", "projectName": "task-management-app", "provider": "gemini" }
```

Proxies the AI engine, then persists the run to MongoDB exactly like a generation, with two extra
fields on the `Generation` document:

| Field | Type | Notes |
| --- | --- | --- |
| `mode` | `"generate"` \| `"refine"` | How the run was produced |
| `changedFiles` | string[] | Files created or modified by a refinement run |

`400` is returned when `prompt` or `projectName` is missing; other errors are surfaced from the
AI engine.

## Frontend

The **Chat** tab tracks the active project. The first message calls `POST /api/agents/generate`;
every subsequent message calls `POST /api/agents/refine` against the project returned by the
previous run. The result panel labels the run as a refinement and lists the changed files.
**New project** clears the active project so the next message generates from scratch.
