"""Frontend Agent — specialist client-side code generator.

Handles HTML, CSS, JavaScript (vanilla or React/JSX), and static assets.
Reads api_contract + component_tree from state to align IDs, fetch URLs,
and component structure with what the BackendAgent generated.
"""

import logging

from config.llm import FallbackLLM, invoke_with_retry, is_quota_error
from graph.state import AgentState
from agents.utils import (
    add_log,
    get_agent_llm,
    llm_label,
    parse_multi_file_response,
    strip_code_fence,
)

logger = logging.getLogger(__name__)

FRONTEND_PROMPT_TEMPLATE = """You are a Senior Frontend Engineer.
Write clean, fully interactive, production-ready client-side code for EVERY frontend file listed below.

User Request: "{user_prompt}"
Tech Stack: "{tech_stack}"
Frontend Files To Write: {file_paths}
Component Tree: {component_tree}

API Contract (your frontend MUST call these exact routes):
{api_contract}

CRITICAL FUNCTIONALITY REQUIREMENTS:
- Write 100% COMPLETE, fully working interactive code. No TODO comments, placeholders, or empty handlers.
- For HTML: include all forms, inputs, buttons, containers, and semantic elements the app needs.
- For JavaScript/JSX: implement real addEventListener (submit, click, change), dynamic DOM manipulation,
  async fetch() calls to the API routes defined in the API Contract, state array management, and localStorage persistence.
- For CSS: provide complete responsive styling, flexbox/grid layouts, hover effects, transitions.
- Element IDs and class names MUST be consistent across HTML, CSS, and JS files.
- API base URL should default to 'http://localhost:3001' (or appropriate port for the tech stack).

Format the response exactly like this, once per file and nothing else:

FILE: path/of/file
```
<complete file content>
```
"""

FRONTEND_SINGLE_FILE_TEMPLATE = """You are a Senior Frontend Engineer.
Write the complete client-side content of ONE file.

User Request: "{user_prompt}"
Tech Stack: "{tech_stack}"
All Frontend Files In This Project: {all_files}
File To Write Now: {file_path}
Component Tree: {component_tree}

API Contract (backend routes your code should call):
{api_contract}

CRITICAL REQUIREMENTS:
- Write 100% COMPLETE code for {file_path}. No stubs or placeholders.
- If writing HTML: include all interactive forms, input fields, buttons, and containers for the app.
- If writing JavaScript/JSX: implement complete event handling (addEventListener for submit/click/change),
  dynamic DOM node creation/removal, async fetch() calls to backend API routes, full state management.
- If writing CSS: clean modern responsive layout with all component styles.
- Keep element IDs, class names, and API route references perfectly aligned with other files.

Return ONLY the complete raw source code of {file_path} inside a single code fence, with no commentary.
"""


def _format_api_contract(api_contract: list) -> str:
    if not api_contract:
        return "No specific API. Use localStorage for client-side persistence."
    lines = []
    for endpoint in api_contract:
        route = endpoint.get("route", "/api")
        method = endpoint.get("method", "GET").upper()
        res = endpoint.get("response_body", "{}")
        lines.append(f"  {method} {route} -> {res}")
    return "\n".join(lines)


def _generate_frontend_file_by_file(
    llm: FallbackLLM,
    file_paths: list[str],
    user_prompt: str,
    tech_stack: str,
    api_contract_str: str,
    component_tree: list[str],
) -> tuple[dict[str, str], BaseException | None]:
    generated: dict[str, str] = {}
    last_error: BaseException | None = None

    for file_path in file_paths:
        try:
            raw = invoke_with_retry(
                llm,
                FRONTEND_SINGLE_FILE_TEMPLATE.format(
                    user_prompt=user_prompt,
                    tech_stack=tech_stack,
                    all_files=file_paths,
                    file_path=file_path,
                    component_tree=component_tree or ["Main"],
                    api_contract=api_contract_str,
                ),
            )
        except Exception as error:
            logger.warning("FrontendAgent failed on %s: %s", file_path, error)
            last_error = error
            continue

        content = parse_multi_file_response(raw).get(file_path) or strip_code_fence(raw)
        if content:
            generated[file_path] = content

    return generated, last_error


def frontend_agent(state: AgentState) -> dict:
    """Generates client-side files: HTML, CSS, JS/JSX/TSX."""
    logs = add_log(
        state.get("logs", []),
        "FrontendAgent",
        "started",
        "Generating client-side code (HTML, CSS, JavaScript/React)...",
    )

    architecture = state.get("architecture", {})
    all_file_paths: list[str] = architecture.get("file_paths", [])
    api_contract: list = state.get("api_contract", [])
    component_tree: list[str] = state.get("component_tree", [])
    user_prompt = state.get("user_prompt", "")
    tech_stack = state.get("tech_stack", "")
    project_type = state.get("project_type", "web")

    FRONTEND_EXTENSIONS = (".html", ".css", ".js", ".jsx", ".tsx", ".ts", ".vue", ".svelte")
    FRONTEND_DIRS = ("src", "public", "client", "frontend", "components", "pages", "views", "styles", "assets")
    NON_FRONTEND = ("server.js", "app.js", "index.js", "main.py", "app.py", "requirements.txt", "pyproject.toml")

    def is_frontend_file(path: str) -> bool:
        if path in NON_FRONTEND and project_type in ("node", "python", "fullstack"):
            return False
        parts = path.split("/")
        if len(parts) > 1 and parts[0] in FRONTEND_DIRS:
            return True
        if project_type == "web":
            return path.endswith(FRONTEND_EXTENSIONS)
        if project_type == "react":
            return path.endswith(FRONTEND_EXTENSIONS) or path in ("index.html", "vite.config.js", "package.json")
        if project_type == "fullstack":
            return parts[0] in FRONTEND_DIRS or path.endswith(".html")
        return False

    frontend_file_paths = [p for p in all_file_paths if is_frontend_file(p)]

    if not frontend_file_paths:
        logs = add_log(logs, "FrontendAgent", "warning", "No frontend files to generate for this project type.")
        return {"logs": logs, "current_step": "frontend_coded", "frontend_files": {}}

    llm = get_agent_llm(state, temperature=0.2, role="frontend")

    if llm is None:
        from agents.coder_agent import _get_fallback_code
        frontend_files = {}
        for path in frontend_file_paths:
            frontend_files[path] = _get_fallback_code(path, user_prompt)
        logs = add_log(logs, "FrontendAgent", "completed", f"Generated {len(frontend_files)} frontend files using fallback templates (no API key).")
        all_files = {**state.get("files", {}), **frontend_files}
        return {"files": all_files, "frontend_files": frontend_files, "logs": logs, "current_step": "frontend_coded"}

    api_contract_str = _format_api_contract(api_contract)
    generated, last_error = _generate_frontend_file_by_file(
        llm, frontend_file_paths, user_prompt, tech_stack, api_contract_str, component_tree
    )

    from agents.coder_agent import _get_fallback_code
    for path in frontend_file_paths:
        if path not in generated:
            generated[path] = _get_fallback_code(path, user_prompt)

    all_files = {**state.get("files", {}), **generated}

    if last_error and not generated:
        status = "quota_exceeded" if is_quota_error(last_error) else "error"
        logs = add_log(logs, "FrontendAgent", status, f"Frontend code generation failed: {last_error}")
        return {"error": str(last_error), "logs": logs, "current_step": "frontend_failed"}

    logs = add_log(
        logs,
        "FrontendAgent",
        "completed",
        f"Generated {len(generated)} frontend files via {llm_label(llm, state)}.",
    )
    return {
        "files": all_files,
        "frontend_files": generated,
        "logs": logs,
        "current_step": "frontend_coded",
    }
