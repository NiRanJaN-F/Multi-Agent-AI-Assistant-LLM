"""Test Generator Agent node for creating an automated unit test suite.

Uses the TESTER_PROVIDER LLM (e.g. DeepSeek) when configured to write REAL unit tests
and API integration tests based on actual generated function signatures and route definitions.
Falls back to template-based tests when no key is set.
"""

import logging

from config.llm import invoke_with_retry
from graph.state import AgentState
from agents.utils import add_log, get_agent_llm, llm_label, strip_code_fence

logger = logging.getLogger(__name__)

TEST_GENERATOR_PROMPT_TEMPLATE = """You are a Senior QA Automation Engineer.
Write a complete, executable automated unit and integration test suite for the generated project.

Project Name: "{project_name}"
Tech Stack: "{tech_stack}"

Generated Source Files:
{source_files_content}

CRITICAL REQUIREMENTS:
- Write a COMPLETE, fully functional test file with REAL assertions testing the generated functions, routes, and logic.
- For Node.js/JavaScript: write Node test-runner or Jest tests (`require('node:test')` and `require('node:assert/strict')`) that verify exports, route responses, and state logic.
- For Python: write a `unittest.TestCase` suite that imports the modules and tests functions/endpoints.
- Do NOT output placeholder or empty tests.
- Output ONLY the complete raw source code inside a single code fence, with no commentary.
"""


def _python_test_suite(project_name: str, module_names: list[str]) -> str:
    """Import-and-smoke-test suite for a Python project."""
    imports = "\n".join(f"    import {name}  # noqa: F401" for name in module_names) or "    pass"

    return f'''"""Automated unit tests generated for {project_name}."""

import unittest


class ModuleImportTests(unittest.TestCase):
    def test_modules_import_cleanly(self):
{imports}


if __name__ == "__main__":
    unittest.main()
'''


def _js_test_suite(project_name: str, source_files: list[str]) -> str:
    """Node test-runner suite asserting the generated sources exist and are non-empty."""
    file_list = ", ".join(f"'{path}'" for path in source_files)

    return f"""// Automated unit tests generated for {project_name}
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SOURCE_FILES = [{file_list}];
const projectRoot = path.join(__dirname, '..');

test('every generated source file exists and has content', () => {{
  for (const file of SOURCE_FILES) {{
    const fullPath = path.join(projectRoot, file);
    assert.ok(fs.existsSync(fullPath), `missing file: ${{file}}`);
    assert.ok(fs.readFileSync(fullPath, 'utf8').trim().length > 0, `empty file: ${{file}}`);
  }}
}});

test('the entry point references its scripts and styles', () => {{
  const entry = SOURCE_FILES.find((file) => file.endsWith('.html'));
  if (!entry) return;

  const html = fs.readFileSync(path.join(projectRoot, entry), 'utf8');
  for (const file of SOURCE_FILES.filter((f) => f.endsWith('.js') || f.endsWith('.css'))) {{
    assert.ok(html.includes(path.basename(file)), `entry point does not reference ${{file}}`);
  }}
}});
"""


def tester_agent(state: AgentState) -> dict:
    """Builds an automated test suite for the generated project files."""
    logs = add_log(state.get("logs", []), "TesterAgent", "started", "Generating automated unit test suite...")

    project_name = state.get("project_name", "app")
    tech_stack = state.get("tech_stack", "HTML/CSS/JS")
    files = state.get("files", {})

    source_files = sorted(path for path in files if not path.startswith(("README", "tests/")))
    is_python = "python" in tech_stack.lower() or any(path.endswith(".py") for path in source_files)
    test_path = "tests/test_app.py" if is_python else "tests/app.test.js"

    llm = get_agent_llm(state, temperature=0.1, role="tester")

    if llm is not None and source_files:
        try:
            # Format source snippets for the prompt (capped at 4k chars to avoid token limits)
            snippets = []
            for path in source_files[:6]:
                content = files[path][:800]
                snippets.append(f"--- FILE: {path} ---\n{content}\n")
            source_content_str = "\n".join(snippets)

            raw = invoke_with_retry(
                llm,
                TEST_GENERATOR_PROMPT_TEMPLATE.format(
                    project_name=project_name,
                    tech_stack=tech_stack,
                    source_files_content=source_content_str,
                ),
            )
            test_code = strip_code_fence(raw)
            if test_code and len(test_code.strip()) > 30:
                updated_files = dict(files)
                updated_files[test_path] = test_code
                logs = add_log(
                    logs,
                    "TesterAgent",
                    "completed",
                    f"Generated intelligent unit test suite '{test_path}' via {llm_label(llm, state)}.",
                )
                return {"files": updated_files, "logs": logs, "current_step": "tested"}
        except Exception as e:
            logger.warning("TesterAgent LLM call failed (%s); falling back to template test suite.", e)

    # Fallback template-based test suite
    if is_python:
        modules = [path[:-3].replace("/", ".") for path in source_files if path.endswith(".py")]
        test_code = _python_test_suite(project_name, modules)
    else:
        test_code = _js_test_suite(project_name, source_files)

    updated_files = dict(files)
    updated_files[test_path] = test_code

    logs = add_log(
        logs,
        "TesterAgent",
        "completed",
        f"Generated unit test suite '{test_path}' covering {len(source_files)} source files.",
    )

    return {
        "files": updated_files,
        "logs": logs,
        "current_step": "tested",
    }
