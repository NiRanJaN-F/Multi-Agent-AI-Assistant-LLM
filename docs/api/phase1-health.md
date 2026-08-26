# Phase 1 — Health & Status API

Base URL (development): `http://localhost:5000/api`

## Backend endpoints

### `GET /api/health`

Basic backend liveness check.

**Response `200`**

```json
{
  "status": "ok",
  "service": "backend",
  "phase": "phase-1",
  "timestamp": "2026-08-26T06:00:00.000Z"
}
```

### `GET /api/status`

Extended backend status including MongoDB connection state.

**Response `200`**

```json
{
  "status": "ok",
  "service": "backend",
  "phase": "phase-1",
  "environment": "development",
  "uptimeSeconds": 42,
  "timestamp": "2026-08-26T06:00:00.000Z",
  "database": {
    "status": "connected",
    "readyState": 1,
    "name": "multi_agent_assistant",
    "host": "127.0.0.1"
  },
  "aiEngineUrl": "http://127.0.0.1:8000"
}
```

When MongoDB is unavailable, `status` is `degraded` and `database.status` is `disconnected`.

### `GET /api/ai/health`

Proxies a health check to the Python AI engine.

**Response `200`** — AI engine reachable

```json
{
  "status": "ok",
  "service": "ai-engine-proxy",
  "timestamp": "2026-08-26T06:00:00.000Z",
  "aiEngine": {
    "reachable": true,
    "status": "ok",
    "httpStatus": 200,
    "data": {
      "status": "ok",
      "service": "ai-engine",
      "phase": "phase-1"
    }
  }
}
```

**Response `503`** — AI engine unreachable or not running

## AI engine endpoints

Base URL (development): `http://127.0.0.1:8000`

### `GET /health`

```json
{
  "status": "ok",
  "service": "ai-engine",
  "phase": "phase-1",
  "environment": "development",
  "llm_provider": "gemini",
  "timestamp": "2026-08-26T06:00:00.000Z"
}
```

Interactive docs: `http://127.0.0.1:8000/docs`

## Running all services (Windows)

```powershell
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — AI Engine
cd ai-engine
.\.venv\Scripts\Activate.ps1
python -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 3 — Frontend
cd frontend
npm run dev
```

Ensure `.env` exists at the repository root (`copy .env.example .env`).
