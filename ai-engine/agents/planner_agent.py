"""Planner Agent node — requirement analysis, task decomposition, and project type detection.

Detects whether the user wants a simple web app, a React SPA, a Node.js backend,
a Python API, or a full-stack project.  This drives which specialist agents run
downstream and which file layout the ArchitectAgent expands.
"""

import logging
from config.llm import invoke_with_retry, is_quota_error
from graph.state import AgentState
from agents.utils import add_log, extract_json_from_llm, get_agent_llm, llm_label

logger = logging.getLogger(__name__)

PLANNER_PROMPT_TEMPLATE = """You are an expert Software Architecture Planner.
Analyse the user request and produce a complete execution plan in ONE JSON response.

User Request:
"{user_prompt}"

Detect the project category from the request:
- "web"       → vanilla HTML/CSS/JavaScript, no framework, no backend
- "react"     → React (with or without Vite/Next.js), no dedicated backend
- "node"      → Node.js/Express backend, may include a simple HTML frontend
- "python"    → Python backend (FastAPI/Flask/Django), may include a simple HTML frontend
- "fullstack" → both a backend (Node or Python) AND a React/HTML frontend

Return ONLY a valid JSON object matching this schema exactly:
{{
  "project_name": "kebab-case-name",
  "project_type": "web|react|node|python|fullstack",
  "tech_stack": "Short stack summary e.g. 'React + Vite + CSS Modules' or 'Node.js Express + HTML/CSS/JS'",
  "tasks": [
    "Task 1: brief description",
    "Task 2: brief description",
    "Task 3: brief description",
    "Task 4: brief description"
  ],
  "design_notes": "Brief architecture overview (2-3 sentences)",
  "file_paths": ["list", "of", "source", "files"],
  "api_contract": [
    {{"route": "/api/items", "method": "GET", "request_body": "None", "response_body": "{{\\"items\\":[]}}"  }},
    {{"route": "/api/items", "method": "POST", "request_body": "{{\\"name\\":\\"string\\"}}", "response_body": "{{\\"id\\":\\"string\\",\\"name\\":\\"string\\"}}"}}
  ],
  "component_tree": ["App", "Header", "ItemList", "ItemForm"]
}}

Rules:
- "file_paths": list ONLY source files needed; exclude README.md and test files.
- "api_contract": define routes only when project_type is node, python, or fullstack; empty list [] for web/react.
- "component_tree": define component names only for react or fullstack; empty list [] otherwise.
- For web projects, keep file_paths to ["index.html", "styles.css", "app.js"].
- For react projects, include src/main.jsx, src/App.jsx, index.html, package.json, vite.config.js.
- For node projects, include server.js, package.json, and route files under routes/.
- For python projects, include main.py, requirements.txt, and route files.
- For fullstack projects, include both backend and frontend files.
"""

# Keyword → project_type mapping for fast heuristic detection without LLM
_REACT_KEYWORDS = ("react", "jsx", "next.js", "nextjs", "vite", "vue", "svelte", "nuxt")
_NODE_KEYWORDS = ("express", "node.js", "nodejs", "node backend", "rest api", "node server")
_PYTHON_KEYWORDS = ("fastapi", "flask", "django", "python api", "python backend", "fastapi server")
_FULLSTACK_KEYWORDS = ("full stack", "full-stack", "fullstack", "frontend and backend", "api and ui", "frontend + backend")


def _detect_project_type(prompt: str) -> str:
    lower = prompt.lower()
    if any(kw in lower for kw in _FULLSTACK_KEYWORDS):
        return "fullstack"
    if any(kw in lower for kw in _PYTHON_KEYWORDS):
        return "python"
    if any(kw in lower for kw in _NODE_KEYWORDS):
        return "node"
    if any(kw in lower for kw in _REACT_KEYWORDS):
        return "react"
    return "web"


def planner_agent(state: AgentState) -> dict:
    """Executes the planning phase: requirement analysis, task decomposition, project type detection."""
    logs = add_log(state.get("logs", []), "PlannerAgent", "started", "Analysing user prompt and building execution plan...")
    user_prompt = state.get("user_prompt", "Sample Application")
    existing_name = state.get("project_name", "").strip()

    llm = get_agent_llm(state, temperature=0.2, role="planner")
    if llm is None:
        logger.info("No LLM key configured. Using default planning template.")
        project_type = _detect_project_type(user_prompt)
        slug = existing_name or ("".join(c if c.isalnum() else "-" for c in user_prompt.lower())[:25].strip("-") or "generated-app")
        logs = add_log(logs, "PlannerAgent", "completed", f"Generated mock execution plan (no API key). Detected project type: {project_type}.")
        return {
            "project_name": slug,
            "project_type": project_type,
            "tech_stack": "HTML / Vanilla CSS / JavaScript",
            "tasks": [
                "Structure HTML layout and DOM containers",
                "Style components with modern CSS responsive layout",
                "Implement frontend application logic with full interactivity",
                "Add README documentation and setup instructions",
            ],
            "architecture": {},
            "api_contract": [],
            "component_tree": [],
            "logs": logs,
            "current_step": "planned",
        }

    try:
        raw = invoke_with_retry(llm, PLANNER_PROMPT_TEMPLATE.format(user_prompt=user_prompt))
        parsed = extract_json_from_llm(raw)

        project_name = existing_name or (parsed.get("project_name") or "generated-app")
        project_type = parsed.get("project_type") or _detect_project_type(user_prompt)
        tech_stack = parsed.get("tech_stack") or "Web Application Stack"
        tasks = parsed.get("tasks") or ["Project structure setup", "Feature implementation", "Testing", "Documentation"]
        api_contract = parsed.get("api_contract") or []
        component_tree = parsed.get("component_tree") or []

        architecture = {
            "design_notes": parsed.get("design_notes") or "Application architecture.",
            "file_paths": parsed.get("file_paths") or [],
        }

        logs = add_log(
            logs,
            "PlannerAgent",
            "completed",
            f"Plan created via {llm_label(llm, state)}: {len(tasks)} tasks, project_type='{project_type}', {len(api_contract)} API routes.",
        )
        return {
            "project_name": project_name,
            "project_type": project_type,
            "tech_stack": tech_stack,
            "tasks": tasks,
            "architecture": architecture,
            "api_contract": api_contract,
            "component_tree": component_tree,
            "logs": logs,
            "current_step": "planned",
        }
    except Exception as e:
        logger.error("Planner Agent error: %s", e)
        status = "quota_exceeded" if is_quota_error(e) else "error"
        logs = add_log(logs, "PlannerAgent", status, f"Planning failed: {e}")
        return {
            "error": str(e),
            "logs": logs,
            "current_step": "planning_failed",
        }
