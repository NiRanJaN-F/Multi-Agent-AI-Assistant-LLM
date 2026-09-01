"""FastAPI application entrypoint for the AI engine."""

from datetime import UTC, datetime
import logging
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config.llm import get_llm_status, verify_llm_connection
from config.settings import settings
from graph.builder import create_agent_graph
from graph.state import AgentState
from services.file_manager import save_project_files

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Multi-Agent AI Assistant — AI Engine",
    version="0.4.0",
    description="Python AI engine with LangGraph multi-agent architecture and live LLM integration, persisted history, and containerized deployment (Phase 4).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent_graph = create_agent_graph()


class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="User prompt describing the requested software application.")
    project_name: Optional[str] = Field(default=None, description="Optional custom project name slug.")
    provider: Optional[str] = Field(default=None, description="LLM provider override ('gemini' or 'openai').")


class GenerateResponse(BaseModel):
    status: str
    project_name: str
    tech_stack: str
    tasks: List[str]
    saved_files: List[str]
    output_dir: str
    review_results: Dict[str, Any]
    documentation: str
    logs: List[Dict[str, Any]]
    llm: Dict[str, Any]


@app.get("/")
def root() -> dict:
    return {
        "service": "ai-engine",
        "phase": "phase-4",
        "docs": "/docs",
        "health": "/health",
        "llm_status": "/api/llm/status",
        "llm_verify": "/api/llm/verify",
        "generate": "/api/generate",
    }


@app.get("/health")
def health() -> dict:
    llm = get_llm_status()
    return {
        "status": "ok",
        "service": "ai-engine",
        "phase": "phase-4",
        "environment": settings.node_env,
        "llm": llm,
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.get("/api/llm/status")
def llm_status(provider: Optional[str] = None) -> dict:
    """Return LLM configuration status without making a live API call."""
    return get_llm_status(provider)


@app.get("/api/llm/verify")
def llm_verify(provider: Optional[str] = None) -> dict:
    """Verify the configured LLM API key and model with a lightweight test call."""
    result = verify_llm_connection(provider)
    if not result.get("reachable"):
        raise HTTPException(status_code=503, detail=result.get("message", "LLM verification failed"))
    return result


@app.post("/api/generate", response_model=GenerateResponse)
def generate_project(req: GenerateRequest) -> dict:
    """Trigger the multi-agent graph execution to generate software from a prompt."""
    logger.info("Received generation request for prompt: '%s'", req.prompt)

    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt parameter cannot be empty.")

    active_provider = (req.provider or settings.llm_provider).lower()
    llm_info = get_llm_status(active_provider)

    if llm_info["mode"] == "mock":
        logger.warning(
            "Generating in mock mode — no API key for provider '%s'.",
            active_provider,
        )

    initial_state: AgentState = {
        "user_prompt": req.prompt.strip(),
        "project_name": req.project_name or "",
        "tech_stack": "",
        "tasks": [],
        "architecture": {},
        "files": {},
        "review_results": {},
        "documentation": "",
        "logs": [],
        "current_step": "init",
        "retry_count": 0,
        "error": None,
        "llm_provider": active_provider,
    }

    try:
        final_state = agent_graph.invoke(initial_state)

        if final_state.get("error"):
            raise HTTPException(
                status_code=502,
                detail=f"Agent pipeline failed at '{final_state.get('current_step')}': {final_state['error']}",
            )

        project_name = final_state.get("project_name", "generated-app")
        generated_files = final_state.get("files", {})
        save_result = save_project_files(project_name, generated_files)

        return {
            "status": "completed",
            "project_name": project_name,
            "tech_stack": final_state.get("tech_stack", "HTML/CSS/JS"),
            "tasks": final_state.get("tasks", []),
            "saved_files": save_result.get("saved_files", []),
            "output_dir": save_result.get("output_dir", ""),
            "review_results": final_state.get("review_results", {}),
            "documentation": final_state.get("documentation", ""),
            "logs": final_state.get("logs", []),
            "llm": llm_info,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error executing agent graph")
        raise HTTPException(status_code=500, detail=f"Multi-Agent execution failed: {str(e)}")
