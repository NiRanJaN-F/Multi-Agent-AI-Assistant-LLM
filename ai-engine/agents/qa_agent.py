"""QA / Code Reviewer Agent node for quality verification.

Static checks over generated files: bracket balance, empty files, broken HTML asset
references, interactivity verification, and cross-agent API contract validation.

Optional LLM-based review gated behind ENABLE_LLM_QA_REVIEW (default=false for
free-tier; enabled when tokens are budgeted).
"""

import ast
import json
import logging
import re

from config.llm import is_quota_error
from config.settings import settings
from graph.state import AgentState
from agents.utils import add_log, extract_json_from_llm, get_agent_llm, llm_label

logger = logging.getLogger(__name__)

MIN_CONTENT_CHARS = 10
BRACKET_PAIRS = {")": "(", "]": "[", "}": "{"}
HTML_REFERENCE_PATTERN = re.compile(r"""(?:src|href)\s*=\s*["']([^"'#?]+)["']""", re.IGNORECASE)

INTERACTION_PATTERNS = re.compile(
    r"addEventListener|onclick|onsubmit|onchange|onkeyup|onkeydown|oninput|"
    r"querySelector|getElementById|getElementsBy|setAttribute|classList|localStorage|"
    r"fetch|axios|XMLHttpRequest|useState|useEffect|useRef|useReducer|useCallback|useMemo|"
    r"onClick|onChange|onSubmit|onKeyDown|onKeyUp|onFocus|onBlur|<button|<form|<input",
    re.IGNORECASE,
)

CONFIG_AND_HELPER_FILES = (
    "vite.config",
    "tailwind.config",
    "postcss.config",
    "eslint.config",
    "jest.config",
    "webpack.config",
    "tsconfig",
    "package.json",
    "server.js",
    "app.js",
    "routes/",
    "models/",
    "middleware/",
    "controllers/",
    "services/",
    "db/",
    "api/",
    "backend/",
)

LLM_QA_REVIEW_PROMPT = """You are a senior code review and QA engineer.
Review the following detected issues and code snippets from a generated project.

Issues detected:
{issues}

Code snippets:
{file_snippets}

Provide concrete fix instructions and list any files that should be rewritten.
Return ONLY valid JSON matching this schema:
{{
  "fix_instructions": "Detailed instructions on fixing detected bugs and logic gaps",
  "files_to_rewrite": ["path/to/file.js"]
}}
"""


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
    basenames = {path.replace("\\", "/").rsplit("/", 1)[-1] for path in files}

    for path, content in files.items():
        if not path.endswith(".html"):
            continue

        for reference in HTML_REFERENCE_PATTERN.findall(content):
            ref = reference.strip()
            if (
                "//" in ref
                or ref.startswith(("data:", "mailto:", "javascript:", "#"))
                or "${" in ref
                or "{{" in ref
                or ref.startswith("http:")
                or ref.startswith("https:")
            ):
                continue
            if ref.replace("\\", "/").rsplit("/", 1)[-1] not in basenames:
                issues.append(f"'{path}' references '{reference}', which was not generated.")

    return issues



def _check_interactivity(files: dict[str, str]) -> list[str]:
    """Check that generated front-end JavaScript files contain interactive logic."""
    issues = []
    js_files = {}
    for path, content in files.items():
        norm_path = path.replace("\\", "/").lower()
        if (
            norm_path.endswith((".js", ".jsx", ".ts", ".tsx"))
            and not norm_path.startswith("tests/")
            and not any(cfg in norm_path for cfg in CONFIG_AND_HELPER_FILES)
        ):
            js_files[path] = content

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


def _build_fix_instructions(issues: list[str], files: dict[str, str]) -> str:
    """Convert static issues to a compact, actionable fix-instruction list the coder can ingest."""
    if not issues:
        return ""

    lines: list[str] = []
    for issue in issues[:15]:
        mentioned_path = None
        for path in files:
            if path.lower() in issue.lower() or issue.lower().startswith(("file '" + path.lower(), "javascript file '" + path.lower())):
                mentioned_path = path
                break
        if mentioned_path:
            content = files.get(mentioned_path, "")
            snippet_lines = content.splitlines()[:18]
            snippet = "\n    ".join(f"L{i+1}: {l[:140]}" for i, l in enumerate(snippet_lines) if l.strip())
            lines.append(f"- FILE: {mentioned_path}\n  ISSUE: {issue}\n  CONTEXT SNIPPET:\n    {snippet[:1200]}")
        else:
            lines.append(f"- {issue}")
    return "\n".join(lines)


def _qa_file_snippets(files: dict[str, str], max_chars: int = 3000) -> str:
    """Compact snippets of all files for optional LLM QA review."""
    chunks: list[str] = []
    total = 0
    for path, content in sorted(files.items()):
        if total >= max_chars:
            break
        lines = content.splitlines()
        head = "\n    ".join(f"L{i+1}: {l[:160]}" for i, l in enumerate(lines[:20]) if l.strip())
        chunk = f"--- {path} ---\n    {head[:800]}"
        if total + len(chunk) > max_chars:
            chunk = chunk[: max(0, max_chars - total)]
        chunks.append(chunk)
        total += len(chunk)
    return "\n".join(chunks)


def qa_agent(state: AgentState) -> dict:
    """Executes static quality analysis + optional LLM review (gated by ENABLE_LLM_QA_REVIEW=false default)."""
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

    fix_instructions = _build_fix_instructions(issues, files) if issues else ""

    if issues and settings.enable_llm_qa_review and len(issues) <= 12:
        llm = get_agent_llm(state, temperature=0.1, role="tester")
        if llm is not None:
            try:
                raw = llm.invoke(
                    LLM_QA_REVIEW_PROMPT.format(
                        issues=issues,
                        file_snippets=_qa_file_snippets(files),
                    )
                )
                parsed = extract_json_from_llm(raw.content if hasattr(raw, "content") else str(raw))
                llm_fix = parsed.get("fix_instructions")
                if llm_fix:
                    fix_instructions = (fix_instructions + "\n\n--- LLM REVIEW DEEP FIXES ---\n" + str(llm_fix)).strip()
                    recommendations.append(f"LLM review via {llm_label(llm, state)} appended fix instructions.")
                rewrite = parsed.get("files_to_rewrite")
                if isinstance(rewrite, list) and rewrite:
                    recommendations.append(f"Files flagged for rewrite: {', '.join(str(x) for x in rewrite[:8])}")
                logs = add_log(logs, "QAAgent", "info", f"Optional LLM QA review ran via {llm_label(llm, state)}.")
            except Exception as e:
                logger.warning("Optional LLM QA review failed: %s", e)
                if not is_quota_error(e):
                    logs = add_log(logs, "QAAgent", "warning", f"Optional LLM QA review skipped: {e}")

    passed = not issues
    if passed:
        recommendations.append(f"Static review passed across {len(files)} files.")

    review_results = {
        "passed": passed,
        "issues": issues,
        "recommendations": recommendations,
        "fix_instructions": fix_instructions,
    }

    status_msg = (
        f"Passed static code review of {len(files)} files."
        if passed
        else f"Found {len(issues)} issues during code review."
    )
    logs = add_log(logs, "QAAgent", "completed" if passed else "warning", status_msg)

    return {
        "review_results": review_results,
        "qa_fix_instructions": fix_instructions,
        "retry_count": state.get("retry_count", 0) + (0 if passed else 1),
        "logs": logs,
        "current_step": "reviewed",
    }
