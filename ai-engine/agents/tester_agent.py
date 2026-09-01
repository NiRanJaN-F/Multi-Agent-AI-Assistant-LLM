"""Test Generator Agent node for creating an automated unit test suite.

The suite is derived from the generated file set rather than from an LLM call, so a full run
costs no extra provider quota. Free-tier keys allow very few requests per day, and a test
scaffold is mechanical enough not to need one.
"""

import logging

from graph.state import AgentState
from agents.utils import add_log

logger = logging.getLogger(__name__)


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

    if is_python:
        modules = [path[:-3].replace("/", ".") for path in source_files if path.endswith(".py")]
        test_path = "tests/test_app.py"
        test_code = _python_test_suite(project_name, modules)
    else:
        test_path = "tests/app.test.js"
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
