"""Tests for iterative refinement of an already generated project."""

import os
import shutil
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from api.main import app
from services.file_manager import GENERATED_PROJECTS_DIR, list_projects, load_project_files
from tests.test_helpers import MockLLMTestCase

PROJECT_NAME = "refine-test-app"


class TestRefinement(MockLLMTestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        super().setUp()
        project_dir = GENERATED_PROJECTS_DIR / PROJECT_NAME
        shutil.rmtree(project_dir, ignore_errors=True)
        (project_dir / "src").mkdir(parents=True, exist_ok=True)
        (project_dir / "index.html").write_text("<html><body>Hello</body></html>", encoding="utf-8")
        (project_dir / "app.js").write_text("console.log('hello');", encoding="utf-8")
        (project_dir / "src" / "style.css").write_text("body { margin: 0; }", encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(GENERATED_PROJECTS_DIR / PROJECT_NAME, ignore_errors=True)
        super().tearDown()

    def test_load_project_files_reads_nested_files(self):
        files = load_project_files(PROJECT_NAME)

        self.assertIn("index.html", files)
        self.assertIn("src/style.css", files)
        self.assertEqual(files["app.js"], "console.log('hello');")

    def test_load_project_files_rejects_path_traversal(self):
        self.assertEqual(load_project_files("../../etc"), {})

    def test_projects_endpoint_lists_the_project(self):
        response = self.client.get("/api/projects")

        self.assertEqual(response.status_code, 200)
        self.assertIn(PROJECT_NAME, response.json()["projects"])
        self.assertIn(PROJECT_NAME, list_projects())

    def test_refine_requires_a_prompt(self):
        response = self.client.post(
            "/api/refine", json={"prompt": "   ", "project_name": PROJECT_NAME}
        )

        self.assertEqual(response.status_code, 400)

    def test_refine_rejects_unknown_project(self):
        response = self.client.post(
            "/api/refine", json={"prompt": "Add dark mode", "project_name": "does-not-exist"}
        )

        self.assertEqual(response.status_code, 404)

    def test_refine_updates_files_in_place(self):
        response = self.client.post(
            "/api/refine",
            json={"prompt": "Add a dark mode toggle", "project_name": PROJECT_NAME},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["mode"], "refine")
        self.assertEqual(data["project_name"], PROJECT_NAME)
        self.assertTrue(data["changed_files"])

        files_on_disk = load_project_files(PROJECT_NAME)
        for changed in data["changed_files"]:
            self.assertIn(changed, files_on_disk)

        self.assertIn("src/style.css", files_on_disk)
        self.assertEqual(files_on_disk["src/style.css"], "body { margin: 0; }")
        self.assertTrue(any(entry["agent"] == "QAAgent" for entry in data["logs"]))

    def test_refine_preserves_untouched_files(self):
        original = load_project_files(PROJECT_NAME)

        response = self.client.post(
            "/api/refine",
            json={"prompt": "Add a dark mode toggle", "project_name": PROJECT_NAME},
        )
        data = response.json()
        updated = load_project_files(PROJECT_NAME)

        for path, content in original.items():
            if path in data["changed_files"]:
                continue
            self.assertEqual(updated[path], content)


if __name__ == "__main__":
    unittest.main()
