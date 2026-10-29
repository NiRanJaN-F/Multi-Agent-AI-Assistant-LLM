"""FastAPI application entrypoint for the AI engine."""

from datetime import UTC, datetime
import json
import logging
from typing import Any, AsyncGenerator, Dict, Generator, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from config.llm import get_llm_status, is_quota_message, verify_llm_connection
from config.settings import settings
from graph.builder import create_agent_graph, create_refinement_graph
from graph.state import AgentState
from services.file_manager import list_projects, load_project_files, save_project_files

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Multi-Agent AI Assistant — AI Engine",
    version="0.5.0",
    description="Python AI engine with LangGraph multi-agent architecture, live LLM integration, persisted history, containerized deployment, and iterative refinement of generated projects (Phase 5).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent_graph = create_agent_graph()
refinement_graph = create_refinement_graph()

QUOTA_HINT = (
    "All configured LLM models are out of quota. Wait for the quota to reset, add a free "
    "GROQ_API_KEY or OPENROUTER_API_KEY, or run a local model with OLLAMA_ENABLED=true."
)


def _format_sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


STAGE_METADATA_GEN = {
    "planner": {"percent": 20, "message": "Planning requirements and decomposing tasks..."},
    "architect": {"percent": 35, "message": "Designing architecture contract and file manifest..."},
    "backend": {"percent": 55, "message": "Generating backend server and API routes..."},
    "frontend": {"percent": 70, "message": "Generating frontend UI and components..."},
    "coder": {"percent": 65, "message": "Writing source code files..."},
    "tester": {"percent": 80, "message": "Generating automated unit test suite..."},
    "qa": {"percent": 90, "message": "Running code quality review and static verification..."},
    "doc_writer": {"percent": 95, "message": "Generating documentation and setup guide..."},
}

STAGE_METADATA_REFINE = {
    "refine_intent": {"percent": 15, "message": "Analyzing change request intent and scope..."},
    "refine_context": {"percent": 30, "message": "Scanning project files and checkpoint context..."},
    "refine_planner": {"percent": 45, "message": "Planning minimal safe code modifications..."},
    "coder": {"percent": 65, "message": "Applying code patches to targeted files..."},
    "tester": {"percent": 80, "message": "Updating automated test suite..."},
    "qa": {"percent": 90, "message": "Running diff QA and regression checks..."},
    "doc_writer": {"percent": 95, "message": "Updating project documentation..."},
}


def _pipeline_failure(stage: str, message: str) -> HTTPException:
    """Turn an agent error into a status code the UI can explain to the user."""
    if is_quota_message(message):
        return HTTPException(status_code=429, detail=f"{QUOTA_HINT} (failed at '{stage}': {message})")
    return HTTPException(status_code=502, detail=f"Agent pipeline failed at '{stage}': {message}")


class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="User prompt describing the requested software application.")
    project_name: Optional[str] = Field(default=None, description="Optional custom project name slug.")
    provider: Optional[str] = Field(default=None, description="LLM provider override ('gemini' or 'openai').")


class RefineRequest(BaseModel):
    prompt: str = Field(..., description="Follow-up instruction describing the change to apply.")
    project_name: str = Field(..., description="Name of the previously generated project to modify.")
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
    changed_files: List[str] = []
    mode: str = "generate"
    files: Optional[Dict[str, str]] = Field(default_factory=dict)
    diff_report: Optional[Dict[str, Any]] = None
    refinement_telemetry: Optional[Dict[str, Any]] = None



@app.get("/")
def root() -> dict:
    return {
        "service": "ai-engine",
        "phase": "phase-5",
        "docs": "/docs",
        "health": "/health",
        "llm_status": "/api/llm/status",
        "llm_verify": "/api/llm/verify",
        "generate": "/api/generate",
        "generate_stream": "/api/generate/stream",
        "refine": "/api/refine",
        "refine_stream": "/api/refine/stream",
        "projects": "/api/projects",
    }


@app.get("/health")
def health() -> dict:
    llm = get_llm_status()
    return {
        "status": "ok",
        "service": "ai-engine",
        "phase": "phase-5",
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
        "existing_files": {},
        "change_request": "",
        "changed_files": [],
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
            raise _pipeline_failure(final_state.get("current_step", "unknown"), str(final_state["error"]))

        project_name = final_state.get("project_name", "generated-app")
        generated_files = final_state.get("files", {})
        save_result = save_project_files(project_name, generated_files, clean=True)

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
            "changed_files": save_result.get("saved_files", []),
            "mode": "generate",
            "files": generated_files,
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error executing agent graph")
        raise HTTPException(status_code=500, detail=f"Multi-Agent execution failed: {str(e)}")


@app.post("/api/generate/stream")
def generate_project_stream(req: GenerateRequest):
    """Execute the multi-agent graph with Server-Sent Events (SSE) streaming progress."""
    logger.info("Received streaming generation request for prompt: '%s'", req.prompt)

    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt parameter cannot be empty.")

    active_provider = (req.provider or settings.llm_provider).lower()
    llm_info = get_llm_status(active_provider)

    def event_stream() -> Generator[str, None, None]:
        yield _format_sse({"stage": "init", "message": "Initializing multi-agent graph...", "percent": 5})

        initial_state: AgentState = {
            "user_prompt": req.prompt.strip(),
            "project_name": req.project_name or "",
            "tech_stack": "",
            "tasks": [],
            "architecture": {},
            "files": {},
            "existing_files": {},
            "change_request": "",
            "changed_files": [],
            "review_results": {},
            "documentation": "",
            "logs": [],
            "current_step": "init",
            "retry_count": 0,
            "error": None,
            "llm_provider": active_provider,
        }

        accumulated_state = dict(initial_state)
        seen_files = set()

        try:
            for step_output in agent_graph.stream(initial_state):
                for node_name, node_state in step_output.items():
                    accumulated_state.update(node_state)
                    meta = STAGE_METADATA_GEN.get(
                        node_name,
                        {"percent": 50, "message": f"Executing stage '{node_name}'..."},
                    )
                    yield _format_sse({
                        "stage": node_name,
                        "message": meta["message"],
                        "percent": meta["percent"],
                    })

                    current_files = accumulated_state.get("files", {})
                    for fpath in current_files:
                        if fpath not in seen_files:
                            seen_files.add(fpath)
                            yield _format_sse({
                                "stage": "coder",
                                "file": fpath,
                                "status": "complete",
                                "message": f"Generated {fpath}",
                            })

                    if accumulated_state.get("error"):
                        err_msg = str(accumulated_state["error"])
                        yield _format_sse({"stage": "error", "message": err_msg})
                        return

            project_name = accumulated_state.get("project_name", "generated-app")
            generated_files = accumulated_state.get("files", {})
            save_result = save_project_files(project_name, generated_files, clean=True)

            final_response = {
                "status": "completed",
                "project_name": project_name,
                "tech_stack": accumulated_state.get("tech_stack", "HTML/CSS/JS"),
                "tasks": accumulated_state.get("tasks", []),
                "saved_files": save_result.get("saved_files", []),
                "output_dir": save_result.get("output_dir", ""),
                "review_results": accumulated_state.get("review_results", {}),
                "documentation": accumulated_state.get("documentation", ""),
                "logs": accumulated_state.get("logs", []),
                "llm": llm_info,
                "changed_files": save_result.get("saved_files", []),
                "mode": "generate",
                "files": generated_files,
            }

            yield _format_sse({
                "stage": "complete",
                "message": "Generation completed successfully",
                "percent": 100,
                "result": final_response,
            })
        except Exception as exc:
            logger.exception("Error during streaming generation")
            yield _format_sse({"stage": "error", "message": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/projects")
def get_projects() -> dict:
    """List the generated projects available on disk for refinement."""
    return {"projects": list_projects()}


@app.get("/api/projects/{project_name}/files")
def get_project_files(project_name: str) -> dict:
    """Return the full file content dict for a generated project."""
    try:
        files = load_project_files(project_name)
        if not files:
            raise HTTPException(status_code=404, detail=f"Project '{project_name}' not found or has no files.")
        return {"project_name": project_name, "files": files}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/refine", response_model=GenerateResponse)
def refine_project(req: RefineRequest) -> dict:
    """Apply a follow-up change request to an already generated project."""
    logger.info("Received refinement request for project '%s'", req.project_name)

    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt parameter cannot be empty.")

    existing_files = load_project_files(req.project_name)
    if not existing_files:
        raise HTTPException(
            status_code=404,
            detail=f"No generated project named '{req.project_name}' was found.",
        )

    active_provider = (req.provider or settings.llm_provider).lower()
    llm_info = get_llm_status(active_provider)

    initial_state: AgentState = {
        "user_prompt": req.prompt.strip(),
        "project_name": req.project_name,
        "tech_stack": "",
        "tasks": [],
        "architecture": {},
        "files": {},
        "existing_files": existing_files,
        "change_request": req.prompt.strip(),
        "changed_files": [],
        "review_results": {},
        "documentation": "",
        "logs": [],
        "current_step": "init",
        "retry_count": 0,
        "error": None,
        "llm_provider": active_provider,
    }

    try:
        final_state = refinement_graph.invoke(initial_state)

        if final_state.get("error"):
            raise _pipeline_failure(final_state.get("current_step", "unknown"), str(final_state["error"]))

        changed_files = final_state.get("changed_files", [])
        updated_files = {
            path: content
            for path, content in final_state.get("files", {}).items()
            if path in changed_files or path == "README.md" or path.startswith("tests/")
        }
        save_result = save_project_files(req.project_name, updated_files)

        return {
            "status": "completed",
            "project_name": req.project_name,
            "tech_stack": final_state.get("tech_stack", ""),
            "tasks": final_state.get("tasks", []),
            "saved_files": sorted(final_state.get("files", {})),
            "output_dir": save_result.get("output_dir", ""),
            "review_results": final_state.get("review_results", {}),
            "documentation": final_state.get("documentation", ""),
            "logs": final_state.get("logs", []),
            "llm": llm_info,
            "changed_files": changed_files,
            "mode": "refine",
            "files": final_state.get("files", {}),
            "diff_report": final_state.get("diff_report"),
            "refinement_telemetry": final_state.get("refinement_telemetry"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error executing refinement graph")
        raise HTTPException(status_code=500, detail=f"Refinement execution failed: {str(e)}")


@app.post("/api/refine/stream")
def refine_project_stream(req: RefineRequest):
    """Apply a follow-up change request with Server-Sent Events (SSE) streaming progress."""
    logger.info("Received streaming refinement request for project '%s'", req.project_name)

    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt parameter cannot be empty.")

    existing_files = load_project_files(req.project_name)
    if not existing_files:
        raise HTTPException(
            status_code=404,
            detail=f"No generated project named '{req.project_name}' was found.",
        )

    active_provider = (req.provider or settings.llm_provider).lower()
    llm_info = get_llm_status(active_provider)

    def event_stream() -> Generator[str, None, None]:
        yield _format_sse({"stage": "init", "message": "Initializing refinement workflow...", "percent": 5})

        initial_state: AgentState = {
            "user_prompt": req.prompt.strip(),
            "project_name": req.project_name,
            "tech_stack": "",
            "tasks": [],
            "architecture": {},
            "files": {},
            "existing_files": existing_files,
            "change_request": req.prompt.strip(),
            "changed_files": [],
            "review_results": {},
            "documentation": "",
            "logs": [],
            "current_step": "init",
            "retry_count": 0,
            "error": None,
            "llm_provider": active_provider,
        }

        accumulated_state = dict(initial_state)

        try:
            for step_output in refinement_graph.stream(initial_state):
                for node_name, node_state in step_output.items():
                    accumulated_state.update(node_state)
                    meta = STAGE_METADATA_REFINE.get(
                        node_name,
                        {"percent": 50, "message": f"Executing stage '{node_name}'..."},
                    )
                    yield _format_sse({
                        "stage": node_name,
                        "message": meta["message"],
                        "percent": meta["percent"],
                    })

                    changed = node_state.get("changed_files", [])
                    for cf in changed:
                        yield _format_sse({
                            "stage": "coder",
                            "file": cf,
                            "status": "complete",
                            "message": f"Updated {cf}",
                        })

                    if accumulated_state.get("error"):
                        err_msg = str(accumulated_state["error"])
                        yield _format_sse({"stage": "error", "message": err_msg})
                        return

            changed_files = accumulated_state.get("changed_files", [])
            updated_files = {
                path: content
                for path, content in accumulated_state.get("files", {}).items()
                if path in changed_files or path == "README.md" or path.startswith("tests/")
            }
            save_result = save_project_files(req.project_name, updated_files)

            final_response = {
                "status": "completed",
                "project_name": req.project_name,
                "tech_stack": accumulated_state.get("tech_stack", ""),
                "tasks": accumulated_state.get("tasks", []),
                "saved_files": sorted(accumulated_state.get("files", {})),
                "output_dir": save_result.get("output_dir", ""),
                "review_results": accumulated_state.get("review_results", {}),
                "documentation": accumulated_state.get("documentation", ""),
                "logs": accumulated_state.get("logs", []),
                "llm": llm_info,
                "changed_files": changed_files,
                "mode": "refine",
                "files": accumulated_state.get("files", {}),
                "diff_report": accumulated_state.get("diff_report"),
                "refinement_telemetry": accumulated_state.get("refinement_telemetry"),
            }

            yield _format_sse({
                "stage": "complete",
                "message": "Refinement completed successfully",
                "percent": 100,
                "result": final_response,
            })
        except Exception as exc:
            logger.exception("Error during streaming refinement")
            yield _format_sse({"stage": "error", "message": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
