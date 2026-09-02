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

    # --- Gemini ---
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-flash-latest", alias="GEMINI_MODEL")
    gemini_fallback_models: str = Field(
        default="gemini-2.5-flash-lite,gemini-3-flash-preview",
        alias="GEMINI_FALLBACK_MODELS",
    )

    # --- OpenAI ---
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    openai_fallback_models: str = Field(default="", alias="OPENAI_FALLBACK_MODELS")

    # --- Groq ---
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_model: str = Field(default="qwen/qwen3.6-27b", alias="GROQ_MODEL")
    groq_fallback_models: str = Field(
        default="groq/compound-mini,openai/gpt-oss-20b,allam-2-7b", alias="GROQ_FALLBACK_MODELS"
    )

    # --- OpenRouter ---
    openrouter_api_key: str | None = Field(default=None, alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(
        default="deepseek/deepseek-chat-v3-1:free", alias="OPENROUTER_MODEL"
    )
    openrouter_fallback_models: str = Field(default="", alias="OPENROUTER_FALLBACK_MODELS")

    # --- Ollama ---
    ollama_base_url: str = Field(default="http://127.0.0.1:11434/v1", alias="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="qwen2.5-coder:3b", alias="OLLAMA_MODEL")
    ollama_fallback_models: str = Field(
        default="qwen2.5-coder:7b,qwen2.5-coder:latest,qwen2.5-coder:3b", alias="OLLAMA_FALLBACK_MODELS"
    )
    ollama_enabled: bool = Field(default=False, alias="OLLAMA_ENABLED")

    # --- DeepSeek (direct API, OpenAI-compatible) ---
    deepseek_api_key: str | None = Field(default=None, alias="DEEPSEEK_API_KEY")
    deepseek_model: str = Field(default="deepseek-chat", alias="DEEPSEEK_MODEL")
    deepseek_reasoner_model: str = Field(default="deepseek-reasoner", alias="DEEPSEEK_REASONER_MODEL")
    deepseek_fallback_models: str = Field(default="", alias="DEEPSEEK_FALLBACK_MODELS")

    # --- Per-agent provider routing ---
    # Each falls back to llm_provider when unset.
    planner_provider: str | None = Field(default=None, alias="PLANNER_PROVIDER")
    architect_provider: str | None = Field(default=None, alias="ARCHITECT_PROVIDER")
    backend_provider: str | None = Field(default=None, alias="BACKEND_PROVIDER")
    frontend_provider: str | None = Field(default=None, alias="FRONTEND_PROVIDER")
    coder_provider: str | None = Field(default=None, alias="CODER_PROVIDER")
    tester_provider: str | None = Field(default=None, alias="TESTER_PROVIDER")

    # Longest a per-minute rate limit is worth waiting out; 0 disables waiting.
    rate_limit_wait_seconds: float = Field(default=40.0, alias="RATE_LIMIT_WAIT_SECONDS")

    # auto: one call per file only for local models | file: always | batch: never
    coder_file_mode: str = Field(default="file", alias="CODER_FILE_MODE")


settings = Settings()
