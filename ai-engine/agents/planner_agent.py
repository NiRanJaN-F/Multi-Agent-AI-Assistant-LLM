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
Analyse the request and output ONE compact JSON plan.

User Request:
"{user_prompt}"

Project category (choose 1):
web|react|node|python|fullstack

Return ONLY valid JSON matching:
{{
  "project_name": "kebab-case-name",
  "project_type": "web|react|node|python|fullstack",
  "tech_stack": "Short stack e.g. 'React+Vite+CSS' or 'Node Express+HTML/CSS/JS'",
  "tasks": ["Task1 brief", "Task2 brief", "Task3 brief", "Task4 brief"],
  "design_notes": "2-3 sentence architecture overview.",
  "file_paths": ["list", "of", "source", "files"],
  "api_contract": [{{"route": "/api/x", "method": "GET", "request_body": "None", "response_body": "{{...}}"}}],
  "component_tree": ["App", "Header", "List", "Form"]
}}

Rules:
- file_paths: source only, no README/tests. web→3 files, react→src/main.jsx+App.jsx+index.html+package.json+vite.config.js, node→server.js+package.json+routes/*.js, python→main.py+requirements.txt+routers/*.py, fullstack→both sides.
- api_contract: only for node/python/fullstack; [] otherwise.
- component_tree: only for react/fullstack; [] otherwise.
"""

from difflib import SequenceMatcher

_ARCHETYPE_DEFS = {
    "vanilla-web": {
        "project_type": "web",
        "tech_stack": "HTML5 / Vanilla CSS / JavaScript (ES6+)",
        "keywords": (
            "landing page", "portfolio", "simple website", "static site", "html css js",
            "vanilla js", "plain html", "webpage", "homepage", "single page website",
        ),
        "file_paths": ["index.html", "styles.css", "app.js"],
    },
    "react-spa": {
        "project_type": "react",
        "tech_stack": "React 19 / CDN imports / CSS Modules",
        "keywords": ("react app", "react component", "react ui", "jsx app"),
        "file_paths": ["index.html", "src/main.jsx", "src/App.jsx", "src/styles.css", "package.json"],
    },
    "react-vite-spa": {
        "project_type": "react",
        "tech_stack": "React 19 + Vite 8 + CSS Modules",
        "keywords": (
            "react vite", "vite react", "react spa", "single page application",
            "react dashboard", "react app with vite",
        ),
        "file_paths": [
            "index.html", "src/main.jsx", "src/App.jsx", "src/index.css",
            "src/components/Header.jsx", "package.json", "vite.config.js",
        ],
    },
    "nextjs-app": {
        "project_type": "react",
        "tech_stack": "Next.js 14 (App Router) + React 19",
        "keywords": ("next.js", "nextjs", "next app", "next.js app router", "ssr react"),
        "file_paths": [
            "package.json", "next.config.js", "app/layout.jsx", "app/page.jsx",
            "app/globals.css", "components/Header.jsx",
        ],
    },
    "vue-spa": {
        "project_type": "react",
        "tech_stack": "Vue 3 + Vite",
        "keywords": ("vue app", "vue.js", "vuejs", "nuxt", "vue 3"),
        "file_paths": ["index.html", "src/main.js", "src/App.vue", "package.json", "vite.config.js"],
    },
    "node-express-api": {
        "project_type": "node",
        "tech_stack": "Node.js 22 + Express 5 REST API",
        "keywords": (
            "node backend", "node.js api", "express api", "node rest api",
            "express server", "node server", "express backend", "rest api node",
        ),
        "file_paths": [
            "server.js", "package.json", "routes/api.js", "routes/items.js",
            "models/item.js", "middleware/errorHandler.js", ".env.example",
        ],
    },
    "node-express-mvc": {
        "project_type": "node",
        "tech_stack": "Node.js 22 + Express 5 MVC with static HTML frontend",
        "keywords": ("node mvc", "express website", "node.js website", "express static"),
        "file_paths": [
            "server.js", "package.json", "routes/api.js", "controllers/itemController.js",
            "models/item.js", "public/index.html", "public/app.js", "public/styles.css",
        ],
    },
    "python-fastapi": {
        "project_type": "python",
        "tech_stack": "Python 3.12 + FastAPI + Pydantic v2 + Uvicorn",
        "keywords": (
            "fastapi", "python api", "fastapi server", "python rest api",
            "fastapi backend", "uvicorn", "pydantic",
        ),
        "file_paths": [
            "main.py", "requirements.txt", "routers/items.py",
            "models/item.py", "schemas/item.py", "database.py", ".env.example",
        ],
    },
    "python-flask": {
        "project_type": "python",
        "tech_stack": "Python 3.12 + Flask 3 + SQLAlchemy",
        "keywords": ("flask", "flask app", "flask api", "python flask", "flask server"),
        "file_paths": [
            "app.py", "requirements.txt", "routes/items.py",
            "models.py", "config.py", ".env.example",
        ],
    },
    "django-app": {
        "project_type": "python",
        "tech_stack": "Python 3.12 + Django 5 + Django REST Framework",
        "keywords": ("django", "django app", "django rest", "drf", "django project"),
        "file_paths": [
            "manage.py", "requirements.txt", "app/settings.py", "app/urls.py",
            "api/models.py", "api/serializers.py", "api/views.py", "api/urls.py",
        ],
    },
    "fullstack-react-node": {
        "project_type": "fullstack",
        "tech_stack": "React 19 + Vite frontend · Node.js Express 5 backend · REST API",
        "keywords": (
            "full stack", "full-stack", "fullstack", "frontend and backend",
            "api and ui", "frontend + backend", "react node", "react express",
            "mern", "react and node",
        ),
        "file_paths": [
            "backend/server.js", "backend/package.json", "backend/routes/api.js", "backend/models/item.js",
            "frontend/index.html", "frontend/src/main.jsx", "frontend/src/App.jsx",
            "frontend/src/components/ItemList.jsx", "frontend/src/components/ItemForm.jsx",
            "frontend/package.json", "frontend/vite.config.js",
        ],
    },
    "fullstack-react-python": {
        "project_type": "fullstack",
        "tech_stack": "React 19 + Vite frontend · Python FastAPI backend · REST API",
        "keywords": (
            "fastapi react", "react fastapi", "fullstack python", "python react",
            "flask react", "django react", "fullstack fastapi",
        ),
        "file_paths": [
            "backend/main.py", "backend/requirements.txt", "backend/routers/items.py", "backend/schemas/item.py",
            "frontend/index.html", "frontend/src/main.jsx", "frontend/src/App.jsx",
            "frontend/src/components/ItemList.jsx", "frontend/src/components/ItemForm.jsx",
            "frontend/package.json", "frontend/vite.config.js",
        ],
    },
    "cli-tool": {
        "project_type": "python",
        "tech_stack": "Python 3.12 + Click / Typer CLI",
        "keywords": ("cli", "command line", "terminal app", "shell tool", "console app", "cli tool"),
        "file_paths": ["main.py", "requirements.txt", "commands/__init__.py", "commands/core.py"],
    },
    "data-script": {
        "project_type": "python",
        "tech_stack": "Python 3.12 + Pandas data processing script",
        "keywords": ("data analysis", "pandas", "data script", "csv processor", "excel script", "data processing"),
        "file_paths": ["main.py", "requirements.txt", "utils/data_loader.py", "utils/analyzer.py"],
    },
}

_REACT_KEYWORDS = ("react", "jsx", "next.js", "nextjs", "vite", "vue", "svelte", "nuxt")
_NODE_KEYWORDS = ("express", "node.js", "nodejs", "node backend", "rest api", "node server")
_PYTHON_KEYWORDS = ("fastapi", "flask", "django", "python api", "python backend", "fastapi server")
_FULLSTACK_KEYWORDS = ("full stack", "full-stack", "fullstack", "frontend and backend", "api and ui", "frontend + backend")


def _detect_archetype(prompt: str) -> tuple[str, float, str]:
    """2-phase keyword-first archetype detection (0 tokens). Returns (archetype_id, confidence 0-1.0, project_type)."""
    lower = prompt.lower()
    stripped = lower.strip()
    best_id = "vanilla-web"
    best_score = 0.0

    for arch_id, arch in _ARCHETYPE_DEFS.items():
        hit_count = sum(1 for kw in arch["keywords"] if kw in lower)
        if hit_count == 0:
            continue
        kw_ratio = hit_count / max(1, len(arch["keywords"]))
        prompt_len_ratio = min(1.0, len(stripped) / 80.0)
        score = (0.7 * kw_ratio) + (0.3 * min(1.0, hit_count / 3.0))
        if len(stripped) < 60:
            score *= prompt_len_ratio
        if score > best_score:
            best_score = score
            best_id = arch_id

    if best_score < 0.25:
        if any(kw in lower for kw in _FULLSTACK_KEYWORDS):
            best_id = "fullstack-react-node"
            best_score = 0.5
        elif any(kw in lower for kw in _PYTHON_KEYWORDS):
            best_id = "python-fastapi"
            best_score = 0.5
        elif any(kw in lower for kw in _NODE_KEYWORDS):
            best_id = "node-express-api"
            best_score = 0.5
        elif any(kw in lower for kw in _REACT_KEYWORDS):
            best_id = "react-vite-spa"
            best_score = 0.5

    project_type = _ARCHETYPE_DEFS[best_id]["project_type"]
    return best_id, min(1.0, best_score), project_type


def _archetype_file_paths(archetype_id: str, prompt: str) -> list[str]:
    arch = _ARCHETYPE_DEFS.get(archetype_id)
    if arch:
        return list(arch["file_paths"])
    return ["index.html", "styles.css", "app.js"]


def _archetype_tech_stack(archetype_id: str) -> str:
    arch = _ARCHETYPE_DEFS.get(archetype_id)
    if arch:
        return arch["tech_stack"]
    return "HTML / Vanilla CSS / JavaScript"


def _default_tasks(project_type: str, archetype_id: str) -> list[str]:
    arch = _ARCHETYPE_DEFS.get(archetype_id, {})
    ptype = project_type or "web"
    if ptype == "react":
        return [
            "Scaffold Vite+React entrypoints and App shell with routing container",
            "Implement reusable Header/List/Form components with state props and callbacks",
            "Style components with responsive CSS Modules layout, hover effects, and dark theme base",
            "Wire complete CRUD state in App: localStorage persistence, add/edit/delete handlers",
        ]
    if ptype == "node":
        return [
            "Scaffold Express server with CORS, JSON body parser, and 404/error middleware",
            "Implement REST API routes with route-layer input validation and in-memory data store",
            "Define model schema with CRUD helper methods (list/create/update/delete)",
            "Add static frontend serving (public/) + .env.example with PORT/CORS config",
        ]
    if ptype == "python":
        return [
            "Scaffold FastAPI app with CORS middleware, lifespan startup, and root health-check endpoint",
            "Implement Pydantic request/response schemas and CRUD router endpoints with in-memory store",
            "Define data model layer with dependency-injected DB session pattern",
            "Add requirements.txt with pinned versions + .env.example with HOST/PORT config",
        ]
    if ptype == "fullstack":
        return [
            "Backend: Scaffold API server with CORS, REST endpoints, in-memory store, error middleware",
            "Frontend: Scaffold Vite+React entry, App shell with axios/fetch API client",
            "Frontend: Implement List+Form components with add/edit/delete state and loading indicators",
            "Integrate: Wire frontend API calls to backend routes, responsive CSS with dark theme",
        ]
    return [
        "Structure HTML layout with semantic containers, forms, inputs, and output regions",
        "Style with modern responsive CSS: flex/grid layout, hover effects, dark theme, mobile breakpoints",
        "Implement complete JavaScript: event listeners, DOM manipulation, state array, localStorage",
        "Add defensive null-checks on every DOM query selector to prevent init-time crashes",
    ]


def _detect_project_type(prompt: str) -> str:
    """Legacy wrapper: returns just project_type string for backward compat with existing callers."""
    _, _, project_type = _detect_archetype(prompt)
    return project_type


def planner_agent(state: AgentState) -> dict:
    """Executes the planning phase: 2-phase archetype detect (keyword-first 0 tokens), then LLM only if ambiguous."""
    logs = add_log(state.get("logs", []), "PlannerAgent", "started", "Analysing user prompt and building execution plan...")
    user_prompt = state.get("user_prompt", "Sample Application")
    existing_name = state.get("project_name", "").strip()

    archetype_id, confidence, project_type = _detect_archetype(user_prompt)
    slug = existing_name or ("".join(c if c.isalnum() else "-" for c in user_prompt.lower())[:25].strip("-") or "generated-app")

    use_shortcut = confidence >= 0.7
    llm = None

    if use_shortcut:
        tech_stack = _archetype_tech_stack(archetype_id)
        file_paths = _archetype_file_paths(archetype_id, user_prompt)
        tasks = _default_tasks(project_type, archetype_id)
        ptype_for_contract = project_type or "web"
        api_contract = []
        component_tree = []

        if ptype_for_contract in ("node", "python", "fullstack"):
            api_contract = [
                {"route": "/api/items", "method": "GET", "request_body": "None", "response_body": '{"items":[]}'},
                {"route": "/api/items", "method": "POST", "request_body": '{"name":"string"}', "response_body": '{"id":"string","name":"string"}'},
                {"route": "/api/items/:id", "method": "DELETE", "request_body": "None", "response_body": '{"success":true}'},
            ]
        if ptype_for_contract in ("react", "fullstack"):
            component_tree = ["App", "Header", "ItemList", "ItemForm", "Footer"]

        architecture = {
            "design_notes": f"Archetype '{archetype_id}' detected via keyword heuristic (confidence={confidence:.2f}). {tech_stack} architecture with {len(file_paths)} source files.",
            "file_paths": file_paths,
        }
        logs = add_log(
            logs,
            "PlannerAgent",
            "completed",
            f"Heuristic plan: archetype='{archetype_id}' (conf={confidence:.2f}), {len(file_paths)} files, {len(api_contract)} API routes. LLM planner SKIPPED (token-free).",
        )
        return {
            "project_name": slug,
            "project_type": project_type,
            "tech_stack": tech_stack,
            "tasks": tasks,
            "architecture": architecture,
            "api_contract": api_contract,
            "component_tree": component_tree,
            "archetype_id": archetype_id,
            "archetype_confidence": confidence,
            "logs": logs,
            "current_step": "planned",
        }

    llm = get_agent_llm(state, temperature=0.2, role="planner")
    if llm is None:
        logger.info("No LLM key configured. Using default planning template.")
        tech_stack = _archetype_tech_stack(archetype_id)
        file_paths = _archetype_file_paths(archetype_id, user_prompt)
        tasks = _default_tasks(project_type, archetype_id)
        logs = add_log(
            logs,
            "PlannerAgent",
            "completed",
            f"Fallback plan: archetype='{archetype_id}' (no API key), project_type='{project_type}', {len(file_paths)} files.",
        )
        return {
            "project_name": slug,
            "project_type": project_type,
            "tech_stack": tech_stack,
            "tasks": tasks,
            "architecture": {
                "design_notes": f"Archetype '{archetype_id}' fallback architecture ({tech_stack}).",
                "file_paths": file_paths,
            },
            "api_contract": [],
            "component_tree": [],
            "archetype_id": archetype_id,
            "archetype_confidence": confidence,
            "logs": logs,
            "current_step": "planned",
        }

    try:
        raw = invoke_with_retry(llm, PLANNER_PROMPT_TEMPLATE.format(user_prompt=user_prompt))
        parsed = extract_json_from_llm(raw)
        if not isinstance(parsed, dict):
            parsed = {}

        project_name = existing_name or (parsed.get("project_name") or slug)
        llm_project_type = parsed.get("project_type") or project_type
        tech_stack = parsed.get("tech_stack") or _archetype_tech_stack(archetype_id)
        tasks = parsed.get("tasks") or _default_tasks(llm_project_type, archetype_id)
        api_contract = parsed.get("api_contract") or []
        component_tree = parsed.get("component_tree") or []
        llm_file_paths = parsed.get("file_paths") or []

        if not llm_file_paths or len(llm_file_paths) < 2:
            llm_file_paths = _archetype_file_paths(archetype_id, user_prompt)

        architecture = {
            "design_notes": parsed.get("design_notes") or f"{tech_stack} application architecture (archetype {archetype_id}).",
            "file_paths": llm_file_paths,
        }

        logs = add_log(
            logs,
            "PlannerAgent",
            "completed",
            f"Plan created via {llm_label(llm, state)} (heuristic conf={confidence:.2f} < 0.7 → LLM ran): {len(tasks)} tasks, project_type='{llm_project_type}', {len(api_contract)} API routes.",
        )
        return {
            "project_name": project_name,
            "project_type": llm_project_type,
            "tech_stack": tech_stack,
            "tasks": tasks,
            "architecture": architecture,
            "api_contract": api_contract,
            "component_tree": component_tree,
            "archetype_id": archetype_id,
            "archetype_confidence": confidence,
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
