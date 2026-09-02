"""Application settings loaded from the monorepo root .env file."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    node_env: str = Field(default="development", alias="NODE_ENV")
    ai_engine_host: str = Field(default="127.0.0.1", alias="AI_ENGINE_HOST")
    ai_engine_port: int = Field(default=8000, alias="AI_ENGINE_PORT")
    llm_provider: str = Field(default="gemini", alias="LLM_PROVIDER")
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", alias="GEMINI_MODEL")
    gemini_fallback_models: str = Field(
        default="gemini-flash-latest,gemini-flash-lite-latest",
        alias="GEMINI_FALLBACK_MODELS",
    )
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    openai_fallback_models: str = Field(default="", alias="OPENAI_FALLBACK_MODELS")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")
    groq_fallback_models: str = Field(default="llama-3.1-8b-instant", alias="GROQ_FALLBACK_MODELS")
    openrouter_api_key: str | None = Field(default=None, alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(
        default="deepseek/deepseek-chat-v3.1:free", alias="OPENROUTER_MODEL"
    )
    openrouter_fallback_models: str = Field(default="", alias="OPENROUTER_FALLBACK_MODELS")
    ollama_base_url: str = Field(default="http://127.0.0.1:11434/v1", alias="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="qwen2.5-coder:7b", alias="OLLAMA_MODEL")
    ollama_fallback_models: str = Field(default="", alias="OLLAMA_FALLBACK_MODELS")
    ollama_enabled: bool = Field(default=False, alias="OLLAMA_ENABLED")


settings = Settings()
