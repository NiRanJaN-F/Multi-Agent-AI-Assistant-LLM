"""Unit tests for quota detection, model candidate ordering, and the fallback chain."""

import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.llm import (
    FallbackLLM,
    QuotaExceededError,
    get_model_candidates,
    invoke_with_retry,
    is_quota_error,
)
from config.settings import settings


class QuotaResponse:
    def __init__(self, content: str) -> None:
        self.content = content


class StubLLM:
    """Chat model stub that either answers or raises a preset error."""

    def __init__(self, error: Exception | None = None, content: str = "ok") -> None:
        self.error = error
        self.content = content
        self.calls = 0

    def invoke(self, prompt: str) -> QuotaResponse:
        self.calls += 1
        if self.error:
            raise self.error
        return QuotaResponse(self.content)


class TestQuotaDetection(unittest.TestCase):
    def test_detects_provider_quota_errors(self):
        errors = [
            RuntimeError("429 You exceeded your current quota"),
            RuntimeError("ResourceExhausted: generate_content_free_tier_requests"),
            RuntimeError("Rate limit reached for gpt-4o-mini"),
            RuntimeError("insufficient_quota"),
        ]
        for error in errors:
            with self.subTest(error=str(error)):
                self.assertTrue(is_quota_error(error))

    def test_ignores_unrelated_errors(self):
        self.assertFalse(is_quota_error(ValueError("invalid JSON in response")))

    def test_retry_helper_stops_immediately_on_quota(self):
        llm = StubLLM(error=RuntimeError("429 quota exceeded"))

        with self.assertRaises(RuntimeError):
            invoke_with_retry(llm, "hello", max_retries=3, retry_delay_seconds=0)

        self.assertEqual(llm.calls, 1)

    def test_retry_helper_retries_transient_errors(self):
        llm = StubLLM(error=RuntimeError("connection reset"))

        with self.assertRaises(RuntimeError):
            invoke_with_retry(llm, "hello", max_retries=2, retry_delay_seconds=0)

        self.assertEqual(llm.calls, 3)


class TestModelCandidates(unittest.TestCase):
    def test_requested_provider_comes_first_then_the_other(self):
        with patch.multiple(
            settings,
            gemini_api_key="gem-key",
            openai_api_key="oai-key",
            gemini_model="gemini-2.5-flash",
            gemini_fallback_models="gemini-2.0-flash",
            openai_model="gpt-4o-mini",
            openai_fallback_models="",
        ):
            self.assertEqual(
                get_model_candidates("gemini"),
                [
                    ("gemini", "gemini-2.5-flash"),
                    ("gemini", "gemini-2.0-flash"),
                    ("openai", "gpt-4o-mini"),
                ],
            )

    def test_providers_without_a_key_are_skipped_and_models_deduplicated(self):
        with patch.multiple(
            settings,
            gemini_api_key="gem-key",
            openai_api_key=None,
            gemini_model="gemini-2.5-flash",
            gemini_fallback_models="gemini-2.5-flash, ,gemini-2.0-flash",
        ):
            self.assertEqual(
                get_model_candidates("gemini"),
                [("gemini", "gemini-2.5-flash"), ("gemini", "gemini-2.0-flash")],
            )

    def test_no_candidates_without_any_key(self):
        with patch.multiple(settings, gemini_api_key=None, openai_api_key=None):
            self.assertEqual(get_model_candidates("gemini"), [])


class TestFallbackLLM(unittest.TestCase):
    def test_falls_back_to_the_next_model_on_quota_error(self):
        exhausted = StubLLM(error=RuntimeError("429 ResourceExhausted"))
        working = StubLLM(content="generated")
        clients = {"gemini-2.5-flash": exhausted, "gemini-2.0-flash": working}

        llm = FallbackLLM([("gemini", "gemini-2.5-flash"), ("gemini", "gemini-2.0-flash")])
        with patch("config.llm.get_llm", side_effect=lambda provider, model_name, temperature: clients[model_name]):
            response = llm.invoke("prompt")

        self.assertEqual(response.content, "generated")
        self.assertEqual(exhausted.calls, 1)
        self.assertEqual(llm.label, "gemini (gemini-2.0-flash)")

    def test_raises_quota_error_when_every_candidate_is_exhausted(self):
        exhausted = StubLLM(error=RuntimeError("429 quota exceeded"))

        llm = FallbackLLM([("gemini", "gemini-2.5-flash"), ("openai", "gpt-4o-mini")])
        with patch("config.llm.get_llm", return_value=exhausted):
            with self.assertRaises(QuotaExceededError) as ctx:
                llm.invoke("prompt")

        self.assertIn("gemini/gemini-2.5-flash", str(ctx.exception))
        self.assertIn("openai/gpt-4o-mini", str(ctx.exception))
        self.assertEqual(exhausted.calls, 2)

    def test_non_quota_failure_is_raised_as_is(self):
        broken = StubLLM(error=ValueError("bad request"))

        llm = FallbackLLM([("gemini", "gemini-2.5-flash")])
        with patch("config.llm.get_llm", return_value=broken):
            with self.assertRaises(ValueError):
                llm.invoke("prompt")


if __name__ == "__main__":
    unittest.main()
