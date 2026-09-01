"""QA / Code Reviewer Agent node for quality verification.

The review is a set of static checks over the generated files instead of an LLM call: it costs
no provider quota and catches the failures that actually occur (empty files, syntax errors,
an entry point referencing assets that were never generated).
"""

import ast
import json
import logging
import re

from graph.state import AgentState
from agents.utils import add_log

logger = logging.getLogger(__name__)

MIN_CONTENT_CHARS = 10
BRACKET_PAIRS = {")": "(", "]": "[", "}": "{"}
HTML_REFERENCE_PATTERN = re.compile(r"""(?:src|href)\s*=\s*["']([^"'#?]+)["']""", re.IGNORECASE)


def _unbalanced_brackets(content: str) -> bool:
    """Cheap syntax smell check for brace/bracket languages, ignoring strings and comments."""
    stripped = re.sub(r"//.*?$|/\*[\s\S]*?\*/|'[^'\n]*'|\"[^\"\n]*\"|`[^`]*`", "", content, flags=re.MULTILINE)
    stack: list[str] = []

    for char in stripped:
        if char in "([{":
            stack.append(char)
        elif char in BRACKET_PAIRS:
            if not stack or stack.pop() != BRACKET_PAIRS[char]:
                return True

    return bool(stack)


def _check_file(path: str, content: str) -> list[str]:
    """Return the issues found in a single generated file."""
    if not content or len(content.strip()) < MIN_CONTENT_CHARS:
        return [f"File '{path}' appears empty or incomplete."]

    if path.endswith(".py"):
        try:
            ast.parse(content)
        except SyntaxError as error:
            return [f"File '{path}' has a Python syntax error on line {error.lineno}: {error.msg}."]
    elif path.endswith(".json"):
        try:
            json.loads(content)
        except json.JSONDecodeError as error:
            return [f"File '{path}' is not valid JSON: {error.msg} (line {error.lineno})."]
    elif path.endswith((".js", ".jsx", ".ts", ".tsx", ".css")) and _unbalanced_brackets(content):
        return [f"File '{path}' has unbalanced brackets and is probably truncated."]

    return []


def _check_html_references(files: dict[str, str]) -> list[str]:
    """Flag local assets an HTML file links to that were never generated."""
    issues = []
    basenames = {path.rsplit("/", 1)[-1] for path in files}

    for path, content in files.items():
        if not path.endswith(".html"):
            continue

        for reference in HTML_REFERENCE_PATTERN.findall(content):
            if "//" in reference or reference.startswith(("data:", "mailto:")):
                continue
            if reference.rsplit("/", 1)[-1] not in basenames:
                issues.append(f"'{path}' references '{reference}', which was not generated.")

    return issues


def qa_agent(state: AgentState) -> dict:
    """Executes static quality analysis and syntax inspection on generated files."""
    logs = add_log(state.get("logs", []), "QAAgent", "started", "Performing code review and quality verification...")

    files = state.get("files", {})
    issues: list[str] = []
    recommendations: list[str] = []

    if not files:
        issues.append("No files were produced by Coder agent.")
    else:
        for path, content in sorted(files.items()):
            issues.extend(_check_file(path, content))
        issues.extend(_check_html_references(files))

        if not any(path.startswith("tests/") for path in files):
            recommendations.append("Add an automated test suite under tests/.")
        if not any(path.startswith("README") for path in files):
            recommendations.append("Add a README.md describing how to run the project.")

    passed = not issues
    if passed:
        recommendations.append(f"Static review passed across {len(files)} files.")

    review_results = {
        "passed": passed,
        "issues": issues,
        "recommendations": recommendations,
    }

    status_msg = (
        f"Passed static code review of {len(files)} files."
        if passed
        else f"Found {len(issues)} issues during code review."
    )
    logs = add_log(logs, "QAAgent", "completed" if passed else "warning", status_msg)

    return {
        "review_results": review_results,
        "retry_count": state.get("retry_count", 0) + (0 if passed else 1),
        "logs": logs,
        "current_step": "reviewed",
    }
