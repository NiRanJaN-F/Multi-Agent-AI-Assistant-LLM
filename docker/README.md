# Docker images

| File | Service | Base image | Runtime port |
| --- | --- | --- | --- |
| `Dockerfile.frontend` | React (Vite) client built and served by nginx | `node:22-alpine` → `nginx:1.27-alpine` | 80 (published as 5173) |
| `Dockerfile.backend` | Node.js / Express API gateway | `node:22-alpine` | 5000 |
| `Dockerfile.ai-engine` | Python FastAPI + LangGraph agent engine | `python:3.11-slim` | 8000 |

All images are built from the **repository root** as the build context, so paths inside the
Dockerfiles are written relative to the root (for example `COPY backend/src ./src`).

`nginx.conf` serves the built SPA and proxies `/api/` to the `backend` service on the Compose network,
which is why the frontend image is built with `VITE_API_BASE_URL=/api`.

## Build and run everything

```bash
docker compose up --build
```

## Build a single image

```bash
docker build -f docker/Dockerfile.backend -t maa-backend .
docker build -f docker/Dockerfile.ai-engine -t maa-ai-engine .
docker build -f docker/Dockerfile.frontend -t maa-frontend .
```
