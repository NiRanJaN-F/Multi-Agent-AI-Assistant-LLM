"""Diff-Aware QA and Verification Agent.

Validates iterative refinements through:
1. Static code review (bracket balance, syntax, HTML references, interactivity).
2. Diff Analysis: Calculates unified diffs between checkpoint snapshot and modified files.
3. Protection Enforcement: Detects illegal modifications to protected files.
4. Scope Drift Detection: Identifies unexpected file touches outside the planned scope.
5. Rollback Recovery: Restores project checkpoint if severe regressions occur after retries.
"""

import difflib
import logging
from typing import Any, Dict, List

from config.settings import settings
from graph.state import AgentState
from agents.qa_agent import (
    _build_fix_instructions,
    _check_contract_alignment,
    _check_file,
    _check_html_references,
    _check_interactivity,
)
from agents.utils import add_log

logger = logging.getLogger(__name__)


def compute_diff_metrics(
    before_files: Dict[str, str],
    after_files: Dict[str, str],
    modify_targets: List[str],
    new_targets: List[str],
    protected_files: List[str],
) -> Dict[str, Any]:
    """Compute structural diff metrics between the checkpoint and generated state."""
    files_changed: List[str] = []
    files_created: List[str] = []
    unexpected_changes: List[str] = []
    protected_violations: List[str] = []
    lines_added = 0
    lines_removed = 0
    diff_summaries: Dict[str, str] = {}

    expected_targets = set(modify_targets) | set(new_targets) | {"README.md"}

    for path, new_content in after_files.items():
        if path.startswith("tests/"):
            continue

        old_content = before_files.get(path)
        if old_content is None:
            # Newly created file
            files_created.append(path)
            lines_added += len(new_content.splitlines())
            if path not in expected_targets:
                unexpected_changes.append(path)
        elif old_content != new_content:
            # Modified file
            files_changed.append(path)
            diff = list(
                difflib.unified_diff(
                    old_content.splitlines(),
                    new_content.splitlines(),
                    fromfile=f"a/{path}",
                    tofile=f"b/{path}",
                    lineterm="",
                )
            )
            added = sum(1 for line in diff if line.startswith("+") and not line.startswith("+++"))
            removed = sum(1 for line in diff if line.startswith("-") and not line.startswith("---"))
            lines_added += added
            lines_removed += removed
            diff_summaries[path] = f"+{added}/-{removed} lines"

            if path in protected_files:
                protected_violations.append(path)
            elif path not in expected_targets:
                unexpected_changes.append(path)

    return {
        "files_changed": files_changed,
        "files_created": files_created,
        "unexpected_changes": unexpected_changes,
        "protected_violations": protected_violations,
        "lines_added": lines_added,
        "lines_removed": lines_removed,
        "diff_summaries": diff_summaries,
    }


def diff_qa_agent(state: AgentState) -> dict:
    """QA Agent equipped with before-and-after diff inspection and automated rollback safeguards."""
    logs = add_log(
        state.get("logs", []),
        "DiffQAAgent",
        "started",
        "Inspecting unified diffs, verifying code changes, and checking for regressions...",
    )

    files = dict(state.get("files", {}))
    checkpoint_files = dict(state.get("checkpoint_files", {}) or state.get("existing_files", {}))
    architecture = state.get("architecture", {})
    modify_targets = list(architecture.get("modify_files", []))
    new_targets = list(architecture.get("new_files", []))
    protected_files = list(state.get("files_protected", []) or [])
    retry_count = state.get("retry_count", 0)

    # 1. Static validation across current files
    issues: List[str] = []
    recommendations: List[str] = []

    for path, content in sorted(files.items()):
        issues.extend(_check_file(path, content))
    issues.extend(_check_html_references(files))
    issues.extend(_check_interactivity(files))
    issues.extend(_check_contract_alignment(files, state.get("api_contract", [])))

    # 2. Diff metrics computation
    diff_metrics = compute_diff_metrics(
        checkpoint_files,
        files,
        modify_targets,
        new_targets,
        protected_files,
    )

    # 3. Assess protection violations & scope drift
    if diff_metrics["protected_violations"]:
        for p in diff_metrics["protected_violations"]:
            issues.append(f"Protected file '{p}' was modified during refinement; must remain untouched.")

    if diff_metrics["unexpected_changes"]:
        for p in diff_metrics["unexpected_changes"]:
            recommendations.append(f"Scope drift note: '{p}' was modified outside planned targets.")

    # 4. Check if coder made zero changes
    if not diff_metrics["files_changed"] and not diff_metrics["files_created"]:
        issues.append("No files were updated or created by the refinement coder.")

    # 5. Determine pass/fail & evaluate rollback condition
    passed = not issues
    rollback_triggered = False

    # Rollback condition: if retries exhausted and critical issues remain, revert to checkpoint
    if not passed and retry_count >= 2 and settings.refinement_rollback_on_regression and checkpoint_files:
        logger.warning("Diff QA failed after max retries. Rolling back to checkpoint snapshot to prevent corruption.")
        files = dict(checkpoint_files)
        rollback_triggered = True
        recommendations.append("Automated Rollback: Restored last known healthy checkpoint.")
        logs = add_log(
            logs,
            "DiffQAAgent",
            "warning",
            "Max retries reached with validation failures. Rolled back changes to project checkpoint.",
        )

    # 6. Update telemetry
    telemetry = dict(state.get("refinement_telemetry", {}) or {})
    telemetry.update({
        "files_modified": diff_metrics["files_changed"],
        "files_created": diff_metrics["files_created"],
        "lines_added": diff_metrics["lines_added"],
        "lines_removed": diff_metrics["lines_removed"],
        "rollback_triggered": rollback_triggered,
        "diff_summaries": diff_metrics["diff_summaries"],
    })

    fix_instructions = _build_fix_instructions(issues, files) if issues else ""

    diff_report = {
        "passed": passed,
        "issues": issues,
        "recommendations": recommendations,
        "diff_metrics": diff_metrics,
        "rollback_triggered": rollback_triggered,
    }

    status_msg = (
        f"Diff QA passed: {len(diff_metrics['files_changed'])} modified, {len(diff_metrics['files_created'])} created "
        f"(+{diff_metrics['lines_added']}/-{diff_metrics['lines_removed']} lines)."
        if passed
        else f"Diff QA found {len(issues)} issue(s) across code changes."
    )
    logs = add_log(logs, "DiffQAAgent", "completed" if passed else "warning", status_msg)

    review_results = {
        "passed": passed,
        "issues": issues,
        "recommendations": recommendations,
        "fix_instructions": fix_instructions,
        "diff_report": diff_report,
    }

    return {
        "files": files,
        "diff_report": diff_report,
        "review_results": review_results,
        "qa_fix_instructions": fix_instructions,
        "refinement_telemetry": telemetry,
        "retry_count": retry_count + (0 if passed else 1),
        "logs": logs,
        "current_step": "diff_reviewed",
    }
