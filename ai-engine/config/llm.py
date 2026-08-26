"""LLM Provider integration factory for Gemini and OpenAI models."""

import logging
from typing import Any

from langchain_core.language_models import BaseChatModel

from config.settings import settings

logger = logging.getLogger(__name__)


def get_llm(
    provider: str | None = None,
    model_name: str | None = None,
    temperature: float = 0.2,
) -> BaseChatModel | None:
    """Instantiate and return a LangChain ChatModel based on provider and configuration.

    :param provider: 'gemini' or 'openai'. Defaults to settings.llm_provider.
    :param model_name: Custom model string or defaults to provider-specific standard.
    :param temperature: LLM sampling temperature.
    :return: BaseChatModel instance or None if credentials are missing.
    """
    target_provider = (provider or settings.llm_provider).lower()

    if target_provider == "gemini":
        api_key = settings.gemini_api_key
        if not api_key:
            logger.warning("GEMINI_API_KEY is not set. Real LLM calls will fail until configured.")
            return None
        
        from langchain_google_genai import ChatGoogleGenerativeAI
        target_model = model_name or "gemini-1.5-flash"
        return ChatGoogleGenerativeAI(
            model=target_model,
            google_api_key=api_key,
            temperature=temperature,
        )

    elif target_provider == "openai":
        api_key = settings.openai_api_key
        if not api_key:
            logger.warning("OPENAI_API_KEY is not set. Real LLM calls will fail until configured.")
            return None

        from langchain_openai import ChatOpenAI
        target_model = model_name or "gpt-4o-mini"
        return ChatOpenAI(
            model=target_model,
            api_key=api_key,
            temperature=temperature,
        )

    else:
        logger.error(f"Unsupported LLM provider requested: {target_provider}")
        return None
