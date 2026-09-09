"""Refinement Context Scanner & Impact Analysis Agent.

Responsibilities:
1. Checkpoint Snapshot: Captures an immutable copy of existing_files into `state["checkpoint_files"]`.
2. Focused Context Scanning: Builds focused context for `files_to_inspect` without context starvation.
3. Dependency & Impact Analysis: Traces script references, CSS stylesheets, and cross-file dependencies.
4. File Protection Enforcement: Flags `files_protected` so downstream planners & coders do not touch them.
"""

import logging
import re
from typing import Any, Dict, List, Set

from graph.state import AgentState
from agents.utils import add_log

logger = logging.getLogger(__name__)

MAX_FOCUS_FILE_CHARS = 4500
MAX_OUTLINE_CHARS = 300
SCRIPT_SRC_PATTERN = re.compile(r"""<script\s+[^>]*src=["']([^"']+)["']""", re.IGNORECASE)
CSS_LINK_PATTERN = re.compile(r"""<link\s+[^>]*href=["']([^"']+\.css)["']""", re.IGNORECASE)


def _extract_dependencies(files: Dict[str, str]) -> Dict[str, List[str]]:
    """Map which files depend on which other files (e.g. index.html depends on app.js and styles.css)."""
    deps: Dict[str, List[str]] = {}
    for path, content in files.items():
        deps[path] = []
        if path.endswith(".html"):
            for src in SCRIPT_SRC_PATTERN.findall(content):
                clean_src = src.lstrip("./").split("?")[0]
                if clean_src in files:
                    deps[path].append(clean_src)
            for href in CSS_LINK_PATTERN.findall(content):
                clean_href = href.lstrip("./").split("?")[0]
                if clean_href in files:
                    deps[path].append(clean_href)
        elif path.endswith((".js", ".jsx", ".ts", ".tsx")):
            # CommonJS requires or ES imports
            for m in re.findall(r"""(?:require\(['"]|from\s+['"])([^'"]+)['"]""", content):
                cand = m.lstrip("./")
                for ext in ("", ".js", ".jsx", ".ts", ".tsx"):
                    if (cand + ext) in files:
                        deps[path].append(cand + ext)
    return deps


def _build_focused_summary(
    existing_files: Dict[str, str],
    files_to_inspect: List[str],
    files_protected: List[str],
    dependencies: Dict[str, List[str]],
) -> str:
    """Build high-fidelity context for inspect files and lightweight outlines for others."""
    sections: List[str] = []

    # Priority 1: Files to Inspect (Full context)
    sections.append("=== PRIMARY FILES FOR MODIFICATION / INSPECTION ===")
    for path in sorted(files_to_inspect):
        content = existing_files.get(path, "")
        if len(content) <= MAX_FOCUS_FILE_CHARS:
            body = content
        else:
            body = content[:MAX_FOCUS_FILE_CHARS] + f"\n... [Truncated for brevity; total {len(content)} chars]"
        deps_str = f" (depends on: {', '.join(dependencies.get(path, []))})" if dependencies.get(path) else ""
        sections.append(f"--- FILE: {path}{deps_str} [{len(content)} chars] ---\n{body}\n")

    # Priority 2: Protected Files (Metadata & Safety Warning)
    if files_protected:
        sections.append("=== PROTECTED FILES (DO NOT MODIFY OR DELETE) ===")
        for path in sorted(files_protected):
            content = existing_files.get(path, "")
            preview = "\n".join(content.splitlines()[:5])[:MAX_OUTLINE_CHARS]
            sections.append(f"--- PROTECTED: {path} [{len(content)} chars] ---\n{preview}\n")

    # Priority 3: Other sibling files (Outlines)
    other_files = [
        p for p in existing_files
        if p not in files_to_inspect and p not in files_protected and not p.startswith("tests/")
    ]
    if other_files:
        sections.append("=== OTHER SIBLING FILES (FOR REFERENCE ONLY) ===")
        for path in sorted(other_files):
            content = existing_files.get(path, "")
            preview = "\n".join(content.splitlines()[:4])[:MAX_OUTLINE_CHARS]
            sections.append(f"--- SIBLING: {path} ---\n{preview}\n")

    return "\n".join(sections)


def refine_context_scanner_agent(state: AgentState) -> dict:
    """Agent node that establishes the project checkpoint, analyzes dependencies, and builds focused context."""
    logs = add_log(
        state.get("logs", []),
        "RefineContextScanner",
        "started",
        "Scanning project context, tracing dependency impacts, and taking checkpoint...",
    )

    existing_files = state.get("existing_files", {})
    intent = state.get("refinement_intent", {})
    files_to_inspect = intent.get("files_to_inspect") or list(existing_files.keys())[:3]
    files_protected = state.get("files_protected") or intent.get("files_protected") or []

    # 1. Establish immutable checkpoint snapshot
    checkpoint_files = dict(existing_files)

    # 2. Dependency tracing & impact analysis
    dependencies = _extract_dependencies(existing_files)

    # 3. If an inspected file is referenced by or references another file, ensure awareness
    impacted_files: Set[str] = set(files_to_inspect)
    for src, target_deps in dependencies.items():
        if src in files_to_inspect:
            impacted_files.update(target_deps)
        for target in target_deps:
            if target in files_to_inspect:
                impacted_files.add(src)

    # Remove protected files from modification candidates
    candidate_inspect = [p for p in impacted_files if p in existing_files and p not in files_protected]
    if not candidate_inspect:
        candidate_inspect = [p for p in files_to_inspect if p in existing_files]

    # 4. Generate focused summary
    context_summary = _build_focused_summary(existing_files, candidate_inspect, files_protected, dependencies)

    # 5. Initialize telemetry container
    telemetry = {
        "files_inspected": candidate_inspect,
        "files_protected": files_protected,
        "files_modified": [],
        "files_created": [],
        "files_deleted": [],
        "lines_added": 0,
        "lines_removed": 0,
        "rollback_triggered": False,
        "impact_graph": {k: v for k, v in dependencies.items() if v},
    }

    logs = add_log(
        logs,
        "RefineContextScanner",
        "completed",
        f"Context prepared: {len(candidate_inspect)} active file(s), {len(files_protected)} protected, "
        f"checkpoint snapshot saved ({len(checkpoint_files)} files).",
    )

    return {
        "checkpoint_files": checkpoint_files,
        "files_protected": files_protected,
        "architecture": {
            **state.get("architecture", {}),
            "context_summary": context_summary,
            "impacted_files": candidate_inspect,
        },
        "refinement_telemetry": telemetry,
        "logs": logs,
        "current_step": "refine_context_scanned",
    }
