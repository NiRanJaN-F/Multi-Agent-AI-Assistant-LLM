"""Tests for iterative refinement of an already generated project with deep architecture."""

import os
import shutil
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from api.main import app
from services.file_manager import GENERATED_PROJECTS_DIR, list_projects, load_project_files
from agents.refine_intent_agent import analyze_intent_heuristics
from agents.refine_context_agent import _extract_dependencies
from agents.diff_qa_agent import compute_diff_metrics
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
        (project_dir / "index.html").write_text("<html><head><link href='src/style.css' rel='stylesheet'></head><body>Hello<script src='app.js'></script></body></html>", encoding="utf-8")
        (project_dir / "app.js").write_text("console.log('hello');", encoding="utf-8")
        (project_dir / "src" / "style.css").write_text("body { margin: 0; }", encoding="utf-8")
        (project_dir / "package.json").write_text('{"name": "refine-test"}', encoding="utf-8")

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

        # Verify new multi-agent pipeline steps executed
        agents_logged = {entry["agent"] for entry in data["logs"]}
        self.assertTrue("RefineIntentAnalyzer" in agents_logged)
        self.assertTrue("RefineContextScanner" in agents_logged)
        self.assertTrue("RefinePlannerAgent" in agents_logged)
        self.assertTrue("DiffQAAgent" in agents_logged)

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

    def test_intent_analyzer_heuristics(self):
        """Test deterministic intent classification for styling vs feature extension."""
        files = {"index.html": "", "app.js": "", "package.json": "", "server.js": ""}
        
        # Style change
        res_style = analyze_intent_heuristics("Add dark mode toggle button", files)
        self.assertEqual(res_style["mode"], "style")
        self.assertEqual(res_style["target_area"], "styling")
        self.assertIn("package.json", res_style["files_protected"])

        # Feature extension
        res_extend = analyze_intent_heuristics("Add search filter and category tabs", files)
        self.assertEqual(res_extend["mode"], "extend")
        self.assertEqual(res_extend["target_area"], "frontend")

        # Backend change
        res_backend = analyze_intent_heuristics("Create a new API route for products database", files)
        self.assertTrue(res_backend["requires_backend_change"])

    def test_context_scanner_dependency_extraction(self):
        """Test dependency extraction across HTML and scripts."""
        files = {
            "index.html": "<html><link href='src/style.css'><script src='app.js'></script></html>",
            "app.js": "console.log('hi');",
            "src/style.css": "body {}",
        }
        deps = _extract_dependencies(files)
        self.assertIn("app.js", deps["index.html"])
        self.assertIn("src/style.css", deps["index.html"])

    def test_diff_qa_metrics_computation(self):
        """Test diff QA unified diff computation and unexpected change detection."""
        before = {"index.html": "Hello", "app.js": "var a = 1;\nvar b = 2;", "package.json": "{}"}
        after = {"index.html": "Hello World", "app.js": "var a = 1;\nvar b = 3;", "package.json": "{}"}
        
        metrics = compute_diff_metrics(
            before,
            after,
            modify_targets=["index.html", "app.js"],
            new_targets=[],
            protected_files=["package.json"],
        )
        self.assertIn("index.html", metrics["files_changed"])
        self.assertIn("app.js", metrics["files_changed"])
        self.assertEqual(len(metrics["protected_violations"]), 0)
        self.assertEqual(len(metrics["unexpected_changes"]), 0)

    def test_diff_qa_detects_protected_violation(self):
        """Test that modifying a protected file flags a violation."""
        before = {"app.js": "var a = 1;", "package.json": '{"v": 1}'}
        after = {"app.js": "var a = 2;", "package.json": '{"v": 2}'}
        
        metrics = compute_diff_metrics(
            before,
            after,
            modify_targets=["app.js", "package.json"],
            new_targets=[],
            protected_files=["package.json"],
        )
        self.assertIn("package.json", metrics["protected_violations"])

    def test_consecutive_multi_turn_refinements(self):
        """Test 3 consecutive refinements on the same project in sequence."""
        # Turn 1: Add dark mode
        res1 = self.client.post(
            "/api/refine",
            json={"prompt": "Add a dark mode toggle button", "project_name": PROJECT_NAME},
        )
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        self.assertEqual(data1["project_name"], PROJECT_NAME)
        self.assertIsNotNone(data1.get("refinement_telemetry"))

        # Turn 2: Add category filters
        res2 = self.client.post(
            "/api/refine",
            json={"prompt": "Add category filter tabs to index.html and app.js", "project_name": PROJECT_NAME},
        )
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertEqual(data2["project_name"], PROJECT_NAME)

        # Turn 3: Add export data button
        res3 = self.client.post(
            "/api/refine",
            json={"prompt": "Add an export data feature to app.js", "project_name": PROJECT_NAME},
        )
        self.assertEqual(res3.status_code, 200)
        data3 = res3.json()
        self.assertEqual(data3["project_name"], PROJECT_NAME)

        # Verify all turns operated in-place on the same directory
        files3 = load_project_files(PROJECT_NAME)
        self.assertIn("index.html", files3)
        self.assertIn("app.js", files3)
        self.assertIn("src/style.css", files3)

    def test_refine_updates_readme_changelog(self):
        """Test that refinement generates or updates README.md with changelog."""
        response = self.client.post(
            "/api/refine",
            json={"prompt": "Add dark mode", "project_name": PROJECT_NAME},
        )
        self.assertEqual(response.status_code, 200)
        files = load_project_files(PROJECT_NAME)
        self.assertIn("README.md", files)
        readme = files["README.md"]
        self.assertTrue("Refinement" in readme or "Overview" in readme)


if __name__ == "__main__":
    unittest.main()
