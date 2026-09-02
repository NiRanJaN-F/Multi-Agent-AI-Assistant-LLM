"""Backend Agent — specialist server-side code generator.

Handles server.js/main.py, API route files, data models, and middleware.
Only runs for node, python, and fullstack project types.
Reads the api_contract from state to ensure routes match what the frontend expects.
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

BACKEND_PROMPT_TEMPLATE = """You are a Senior Backend Engineer.
Write clean, production-ready server-side code for EVERY backend file listed below.

User Request: "{user_prompt}"
Tech Stack: "{tech_stack}"
Backend Files To Write: {file_paths}

API Contract (your routes MUST implement these exactly):
{api_contract}

CRITICAL REQUIREMENTS:
- Write 100% COMPLETE, fully working backend code. No TODO stubs or empty handlers.
- For Node.js/Express: implement real route handlers with proper req/res handling, error middleware, and response formats.
- For Python/FastAPI: implement real endpoint functions with proper Pydantic models, status codes, and error handling.
- Data models must match the api_contract request/response schemas exactly.
- Include proper error handling (try/catch or try/except) in every route.
- For database operations: use in-memory storage (arrays/dicts) when no DB is configured, clearly structured for easy DB replacement.
- Every route file must be importable and free of syntax errors.

Format the response exactly like this, once per file and nothing else:

FILE: path/of/file
```
<complete file content>
```
"""

BACKEND_SINGLE_FILE_TEMPLATE = """You are a Senior Backend Engineer.
Write the complete server-side content of ONE file.

User Request: "{user_prompt}"
Tech Stack: "{tech_stack}"
All Backend Files In This Project: {all_files}
File To Write Now: {file_path}

API Contract:
{api_contract}

CRITICAL REQUIREMENTS:
- Write 100% COMPLETE code for {file_path}. No stubs or placeholders.
- Implement real route handlers, data validation, and error handling.
- Keep imports, exports, variable names, and route paths consistent with other files in the project.
- For Node.js: use ES module syntax or CommonJS consistently throughout the project.
- For Python: use proper async/await with FastAPI or synchronous handlers with Flask.

Return ONLY the complete raw source code inside a single code fence, with no commentary.
"""


def _format_api_contract(api_contract: list) -> str:
    """Format the API contract for inclusion in the prompt."""
    if not api_contract:
        return "No specific API contract defined. Design RESTful routes appropriate for the request."
    lines = []
    for endpoint in api_contract:
        route = endpoint.get("route", "/api")
        method = endpoint.get("method", "GET").upper()
        req = endpoint.get("request_body", "None")
        res = endpoint.get("response_body", "{}")
        lines.append(f"  {method} {route} | Request: {req} | Response: {res}")
    return "\n".join(lines)


def _generate_backend_file_by_file(
    llm: FallbackLLM,
    file_paths: list[str],
    user_prompt: str,
    tech_stack: str,
    api_contract_str: str,
) -> tuple[dict[str, str], BaseException | None]:
    """One LLM call per backend file for maximum token focus."""
    generated: dict[str, str] = {}
    last_error: BaseException | None = None

    for file_path in file_paths:
        try:
            raw = invoke_with_retry(
                llm,
                BACKEND_SINGLE_FILE_TEMPLATE.format(
                    user_prompt=user_prompt,
                    tech_stack=tech_stack,
                    all_files=file_paths,
                    file_path=file_path,
                    api_contract=api_contract_str,
                ),
            )
        except Exception as error:
            logger.warning("BackendAgent failed on %s: %s", file_path, error)
            last_error = error
            continue

        content = parse_multi_file_response(raw).get(file_path) or strip_code_fence(raw)
        if content:
            generated[file_path] = content

    return generated, last_error


def backend_agent(state: AgentState) -> dict:
    """Generates server-side files: API routes, data models, middleware, entry points."""
    logs = add_log(
        state.get("logs", []),
        "BackendAgent",
        "started",
        "Generating server-side code (routes, models, middleware)...",
    )

    architecture = state.get("architecture", {})
    all_file_paths: list[str] = architecture.get("file_paths", [])
    api_contract: list = state.get("api_contract", [])
    user_prompt = state.get("user_prompt", "")
    tech_stack = state.get("tech_stack", "")
    project_type = state.get("project_type", "web")

    # Identify backend files by convention
    BACKEND_EXTENSIONS = (".py", ".js", ".ts")
    BACKEND_DIRS = ("routes", "models", "middleware", "controllers", "services", "db", "api")
    ENTRY_POINTS = ("server.js", "app.js", "index.js", "main.py", "app.py")

    def is_backend_file(path: str) -> bool:
        if path in ENTRY_POINTS:
            return True
        parts = path.split("/")
        if len(parts) > 1 and parts[0] in BACKEND_DIRS:
            return True
        if project_type in ("python", "node") and not path.startswith(("public/", "src/", "client/", "frontend/")):
            return path.endswith(BACKEND_EXTENSIONS) or path in ("package.json", "requirements.txt", "pyproject.toml")
        return False

    backend_file_paths = [p for p in all_file_paths if is_backend_file(p)]

    if not backend_file_paths:
        logs = add_log(logs, "BackendAgent", "warning", "No backend files to generate for this project type.")
        return {"logs": logs, "current_step": "backend_coded", "backend_files": {}}

    llm = get_agent_llm(state, temperature=0.15, role="backend")

    if llm is None:
        is_python = "python" in tech_stack.lower() or project_type == "python"
        if is_python:
            backend_files = {
                "main.py": _python_fallback(user_prompt, api_contract),
                "requirements.txt": "fastapi\nuvicorn[standard]\npydantic\n",
            }
        else:
            backend_files = {"server.js": _node_fallback(user_prompt, api_contract)}
        logs = add_log(logs, "BackendAgent", "completed", f"Generated {len(backend_files)} backend files using fallback templates (no API key).")
        all_files = {**state.get("files", {}), **backend_files}
        return {"files": all_files, "backend_files": backend_files, "logs": logs, "current_step": "backend_coded"}

    api_contract_str = _format_api_contract(api_contract)
    generated, last_error = _generate_backend_file_by_file(llm, backend_file_paths, user_prompt, tech_stack, api_contract_str)

    skipped = [p for p in backend_file_paths if p not in generated]
    if skipped:
        is_python = "python" in tech_stack.lower()
        for path in skipped:
            if path.endswith(".py"):
                generated[path] = f"# {path}\n# TODO: implement {path}\n"
            elif path == "requirements.txt":
                generated[path] = "fastapi\nuvicorn[standard]\npydantic\n" if is_python else ""
            elif path == "package.json":
                generated[path] = _package_json_fallback(state.get("project_name", "app"))
            else:
                generated[path] = f"// {path}\n// TODO: implement {path}\n"

    all_files = {**state.get("files", {}), **generated}

    if last_error and not generated:
        status = "quota_exceeded" if is_quota_error(last_error) else "error"
        logs = add_log(logs, "BackendAgent", status, f"Backend code generation failed: {last_error}")
        return {"error": str(last_error), "logs": logs, "current_step": "backend_failed"}

    logs = add_log(
        logs,
        "BackendAgent",
        "completed",
        f"Generated {len(generated)} backend files via {llm_label(llm, state)}.",
    )
    return {
        "files": all_files,
        "backend_files": generated,
        "logs": logs,
        "current_step": "backend_coded",
    }


def _node_fallback(user_prompt: str, api_contract: list) -> str:
    routes = ""
    for endpoint in api_contract:
        route = endpoint.get("route", "/api/items")
        method = endpoint.get("method", "GET").lower()
        routes += f"""
app.{method}('{route}', (req, res) => {{
  res.json({{ success: true, data: [], message: 'Endpoint: {route}' }});
}});
"""
    if not routes:
        routes = """
app.get('/api/items', (req, res) => {
  res.json({ success: true, data: items });
});
app.post('/api/items', (req, res) => {
  const item = { id: Date.now().toString(), ...req.body };
  items.push(item);
  res.status(201).json({ success: true, data: item });
});
app.delete('/api/items/:id', (req, res) => {
  items = items.filter(i => i.id !== req.params.id);
  res.json({ success: true });
});
"""
    return f"""// Server for: {user_prompt}
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let items = [];
{routes}
app.listen(PORT, () => console.log(`Server running on port ${{PORT}}`));
module.exports = app;
"""


def _python_fallback(user_prompt: str, api_contract: list) -> str:
    routes = ""
    for endpoint in api_contract:
        route = endpoint.get("route", "/api/items")
        method = endpoint.get("method", "GET").lower()
        func_name = route.replace("/", "_").replace("-", "_").strip("_") or "root"
        routes += f"""
@app.{method}("{route}")
async def {func_name}():
    return {{"success": True, "data": []}}
"""
    if not routes:
        routes = """
@app.get("/api/items")
async def get_items():
    return {"success": True, "data": items}

@app.post("/api/items")
async def create_item(item: dict):
    items.append(item)
    return {"success": True, "data": item}
"""
    return f"""# FastAPI app for: {user_prompt}
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Any

app = FastAPI(title="Generated API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

items: list[Any] = []
{routes}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
"""


def _package_json_fallback(project_name: str) -> str:
    return f"""{{
  "name": "{project_name}",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {{
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node --test tests/"
  }},
  "dependencies": {{
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }},
  "devDependencies": {{
    "nodemon": "^3.0.0"
  }}
}}
"""
