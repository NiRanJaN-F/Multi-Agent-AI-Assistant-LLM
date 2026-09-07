"""LLM provider factory covering Gemini, Groq, OpenRouter, OpenAI, and local Ollama."""

import logging
import re
import sys
import time

from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any, Protocol

from langchain_core.language_models import BaseChatModel

from config.settings import settings

logger = logging.getLogger(__name__)

QUOTA_ERROR_MARKERS = (
    "429",
    "402",
    "insufficient balance",
    "payment required",
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


# Free providers first: Gemini (fast & high quota) → Groq (thousands/day) → OpenRouter free models →
# Ollama (local, unlimited), with paid DeepSeek/OpenAI last and only if configured.
PROVIDER_ORDER = ("gemini", "groq", "openrouter", "deepseek", "ollama", "openai")

PROVIDER_COST_TIER = {
    "ollama": "free_local",
    "groq": "cheap",
    "gemini": "standard_daily_cap",
    "openrouter": "standard",
    "deepseek": "premium_future_paid",
    "openai": "premium",
}

OPENAI_COMPATIBLE = {"openai", "groq", "openrouter", "ollama", "deepseek"}

HEAVY_TOKEN_ROLES = {"planner", "coder"}


def _normalize_prompt_for_cache(prompt: str) -> str:
    if len(prompt) > 2048:
        return ""
    collapsed = re.sub(r"\s+", " ", prompt).strip()
    return collapsed


@lru_cache(maxsize=64)
def _cached_invoke(
    normalized_prompt: str,
    provider_name: str,
    model_name: str,
    temperature: float,
) -> str:
    if not normalized_prompt:
        raise ValueError("cache bypass")
    llm = get_llm(provider=provider_name, model_name=model_name, temperature=temperature)
    if llm is None:
        raise ValueError("cache bypass")
    response = llm.invoke(normalized_prompt)
    return response.content if hasattr(response, "content") else str(response)


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

    Free-tier optimization: when DEEPSEEK_PAID_TIER=false and role is a heavy-token role
    (planner, coder), DeepSeek is demoted behind Groq/Gemini/OpenRouter/Ollama to preserve
    quota. Set DEEPSEEK_PAID_TIER=true to restore DeepSeek to its primary position.
    """
    target = (provider or get_role_provider(role) or settings.llm_provider).lower()
    ordered = [target, *(name for name in PROVIDER_ORDER if name != target)]

    if (
        not settings.deepseek_paid_tier
        and role is not None
        and role.lower() in HEAVY_TOKEN_ROLES
        and not provider
    ):
        if "deepseek" in ordered:
            ordered.remove("deepseek")
            insert_at = 1
            for idx, name in enumerate(ordered):
                if name in {"openrouter", "ollama"}:
                    insert_at = idx + 1
            ordered.insert(insert_at, "deepseek")
            logger.info(
                "Free-tier mode: demoted DeepSeek to position %d for %s role. "
                "Set DEEPSEEK_PAID_TIER=true to promote.",
                insert_at,
                role,
            )

    return [
        (profile.name, model)
        for name in ordered
        if (profile := get_provider_profile(name)) and profile.available
        for model in profile.models
    ]


class FallbackLLM:
    """Chat model that walks a list of models/providers when one runs out of quota.

    Exposes ``invoke`` so it is a drop-in for a LangChain chat model in the agents.
    Tracks call count for free-tier token-budget gating.
    """

    def __init__(self, candidates: list[tuple[str, str]], temperature: float = 0.2) -> None:
        self.candidates = candidates
        self.temperature = temperature
        self.last_provider, self.last_model = candidates[0]
        self._stats = {"calls": 0, "cache_hits": 0, "budget_warned": False}

    @property
    def label(self) -> str:
        return f"{self.last_provider} ({self.last_model})"

    @property
    def call_count(self) -> int:
        return self._stats["calls"]

    def _try(self, provider: str, model: str, prompt: str) -> Any:
        if settings.enable_prompt_cache and "pytest" not in sys.modules:
            normalized = _normalize_prompt_for_cache(prompt)

            if normalized:
                try:
                    cached = _cached_invoke(
                        normalized, provider, model, self.temperature
                    )
                    self._stats["cache_hits"] += 1
                    self.last_provider, self.last_model = provider, model
                    return type(
                        "CachedResponse",
                        (),
                        {"content": cached},
                    )()
                except ValueError:
                    pass
                except Exception as error:
                    if is_quota_error(error) or is_model_unavailable_error(error):
                        raise error
                    logger.debug("Prompt cache miss for %s/%s: %s", provider, model, error)


        llm = get_llm(provider=provider, model_name=model, temperature=self.temperature)
        if llm is None:
            raise LookupError(f"Provider '{provider}' is not configured.")

        response = llm.invoke(prompt)
        self.last_provider, self.last_model = provider, model
        self._stats["calls"] += 1
        budget_threshold = max(settings.token_budget_per_generation_k * 4, 12)
        if (
            self._stats["calls"] >= budget_threshold
            and not self._stats["budget_warned"]
        ):
            self._stats["budget_warned"] = True
            logger.warning(
                "Free-tier call budget soft threshold reached (%d calls for this run). "
                "Remaining steps will be conservative. Raise TOKEN_BUDGET_PER_GENERATION_K "
                "or set DEEPSEEK_PAID_TIER=true if you have paid quota.",
                self._stats["calls"],
            )
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
                        wait = get_retry_after_seconds(error)
                        if wait is not None and wait <= settings.rate_limit_wait_seconds:
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
    """Invoke the LLM with simple retry logic for transient API failures.

    When settings.enable_prompt_cache and the prompt is small (<=2048 chars) and the
    caller is a FallbackLLM we cache; here we only wrap the underlying invoke with
    retries, because FallbackLLM._try already gates caching for its own path.
    """
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
