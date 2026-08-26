# AI Engine

Python service that will host LangGraph agent workflows and expose an HTTP API
consumed by the Node.js backend.

## Setup (Windows PowerShell)

```powershell
cd ai-engine
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Layout

| Path | Purpose |
| --- | --- |
| `agents/` | Specialized agent implementations (later) |
| `graph/` | LangGraph state graphs and orchestration (later) |
| `models/` | Pydantic / domain models |
| `prompts/` | Prompt templates |
| `tools/` | Tools callable by agents |
| `services/` | Business logic helpers |
| `config/` | Settings loaders |
| `api/` | HTTP API routers (FastAPI) |
| `tests/` | Unit tests for the AI engine |

Do not place Node.js or React code in this directory.

## Run (Phase 1)

```powershell
cd ai-engine
.\.venv\Scripts\Activate.ps1
python -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

Health check: `http://127.0.0.1:8000/health`  
API docs: `http://127.0.0.1:8000/docs`
