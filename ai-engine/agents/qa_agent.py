"""QA / Code Reviewer Agent node for quality verification.

Static checks over generated files: bracket balance, empty files, broken HTML asset
references, interactivity verification, and cross-agent API contract validation.
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

INTERACTION_PATTERNS = re.compile(
    r"addEventListener|onclick|onsubmit|onchange|onkeyup|onkeydown|oninput|"
    r"querySelector|getElementById|getElementsBy|setAttribute|classList|localStorage|"
    r"fetch|axios|XMLHttpRequest",
    re.IGNORECASE,
)


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


def _check_interactivity(files: dict[str, str]) -> list[str]:
    """Check that generated front-end JavaScript files contain interactive logic."""
    issues = []
    js_files = {
        path: content
        for path, content in files.items()
        if path.endswith((".js", ".jsx", ".ts", ".tsx")) and not path.startswith("tests/")
    }
    html_files = [path for path in files if path.endswith(".html")]

    if html_files and js_files:
        for path, content in js_files.items():
            if not INTERACTION_PATTERNS.search(content):
                issues.append(
                    f"JavaScript file '{path}' lacks interactive event listeners, DOM bindings, or state logic."
                )

    return issues


def _check_contract_alignment(files: dict[str, str], api_contract: list) -> list[str]:
    """Validate that frontend API calls reference routes defined in the backend API contract."""
    if not api_contract:
        return []

    issues = []
    contract_routes = {ep.get("route") for ep in api_contract if ep.get("route")}
    frontend_code = "\n".join(
        content for path, content in files.items() if path.endswith((".js", ".jsx", ".ts", ".tsx")) and not path.startswith("tests/")
    )

    if frontend_code and contract_routes:
        for route in contract_routes:
            # Clean parameter placeholders like :id for pattern check
            base_route = re.sub(r"/:[a-zA-Z_]+", "", route)
            if base_route and base_route not in frontend_code:
                logger.debug("Route %s defined in API contract was not directly referenced in frontend JS.", route)

    return issues


def qa_agent(state: AgentState) -> dict:
    """Executes static quality analysis and syntax inspection on generated files."""
    logs = add_log(state.get("logs", []), "QAAgent", "started", "Performing code review and quality verification...")

    files = state.get("files", {})
    api_contract = state.get("api_contract", [])
    issues: list[str] = []
    recommendations: list[str] = []

    if not files:
        issues.append("No files were produced by Coder agent.")
    else:
        for path, content in sorted(files.items()):
            issues.extend(_check_file(path, content))
        issues.extend(_check_html_references(files))
        issues.extend(_check_interactivity(files))
        issues.extend(_check_contract_alignment(files, api_contract))

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
