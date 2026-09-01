"""Unit tests for the free multi-provider chain: Gemini, Groq, OpenRouter, Ollama, OpenAI."""

import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config.llm import (
    FallbackLLM,
    get_available_providers,
    get_llm,
    get_llm_status,
    get_model_candidates,
    get_provider_profile,
)
from config.settings import settings

ALL_PROVIDERS = {
    "gemini_api_key": "gem-key",
    "gemini_model": "gemini-2.5-flash",
    "gemini_fallback_models": "",
    "groq_api_key": "groq-key",
    "groq_model": "llama-3.3-70b-versatile",
    "groq_fallback_models": "llama-3.1-8b-instant",
    "openrouter_api_key": "or-key",
    "openrouter_model": "deepseek/deepseek-chat-v3.1:free",
    "openrouter_fallback_models": "",
    "openai_api_key": "oai-key",
    "openai_model": "gpt-4o-mini",
    "openai_fallback_models": "",
    "ollama_enabled": True,
    "ollama_model": "qwen2.5-coder:7b",
    "ollama_fallback_models": "",
}

NO_PROVIDERS = {
    "gemini_api_key": None,
    "groq_api_key": None,
    "openrouter_api_key": None,
    "openai_api_key": None,
    "ollama_enabled": False,
}


class StubResponse:
    def __init__(self, content: str) -> None:
        self.content = content


class StubLLM:
    def __init__(self, error: Exception | None = None, content: str = "ok") -> None:
        self.error = error
        self.content = content
        self.calls = 0

    def invoke(self, prompt: str) -> StubResponse:
        self.calls += 1
        if self.error:
            raise self.error
        return StubResponse(self.content)


class TestProviderProfiles(unittest.TestCase):
    def test_openai_compatible_providers_get_their_own_endpoint(self):
        with patch.multiple(settings, **ALL_PROVIDERS):
            self.assertEqual(
                get_provider_profile("groq").base_url,
                "https://api.groq.com/openai/v1",
            )
            self.assertEqual(
                get_provider_profile("openrouter").base_url,
                "https://openrouter.ai/api/v1",
            )
            self.assertIsNone(get_provider_profile("openai").base_url)
            self.assertIsNone(get_provider_profile("gemini").base_url)

    def test_unknown_provider_has_no_profile(self):
        self.assertIsNone(get_provider_profile("anthropic"))

    def test_ollama_is_only_available_when_explicitly_enabled(self):
        with patch.multiple(settings, **{**NO_PROVIDERS, "ollama_enabled": False}):
            self.assertFalse(get_provider_profile("ollama").available)
            self.assertEqual(get_available_providers(), [])

        with patch.multiple(settings, **{**NO_PROVIDERS, "ollama_enabled": True}):
            self.assertTrue(get_provider_profile("ollama").available)
            self.assertEqual(get_available_providers(), ["ollama"])


class TestCandidateOrdering(unittest.TestCase):
    def test_free_providers_precede_paid_openai(self):
        with patch.multiple(settings, **ALL_PROVIDERS):
            providers = [name for name, _ in get_model_candidates("gemini")]

        self.assertEqual(
            providers,
            ["gemini", "groq", "groq", "openrouter", "ollama", "openai"],
        )

    def test_requested_provider_is_tried_first(self):
        with patch.multiple(settings, **ALL_PROVIDERS):
            candidates = get_model_candidates("groq")

        self.assertEqual(candidates[0], ("groq", "llama-3.3-70b-versatile"))
        self.assertEqual(candidates[1], ("groq", "llama-3.1-8b-instant"))
        self.assertEqual(candidates[2][0], "gemini")

    def test_unconfigured_provider_falls_through_to_the_configured_ones(self):
        with patch.multiple(settings, **{**NO_PROVIDERS, "groq_api_key": "groq-key"}):
            candidates = get_model_candidates("gemini")

        self.assertTrue(candidates)
        self.assertTrue(all(name == "groq" for name, _ in candidates))


class TestProviderStatus(unittest.TestCase):
    def test_status_reports_mock_when_nothing_is_configured(self):
        with patch.multiple(settings, **NO_PROVIDERS):
            status = get_llm_status("gemini")

        self.assertEqual(status["mode"], "mock")
        self.assertEqual(status["available_providers"], [])
        self.assertEqual(status["fallback_chain"], [])

    def test_status_reports_fallback_when_another_provider_can_serve(self):
        with patch.multiple(settings, **{**NO_PROVIDERS, "groq_api_key": "groq-key"}):
            status = get_llm_status("gemini")

        self.assertEqual(status["mode"], "fallback")
        self.assertFalse(status["configured"])
        self.assertEqual(status["available_providers"], ["groq"])

    def test_status_never_exposes_api_keys(self):
        with patch.multiple(settings, **ALL_PROVIDERS):
            serialized = repr(get_llm_status("groq"))

        for secret in ("gem-key", "groq-key", "or-key", "oai-key"):
            self.assertNotIn(secret, serialized)


class TestClientFactory(unittest.TestCase):
    def test_groq_and_openrouter_use_the_openai_client_with_their_base_url(self):
        with patch.multiple(settings, **ALL_PROVIDERS):
            groq = get_llm(provider="groq")
            openrouter = get_llm(provider="openrouter")

        self.assertEqual(str(groq.openai_api_base), "https://api.groq.com/openai/v1")
        self.assertEqual(str(openrouter.openai_api_base), "https://openrouter.ai/api/v1")

    def test_disabled_ollama_yields_no_client(self):
        with patch.multiple(settings, **NO_PROVIDERS):
            self.assertIsNone(get_llm(provider="ollama"))

    def test_unsupported_provider_yields_no_client(self):
        self.assertIsNone(get_llm(provider="anthropic"))


class TestChainFallback(unittest.TestCase):
    def test_run_survives_until_a_provider_answers(self):
        exhausted = StubLLM(error=RuntimeError("429 quota exceeded"))
        working = StubLLM(content="generated")
        clients = {
            "gemini": exhausted,
            "groq": exhausted,
            "openrouter": exhausted,
            "ollama": working,
        }

        llm = FallbackLLM(
            [
                ("gemini", "gemini-2.5-flash"),
                ("groq", "llama-3.3-70b-versatile"),
                ("openrouter", "deepseek/deepseek-chat-v3.1:free"),
                ("ollama", "qwen2.5-coder:7b"),
            ]
        )
        with patch(
            "config.llm.get_llm",
            side_effect=lambda provider, model_name, temperature: clients[provider],
        ):
            response = llm.invoke("prompt")

        self.assertEqual(response.content, "generated")
        self.assertEqual(exhausted.calls, 3)
        self.assertEqual(llm.label, "ollama (qwen2.5-coder:7b)")


if __name__ == "__main__":
    unittest.main()
