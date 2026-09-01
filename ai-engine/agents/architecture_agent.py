"""Architecture Agent node that validates and normalises the planned file structure.

The Planner returns the file layout together with the plan in a single LLM call, so this node
does no LLM work: it sanitises those paths and fills in a stack-appropriate default when the
plan is missing or unusable. That keeps a full run at two LLM calls (Planner + Coder).
"""

import logging
from posixpath import normpath

from graph.state import AgentState
from agents.utils import add_log

logger = logging.getLogger(__name__)

MAX_FILES = 12

DEFAULT_LAYOUTS = {
    "python": ["main.py", "requirements.txt"],
    "react": ["index.html", "src/main.jsx", "src/App.jsx", "src/styles.css", "package.json"],
    "node": ["server.js", "package.json", "public/index.html"],
}
DEFAULT_WEB_LAYOUT = ["index.html", "styles.css", "app.js"]


def _default_layout(tech_stack: str) -> list[str]:
    """Pick a sensible file layout for the planned stack."""
    stack = tech_stack.lower()

    if "python" in stack or "fastapi" in stack or "django" in stack or "flask" in stack:
        return DEFAULT_LAYOUTS["python"]
    if "react" in stack or "next" in stack or "vue" in stack:
        return DEFAULT_LAYOUTS["react"]
    if "express" in stack or "node" in stack:
        return DEFAULT_LAYOUTS["node"]
    return DEFAULT_WEB_LAYOUT


def _sanitise(file_paths: list) -> list[str]:
    """Drop absolute paths, traversal, README, and duplicates from the planned layout."""
    cleaned: list[str] = []

    for raw in file_paths:
        if not isinstance(raw, str):
            continue

        path = normpath(raw.strip().replace("\\", "/").lstrip("/"))
        if not path or path.startswith("..") or path == "." or path.lower().startswith("readme"):
            continue
        if path in cleaned:
            continue

        cleaned.append(path)

    return cleaned[:MAX_FILES]


def architecture_agent(state: AgentState) -> dict:
    """Validates the planned file structure without spending an extra LLM call."""
    logs = add_log(state.get("logs", []), "ArchitectureAgent", "started", "Validating file structure and system architecture...")

    tech_stack = state.get("tech_stack", "HTML/CSS/JS")
    planned = state.get("architecture", {}) or {}
    file_paths = _sanitise(planned.get("file_paths", []))

    if file_paths:
        message = f"Blueprint validated: {len(file_paths)} files."
        status = "completed"
    else:
        file_paths = _default_layout(tech_stack)
        status = "warning" if planned.get("file_paths") else "completed"
        message = f"Applied default {tech_stack} structure ({len(file_paths)} files)."

    architecture = {
        "design_notes": planned.get("design_notes") or f"{tech_stack} application structure.",
        "file_paths": file_paths,
    }

    logs = add_log(logs, "ArchitectureAgent", status, message)

    return {
        "architecture": architecture,
        "logs": logs,
        "current_step": "architected",
    }
