"""QA / Code Reviewer Agent node for quality verification."""

import logging
from config.llm import invoke_with_retry
from graph.state import AgentState
from agents.utils import add_log, extract_json_from_llm, get_agent_llm, get_agent_llm_label

logger = logging.getLogger(__name__)

QA_PROMPT_TEMPLATE = """You are a QA Lead and Code Reviewer.
Inspect the generated code files for completeness, security, and basic correctness.

Target Stack: "{tech_stack}"
File List and Content Summary:
{files_summary}

Return ONLY a valid JSON object matching this schema:
{{
  "passed": true,
  "issues": [],
  "recommendations": ["Add unit tests", "Optimize responsive CSS"]
}}
If there are critical syntax errors or missing required files, set passed to false and list issues.
"""


def qa_agent(state: AgentState) -> dict:
    """Executes quality analysis and syntax inspection on generated files."""
    logs = add_log(state.get("logs", []), "QAAgent", "started", "Performing code review and quality verification...")

    files = state.get("files", {})
    tech_stack = state.get("tech_stack", "")

    issues = []
    recommendations = []

    # Local structural validation
    if not files:
        issues.append("No files were produced by Coder agent.")
    else:
        for path, content in files.items():
            if not content or len(content.strip()) < 10:
                issues.append(f"File '{path}' appears empty or incomplete.")

    llm = get_agent_llm(state, temperature=0.1)
    if llm is not None and files:
        try:
            summary = "\n".join([f"--- {path} ---\n{content[:300]}..." for path, content in files.items()])
            raw = invoke_with_retry(
                llm,
                QA_PROMPT_TEMPLATE.format(
                    tech_stack=tech_stack,
                    files_summary=summary,
                ),
            )
            parsed = extract_json_from_llm(raw)

            passed = parsed.get("passed", True) and len(issues) == 0
            issues.extend(parsed.get("issues", []))
            recommendations.extend(parsed.get("recommendations", []))
        except Exception as e:
            logger.warning(f"QA LLM inspection failed: {e}")
            passed = len(issues) == 0
            recommendations.append(f"LLM QA fallback used: {e}")
    else:
        passed = len(issues) == 0
        if passed:
            recommendations.append("Basic structural check passed (mock QA mode).")

    review_results = {
        "passed": passed,
        "issues": issues,
        "recommendations": recommendations,
    }

    status_msg = (
        f"Passed code review via {get_agent_llm_label(state)}."
        if passed and llm is not None
        else f"Found {len(issues)} issues during code review." if not passed else "Passed structural code review."
    )
    logs = add_log(logs, "QAAgent", "completed" if passed else "warning", status_msg)

    return {
        "review_results": review_results,
        "logs": logs,
        "current_step": "reviewed",
    }
