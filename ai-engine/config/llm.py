"""LLM Provider integration factory for Gemini and OpenAI models."""

import logging
import time
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


def _provider_models(provider: str) -> list[str]:
    """Configured model first, then that provider's fallback models, de-duplicated."""
    if provider == "gemini":
        primary, fallbacks = settings.gemini_model, settings.gemini_fallback_models
    elif provider == "openai":
        primary, fallbacks = settings.openai_model, settings.openai_fallback_models
    else:
        return []

    models = [primary, *(name.strip() for name in fallbacks.split(","))]
    return list(dict.fromkeys(name for name in models if name))


def _has_api_key(provider: str) -> bool:
    key = settings.gemini_api_key if provider == "gemini" else settings.openai_api_key
    return bool(key and key.strip())


def get_model_candidates(provider: str | None = None) -> list[tuple[str, str]]:
    """Ordered (provider, model) pairs to try: requested provider first, then the other one."""
    target = (provider or settings.llm_provider).lower()
    ordered = [target, *(p for p in ("gemini", "openai") if p != target)]

    return [
        (name, model)
        for name in ordered
        if _has_api_key(name)
        for model in _provider_models(name)
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
                "Wait for the quota to reset, add another provider key, or set "
                "GEMINI_FALLBACK_MODELS to models you still have quota for."
            ) from last_error
        raise last_error


def get_llm_status(provider: str | None = None) -> dict[str, Any]:
    """Return configuration status for the active or requested LLM provider."""
    target_provider = (provider or settings.llm_provider).lower()

    if target_provider == "gemini":
        configured = bool(settings.gemini_api_key and settings.gemini_api_key.strip())
        model = settings.gemini_model
    elif target_provider == "openai":
        configured = bool(settings.openai_api_key and settings.openai_api_key.strip())
        model = settings.openai_model
    else:
        return {
            "provider": target_provider,
            "model": None,
            "configured": False,
            "mode": "unsupported",
        }

    return {
        "provider": target_provider,
        "model": model,
        "configured": configured,
        "mode": "live" if configured else "mock",
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

    if target_provider == "openai":
        api_key = settings.openai_api_key
        if not api_key:
            logger.warning("OPENAI_API_KEY is not set. Agents will use mock templates.")
            return None

        from langchain_openai import ChatOpenAI

        target_model = model_name or settings.openai_model
        logger.info("Initializing OpenAI LLM: %s", target_model)
        return ChatOpenAI(
            model=target_model,
            api_key=api_key,
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
