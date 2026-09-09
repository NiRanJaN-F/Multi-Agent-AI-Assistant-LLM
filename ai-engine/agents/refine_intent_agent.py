"""Refinement Intent Analyzer Agent.

Classifies the user's refinement change request into structured intent metadata:
- mode: patch | extend | config | style | refactor
- target_area: frontend | backend | both | config | styling
- risk_level: low | medium | high
- requires_backend_change: bool
- files_to_inspect: candidate files to focus on
- files_protected: files that must NOT be modified
"""

import logging
import re
from typing import Any, Dict, List

from config.llm import invoke_with_retry, is_quota_error
from graph.state import AgentState
from agents.utils import add_log, extract_json_from_llm, get_agent_llm, llm_label

logger = logging.getLogger(__name__)

INTENT_ANALYZER_PROMPT_TEMPLATE = """You are a Principal Software Architect analyzing a code refinement request.

Change Request: "{change_request}"
Project Name: "{project_name}"
Tech Stack: "{tech_stack}"
Existing Project Files:
{files_list}

Analyze the request and determine:
1. "mode": one of ["patch", "extend", "config", "style", "refactor"]
2. "summary": A concise 1-sentence technical description of the exact change needed.
3. "target_area": one of ["frontend", "backend", "both", "config", "styling"]
4. "risk_level": one of ["low", "medium", "high"]
5. "requires_backend_change": true if server/API routes/controllers must change, else false
6. "files_to_inspect": list of existing file paths from the project that are directly relevant to this change
7. "files_protected": list of existing file paths that are unrelated and MUST NOT be touched (e.g., config, documentation, or unrelated subcomponents)

Return ONLY valid JSON matching this schema:
{{
  "mode": "style",
  "summary": "Implement dark mode theme switcher with persistence",
  "target_area": "frontend",
  "risk_level": "low",
  "requires_backend_change": false,
  "files_to_inspect": ["index.html", "app.js", "styles.css"],
  "files_protected": ["package.json", "README.md"]
}}
"""

STYLE_KEYWORDS = {"dark mode", "light mode", "theme", "color", "colour", "css", "font", "style", "spacing", "padding", "margin", "glassmorphic", "navbar design", "icon"}
EXTEND_KEYWORDS = {"add", "new feature", "filter", "search", "sort", "drawer", "modal", "tab", "button", "cart", "badge", "toast", "export", "pagination"}
BACKEND_KEYWORDS = {"api", "server", "database", "route", "endpoint", "controller", "mongo", "express", "fastapi", "schema", "backend", "model"}
CONFIG_KEYWORDS = {"config", "tailwind.config", "package.json", "tsconfig", "vite.config", "env", "dependency", "install"}


def analyze_intent_heuristics(change_request: str, existing_files: Dict[str, str]) -> Dict[str, Any]:
    """Fast, deterministic heuristic intent classification when no LLM key is set or as fallback."""
    cr_lower = change_request.lower()
    all_paths = list(existing_files.keys())

    # Mode detection
    if any(k in cr_lower for k in STYLE_KEYWORDS):
        mode = "style"
        target_area = "styling"
        risk = "low"
    elif any(k in cr_lower for k in CONFIG_KEYWORDS):
        mode = "config"
        target_area = "config"
        risk = "medium"
    elif any(k in cr_lower for k in EXTEND_KEYWORDS):
        mode = "extend"
        target_area = "frontend"
        risk = "low"
    else:
        mode = "patch"
        target_area = "frontend"
        risk = "low"

    requires_backend = any(k in cr_lower for k in BACKEND_KEYWORDS)
    if requires_backend:
        target_area = "both" if target_area == "frontend" else "backend"
        risk = "medium"

    # Identify files to inspect
    files_to_inspect: List[str] = []
    # 1. Mentioned directly in prompt
    for p in all_paths:
        if p.lower() in cr_lower or p.rsplit("/", 1)[-1].lower() in cr_lower:
            files_to_inspect.append(p)

    # 2. Based on target area
    if not files_to_inspect:
        if target_area in ("frontend", "styling"):
            for p in all_paths:
                if p.endswith((".html", ".js", ".jsx", ".ts", ".tsx", ".css")) and not p.startswith("tests/"):
                    files_to_inspect.append(p)
        elif target_area == "backend":
            for p in all_paths:
                if any(x in p for x in ("server", "routes", "api", "controllers", "models", ".py")) and not p.startswith("tests/"):
                    files_to_inspect.append(p)
        else:
            files_to_inspect = [p for p in all_paths if not p.startswith("tests/") and p != "README.md"]

    if not files_to_inspect:
        files_to_inspect = all_paths[:3]

    # Files protected: config/docs/tests unless specifically requested
    files_protected = []
    for p in all_paths:
        if p in files_to_inspect:
            continue
        if p in ("package.json", "package-lock.json", "README.md", "vite.config.js", "tailwind.config.js") and p.lower() not in cr_lower:
            files_protected.append(p)
        elif not requires_backend and any(x in p for x in ("backend/", "server.js", "api/", "routes/", "models/")):
            files_protected.append(p)

    return {
        "mode": mode,
        "summary": f"Refinement: {change_request}",
        "target_area": target_area,
        "risk_level": risk,
        "requires_backend_change": requires_backend,
        "files_to_inspect": files_to_inspect,
        "files_protected": files_protected,
    }


def refine_intent_analyzer_agent(state: AgentState) -> dict:
    """Agent node that inspects change request and produces a structured intent specification."""
    logs = add_log(
        state.get("logs", []),
        "RefineIntentAnalyzer",
        "started",
        "Analyzing refinement intent, scope, and impact...",
    )

    change_request = state.get("change_request", "")
    existing_files = state.get("existing_files", {})
    project_name = state.get("project_name", "")
    tech_stack = state.get("tech_stack", "HTML/CSS/JS")

    if not existing_files:
        logs = add_log(logs, "RefineIntentAnalyzer", "error", f"No project files found for '{project_name}'.")
        return {
            "error": f"No existing files found for project '{project_name}'.",
            "logs": logs,
            "current_step": "refine_intent_failed",
        }

    heuristic_intent = analyze_intent_heuristics(change_request, existing_files)
    llm = get_agent_llm(state, temperature=0.1, role="planner")

    if llm is None:
        logs = add_log(
            logs,
            "RefineIntentAnalyzer",
            "completed",
            f"Intent analyzed (heuristic mode): mode={heuristic_intent['mode']}, "
            f"target_area={heuristic_intent['target_area']}, {len(heuristic_intent['files_to_inspect'])} file(s) to inspect.",
        )
        return {
            "refinement_intent": heuristic_intent,
            "files_protected": heuristic_intent["files_protected"],
            "logs": logs,
            "current_step": "refine_intent_analyzed",
        }

    try:
        files_list = "\n".join(f"- {p} ({len(c)} chars)" for p, c in sorted(existing_files.items()))
        raw = invoke_with_retry(
            llm,
            INTENT_ANALYZER_PROMPT_TEMPLATE.format(
                change_request=change_request,
                project_name=project_name,
                tech_stack=tech_stack,
                files_list=files_list,
            ),
        )
        parsed = extract_json_from_llm(raw)

        # Merge with heuristics for robust safety
        mode = parsed.get("mode") or heuristic_intent["mode"]
        summary = parsed.get("summary") or heuristic_intent["summary"]
        target_area = parsed.get("target_area") or heuristic_intent["target_area"]
        risk_level = parsed.get("risk_level") or heuristic_intent["risk_level"]
        requires_backend = parsed.get("requires_backend_change", heuristic_intent["requires_backend_change"])

        files_to_inspect = [p for p in parsed.get("files_to_inspect", []) if p in existing_files] or heuristic_intent["files_to_inspect"]
        files_protected = [p for p in parsed.get("files_protected", []) if p in existing_files and p not in files_to_inspect] or heuristic_intent["files_protected"]

        intent = {
            "mode": mode,
            "summary": summary,
            "target_area": target_area,
            "risk_level": risk_level,
            "requires_backend_change": bool(requires_backend),
            "files_to_inspect": files_to_inspect,
            "files_protected": files_protected,
        }

        logs = add_log(
            logs,
            "RefineIntentAnalyzer",
            "completed",
            f"Intent identified via {llm_label(llm, state)}: mode='{mode}', target='{target_area}', "
            f"risk='{risk_level}'. {len(files_to_inspect)} inspect, {len(files_protected)} protected.",
        )

        return {
            "refinement_intent": intent,
            "files_protected": files_protected,
            "logs": logs,
            "current_step": "refine_intent_analyzed",
        }
    except Exception as e:
        logger.warning(f"RefineIntentAnalyzer LLM fallback to heuristics: {e}")
        status = "quota_exceeded" if is_quota_error(e) else "info"
        logs = add_log(
            logs,
            "RefineIntentAnalyzer",
            status,
            f"Intent Analyzer used heuristic classifier: mode={heuristic_intent['mode']}, target={heuristic_intent['target_area']}",
        )
        return {
            "refinement_intent": heuristic_intent,
            "files_protected": heuristic_intent["files_protected"],
            "logs": logs,
            "current_step": "refine_intent_analyzed",
        }
