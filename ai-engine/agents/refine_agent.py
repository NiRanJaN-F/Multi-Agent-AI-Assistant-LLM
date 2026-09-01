"""Refinement agents that modify an existing generated project from a follow-up prompt."""

import logging

from config.llm import invoke_with_retry
from graph.state import AgentState
from agents.utils import (
    add_log,
    extract_json_from_llm,
    get_agent_llm,
    get_agent_llm_label,
    strip_code_fence,
)

logger = logging.getLogger(__name__)

MAX_CONTEXT_CHARS_PER_FILE = 4000

REFINE_PLANNER_PROMPT_TEMPLATE = """You are a Technical Lead planning a change to an existing codebase.

Change Request: "{change_request}"
Project Name: "{project_name}"
Tech Stack: "{tech_stack}"

Existing files:
{files_summary}

Decide the minimal set of files to touch. Return ONLY a valid JSON object matching this schema:
{{
  "summary": "One sentence describing the change",
  "tasks": ["Concrete step 1", "Concrete step 2"],
  "modify_files": ["existing/path/to/change.js"],
  "new_files": ["path/of/file/to/create.js"]
}}
Only list files under "modify_files" that appear in the existing files list.
"""

REFINE_CODER_PROMPT_TEMPLATE = """You are a Principal Software Engineer editing an existing project.

Change Request: "{change_request}"
Tech Stack: "{tech_stack}"
Target File: "{file_path}"
Other Files In Project: {file_paths}

Current content of "{file_path}":
```
{current_content}
```

Rewrite the file so the change request is satisfied. Preserve all existing behaviour that the
change request does not ask you to alter. Return ONLY the complete new content of the file.
"""


def _infer_tech_stack(files: dict[str, str]) -> str:
    """Derive a tech stack label from the file extensions already in the project."""
    suffixes = {path.rsplit(".", 1)[-1].lower() for path in files if "." in path}

    if "py" in suffixes:
        return "Python"
    if suffixes & {"jsx", "tsx"}:
        return "React"
    if "java" in suffixes:
        return "Java"
    return "HTML/CSS/JS"


def _files_summary(files: dict[str, str]) -> str:
    if not files:
        return "(none)"
    return "\n".join(
        f"--- {path} ({len(content)} chars) ---\n{content[:400]}"
        for path, content in files.items()
    )


def _mock_targets(existing_files: dict[str, str], change_request: str) -> list[str]:
    """Pick target files deterministically when no LLM key is configured."""
    mentioned = [path for path in existing_files if path.lower() in change_request.lower()]
    if mentioned:
        return mentioned

    preferred = [path for path in ("app.js", "index.html") if path in existing_files]
    if preferred:
        return preferred

    return list(existing_files)[:1]


def _mock_refined_content(file_path: str, current_content: str, change_request: str) -> str:
    """Append a traceable change note when running without an LLM key."""
    note = f"Change request applied in mock mode: {change_request}"
    if file_path.endswith((".js", ".ts", ".jsx", ".tsx", ".java", ".c", ".cpp", ".css")):
        marker = f"\n\n/* {note} */\n"
    elif file_path.endswith((".html", ".xml", ".md")):
        marker = f"\n\n<!-- {note} -->\n"
    else:
        marker = f"\n\n# {note}\n"

    return f"{current_content.rstrip()}{marker}"


def refine_planner_agent(state: AgentState) -> dict:
    """Plan which files a follow-up change request should touch."""
    logs = add_log(
        state.get("logs", []),
        "RefinePlannerAgent",
        "started",
        "Analysing the existing project and planning the requested change...",
    )

    change_request = state.get("change_request", "")
    existing_files = state.get("existing_files", {})
    project_name = state.get("project_name", "")
    tech_stack = state.get("tech_stack") or _infer_tech_stack(existing_files)

    if not existing_files:
        logs = add_log(
            logs,
            "RefinePlannerAgent",
            "error",
            f"Project '{project_name}' has no readable files to refine.",
        )
        return {
            "error": f"No existing files found for project '{project_name}'.",
            "logs": logs,
            "current_step": "refine_planning_failed",
        }

    llm = get_agent_llm(state, temperature=0.2)
    if llm is None:
        targets = _mock_targets(existing_files, change_request)
        logs = add_log(
            logs,
            "RefinePlannerAgent",
            "completed",
            f"Mock plan: update {len(targets)} existing file(s).",
        )
        return {
            "tech_stack": tech_stack,
            "tasks": [f"Apply change request to {path}" for path in targets],
            "architecture": {
                "design_notes": f"Refinement of existing project '{project_name}'.",
                "modify_files": targets,
                "new_files": [],
            },
            "logs": logs,
            "current_step": "refine_planned",
        }

    try:
        raw = invoke_with_retry(
            llm,
            REFINE_PLANNER_PROMPT_TEMPLATE.format(
                change_request=change_request,
                project_name=project_name,
                tech_stack=tech_stack,
                files_summary=_files_summary(existing_files),
            ),
        )
        parsed = extract_json_from_llm(raw)

        modify_files = [path for path in parsed.get("modify_files", []) if path in existing_files]
        new_files = [path for path in parsed.get("new_files", []) if path not in existing_files]
        if not modify_files and not new_files:
            modify_files = _mock_targets(existing_files, change_request)

        tasks = parsed.get("tasks") or [f"Apply change request to {path}" for path in modify_files]

        logs = add_log(
            logs,
            "RefinePlannerAgent",
            "completed",
            f"Change plan via {get_agent_llm_label(state)}: "
            f"{len(modify_files)} file(s) to modify, {len(new_files)} to create.",
        )
        return {
            "tech_stack": tech_stack,
            "tasks": tasks,
            "architecture": {
                "design_notes": parsed.get("summary", f"Refinement of '{project_name}'."),
                "modify_files": modify_files,
                "new_files": new_files,
            },
            "logs": logs,
            "current_step": "refine_planned",
        }
    except Exception as e:
        logger.error(f"Refine Planner error: {e}")
        logs = add_log(logs, "RefinePlannerAgent", "error", f"Change planning failed: {str(e)}")
        return {
            "error": str(e),
            "logs": logs,
            "current_step": "refine_planning_failed",
        }


def refine_coder_agent(state: AgentState) -> dict:
    """Rewrite the targeted files so they satisfy the change request."""
    logs = add_log(
        state.get("logs", []),
        "RefineCoderAgent",
        "started",
        "Editing the existing source files...",
    )

    change_request = state.get("change_request", "")
    tech_stack = state.get("tech_stack", "")
    existing_files = dict(state.get("existing_files", {}))
    architecture = state.get("architecture", {})
    targets = list(architecture.get("modify_files", [])) + list(architecture.get("new_files", []))

    llm = get_agent_llm(state, temperature=0.2)
    files = dict(existing_files)
    changed_files: list[str] = []

    for file_path in targets:
        current_content = existing_files.get(file_path, "")
        if llm is None:
            files[file_path] = _mock_refined_content(file_path, current_content, change_request)
            changed_files.append(file_path)
            continue

        try:
            raw_code = invoke_with_retry(
                llm,
                REFINE_CODER_PROMPT_TEMPLATE.format(
                    change_request=change_request,
                    tech_stack=tech_stack,
                    file_path=file_path,
                    file_paths=list(existing_files),
                    current_content=current_content[:MAX_CONTEXT_CHARS_PER_FILE],
                ),
            )
            new_content = strip_code_fence(raw_code)
            if new_content:
                files[file_path] = new_content
                changed_files.append(file_path)
        except Exception as e:
            logger.error(f"Error refining {file_path}: {e}")
            logs = add_log(
                logs,
                "RefineCoderAgent",
                "warning",
                f"Kept the previous version of '{file_path}': {str(e)}",
            )

    mode_label = get_agent_llm_label(state) if llm is not None else "mock templates"
    logs = add_log(
        logs,
        "RefineCoderAgent",
        "completed" if changed_files else "warning",
        f"Updated {len(changed_files)} file(s) via {mode_label}.",
    )

    return {
        "files": files,
        "changed_files": changed_files,
        "logs": logs,
        "current_step": "refined",
    }
