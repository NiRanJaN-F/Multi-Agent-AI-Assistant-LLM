# Multi-Agent AI Software Engineering Assistant

A final-year project that uses Large Language Models and agentic AI to assist with software engineering tasks such as requirement analysis, UI design, code generation, testing, documentation, and deployment support.

> **Status:** Phase 5 — iterative refinement: after the first prompt generates a project, follow-up
> prompts modify that same project on disk instead of starting over. Phases 1–4 (agent pipeline,
> live LLM integration, chat UI, MongoDB history, Docker stack, CI) are complete.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React.js (Vite) |
| Backend | Node.js + Express.js |
| Database | MongoDB |
| AI Engine | Python |
| Agent Framework | LangGraph |
| LLM Providers | Gemini / Groq / OpenRouter / Ollama (local) / OpenAI |
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Version Control | Git + GitHub |

## Architecture (logical flow)

```text
React UI
    ↓
Node.js / Express API
    ↓
Python AI Engine
    ↓
LangGraph
    ↓
Specialized AI Agents
    ↓
LLM Provider (Gemini / Groq / OpenRouter / Ollama / OpenAI)
```

## Repository Structure

```text
.
├── frontend/              # React.js client
├── backend/               # Node.js / Express API
├── ai-engine/             # Python AI engine + LangGraph agents
├── generated-projects/    # Projects produced by agents (gitignored content)
├── docs/                  # Project documentation
├── tests/                 # Cross-service integration and e2e tests
├── docker/                # Dockerfiles + nginx config for each service
├── config/                # Shared non-secret configuration
├── scripts/               # Setup and utility scripts
├── .github/workflows/     # GitHub Actions (tests + image builds)
├── .env.example           # Environment variable template
├── docker-compose.yml     # Full stack: frontend, backend, ai-engine, mongodb
└── README.md
```

## Prerequisites

- Git
- Node.js **22 LTS** + npm (Vite 8 requires Node `^20.19` or `>=22.12`; see `.nvmrc`)
- Python 3.11+ + pip
- MongoDB (local Community Server **or** Atlas) — optional, only needed for generation history
- Docker Desktop (for the containerized stack)
- An LLM provider key — optional; free options are Gemini, Groq, OpenRouter, or a local Ollama
  install. Without any of them the agents run in deterministic mock mode

Developed on Windows 11; the stack also runs on Linux and macOS.

## Initial Setup

### 1. Clone the repository

```bash
git clone <REPOSITORY_URL>
cd multi-agent-ai-assistant
```

### 2. Environment variables

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

Edit `.env` and fill in `MONGODB_URI` and LLM API keys when needed.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Backend

```bash
cd backend
npm install
npm run dev
```

### 5. AI Engine

```bash
cd ai-engine
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

### 6. Run all services locally

Use three terminals — backend (`npm run dev`), AI engine (`uvicorn` above), frontend (`npm run dev`).

Open the frontend URL and use the **Chat** tab to describe a requirement, the **Form** tab for the
classic single-shot generator, and the **History** tab to browse past runs stored in MongoDB.

### Iterative development (Phase 5)

In the **Chat** tab the first message generates a new project. Every message after that is treated as
a change request against the same project: the AI engine reloads the files from
`generated-projects/<project-name>/`, plans the minimal set of files to touch, rewrites them in
place, and re-runs the Tester, QA, and Doc Writer agents. The result shows which files changed.
Press **New project** to start a fresh generation.

```text
"Build a task management app"        → generated-projects/task-management-app/
"Add a dark mode toggle"             → same folder, only the affected files rewritten
```

In mock mode (no API key) refinement is deterministic — it marks the targeted files with a change
note rather than writing real feature code. Configure any provider key for actual code edits.

### LLM quota budget and provider fallback

Free Gemini tiers allow as few as 20 requests per day, so the pipeline is deliberately cheap: a full
run costs **2 LLM calls** — Planner (plan + architecture in one response) and Coder (all files in one
response). Architect, Tester, QA, and Doc Writer are deterministic and never touch the provider. A
refinement run also costs 2 calls.

When a model returns a quota/rate-limit error — or has been retired by the provider, as
`gemini-2.0-flash` was — the engine does not retry it; it moves straight to the next candidate: the
selected provider's models first, then the other configured providers in this order, free ones
before paid OpenAI, which is only used when its key is set:

```text
Gemini → Groq → OpenRouter → Ollama (local) → OpenAI → deterministic mock templates
```

Every key is optional and unconfigured providers are skipped, so the chain is as long as you make
it. If every candidate is exhausted the API answers `429` with an actionable message instead of
hanging until the request times out. `GET /api/llm/status` reports the active provider, the
providers currently usable, and the exact fallback chain.

| Provider | Free tier | Key |
| --- | --- | --- |
| Gemini | ~20 requests/day | https://aistudio.google.com/apikey |
| Groq | thousands of requests/day, OpenAI-compatible | https://console.groq.com/keys |
| OpenRouter | `:free` models (availability varies) | https://openrouter.ai/keys |
| Ollama | unlimited, runs on your machine, no network | none — install https://ollama.com |
| OpenAI | paid only | https://platform.openai.com/api-keys |

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODELS=gemini-flash-latest,gemini-flash-lite-latest
GROQ_API_KEY=              # largest free tier — recommended primary
OPENROUTER_API_KEY=
OLLAMA_ENABLED=false       # true after `ollama pull qwen2.5-coder:7b`
LLM_PROVIDER=gemini        # which provider is tried first
```

Ollama runs on the host, not in Compose: install it, pull a model, set `OLLAMA_ENABLED=true`, and
the container reaches it through `http://host.docker.internal:11434/v1`.

### 7. Run everything with Docker (recommended for demos)

```bash
cp .env.example .env
docker compose up --build
```

Frontend `http://localhost:5173`, backend `http://localhost:5000/api/status`,
AI engine `http://localhost:8000/docs`, MongoDB `mongodb://localhost:27017`.

## Tests

```bash
cd ai-engine && python -m unittest discover -s tests -v   # 42 agent/graph/API/refinement/fallback tests
cd backend  && npm test                                   # Express API tests (node --test)
cd frontend && npm run lint && npm run build              # oxlint + production build
```

The same three suites plus the three Docker image builds run in GitHub Actions on every pull request.

## Documentation

| Document | Contents |
| --- | --- |
| `docs/api/phase1-health.md` | Health and status endpoints |
| `docs/api/phase2-agents.md` | LangGraph agent pipeline and generation API |
| `docs/api/phase3-llm.md` | LLM configuration and verification |
| `docs/api/phase4-history.md` | MongoDB generation history API |
| `docs/api/phase5-refinement.md` | Iterative refinement API |
| `docs/setup/docker.md` | Docker Compose stack |
| `.github/workflows/README.md` | CI/CD pipelines |

## Current Project Status

- [x] Monorepo structure
- [x] Frontend scaffold (Vite + React)
- [x] Backend scaffold (Express)
- [x] Python AI engine scaffold + LangGraph dependencies
- [x] Environment templates and `.gitignore`
- [x] Phase 1 API routes and MongoDB connection
- [x] AI engine FastAPI `/health` endpoint
- [x] Backend → AI engine health proxy
- [x] Frontend health dashboard
- [x] LangGraph multi-agent workflow (Planner → Doc Writer)
- [x] `POST /api/agents/generate` project generation
- [x] Frontend agent generator UI
- [x] Live LLM integration (Gemini / Groq / OpenRouter / Ollama / OpenAI)
- [x] LLM status & verify endpoints
- [x] Chat-based workflow UI
- [x] MongoDB generation history (`/api/agents/history`)
- [x] Full Docker multi-service setup (frontend, backend, AI engine, MongoDB)
- [x] GitHub Actions CI/CD pipelines (tests + image builds)
- [x] Automated test suites for all three services
- [x] Iterative refinement of an existing project (`POST /api/agents/refine`)
- [x] 2-call-per-run pipeline with model/provider fallback and fast `429` quota errors
- [x] Free multi-provider chain (Gemini → Groq → OpenRouter → Ollama → OpenAI → mock)
- [ ] Authentication and per-user history
- [ ] Download generated project as ZIP + in-browser file preview
- [ ] Public cloud deployment

## License

Recommended for academic projects.
