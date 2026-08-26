# Multi-Agent AI Software Engineering Assistant

A final-year project that uses Large Language Models and agentic AI to assist with software engineering tasks such as requirement analysis, UI design, code generation, testing, documentation, and deployment support.

> **Status:** Phase 1 — backend API foundation, MongoDB connection, AI engine health proxy, and frontend health dashboard are implemented. LangGraph agents are not implemented yet.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React.js (Vite) |
| Backend | Node.js + Express.js |
| Database | MongoDB |
| AI Engine | Python |
| Agent Framework | LangGraph |
| LLM Providers | Gemini API / OpenAI API |
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
LLM Provider (Gemini / OpenAI)
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
├── docker/                # Dockerfiles (scaffolded)
├── config/                # Shared non-secret configuration
├── scripts/               # Setup and utility scripts
├── .github/workflows/     # GitHub Actions (scaffolded)
├── .env.example           # Environment variable template
├── docker-compose.yml     # Compose scaffold
└── README.md
```

## Prerequisites

- Windows 11
- Git
- Node.js (LTS) + npm
- Python 3.11+ + pip
- MongoDB (local Community Server **or** Atlas)
- Docker Desktop (for later containerization)
- VS Code
- Gemini and/or OpenAI API keys (for later AI phases)

## Initial Setup

### 1. Clone the repository

```bash
git clone <REPOSITORY_URL>
cd multi-agent-ai-assistant
```

### 2. Environment variables

```bash
copy .env.example .env
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

### 6. Run all services (Phase 1)

Use three terminals — backend (`npm run dev`), AI engine (`uvicorn` above), frontend (`npm run dev`).

Open the frontend URL and confirm backend, MongoDB, and AI engine status cards are green when all services are running.

See `docs/api/phase1-health.md` for endpoint details.

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
- [ ] LangGraph agent workflows
- [ ] Full Docker multi-service setup
- [ ] GitHub Actions CI/CD pipelines

## License

Recommended for academic projects.
