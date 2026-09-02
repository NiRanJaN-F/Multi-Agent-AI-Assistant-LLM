"""Architecture Agent node — creates and validates the system architecture contract.

Uses the ARCHITECT_PROVIDER LLM (e.g. DeepSeek R1 / Groq) when configured to produce
a structured architecture contract: directory structure, file manifest, API route map,
and component tree. All downstream specialist agents (BackendAgent, FrontendAgent,
TesterAgent) consume this contract to ensure alignment across files.
"""

import logging
from posixpath import normpath

from config.llm import invoke_with_retry, is_quota_error
from graph.state import AgentState
from agents.utils import add_log, extract_json_from_llm, get_agent_llm, llm_label

logger = logging.getLogger(__name__)

MAX_FILES = 16

DEFAULT_LAYOUTS = {
    "python": ["main.py", "requirements.txt"],
    "react": ["index.html", "src/main.jsx", "src/App.jsx", "src/styles.css", "src/components/Header.jsx", "package.json", "vite.config.js"],
    "node": ["server.js", "routes/api.js", "models/item.js", "package.json", "public/index.html"],
    "fullstack": ["server.js", "routes/api.js", "package.json", "public/index.html", "public/app.js", "public/styles.css"],
    "web": ["index.html", "styles.css", "app.js"],
}

ARCHITECT_PROMPT_TEMPLATE = """You are a Principal Software Architect.
Design the complete system architecture for a {project_type} application.

User Request: "{user_prompt}"
Tech Stack: "{tech_stack}"
Planned Tasks: {tasks}

Return ONLY a valid JSON object matching this schema:
{{
  "design_notes": "Detailed architecture design explanation (3-4 sentences)",
  "file_paths": ["server.js", "routes/api.js", "public/index.html", "public/app.js", "public/styles.css"],
  "api_contract": [
    {{"route": "/api/items", "method": "GET", "request_body": "None", "response_body": "{{\\"success\\": true, \\"data\\": []}}"}},
    {{"route": "/api/items", "method": "POST", "request_body": "{{\\"text\\": \\"string\\"}}", "response_body": "{{\\"success\\": true, \\"data\\": {{...}}}}"}},
    {{"route": "/api/items/:id", "method": "DELETE", "request_body": "None", "response_body": "{{\\"success\\": true}}"}}
  ],
  "component_tree": ["App", "Header", "ItemList", "ItemInput", "Footer"]
}}

Rules:
- "file_paths": list ALL source files needed for a complete, fully functional app. Include package.json or requirements.txt if applicable. Do NOT include test files or README.md.
- "api_contract": list all REST API endpoints the backend must provide and the frontend will consume.
- "component_tree": list main UI components/views needed.
- Keep total files between 3 and 12 files.
"""


def _default_layout(tech_stack: str, project_type: str) -> list[str]:
    """Pick a sensible file layout for the planned stack and project type."""
    stack = (tech_stack or "").lower()
    if "python" in stack or "fastapi" in stack or "flask" in stack or "django" in stack:
        return DEFAULT_LAYOUTS["python"]
    if "react" in stack or "next" in stack or "vue" in stack:
        return DEFAULT_LAYOUTS["react"]
    if "express" in stack or "node" in stack:
        return DEFAULT_LAYOUTS["node"]

    pt = (project_type or "").lower()
    if pt in DEFAULT_LAYOUTS:
        return DEFAULT_LAYOUTS[pt]

    return DEFAULT_LAYOUTS["web"]


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
    """Produces a structured system architecture contract."""
    logs = add_log(state.get("logs", []), "ArchitectureAgent", "started", "Validating file structure and system architecture...")

    tech_stack = state.get("tech_stack", "HTML/CSS/JS")
    project_type = state.get("project_type", "web")
    user_prompt = state.get("user_prompt", "")
    tasks = state.get("tasks", [])
    planned = state.get("architecture", {}) or {}

    llm = get_agent_llm(state, temperature=0.15, role="architect")

    if llm is None:
        file_paths = _sanitise(planned.get("file_paths", [])) or _default_layout(tech_stack, project_type)
        api_contract = state.get("api_contract", [])
        component_tree = state.get("component_tree", [])
        architecture = {
            "design_notes": planned.get("design_notes") or f"{tech_stack} ({project_type}) application structure.",
            "file_paths": file_paths,
        }
        logs = add_log(logs, "ArchitectureAgent", "completed", f"Applied default architecture layout ({len(file_paths)} files, {project_type} stack).")
        return {
            "architecture": architecture,
            "api_contract": api_contract,
            "component_tree": component_tree,
            "logs": logs,
            "current_step": "architected",
        }

    try:
        raw = invoke_with_retry(
            llm,
            ARCHITECT_PROMPT_TEMPLATE.format(
                project_type=project_type,
                user_prompt=user_prompt,
                tech_stack=tech_stack,
                tasks=tasks,
            ),
        )
        parsed = extract_json_from_llm(raw)

        file_paths = _sanitise(parsed.get("file_paths", [])) or _default_layout(tech_stack, project_type)
        api_contract = parsed.get("api_contract") or state.get("api_contract", [])
        component_tree = parsed.get("component_tree") or state.get("component_tree", [])
        design_notes = parsed.get("design_notes") or f"{tech_stack} application architecture."

        architecture = {
            "design_notes": design_notes,
            "file_paths": file_paths,
        }

        logs = add_log(
            logs,
            "ArchitectureAgent",
            "completed",
            f"Architecture contract created via {llm_label(llm, state)}: {len(file_paths)} files, {len(api_contract)} API endpoints.",
        )
        return {
            "architecture": architecture,
            "api_contract": api_contract,
            "component_tree": component_tree,
            "logs": logs,
            "current_step": "architected",
        }
    except Exception as e:
        logger.error("Architecture Agent error: %s", e)
        file_paths = _sanitise(planned.get("file_paths", [])) or _default_layout(tech_stack, project_type)
        architecture = {
            "design_notes": f"{tech_stack} fallback architecture.",
            "file_paths": file_paths,
        }
        logs = add_log(logs, "ArchitectureAgent", "warning", f"Architecture call failed ({e}); used fallback layout.")
        return {
            "architecture": architecture,
            "logs": logs,
            "current_step": "architected",
        }
