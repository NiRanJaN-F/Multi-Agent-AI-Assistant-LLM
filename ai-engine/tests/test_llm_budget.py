"""End-to-end tests asserting how much provider quota a single run consumes."""

import json
import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.settings import settings
from graph.builder import create_agent_graph, create_refinement_graph
from graph.state import AgentState

PLAN = json.dumps(
    {
        "project_name": "todo-app",
        "tech_stack": "HTML/CSS/JavaScript",
        "tasks": ["Build the UI", "Wire up the logic"],
        "design_notes": "Single page app",
        "file_paths": ["index.html", "app.js"],
    }
)

CODE = """FILE: index.html
```
<html><script src="app.js"></script></html>
```

FILE: app.js
```
const tasks = [];
console.log(tasks);
```
"""

REFINE_PLAN = json.dumps(
    {
        "summary": "Add a dark mode toggle",
        "tasks": ["Add the toggle"],
        "modify_files": ["app.js"],
        "new_files": [],
    }
)

REFINED_CODE = """FILE: app.js
```
const theme = 'dark';
console.log(theme);
```
"""


class Response:
    def __init__(self, content: str) -> None:
        self.content = content


class ScriptedLLM:
    """Returns the queued responses in order and counts how many calls were made."""

    def __init__(self, responses: list[str]) -> None:
        self.responses = list(responses)
        self.prompts: list[str] = []

    def invoke(self, prompt: str) -> Response:
        self.prompts.append(prompt)
        if not self.responses:
            raise AssertionError("the pipeline made more LLM calls than the budget allows")
        return Response(self.responses.pop(0))


def initial_state(**overrides) -> AgentState:
    state: AgentState = {
        "user_prompt": "Build a todo app",
        "project_name": "todo-app",
        "tech_stack": "",
        "tasks": [],
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


class TestLLMCallBudget(unittest.TestCase):
    """A free-tier key allows very few requests per day, so each run has a hard budget."""

    def setUp(self):
        keys = patch.multiple(
            settings,
            gemini_api_key="test-key",
            openai_api_key=None,
            gemini_model="gemini-2.5-flash",
            gemini_fallback_models="",
        )
        keys.start()
        self.addCleanup(keys.stop)

    def run_graph(self, graph, responses: list[str], state: AgentState) -> tuple[dict, ScriptedLLM]:
        llm = ScriptedLLM(responses)
        with patch("config.llm.get_llm", return_value=llm):
            return graph.invoke(state), llm

    def test_generation_costs_two_llm_calls(self):
        final_state, llm = self.run_graph(create_agent_graph(), [PLAN, CODE], initial_state())

        self.assertEqual(len(llm.prompts), 2)
        self.assertIsNone(final_state.get("error"))
        self.assertEqual(final_state["tasks"], ["Build the UI", "Wire up the logic"])
        self.assertIn("tests/app.test.js", final_state["files"])
        self.assertIn("README.md", final_state["files"])
        self.assertTrue(final_state["review_results"]["passed"])

    def test_refinement_costs_two_llm_calls(self):
        state = initial_state(
            change_request="Add a dark mode toggle",
            existing_files={
                "index.html": '<html><script src="app.js"></script></html>',
                "app.js": "const tasks = [];\n",
            },
        )
        final_state, llm = self.run_graph(
            create_refinement_graph(), [REFINE_PLAN, REFINED_CODE], state
        )

        self.assertEqual(len(llm.prompts), 2)
        self.assertEqual(final_state["changed_files"], ["app.js"])
        self.assertIn("dark", final_state["files"]["app.js"])
        self.assertEqual(
            final_state["files"]["index.html"],
            '<html><script src="app.js"></script></html>',
        )

    def test_quota_exhaustion_fails_the_run_immediately(self):
        quota_error = RuntimeError("429 ResourceExhausted: quota exceeded")

        class ExhaustedLLM:
            def __init__(self) -> None:
                self.calls = 0

            def invoke(self, prompt: str):
                self.calls += 1
                raise quota_error

        llm = ExhaustedLLM()
        with patch("config.llm.get_llm", return_value=llm):
            final_state = create_agent_graph().invoke(initial_state())

        self.assertEqual(llm.calls, 1)
        self.assertEqual(final_state["current_step"], "planning_failed")
        self.assertIn("quota", final_state["error"].lower())
        self.assertEqual(final_state["logs"][-1]["status"], "quota_exceeded")


if __name__ == "__main__":
    unittest.main()
