"""LLM provider factory covering Gemini, Groq, OpenRouter, OpenAI, and local Ollama."""

import logging
import re
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

# Providers retire models regularly ("gemini-2.0-flash is no longer available"); a configured
# model that no longer exists must not abort the run while other candidates remain.
MODEL_UNAVAILABLE_MARKERS = (
    "no longer available",
    "not found",
    "does not exist",
    "decommissioned",
    "deprecated",
    "unsupported model",
    "model_not_found",
    "invalid model",
)


# A per-minute cap clears itself in seconds, unlike a per-day cap; only the latter is worth
# giving up on. Providers say which one was hit in the quota id or the message text.
RATE_LIMIT_MARKERS = (
    "perminute",
    "per minute",
    "per-minute",
    "requests per min",
    "tokens per min",
    "rpm",
    "tpm",
)

RETRY_AFTER_PATTERNS = (
    re.compile(r"retry_delay\s*\{[^}]*seconds:\s*(\d+(?:\.\d+)?)", re.IGNORECASE),
    re.compile(r"retry[- ]after[\"']?\s*[:=]?\s*(\d+(?:\.\d+)?)", re.IGNORECASE),
    re.compile(r"(?:retry|try again) in\s*(\d+(?:\.\d+)?)\s*s", re.IGNORECASE),
    re.compile(r"(?:retry|try again) in\s*(\d+(?:\.\d+)?)m(\d+(?:\.\d+)?)s", re.IGNORECASE),
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


def is_rate_limit_error(error: BaseException) -> bool:
    """True when the 429 is a short per-minute limit rather than an exhausted daily quota."""
    if not is_quota_error(error):
        return False
    lowered = f"{type(error).__name__} {error}".lower()
    if any(marker in lowered for marker in RATE_LIMIT_MARKERS):
        return True
    # A provider that tells us when to come back is describing a window, not an exhausted day.
    return get_retry_after_seconds(error) is not None and "per day" not in lowered


def get_retry_after_seconds(error: BaseException) -> float | None:
    """Seconds the provider asked us to wait, when it says so."""
    text = f"{error}"

    for pattern in RETRY_AFTER_PATTERNS:
        match = pattern.search(text)
        if match:
            groups = [float(value) for value in match.groups() if value is not None]
            return groups[0] * 60 + groups[1] if len(groups) == 2 else groups[0]

    return None


def is_model_unavailable_error(error: BaseException) -> bool:
    """Detect a retired, renamed, or misspelled model, which only another model can fix."""
    lowered = f"{type(error).__name__} {error}".lower()
    return any(marker in lowered for marker in MODEL_UNAVAILABLE_MARKERS)


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
PROVIDER_ORDER = ("deepseek", "gemini", "groq", "openrouter", "ollama", "openai")

OPENAI_COMPATIBLE = {"openai", "groq", "openrouter", "ollama", "deepseek"}


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
    elif name == "deepseek":
        key = settings.deepseek_api_key
        models = _models(settings.deepseek_model, settings.deepseek_fallback_models)
        base_url = "https://api.deepseek.com/v1"
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


def get_role_provider(role: str | None) -> str | None:
    """Provider configured for one agent role, when the deployment routes roles separately."""
    role_map = {
        "planner": settings.planner_provider,
        "architect": settings.architect_provider,
        "backend": settings.backend_provider,
        "frontend": settings.frontend_provider,
        "coder": settings.coder_provider,
        "tester": settings.tester_provider,
    }
    return role_map.get(role or "") or None


def get_model_candidates(
    provider: str | None = None,
    role: str | None = None,
) -> list[tuple[str, str]]:
    """Ordered (provider, model) pairs to try: requested provider first, then the rest.

    Precedence: an explicit request (the UI selector) beats the role's provider, which beats
    the global default. The rest of the chain follows in either case, so routing never costs
    a run: a role pinned to an unconfigured provider still falls through to the others.
    """
    target = (provider or get_role_provider(role) or settings.llm_provider).lower()
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

    def _try(self, provider: str, model: str, prompt: str) -> Any:
        llm = get_llm(provider=provider, model_name=model, temperature=self.temperature)
        if llm is None:
            raise LookupError(f"Provider '{provider}' is not configured.")

        response = llm.invoke(prompt)
        self.last_provider, self.last_model = provider, model
        return response

    def invoke(self, prompt: str) -> Any:
        last_error: BaseException | None = None
        only_quota_failures = True
        # (wait_seconds, provider, model) for models blocked by a per-minute window that a
        # short sleep would clear — used only after every other candidate has been tried.
        deferred: list[tuple[float, str, str]] = []

        for provider, model in self.candidates:
            try:
                return self._try(provider, model, prompt)
            except LookupError:
                continue
            except Exception as error:
                last_error = error
                if is_quota_error(error):
                    if is_rate_limit_error(error):
                        wait = get_retry_after_seconds(error) or 5.0
                        if wait <= settings.rate_limit_wait_seconds:
                            deferred.append((wait, provider, model))
                    logger.warning("Quota exhausted for %s/%s, trying next model.", provider, model)
                    continue
                if is_model_unavailable_error(error):
                    only_quota_failures = False
                    logger.warning(
                        "Model %s/%s is unavailable (%s), trying next model.",
                        provider,
                        model,
                        error,
                    )
                    continue
                only_quota_failures = False
                logger.warning("Model %s/%s failed: %s", provider, model, error)

        budget = settings.rate_limit_wait_seconds
        for wait, provider, model in sorted(deferred):
            if wait > budget:
                break
            budget -= wait
            logger.warning(
                "Every model is busy; waiting %.0fs for the %s/%s rate limit to reset.",
                wait,
                provider,
                model,
            )
            time.sleep(wait)
            try:
                return self._try(provider, model, prompt)
            except LookupError:
                continue
            except Exception as error:
                last_error = error
                logger.warning("Model %s/%s still failing after the wait: %s", provider, model, error)

        if last_error is None:
            raise RuntimeError("No usable LLM model is configured.")
        if only_quota_failures:
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
            timeout=30.0,
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
            request_timeout=30.0,
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
            if is_quota_error(error) or is_model_unavailable_error(error):
                break
            if attempt < max_retries:
                time.sleep(retry_delay_seconds * (attempt + 1))

    if last_error:
        raise last_error
    raise RuntimeError("LLM invoke failed without an exception.")
