"""Unit tests proving Architect, Tester, QA, and Doc Writer never spend LLM quota."""

import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.architecture_agent import architecture_agent
from agents.doc_agent import doc_agent
from agents.qa_agent import qa_agent
from agents.tester_agent import tester_agent
from graph.state import AgentState


def base_state(**overrides) -> AgentState:
    state: AgentState = {
        "user_prompt": "Create a todo app",
        "project_name": "todo-app",
        "tech_stack": "HTML/CSS/JavaScript",
        "tasks": ["Build the UI", "Wire up the logic"],
        "architecture": {},
        "files": {},
        "existing_files": {},
        "change_request": "",
        "changed_files": [],
        "review_results": {},
        "documentation": "",
        "logs": [],
        "current_step": "init",
        "retry_count": 0,
        "error": None,
        "llm_provider": "gemini",
    }
    state.update(overrides)
    return state


class TestNoLLMCalls(unittest.TestCase):
    """These agents must run on a fully exhausted API key."""

    def setUp(self):
        self.get_llm = patch("config.llm.get_llm", side_effect=AssertionError("agent called an LLM"))
        self.get_llm.start()
        self.addCleanup(self.get_llm.stop)

    def test_architect_tester_qa_and_docs_run_without_an_llm(self):
        architected = architecture_agent(
            base_state(architecture={"file_paths": ["index.html", "app.js"], "design_notes": "SPA"})
        )
        self.assertEqual(architected["architecture"]["file_paths"], ["index.html", "app.js"])

        tested = tester_agent(
            base_state(files={"index.html": "<html></html>", "app.js": "const x = 1;"})
        )
        self.assertIn("tests/app.test.js", tested["files"])

        reviewed = qa_agent(base_state(files=tested["files"]))
        self.assertIn("passed", reviewed["review_results"])

        documented = doc_agent(base_state(files=tested["files"]))
        self.assertIn("README.md", documented["files"])


class TestArchitectValidation(unittest.TestCase):
    def test_rejects_traversal_and_absolute_paths(self):
        result = architecture_agent(
            base_state(architecture={"file_paths": ["../escape.js", "/etc/passwd", "app.js"]})
        )
        self.assertEqual(result["architecture"]["file_paths"], ["etc/passwd", "app.js"])

    def test_falls_back_to_a_stack_default_when_the_plan_is_empty(self):
        result = architecture_agent(base_state(tech_stack="Python FastAPI"))
        self.assertEqual(result["architecture"]["file_paths"], ["main.py", "requirements.txt"])


class TestTesterSuite(unittest.TestCase):
    def test_generates_a_python_suite_for_python_projects(self):
        result = tester_agent(
            base_state(tech_stack="Python", files={"main.py": "print('hi')"})
        )
        self.assertIn("tests/test_app.py", result["files"])
        self.assertIn("import main", result["files"]["tests/test_app.py"])

    def test_javascript_suite_lists_every_source_file(self):
        result = tester_agent(
            base_state(files={"index.html": "<html></html>", "app.js": "const x = 1;"})
        )
        suite = result["files"]["tests/app.test.js"]
        self.assertIn("'index.html'", suite)
        self.assertIn("'app.js'", suite)


class TestStaticReview(unittest.TestCase):
    def test_passes_a_healthy_project(self):
        files = {
            "index.html": '<html><link rel="stylesheet" href="styles.css"><script src="app.js"></script></html>',
            "styles.css": "body { margin: 0; }",
            "app.js": "const x = 1;\nconsole.log(x);",
            "tests/app.test.js": "// generated test suite\n",
            "README.md": "# Todo App\n\nGenerated project.\n",
        }
        result = qa_agent(base_state(files=files))
        self.assertTrue(result["review_results"]["passed"])
        self.assertEqual(result["retry_count"], 0)

    def test_flags_empty_files_and_broken_syntax(self):
        files = {
            "app.js": "function broken() { console.log('x');",
            "config.json": "{ not json }",
            "main.py": "def f(:\n    pass",
            "empty.css": "",
        }
        result = qa_agent(base_state(files=files))
        issues = " ".join(result["review_results"]["issues"])

        self.assertFalse(result["review_results"]["passed"])
        self.assertIn("app.js", issues)
        self.assertIn("config.json", issues)
        self.assertIn("main.py", issues)
        self.assertIn("empty.css", issues)
        self.assertEqual(result["retry_count"], 1)

    def test_flags_html_references_to_missing_assets(self):
        files = {"index.html": '<html><script src="missing.js"></script></html>'}
        result = qa_agent(base_state(files=files))

        self.assertFalse(result["review_results"]["passed"])
        self.assertIn("missing.js", " ".join(result["review_results"]["issues"]))


class TestTemplatedDocs(unittest.TestCase):
    def test_readme_reports_the_plan_structure_and_review(self):
        state = base_state(
            files={"index.html": "<html></html>", "app.js": "const x = 1;"},
            architecture={"design_notes": "Single page app", "file_paths": ["index.html"]},
            review_results={"passed": False, "issues": ["File 'app.js' looks truncated."]},
        )
        readme = doc_agent(state)["documentation"]

        self.assertIn("# Todo App", readme)
        self.assertIn("Build the UI", readme)
        self.assertIn("index.html", readme)
        self.assertIn("Single page app", readme)
        self.assertIn("1 open issue(s)", readme)


if __name__ == "__main__":
    unittest.main()
