"""FastAPI application entrypoint for the AI engine."""

from datetime import UTC, datetime
import logging
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config.settings import settings
from graph.builder import create_agent_graph
from graph.state import AgentState
from services.file_manager import save_project_files

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Multi-Agent AI Assistant — AI Engine",
    version="0.2.0",
    description="Python AI engine service featuring LangGraph multi-agent architecture (Phase 2).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate the compiled LangGraph execution graph
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


@app.get("/")
def root() -> dict:
    return {
        "service": "ai-engine",
        "phase": "phase-2",
        "docs": "/docs",
        "health": "/health",
        "generate": "/api/generate",
    }


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "ai-engine",
        "phase": "phase-2",
        "environment": settings.node_env,
        "llm_provider": settings.llm_provider,
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.post("/api/generate", response_model=GenerateResponse)
def generate_project(req: GenerateRequest) -> dict:
    """Trigger the multi-agent graph execution to generate software from a prompt."""
    logger.info(f"Received generation request for prompt: '{req.prompt}'")

    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt parameter cannot be empty.")

    initial_state: AgentState = {
        "user_prompt": req.prompt,
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
    }

    try:
        final_state = agent_graph.invoke(initial_state)

        project_name = final_state.get("project_name", "generated-app")
        generated_files = final_state.get("files", {})

        # Save files to disk in generated-projects/<project_name>/
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
        }
    except Exception as e:
        logger.exception("Error executing agent graph")
        raise HTTPException(status_code=500, detail=f"Multi-Agent execution failed: {str(e)}")
