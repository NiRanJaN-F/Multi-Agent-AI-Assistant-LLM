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

MAX_FILES = 24

ARCHETYPE_LAYOUTS = {
    "vanilla-web": ["index.html", "styles.css", "app.js"],
    "react-spa": ["index.html", "src/main.jsx", "src/App.jsx", "src/styles.css", "package.json"],
    "react-vite-spa": [
        "index.html", "src/main.jsx", "src/App.jsx", "src/index.css",
        "src/components/Header.jsx", "package.json", "vite.config.js",
    ],
    "nextjs-app": [
        "package.json", "next.config.js", "app/layout.jsx", "app/page.jsx",
        "app/globals.css", "components/Header.jsx",
    ],
    "vue-spa": ["index.html", "src/main.js", "src/App.vue", "package.json", "vite.config.js"],
    "node-express-api": [
        "server.js", "package.json", "routes/api.js", "routes/items.js",
        "models/item.js", "middleware/errorHandler.js", ".env.example",
    ],
    "node-express-mvc": [
        "server.js", "package.json", "routes/api.js", "controllers/itemController.js",
        "models/item.js", "public/index.html", "public/app.js", "public/styles.css",
    ],
    "python-fastapi": [
        "main.py", "requirements.txt", "routers/items.py",
        "models/item.py", "schemas/item.py", "database.py", ".env.example",
    ],
    "python-flask": [
        "app.py", "requirements.txt", "routes/items.py",
        "models.py", "config.py", ".env.example",
    ],
    "django-app": [
        "manage.py", "requirements.txt", "app/settings.py", "app/urls.py",
        "api/models.py", "api/serializers.py", "api/views.py", "api/urls.py",
    ],
    "fullstack-react-node": [
        "backend/server.js", "backend/package.json", "backend/routes/api.js", "backend/models/item.js",
        "frontend/index.html", "frontend/src/main.jsx", "frontend/src/App.jsx",
        "frontend/src/components/ItemList.jsx", "frontend/src/components/ItemForm.jsx",
        "frontend/package.json", "frontend/vite.config.js",
    ],
    "fullstack-react-python": [
        "backend/main.py", "backend/requirements.txt", "backend/routers/items.py", "backend/schemas/item.py",
        "frontend/index.html", "frontend/src/main.jsx", "frontend/src/App.jsx",
        "frontend/src/components/ItemList.jsx", "frontend/src/components/ItemForm.jsx",
        "frontend/package.json", "frontend/vite.config.js",
    ],
    "cli-tool": ["main.py", "requirements.txt", "commands/__init__.py", "commands/core.py"],
    "data-script": ["main.py", "requirements.txt", "utils/data_loader.py", "utils/analyzer.py"],
}

DEFAULT_LAYOUTS = {
    "python": ARCHETYPE_LAYOUTS["python-fastapi"],
    "react": ARCHETYPE_LAYOUTS["react-vite-spa"],
    "node": ARCHETYPE_LAYOUTS["node-express-api"],
    "fullstack": ARCHETYPE_LAYOUTS["fullstack-react-node"],
    "web": ARCHETYPE_LAYOUTS["vanilla-web"],
}

ARCHITECT_PROMPT_TEMPLATE = """You are a Principal Software Architect.
Design the {project_type} application architecture and output ONE compact JSON contract.

User Request: "{user_prompt}"
Tech Stack: "{tech_stack}"
Planned Tasks: {tasks}

Return ONLY valid JSON:
{{
  "design_notes": "3-4 sentence architecture design.",
  "file_paths": ["server.js", "routes/api.js", "public/index.html", ...],
  "api_contract": [
    {{"route": "/api/x", "method": "GET", "request_body": "None", "response_body": "{{\\"success\\": true}}"}},
    {{"route": "/api/x", "method": "POST", "request_body": "{{\\"name\\": \\"string\\"}}", "response_body": "{{\\"success\\": true}}"}},
    {{"route": "/api/x/:id", "method": "DELETE", "request_body": "None", "response_body": "{{\\"success\\": true}}"}}
  ],
  "component_tree": ["App", "Header", "List", "Form", "Footer"]
}}

Rules:
- file_paths: ALL source files for a complete app (include package.json/requirements.txt). No README/tests. 3-18 files.
- api_contract: all REST endpoints. [] for web/react-only.
- component_tree: main UI components. [] for backend-only.
"""


def _default_layout(tech_stack: str, project_type: str, archetype_id: str | None = None) -> list[str]:
    """Pick a sensible file layout, preferring planner-detected archetype when available."""
    if archetype_id and archetype_id in ARCHETYPE_LAYOUTS:
        return list(ARCHETYPE_LAYOUTS[archetype_id])

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
    """Produces structured architecture contract. Skips LLM when planner archetype confidence ≥0.7 (token-free)."""
    logs = add_log(state.get("logs", []), "ArchitectureAgent", "started", "Validating file structure and system architecture...")

    tech_stack = state.get("tech_stack", "HTML/CSS/JS")
    project_type = state.get("project_type", "web")
    user_prompt = state.get("user_prompt", "")
    tasks = state.get("tasks", [])
    planned = state.get("architecture", {}) or {}
    archetype_id = state.get("archetype_id")
    archetype_conf = state.get("archetype_confidence", 0.0)

    planner_file_paths = _sanitise(planned.get("file_paths", []))
    planner_api = state.get("api_contract", [])
    planner_components = state.get("component_tree", [])
    planner_notes = planned.get("design_notes") or ""

    if archetype_conf >= 0.7 and len(planner_file_paths) >= 3:
        architecture = {
            "design_notes": planner_notes or f"Archetype '{archetype_id}' {tech_stack} ({project_type}) structure — planner-detected, LLM skipped.",
            "file_paths": planner_file_paths,
        }
        logs = add_log(
            logs,
            "ArchitectureAgent",
            "completed",
            f"Archetype '{archetype_id}' validated (conf={archetype_conf:.2f}). {len(planner_file_paths)} files, {len(planner_api)} API routes. Architect LLM SKIPPED (token-free).",
        )
        return {
            "architecture": architecture,
            "api_contract": planner_api,
            "component_tree": planner_components,
            "logs": logs,
            "current_step": "architected",
        }

    llm = get_agent_llm(state, temperature=0.15, role="architect")

    if llm is None:
        file_paths = planner_file_paths or _default_layout(tech_stack, project_type, archetype_id)
        api_contract = planner_api
        component_tree = planner_components
        architecture = {
            "design_notes": planner_notes or f"{tech_stack} ({project_type}) application structure.",
            "file_paths": file_paths,
        }
        logs = add_log(logs, "ArchitectureAgent", "completed", f"Applied default architecture layout ({len(file_paths)} files, {project_type} stack — no LLM key).")
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

        file_paths = _sanitise(parsed.get("file_paths", [])) or planner_file_paths or _default_layout(tech_stack, project_type, archetype_id)
        api_contract = parsed.get("api_contract") or planner_api
        component_tree = parsed.get("component_tree") or planner_components
        design_notes = parsed.get("design_notes") or planner_notes or f"{tech_stack} application architecture."

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
        file_paths = planner_file_paths or _default_layout(tech_stack, project_type, archetype_id)
        architecture = {
            "design_notes": planner_notes or f"{tech_stack} fallback architecture.",
            "file_paths": file_paths,
        }
        logs = add_log(logs, "ArchitectureAgent", "warning", f"Architecture call failed ({e}); used planner/archetype fallback layout.")
        return {
            "architecture": architecture,
            "api_contract": planner_api,
            "component_tree": planner_components,
            "logs": logs,
            "current_step": "architected",
        }
