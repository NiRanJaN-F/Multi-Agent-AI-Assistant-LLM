# Backend

Express API gateway for the Multi-Agent AI Software Engineering Assistant.

## Phase 1 endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Backend liveness |
| GET | `/api/status` | Backend + MongoDB status |
| GET | `/api/ai/health` | Proxied AI engine health |

See `../docs/api/phase1-health.md` for response examples.

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
