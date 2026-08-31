# Backend

Express API gateway for the Multi-Agent AI Software Engineering Assistant.

## Phase 1 endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Backend liveness |
| GET | `/api/status` | Backend + MongoDB status |
| GET | `/api/ai/health` | Proxied AI engine health |

## Phase 2 endpoints

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/agents/generate` | Run multi-agent project generation |

See `../docs/api/phase2-agents.md` for request/response details.

## Run (development)

```powershell
cd backend
npm install
npm run dev
```

Loads environment from the repository root `.env` file.

## Structure

```text
src/
├── config/        # env validation, MongoDB connection
├── controllers/   # request handlers
├── middleware/    # error handling
├── routes/        # Express routers
├── services/      # AI engine HTTP client
└── server.js      # entrypoint
```
