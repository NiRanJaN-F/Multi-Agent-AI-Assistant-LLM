# Containerized setup (Docker Compose)

The whole system — MongoDB, AI engine, backend, and frontend — runs with a single command.

## 1. Prepare environment variables

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

Set `GEMINI_API_KEY` or `OPENAI_API_KEY` for live LLM mode. Without a key the agents still run
in deterministic **mock** mode, which is useful for demos and CI.

Compose reads the root `.env` automatically. `MONGODB_URI` and `AI_ENGINE_URL` are overridden
inside the Compose network (`mongodb://mongodb:27017/...`, `http://ai-engine:8000`), so the
values in `.env` only affect non-Docker local runs.

## 2. Start the stack

```bash
docker compose up --build
```

| Service | URL | Notes |
| --- | --- | --- |
| Frontend | http://localhost:5173 | nginx serving the built SPA, proxying `/api/` to the backend |
| Backend | http://localhost:5000/api/status | Express API gateway |
| AI engine | http://localhost:8000/docs | FastAPI + LangGraph agents |
| MongoDB | mongodb://localhost:27017 | Data kept in the `mongo-data` volume |

Generated projects are written to the AI engine container and bind-mounted back to
`./generated-projects` on the host.

## 3. Verify

```bash
curl http://localhost:5000/api/status
curl http://localhost:5000/api/ai/health
curl -X POST http://localhost:5000/api/agents/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Build a simple todo list web app","projectName":"demo-app"}'
curl http://localhost:5000/api/agents/history
```

## 4. Stop

```bash
docker compose down          # keep stored history
docker compose down -v       # also drop the MongoDB volume
```
