"""Shared test helpers for AI engine unit tests."""

import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


class MockLLMTestCase(unittest.TestCase):
    """Base test case that forces mock LLM mode (no live API calls)."""

    def setUp(self):
        self.llm_patcher = patch("agents.utils.get_model_candidates", return_value=[])
        self.llm_patcher.start()

    def tearDown(self):
        self.llm_patcher.stop()
