"""LLM provider factory covering Gemini, Groq, OpenRouter, OpenAI, and local Ollama."""

import logging
import time
from dataclasses import dataclass
from typing import Any, Protocol

from langchain_core.language_models import BaseChatModel

from config.settings import settings

logger = logging.getLogger(__name__)

QUOTA_ERROR_MARKERS = (
    "429",
    "resourceexhausted",
    "resource_exhausted",
    "quota",
    "rate limit",
    "rate_limit",
    "insufficient_quota",
)


class QuotaExceededError(RuntimeError):
    """Raised when every configured model has exhausted its provider quota."""


class SupportsInvoke(Protocol):
    """Minimal chat-model interface the agents rely on."""

    def invoke(self, prompt: str) -> Any: ...


def is_quota_message(text: str) -> bool:
    """Detect a provider quota / rate-limit failure from its message text."""
    lowered = text.lower()
    return any(marker in lowered for marker in QUOTA_ERROR_MARKERS)


def is_quota_error(error: BaseException) -> bool:
    """Detect provider quota / rate-limit failures, which retrying cannot fix."""
    return is_quota_message(f"{type(error).__name__} {error}")


@dataclass(frozen=True)
class ProviderProfile:
    """Everything needed to talk to one provider, resolved from the current settings."""

    name: str
    api_key: str | None
    models: list[str]
    base_url: str | None
    available: bool


# Free providers first: Gemini (20/day) → Groq (thousands/day) → OpenRouter free models →
# Ollama (local, unlimited, slowest), with paid OpenAI last and only if a key is set.
PROVIDER_ORDER = ("gemini", "groq", "openrouter", "ollama", "openai")

OPENAI_COMPATIBLE = {"openai", "groq", "openrouter", "ollama"}


def _models(primary: str, fallbacks: str) -> list[str]:
    """Configured model first, then that provider's fallback models, de-duplicated."""
    names = [primary, *(name.strip() for name in fallbacks.split(","))]
    return list(dict.fromkeys(name for name in names if name))


def get_provider_profile(provider: str) -> ProviderProfile | None:
    """Resolve one provider's key, models, and endpoint, or None if it is not supported."""
    name = provider.lower()

    if name == "gemini":
        key = settings.gemini_api_key
        models = _models(settings.gemini_model, settings.gemini_fallback_models)
        base_url = None
    elif name == "openai":
        key = settings.openai_api_key
        models = _models(settings.openai_model, settings.openai_fallback_models)
        base_url = None
    elif name == "groq":
        key = settings.groq_api_key
        models = _models(settings.groq_model, settings.groq_fallback_models)
        base_url = "https://api.groq.com/openai/v1"
    elif name == "openrouter":
        key = settings.openrouter_api_key
        models = _models(settings.openrouter_model, settings.openrouter_fallback_models)
        base_url = "https://openrouter.ai/api/v1"
    elif name == "ollama":
        # A local Ollama server ignores the key, but the OpenAI client insists on one.
        key = "ollama"
        models = _models(settings.ollama_model, settings.ollama_fallback_models)
        base_url = settings.ollama_base_url
        return ProviderProfile(name, key, models, base_url, settings.ollama_enabled)
    else:
        return None

    return ProviderProfile(name, key, models, base_url, bool(key and key.strip()))


def get_available_providers() -> list[str]:
    """Providers usable right now — those with a key set, plus Ollama when enabled."""
    return [
        name
        for name in PROVIDER_ORDER
        if (profile := get_provider_profile(name)) and profile.available
    ]


def get_model_candidates(provider: str | None = None) -> list[tuple[str, str]]:
    """Ordered (provider, model) pairs to try: requested provider first, then the rest."""
    target = (provider or settings.llm_provider).lower()
    ordered = [target, *(name for name in PROVIDER_ORDER if name != target)]

    return [
        (profile.name, model)
        for name in ordered
        if (profile := get_provider_profile(name)) and profile.available
        for model in profile.models
    ]


class FallbackLLM:
    """Chat model that walks a list of models/providers when one runs out of quota.

    Exposes ``invoke`` so it is a drop-in for a LangChain chat model in the agents.
    """

    def __init__(self, candidates: list[tuple[str, str]], temperature: float = 0.2) -> None:
        self.candidates = candidates
        self.temperature = temperature
        self.last_provider, self.last_model = candidates[0]

    @property
    def label(self) -> str:
        return f"{self.last_provider} ({self.last_model})"

    def invoke(self, prompt: str) -> Any:
        last_error: BaseException | None = None
        quota_exhausted = True

        for provider, model in self.candidates:
            llm = get_llm(provider=provider, model_name=model, temperature=self.temperature)
            if llm is None:
                continue

            try:
                response = llm.invoke(prompt)
                self.last_provider, self.last_model = provider, model
                return response
            except Exception as error:
                last_error = error
                if is_quota_error(error):
                    logger.warning("Quota exhausted for %s/%s, trying next model.", provider, model)
                    continue
                quota_exhausted = False
                logger.warning("Model %s/%s failed: %s", provider, model, error)

        if last_error is None:
            raise RuntimeError("No usable LLM model is configured.")
        if quota_exhausted:
            tried = ", ".join(f"{p}/{m}" for p, m in self.candidates)
            raise QuotaExceededError(
                f"LLM quota exceeded on every configured model ({tried}). "
                "Wait for the quota to reset, add a free GROQ_API_KEY or "
                "OPENROUTER_API_KEY, or run a local model with OLLAMA_ENABLED=true."
            ) from last_error
        raise last_error


def get_llm_status(provider: str | None = None) -> dict[str, Any]:
    """Return configuration status for the active or requested LLM provider."""
    target_provider = (provider or settings.llm_provider).lower()
    profile = get_provider_profile(target_provider)
    available = get_available_providers()

    if profile is None:
        return {
            "provider": target_provider,
            "model": None,
            "configured": False,
            "mode": "unsupported",
            "available_providers": available,
            "fallback_chain": [],
        }

    return {
        "provider": target_provider,
        "model": profile.models[0] if profile.models else None,
        "configured": profile.available,
        "mode": "live" if profile.available else ("fallback" if available else "mock"),
        "available_providers": available,
        "fallback_chain": [f"{name}/{model}" for name, model in get_model_candidates(target_provider)],
    }


def verify_llm_connection(provider: str | None = None) -> dict[str, Any]:
    """Perform a lightweight live call to confirm the LLM API key and model work."""
    status = get_llm_status(provider)

    if not status["configured"]:
        return {
            **status,
            "reachable": False,
            "message": "API key not configured — agents will use mock templates.",
        }

    try:
        llm = get_llm(provider=provider)
        if llm is None:
            return {
                **status,
                "reachable": False,
                "message": "LLM client could not be initialized.",
            }

        started = time.perf_counter()
        text = invoke_with_retry(llm, "Reply with exactly: OK", max_retries=0)
        elapsed_ms = round((time.perf_counter() - started) * 1000)

        return {
            **status,
            "reachable": True,
            "message": "LLM connection verified.",
            "latency_ms": elapsed_ms,
            "sample": text.strip()[:80],
        }
    except Exception as error:
        logger.error("LLM verification failed: %s", error)
        return {
            **status,
            "reachable": False,
            "message": str(error),
        }


def get_llm(
    provider: str | None = None,
    model_name: str | None = None,
    temperature: float = 0.2,
) -> BaseChatModel | None:
    """Instantiate and return a LangChain ChatModel based on provider and configuration."""
    target_provider = (provider or settings.llm_provider).lower()

    if target_provider == "gemini":
        api_key = settings.gemini_api_key
        if not api_key:
            logger.warning("GEMINI_API_KEY is not set. Agents will use mock templates.")
            return None

        from langchain_google_genai import ChatGoogleGenerativeAI

        target_model = model_name or settings.gemini_model

        logger.info("Initializing Gemini LLM: %s", target_model)
        return ChatGoogleGenerativeAI(
            model=target_model,
            google_api_key=api_key,
            temperature=temperature,
            max_retries=0,
        )

    if target_provider in OPENAI_COMPATIBLE:
        profile = get_provider_profile(target_provider)
        if profile is None or not profile.available:
            logger.warning(
                "Provider '%s' is not configured. Agents will use mock templates.",
                target_provider,
            )
            return None

        from langchain_openai import ChatOpenAI

        target_model = model_name or (profile.models[0] if profile.models else None)
        logger.info("Initializing %s LLM: %s", target_provider, target_model)
        return ChatOpenAI(
            model=target_model,
            api_key=profile.api_key,
            base_url=profile.base_url,
            temperature=temperature,
            max_retries=0,
        )

    logger.error("Unsupported LLM provider requested: %s", target_provider)
    return None


def invoke_with_retry(
    llm: SupportsInvoke,
    prompt: str,
    max_retries: int = 2,
    retry_delay_seconds: float = 1.5,
) -> str:
    """Invoke the LLM with simple retry logic for transient API failures."""
    last_error: Exception | None = None

    for attempt in range(max_retries + 1):
        try:
            response = llm.invoke(prompt)
            return response.content if hasattr(response, "content") else str(response)
        except Exception as error:
            last_error = error
            logger.warning(
                "LLM invoke attempt %s/%s failed: %s",
                attempt + 1,
                max_retries + 1,
                error,
            )
            if is_quota_error(error):
                break
            if attempt < max_retries:
                time.sleep(retry_delay_seconds * (attempt + 1))

    if last_error:
        raise last_error
    raise RuntimeError("LLM invoke failed without an exception.")
