"""Refinement agents that modify an existing generated project from a follow-up prompt."""

import logging

from config.llm import FallbackLLM, invoke_with_retry, is_quota_error
from graph.state import AgentState
from agents.coder_agent import one_call_per_file
from agents.utils import (
    add_log,
    extract_json_from_llm,
    get_agent_llm,
    llm_label,
    parse_multi_file_response,
    strip_code_fence,
)

logger = logging.getLogger(__name__)

MAX_CONTEXT_CHARS_PER_FILE = 5000
MAX_SIBLING_CHARS = 3000

REFINE_PLANNER_PROMPT_TEMPLATE = """You are a Principal Software Architect planning an incremental modification to an existing codebase.

Change Request: "{change_request}"
Project Name: "{project_name}"
Tech Stack: "{tech_stack}"

Existing Project Files & Contents:
{files_summary}

CRITICAL RULES:
1. Analyze the existing codebase thoroughly before planning. Identify exact files, functions, DOM IDs, and styles that need adjustment.
2. Minimize changes: only modify files that directly require updates to implement the change request.
3. If new files are strictly necessary (e.g. new utility or component), list them under "new_files". Otherwise, prefer editing existing files.
4. Never break existing features, UI elements, or event bindings.

Return ONLY a valid JSON object matching this schema:
{{
  "summary": "One concise sentence describing the exact technical change",
  "tasks": ["Step 1: description", "Step 2: description"],
  "modify_files": ["existing/path/to/file.ext"],
  "new_files": ["new/path/to/file.ext"]
}}
Only list files under "modify_files" that exist in the project above.
"""

REFINE_CODER_PROMPT_TEMPLATE = """You are a Principal Software Engineer editing an existing project.

{qa_header}
Change Request: "{change_request}"
Tech Stack: "{tech_stack}"
All Files In Project: {file_paths}
Files To Rewrite: {targets}

Current content of the files to rewrite:
{current_contents}

CRITICAL REQUIREMENTS:
1. PRESERVE ALL EXISTING FUNCTIONALITY: Do NOT remove, break, or omit existing working features, mock datasets, or DOM bindings.
2. 100% COMPLETE CODE: Return the complete updated file content for each file. No placeholders or `// rest of code`.
3. DEFENSIVE JS & CROSS-FILE SYNC:
   - For browser apps, attach shared data/managers to `window` (e.g. `window.PRODUCTS`, `window.Cart`, `window.ThemeManager`).
   - Do NOT use ES module `export`/`import` statements in plain browser scripts.
   - Maintain exact DOM element IDs and call `lucide.createIcons();` after dynamic UI updates.
4. STYLING: Maintain clean Tailwind CSS styling, responsive grid layouts, and smooth transitions.

Format the response exactly like this, once per file and nothing else:

FILE: path/of/file
```
<complete new file content>
```
"""

REFINE_SINGLE_FILE_PROMPT_TEMPLATE = """You are a Principal Software Engineer incrementally updating an existing file.

{qa_header}
Change Request: "{change_request}"
Tech Stack: "{tech_stack}"
File To Update: {file_path}
All Project Files: {file_paths}

CURRENT CONTENT OF {file_path}:
```
{current_content}
```

SIBLING FILES CONTEXT:
{sibling_context}

CRITICAL RULES FOR UPDATING {file_path}:
1. PRESERVE EXISTING FUNCTIONALITY: Do NOT delete, break, or omit existing features, mock data, DOM IDs, or event handlers unless the change request specifically asks to replace them.
2. COMPLETE OUTPUT: Return the COMPLETE, updated file content. Do NOT use snippets, placeholders, `// ... rest of code`, or truncated code.
3. DEFENSIVE BROWSER JS & CROSS-FILE SYNC:
   - If writing JavaScript for the browser, attach shared data, state, or utility objects to `window` (e.g., `window.PRODUCTS`, `window.Cart`, `window.ThemeManager`).
   - Do NOT use ES module `export` or `import` statements in plain browser scripts.
   - Guard DOM selections with `if (el) ...` and call `lucide.createIcons();` after rendering dynamic UI.
4. STYLING: Preserve Tailwind CSS classes, responsive layouts, dark mode classes, and clean visual structure.

Return ONLY the complete updated file content inside a single markdown code fence (```...```), with no commentary.
"""

REFINE_NEW_FILE_PROMPT_TEMPLATE = """You are a Principal Software Engineer creating a NEW file for an existing codebase.

{qa_header}
Change Request: "{change_request}"
Tech Stack: "{tech_stack}"
New File Path To Create: {file_path}
All Project Files: {file_paths}

EXISTING SIBLING FILES IN PROJECT:
{sibling_context}

CRITICAL RULES:
- Implement the COMPLETE, 100% functional content for {file_path}. No placeholders or TODOs.
- Match all existing styles, naming conventions, and data structures used in sibling files.
- If writing browser JavaScript: attach any shared classes or objects to `window` (e.g., `window.ThemeManager = ...`) so other scripts can access them without `import`/`export`.
- Never throw ReferenceErrors between scripts.

Return ONLY the raw source code for {file_path} inside a single markdown code fence (```...```), with no commentary.
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


def _files_summary(files: dict[str, str], max_per_file: int = 2500) -> str:
    if not files:
        return "(none)"
    chunks = []
    for path, content in sorted(files.items()):
        if len(content) <= max_per_file:
            snippet = content
        else:
            snippet = content[:max_per_file] + f"\n... [truncated, total {len(content)} chars]"
        chunks.append(f"--- FILE: {path} ({len(content)} chars) ---\n{snippet}\n")
    return "\n".join(chunks)


def _format_sibling_context(files: dict[str, str], exclude_path: str) -> str:
    """Provide compact sibling context for cross-file consistency."""
    snippets = []
    total = 0
    for path, content in sorted(files.items()):
        if path == exclude_path:
            continue
        if total >= MAX_SIBLING_CHARS:
            break
        head = content[:800]
        snippet = f"--- {path} ---\n{head}\n"
        snippets.append(snippet)
        total += len(snippet)
    return "\n".join(snippets) if snippets else "(no sibling files)"


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


def _rewrite_file_by_file(
    llm: FallbackLLM,
    modify_targets: list[str],
    new_targets: list[str],
    existing_files: dict[str, str],
    change_request: str,
    tech_stack: str,
    qa_header: str = "",
) -> tuple[dict[str, str], BaseException | None]:
    """One call per file, so a model only has to hold one file's content at a time."""
    rewritten: dict[str, str] = {}
    last_error: BaseException | None = None
    all_paths = list(existing_files) + [p for p in new_targets if p not in existing_files]

    # Process modified files
    for file_path in modify_targets:
        try:
            sibling_ctx = _format_sibling_context(existing_files, file_path)
            raw = invoke_with_retry(
                llm,
                REFINE_SINGLE_FILE_PROMPT_TEMPLATE.format(
                    qa_header=qa_header,
                    change_request=change_request,
                    tech_stack=tech_stack,
                    file_paths=all_paths,
                    file_path=file_path,
                    current_content=existing_files.get(file_path, "")[:MAX_CONTEXT_CHARS_PER_FILE],
                    sibling_context=sibling_ctx,
                ),
            )
            content = parse_multi_file_response(raw).get(file_path) or strip_code_fence(raw)
            if content:
                rewritten[file_path] = content
        except Exception as error:
            logger.warning("Refine Coder failed on %s: %s", file_path, error)
            last_error = error
            continue

    # Process new files
    for file_path in new_targets:
        try:
            sibling_ctx = _format_sibling_context(existing_files, file_path)
            raw = invoke_with_retry(
                llm,
                REFINE_NEW_FILE_PROMPT_TEMPLATE.format(
                    qa_header=qa_header,
                    change_request=change_request,
                    tech_stack=tech_stack,
                    file_paths=all_paths,
                    file_path=file_path,
                    sibling_context=sibling_ctx,
                ),
            )
            content = parse_multi_file_response(raw).get(file_path) or strip_code_fence(raw)
            if content:
                rewritten[file_path] = content
        except Exception as error:
            logger.warning("Refine Coder failed on new file %s: %s", file_path, error)
            last_error = error
            continue

    return rewritten, last_error


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

    llm = get_agent_llm(state, temperature=0.2, role="planner")
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
            f"Change plan via {llm_label(llm, state)}: "
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
        status = "quota_exceeded" if is_quota_error(e) else "error"
        logs = add_log(logs, "RefinePlannerAgent", status, f"Change planning failed: {str(e)}")
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
    modify_targets = list(architecture.get("modify_files", []))
    new_targets = list(architecture.get("new_files", []))
    targets = modify_targets + new_targets

    qa_fix_instructions = state.get("qa_fix_instructions") or ""
    qa_header = (
        f"IMPORTANT — FIX PREVIOUS ISSUES FOUND IN QA REVIEW:\n{qa_fix_instructions}\n"
        if qa_fix_instructions
        else ""
    )

    llm = get_agent_llm(state, temperature=0.2, role="coder")
    files = dict(existing_files)

    if llm is None:
        for file_path in targets:
            files[file_path] = _mock_refined_content(
                file_path, existing_files.get(file_path, ""), change_request
            )
        logs = add_log(
            logs,
            "RefineCoderAgent",
            "completed" if targets else "warning",
            f"Updated {len(targets)} file(s) via mock templates.",
        )
        return {
            "files": files,
            "changed_files": list(targets),
            "logs": logs,
            "current_step": "refined",
        }

    if one_call_per_file(llm):
        rewritten, error = _rewrite_file_by_file(
            llm, modify_targets, new_targets, existing_files, change_request, tech_stack, qa_header
        )
        if not rewritten and error is not None:
            logger.error(f"Refine Coder error: {error}")
            status = "quota_exceeded" if is_quota_error(error) else "error"
            logs = add_log(logs, "RefineCoderAgent", status, f"Editing the project failed: {error}")
            return {"error": str(error), "logs": logs, "current_step": "refine_coding_failed"}
    else:
        current_contents = "\n".join(
            f"FILE: {path}\n```\n{existing_files.get(path, '')[:MAX_CONTEXT_CHARS_PER_FILE]}\n```"
            for path in targets
        )

        try:
            raw = invoke_with_retry(
                llm,
                REFINE_CODER_PROMPT_TEMPLATE.format(
                    qa_header=qa_header,
                    change_request=change_request,
                    tech_stack=tech_stack,
                    file_paths=list(existing_files) + new_targets,
                    targets=targets,
                    current_contents=current_contents,
                ),
            )
        except Exception as e:
            logger.error(f"Refine Coder error: {e}")
            status = "quota_exceeded" if is_quota_error(e) else "error"
            logs = add_log(logs, "RefineCoderAgent", status, f"Editing the project failed: {e}")
            return {"error": str(e), "logs": logs, "current_step": "refine_coding_failed"}

        rewritten = parse_multi_file_response(raw)

    changed_files = [path for path in targets if rewritten.get(path)]
    for path in changed_files:
        files[path] = rewritten[path]

    skipped = [path for path in targets if path not in changed_files]
    message = f"Updated {len(changed_files)} file(s) via {llm_label(llm, state)}."
    if skipped:
        message += f" Kept the previous version of: {', '.join(skipped)}."

    logs = add_log(
        logs,
        "RefineCoderAgent",
        "completed" if changed_files else "warning",
        message,
    )

    return {
        "files": files,
        "changed_files": changed_files,
        "logs": logs,
        "current_step": "refined",
    }

