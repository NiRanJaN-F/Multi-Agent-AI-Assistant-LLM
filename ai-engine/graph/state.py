"""State schema for the multi-agent software engineering graph."""

from typing import Any, Dict, List, Optional, TypedDict


class LogEntry(TypedDict):
    agent: str
    status: str  # e.g., "started", "completed", "warning", "error"
    message: str
    timestamp: str


class AgentState(TypedDict):
    user_prompt: str
    project_name: str
    tech_stack: str
    tasks: List[str]
    architecture: Dict[str, Any]  # Contains directory structure, required files list, component spec
    files: Dict[str, str]  # Relative filepath -> source code content
    existing_files: Dict[str, str]  # Files already on disk when refining an existing project
    change_request: str  # Follow-up instruction driving a refinement run
    changed_files: List[str]  # Files created or modified by a refinement run
    review_results: Dict[str, Any]  # passed: bool, issues: List[str], recommendations: List[str]
    documentation: str  # README.md and setup instructions
    logs: List[LogEntry]
    current_step: str
    retry_count: int
    error: Optional[str]
    llm_provider: Optional[str]
