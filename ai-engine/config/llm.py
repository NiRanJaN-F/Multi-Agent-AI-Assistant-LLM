"""LLM Provider integration factory for Gemini and OpenAI models."""

import logging
import time
from typing import Any

from langchain_core.language_models import BaseChatModel

from config.settings import settings

logger = logging.getLogger(__name__)


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
        )

    logger.error("Unsupported LLM provider requested: %s", target_provider)
    return None


def invoke_with_retry(
    llm: BaseChatModel,
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
            if attempt < max_retries:
                time.sleep(retry_delay_seconds * (attempt + 1))

    if last_error:
        raise last_error
    raise RuntimeError("LLM invoke failed without an exception.")
