# Phase 4 — Generation history API

Every successful run of `POST /api/agents/generate` is persisted to MongoDB in the
`generations` collection, so past runs can be listed, inspected, and deleted from the
**History** tab of the frontend.

If MongoDB is unavailable the generation itself still succeeds; the response simply reports
`history.persisted = false` and the history endpoints answer `503`.

## Document shape

| Field | Type | Notes |
| --- | --- | --- |
| `prompt` | string | Original requirement submitted by the user |
| `projectName` | string | Project slug returned by the Planner agent |
| `provider` | string \| null | LLM provider used for the run |
| `status` | string | `completed` when the graph finished |
| `techStack` | string | Stack chosen by the Planner agent |
| `tasks` | string[] | Planner task breakdown |
| `savedFiles` | string[] | Files written under `generated-projects/<projectName>/` |
| `outputDir` | string | Absolute output directory on the AI engine host |
| `reviewResults` | object | QA agent verdict (`passed`, `issues`, `recommendations`) |
| `documentation` | string | README produced by the Doc Writer agent |
| `logs` | object[] | Per-agent execution log (`agent`, `status`, `message`, `timestamp`) |
| `llm` | object | Provider, model, and `mode` (`live` or `mock`) |
| `durationMs` | number | End-to-end backend duration of the run |
| `createdAt` / `updatedAt` | date | Mongoose timestamps |

## Endpoints

### `POST /api/agents/generate`

Unchanged request contract. The response now also contains:

```json
{
  "durationMs": 8421,
  "history": { "persisted": true, "id": "6a9704032c95f1e56a25a4cd" }
}
```

### `GET /api/agents/history?limit=20&skip=0`

Returns a paginated summary list, newest first (`limit` is clamped to 1–100).

```json
{
  "status": "ok",
  "total": 1,
  "limit": 20,
  "skip": 0,
  "items": [
    {
      "id": "6a9704032c95f1e56a25a4cd",
      "prompt": "Build a simple todo list web app",
      "projectName": "compose-smoke-test",
      "provider": "gemini",
      "status": "completed",
      "techStack": "HTML / Vanilla CSS / JavaScript",
      "llm": { "provider": "gemini", "model": "gemini-2.0-flash", "mode": "mock" },
      "durationMs": 10,
      "createdAt": "2026-09-01T16:57:39.499Z"
    }
  ]
}
```

### `GET /api/agents/history/:id`

Returns the full stored document (`{ "status": "ok", "generation": { ... } }`),
`404` when the id is unknown or malformed.

### `DELETE /api/agents/history/:id`

Deletes one stored run: `{ "status": "ok", "id": "..." }`, or `404` when not found.

## Quick verification

```bash
curl -X POST http://localhost:5000/api/agents/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Build a simple todo list web app","projectName":"demo-app"}'

curl http://localhost:5000/api/agents/history
```
