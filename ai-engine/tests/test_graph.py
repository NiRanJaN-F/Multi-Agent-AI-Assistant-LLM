"""Integration tests for the LangGraph multi-agent workflow graph using unittest."""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from graph.builder import create_agent_graph
from graph.state import AgentState


class TestAgentGraph(unittest.TestCase):

    def test_agent_graph_compilation(self):
        graph = create_agent_graph()
        self.assertIsNotNone(graph)

    def test_agent_graph_full_execution(self):
        graph = create_agent_graph()
        initial_state: AgentState = {
            "user_prompt": "Build a simple calculator app",
            "project_name": "",
            "tech_stack": "",
            "tasks": [],
            "architecture": {},
            "files": {},
            "review_results": {},
            "documentation": "",
            "logs": [],
            "current_step": "init",
            "retry_count": 0,
            "error": None,
        }

        final_state = graph.invoke(initial_state)

        self.assertEqual(final_state["current_step"], "completed")
        self.assertTrue(len(final_state["files"]) > 0)
        self.assertIn("README.md", final_state["files"])
        self.assertTrue(any(p.startswith("tests/") for p in final_state["files"].keys()))
        self.assertGreaterEqual(len(final_state["logs"]), 6)


if __name__ == "__main__":
    unittest.main()
