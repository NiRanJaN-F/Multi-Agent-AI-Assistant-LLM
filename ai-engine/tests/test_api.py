"""API route tests for FastAPI application endpoints using unittest."""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from api.main import app


class TestFastAPIEndpoints(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_root_endpoint(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["service"], "ai-engine")
        self.assertEqual(data["phase"], "phase-2")

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("timestamp", data)

    def test_generate_endpoint_validation(self):
        # Empty prompt should return 400 Bad Request
        response = self.client.post("/api/generate", json={"prompt": ""})
        self.assertEqual(response.status_code, 400)

    def test_generate_endpoint_success(self):
        payload = {
            "prompt": "Create a simple landing page",
            "project_name": "landing-page-test",
        }
        response = self.client.post("/api/generate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "completed")
        self.assertEqual(data["project_name"], "landing-page-test")
        self.assertTrue(len(data["saved_files"]) > 0)
        self.assertIn("README.md", data["saved_files"])
        self.assertTrue(any(p.startswith("tests/") for p in data["saved_files"]))


if __name__ == "__main__":
    unittest.main()
