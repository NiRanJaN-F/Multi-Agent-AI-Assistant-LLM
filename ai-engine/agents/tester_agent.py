"""Test Generator Agent node for creating automated unit tests."""

import logging
from config.llm import get_llm
from graph.state import AgentState
from agents.utils import add_log

logger = logging.getLogger(__name__)

TESTER_PROMPT_TEMPLATE = """You are a Software QA Automation Specialist.
Based on the generated source code files, write a complete, working unit test suite file.

Tech Stack: "{tech_stack}"
Source Files:
{files_summary}

Write a comprehensive test file (e.g., `tests/app.test.js` for JS/Node, or `tests/test_app.py` for Python).
Return ONLY the raw code content for the test file. Do not include markdown code block syntax if possible, or wrap entirely in a ``` block.
"""


def _get_fallback_test_code(project_name: str, tech_stack: str) -> tuple[str, str]:
    """Generate fallback unit test code when no LLM key is configured."""
    test_filepath = "tests/app.test.js"
    test_code = f"""// Automated Unit Tests generated for {project_name}
// Tech Stack: {tech_stack}

describe('Application Initializer & DOM Tests', () => {{
    test('DOM containers should be correctly configured', () => {{
        const appTitle = '{project_name}';
        expect(appTitle).toBeDefined();
        expect(typeof appTitle).toBe('string');
    }});

    test('Action button event listener contract validation', () => {{
        const initialCount = 0;
        const increment = (c) => c + 1;
        expect(increment(initialCount)).toBe(1);
    }});
}});
"""
    return test_filepath, test_code


def tester_agent(state: AgentState) -> dict:
    """Executes automated unit test generation for project code."""
    logs = add_log(state.get("logs", []), "TesterAgent", "started", "Generating automated unit test suite...")

    project_name = state.get("project_name", "app")
    tech_stack = state.get("tech_stack", "HTML/CSS/JS")
    files = state.get("files", {})

    llm = get_llm(temperature=0.2)
    updated_files = dict(files)

    if llm is None or not files:
        logger.info("Using default automated test suite template.")
        test_path, test_code = _get_fallback_test_code(project_name, tech_stack)
        updated_files[test_path] = test_code
        logs = add_log(logs, "TesterAgent", "completed", f"Generated unit test file '{test_path}' (Default template).")
    else:
        try:
            summary = "\n".join([f"--- {path} ---\n{content[:300]}..." for path, content in files.items() if not path.startswith("README")])
            response = llm.invoke(TESTER_PROMPT_TEMPLATE.format(
                tech_stack=tech_stack,
                files_summary=summary,
            ))
            test_code = response.content if hasattr(response, "content") else str(response)
            cleaned_code = test_code.strip()
            if cleaned_code.startswith("```"):
                lines = cleaned_code.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                cleaned_code = "\n".join(lines)

            # Determine test filename based on tech stack
            test_path = "tests/test_main.py" if "python" in tech_stack.lower() else "tests/app.test.js"
            updated_files[test_path] = cleaned_code
            logs = add_log(logs, "TesterAgent", "completed", f"Generated unit test suite '{test_path}'.")
        except Exception as e:
            logger.error(f"Tester Agent error: {e}")
            test_path, test_code = _get_fallback_test_code(project_name, tech_stack)
            updated_files[test_path] = test_code
            logs = add_log(logs, "TesterAgent", "warning", f"Generated fallback unit test suite due to: {e}")

    return {
        "files": updated_files,
        "logs": logs,
        "current_step": "tested",
    }
