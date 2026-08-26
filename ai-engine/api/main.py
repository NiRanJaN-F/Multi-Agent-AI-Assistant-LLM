"""FastAPI application entrypoint for the AI engine."""

from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings

app = FastAPI(
    title="Multi-Agent AI Assistant — AI Engine",
    version="0.1.0",
    description="Python AI engine service (Phase 1: health endpoints only).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict:
    return {
        "service": "ai-engine",
        "phase": "phase-1",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "ai-engine",
        "phase": "phase-1",
        "environment": settings.node_env,
        "llm_provider": settings.llm_provider,
        "timestamp": datetime.now(UTC).isoformat(),
    }
