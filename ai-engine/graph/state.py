"""State schema for the multi-agent software engineering graph."""

from typing import Any, Dict, List, Literal, Optional, TypedDict


class LogEntry(TypedDict):
    agent: str
    status: str  # e.g., "started", "completed", "warning", "error"
    message: str
    timestamp: str


# Recognised project categories — drives which specialist agents run.
ProjectType = Literal["web", "react", "node", "python", "fullstack"]


class AgentState(TypedDict):
    # ── Core inputs ──────────────────────────────────────────────────────────
    user_prompt: str
    project_name: str
    tech_stack: str
    project_type: ProjectType          # detected by PlannerAgent

    # ── Planning ─────────────────────────────────────────────────────────────
    tasks: List[str]

    # ── Architecture contract (produced by ArchitectAgent, consumed by all coders)
    architecture: Dict[str, Any]       # file_paths, design_notes
    api_contract: List[Dict[str, Any]] # [{route, method, request_body, response_body}]
    component_tree: List[str]          # React component names / pages

    # ── Generated code ───────────────────────────────────────────────────────
    files: Dict[str, str]              # All files merged: path -> content
    backend_files: Dict[str, str]      # Server-side files only
    frontend_files: Dict[str, str]     # Client-side files only

    # ── Refinement ───────────────────────────────────────────────────────────
    existing_files: Dict[str, str]     # Files already on disk when refining
    change_request: str                # Follow-up instruction
    changed_files: List[str]           # Files modified by a refinement run

    # ── Quality & docs ───────────────────────────────────────────────────────
    review_results: Dict[str, Any]     # passed: bool, issues: list, recommendations: list
    documentation: str                 # README.md and setup instructions

    # ── Pipeline metadata ────────────────────────────────────────────────────
    logs: List[LogEntry]
    current_step: str
    retry_count: int
    error: Optional[str]
    llm_provider: Optional[str]
