"""Unit tests for individual AI Engine agent nodes using unittest."""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.planner_agent import planner_agent
from agents.architecture_agent import architecture_agent
from agents.coder_agent import coder_agent
from agents.tester_agent import tester_agent
from agents.qa_agent import qa_agent
from agents.doc_agent import doc_agent
from graph.state import AgentState


from tests.test_helpers import MockLLMTestCase


class TestAgentNodes(MockLLMTestCase):

    def get_base_state(self) -> AgentState:
        return {
            "user_prompt": "Create a todo app",
            "project_name": "todo-app",
            "tech_stack": "HTML/CSS/JavaScript",
            "tasks": [],
            "architecture": {},
            "files": {},
            "review_results": {},
            "documentation": "",
            "logs": [],
            "current_step": "init",
            "retry_count": 0,
            "error": None,
            "llm_provider": "gemini",
        }

    def test_planner_agent(self):
        state = self.get_base_state()
        res = planner_agent(state)
        self.assertIn("project_name", res)
        self.assertIn("tech_stack", res)
        self.assertIn("tasks", res)
        self.assertEqual(res["current_step"], "planned")
        self.assertTrue(len(res["logs"]) > 0)

    def test_architecture_agent(self):
        state = self.get_base_state()
        state["tasks"] = ["Setup UI", "Add logic"]
        res = architecture_agent(state)
        self.assertIn("architecture", res)
        self.assertIn("file_paths", res["architecture"])
        self.assertEqual(res["current_step"], "architected")

    def test_coder_agent(self):
        state = self.get_base_state()
        state["architecture"] = {"file_paths": ["index.html", "styles.css", "app.js"]}
        res = coder_agent(state)
        self.assertIn("files", res)
        self.assertIn("index.html", res["files"])
        self.assertIn("styles.css", res["files"])
        self.assertIn("app.js", res["files"])
        self.assertEqual(res["current_step"], "coded")

    def test_tester_agent(self):
        state = self.get_base_state()
        state["files"] = {
            "index.html": "<html><body><h1>Todo App</h1></body></html>",
            "app.js": "console.log('App ready');",
        }
        res = tester_agent(state)
        self.assertIn("files", res)
        self.assertTrue(any(k.startswith("tests/") for k in res["files"].keys()))
        self.assertEqual(res["current_step"], "tested")

    def test_qa_agent(self):
        state = self.get_base_state()
        state["files"] = {"index.html": "<html></html>", "app.js": "var x = 1;"}
        res = qa_agent(state)
        self.assertIn("review_results", res)
        self.assertIn("passed", res["review_results"])
        self.assertEqual(res["current_step"], "reviewed")

    def test_doc_agent(self):
        state = self.get_base_state()
        state["files"] = {"index.html": "<html></html>", "app.js": "var x = 1;"}
        res = doc_agent(state)
        self.assertIn("documentation", res)
        self.assertIn("README.md", res["files"])
        self.assertEqual(res["current_step"], "completed")


if __name__ == "__main__":
    unittest.main()
