# Phase 2 — Multi-Agent Generation API

## Overview

Phase 2 introduces a LangGraph multi-agent pipeline that generates software projects from natural language requirements.

**Agent flow:**

```text
Planner → Architect → Coder → Tester → QA → Doc Writer
                              ↑__________|  (retry up to 2x if QA fails)
```

## Backend endpoint

### `POST /api/agents/generate`

Proxies to the Python AI engine `POST /api/generate`.

**Request body**

```json
{
  "prompt": "Build a simple todo list web app",
  "projectName": "todo-app",
  "provider": "gemini"
}
```

| Field | Required | Description |
| --- | --- | --- |
| `prompt` | Yes | Software requirement / user request |
| `projectName` | No | Custom project folder name (kebab-case) |
| `provider` | No | `gemini` or `openai` (overrides `.env` default) |

**Response `200`**

```json
{
  "status": "ok",
  "project_name": "todo-app",
  "tech_stack": "HTML / Vanilla CSS / JavaScript",
  "tasks": ["Task 1: ...", "Task 2: ..."],
  "saved_files": ["index.html", "styles.css", "app.js", "tests/app.test.js", "README.md"],
  "output_dir": "D:/.../generated-projects/todo-app",
  "review_results": { "passed": true, "issues": [], "recommendations": [] },
  "documentation": "# Todo App\n...",
  "logs": [
    { "agent": "PlannerAgent", "status": "completed", "message": "...", "timestamp": "..." }
  ]
}
```

**Errors**

| Code | Cause |
| --- | --- |
| `400` | Missing or empty `prompt` |
| `503` / `504` | AI engine unreachable or timeout (5 min) |

## AI engine endpoint

### `POST /api/generate`

Direct access (used by backend proxy). Same request/response schema with `project_name` instead of `projectName`.

Interactive docs: `http://127.0.0.1:8000/docs`

## Agents

| Agent | Role |
| --- | --- |
| **PlannerAgent** | Requirement analysis and task decomposition |
| **ArchitectureAgent** | File structure and system design |
| **CoderAgent** | Source code generation per file |
| **TesterAgent** | Unit test suite generation |
| **QAAgent** | Code review and quality checks |
| **DocAgent** | README and documentation |

## Output location

Generated projects are saved to:

```text
generated-projects/<project_name>/
```

This folder content is gitignored (only `.gitkeep` is tracked).

## LLM configuration

Set at least one API key in `.env`:

```env
GEMINI_API_KEY=your-key
OPENAI_API_KEY=your-key
LLM_PROVIDER=gemini
```

Without API keys, agents use **mock/fallback templates** so the pipeline still runs for development and demos.

## Run all services

```powershell
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — AI Engine
cd ai-engine && .\.venv\Scripts\Activate.ps1
python -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Open the frontend, enter a requirement, and click **Generate project**.
