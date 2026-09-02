"""Tests for per-agent provider routing, rate-limit handling, and per-file code generation."""

import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.coder_agent import coder_agent, one_call_per_file
from agents.utils import get_agent_llm
from config.llm import (
    FallbackLLM,
    get_model_candidates,
    get_retry_after_seconds,
    is_quota_error,
    is_rate_limit_error,
)
from config.settings import settings

PER_MINUTE_429 = (
    "429 You exceeded your current quota. "
    "Quota exceeded for metric: generate_content_free_tier_requests, limit: 5, "
    'model: gemini-3.7-flash. Please retry in 32.75s. violations { quota_id: '
    '"GenerateRequestsPerMinutePerProjectPerModel-FreeTier" } retry_delay { seconds: 32 }'
)

PER_DAY_429 = (
    "429 You exceeded your current quota. "
    "Quota exceeded for metric: generate_content_free_tier_requests, limit: 20. "
    'violations { quota_id: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" }'
)

TWO_PROVIDERS = {
    "gemini_api_key": "gem-key",
    "gemini_model": "gemini-2.5-flash",
    "gemini_fallback_models": "",
    "groq_api_key": "groq-key",
    "groq_model": "llama-3.3-70b-versatile",
    "groq_fallback_models": "",
    "openrouter_api_key": None,
    "openai_api_key": None,
    "ollama_enabled": False,
}


class StubResponse:
    def __init__(self, content: str) -> None:
        self.content = content


class StubLLM:
    """Fails with ``error`` for the first ``fail_times`` calls, then succeeds."""

    def __init__(self, error: Exception | None = None, content: str = "ok", fail_times: int = -1):
        self.error = error
        self.content = content
        self.fail_times = fail_times
        self.calls = 0
        self.last_model = "stub-model"
        self.label = "stub (stub-model)"

    def invoke(self, prompt: str) -> StubResponse:
        self.calls += 1
        if self.error and (self.fail_times < 0 or self.calls <= self.fail_times):
            raise self.error
        return StubResponse(self.content)


class TestRateLimitClassification(unittest.TestCase):
    def test_per_minute_limit_is_distinguished_from_daily_exhaustion(self):
        self.assertTrue(is_rate_limit_error(RuntimeError(PER_MINUTE_429)))
        self.assertFalse(is_rate_limit_error(RuntimeError(PER_DAY_429)))
        self.assertTrue(is_quota_error(RuntimeError(PER_DAY_429)))

    def test_non_quota_errors_are_never_rate_limits(self):
        self.assertFalse(is_rate_limit_error(RuntimeError("connection reset")))

    def test_retry_delay_is_read_from_the_provider_message(self):
        self.assertEqual(get_retry_after_seconds(RuntimeError(PER_MINUTE_429)), 32.0)
        self.assertEqual(
            get_retry_after_seconds(RuntimeError("429 Rate limit reached. Retry-After: 7")),
            7.0,
        )
        self.assertIsNone(get_retry_after_seconds(RuntimeError(PER_DAY_429)))


class TestBoundedRateLimitWait(unittest.TestCase):
    def test_other_providers_are_tried_before_waiting(self):
        limited = StubLLM(error=RuntimeError(PER_MINUTE_429))
        working = StubLLM(content="generated")
        clients = {"gemini": limited, "groq": working}

        llm = FallbackLLM([("gemini", "gemini-2.5-flash"), ("groq", "llama-3.3-70b-versatile")])
        with patch(
            "config.llm.get_llm",
            side_effect=lambda provider, model_name, temperature: clients[provider],
        ), patch("config.llm.time.sleep") as sleep:
            response = llm.invoke("prompt")

        self.assertEqual(response.content, "generated")
        sleep.assert_not_called()

    def test_a_per_minute_limit_is_waited_out_when_nothing_else_is_free(self):
        limited = StubLLM(error=RuntimeError(PER_MINUTE_429), content="generated", fail_times=1)

        llm = FallbackLLM([("gemini", "gemini-2.5-flash")])
        with patch("config.llm.get_llm", return_value=limited), patch(
            "config.llm.time.sleep"
        ) as sleep, patch.multiple(settings, rate_limit_wait_seconds=40.0):
            response = llm.invoke("prompt")

        sleep.assert_called_once_with(32.0)
        self.assertEqual(response.content, "generated")

    def test_a_wait_longer_than_the_budget_is_not_taken(self):
        limited = StubLLM(error=RuntimeError(PER_MINUTE_429))

        llm = FallbackLLM([("gemini", "gemini-2.5-flash")])
        with patch("config.llm.get_llm", return_value=limited), patch(
            "config.llm.time.sleep"
        ) as sleep, patch.multiple(settings, rate_limit_wait_seconds=10.0):
            with self.assertRaises(RuntimeError):
                llm.invoke("prompt")

        sleep.assert_not_called()

    def test_daily_exhaustion_is_never_waited_out(self):
        exhausted = StubLLM(error=RuntimeError(PER_DAY_429))

        llm = FallbackLLM([("gemini", "gemini-2.5-flash")])
        with patch("config.llm.get_llm", return_value=exhausted), patch(
            "config.llm.time.sleep"
        ) as sleep:
            with self.assertRaises(RuntimeError):
                llm.invoke("prompt")

        sleep.assert_not_called()
        self.assertEqual(exhausted.calls, 1)


class TestRoleProviderRouting(unittest.TestCase):
    def test_each_role_starts_at_its_own_provider(self):
        with patch.multiple(
            settings,
            **TWO_PROVIDERS,
            llm_provider="gemini",
            planner_provider="gemini",
            coder_provider="groq",
        ):
            self.assertEqual(get_model_candidates(role="planner")[0][0], "gemini")
            self.assertEqual(get_model_candidates(role="coder")[0][0], "groq")

    def test_a_role_without_its_own_provider_uses_the_default(self):
        with patch.multiple(
            settings,
            **TWO_PROVIDERS,
            llm_provider="groq",
            planner_provider=None,
            coder_provider=None,
        ):
            self.assertEqual(get_model_candidates(role="planner")[0][0], "groq")
            self.assertEqual(get_model_candidates(role="coder")[0][0], "groq")

    def test_an_explicit_request_overrides_the_role_provider(self):
        with patch.multiple(
            settings, **TWO_PROVIDERS, llm_provider="gemini", coder_provider="groq"
        ):
            self.assertEqual(get_model_candidates("gemini", role="coder")[0][0], "gemini")

    def test_routing_still_falls_back_to_the_rest_of_the_chain(self):
        with patch.multiple(settings, **TWO_PROVIDERS, coder_provider="openrouter"):
            providers = [name for name, _ in get_model_candidates(role="coder")]

        self.assertNotIn("openrouter", providers)
        self.assertEqual(set(providers), {"gemini", "groq"})

    def test_the_agent_helper_honours_the_role(self):
        with patch.multiple(
            settings, **TWO_PROVIDERS, llm_provider="gemini", coder_provider="groq"
        ):
            llm = get_agent_llm({}, role="coder")

        self.assertIsNotNone(llm)
        self.assertEqual(llm.candidates[0][0], "groq")


class TestPerFileCodeGeneration(unittest.TestCase):
    def _llm(self, provider: str) -> FallbackLLM:
        return FallbackLLM([(provider, "model")])

    def test_local_models_write_one_file_per_call(self):
        with patch.multiple(settings, coder_file_mode="auto"):
            self.assertTrue(one_call_per_file(self._llm("ollama")))
            self.assertFalse(one_call_per_file(self._llm("groq")))

    def test_the_mode_can_be_forced_either_way(self):
        with patch.multiple(settings, coder_file_mode="file"):
            self.assertTrue(one_call_per_file(self._llm("groq")))
        with patch.multiple(settings, coder_file_mode="batch"):
            self.assertFalse(one_call_per_file(self._llm("ollama")))

    def test_per_file_mode_issues_one_call_per_file(self):
        stub = StubLLM(content="```\nfile body\n```")
        state = {
            "user_prompt": "todo app",
            "architecture": {"file_paths": ["index.html", "app.js"]},
        }

        with patch("agents.coder_agent.get_agent_llm", return_value=stub), patch(
            "agents.coder_agent.one_call_per_file", return_value=True
        ):
            result = coder_agent(state)

        self.assertEqual(stub.calls, 2)
        self.assertEqual(result["files"]["index.html"], "file body")
        self.assertEqual(result["files"]["app.js"], "file body")

    def test_a_single_failed_file_does_not_lose_the_others(self):
        stub = StubLLM(
            error=RuntimeError("boom"), content="```\nfile body\n```", fail_times=1
        )
        state = {
            "user_prompt": "todo app",
            "architecture": {"file_paths": ["index.html", "app.js"]},
        }

        with patch("agents.coder_agent.get_agent_llm", return_value=stub), patch(
            "agents.coder_agent.one_call_per_file", return_value=True
        ):
            result = coder_agent(state)

        self.assertNotIn("error", result)
        self.assertEqual(result["files"]["app.js"], "file body")
        self.assertIn("index.html", result["files"])  # deterministic template

    def test_every_file_failing_reports_the_error(self):
        stub = StubLLM(error=RuntimeError(PER_DAY_429))
        state = {"user_prompt": "todo app", "architecture": {"file_paths": ["index.html"]}}

        with patch("agents.coder_agent.get_agent_llm", return_value=stub), patch(
            "agents.coder_agent.one_call_per_file", return_value=True
        ):
            result = coder_agent(state)

        self.assertEqual(result["current_step"], "coding_failed")
        self.assertEqual(result["logs"][-1]["status"], "quota_exceeded")


if __name__ == "__main__":
    unittest.main()
