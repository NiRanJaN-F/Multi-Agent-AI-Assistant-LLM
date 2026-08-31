"""Utilities for logging state events and parsing LLM outputs."""

from datetime import UTC, datetime
import json
import re
from typing import Any, Dict

from config.llm import get_llm, get_llm_status
from graph.state import AgentState, LogEntry


def add_log(state_logs: list[LogEntry], agent: str, status: str, message: str) -> list[LogEntry]:
    """Helper to append a structured log entry to the state logs list."""
    new_logs = list(state_logs) if state_logs else []
    new_logs.append({
        "agent": agent,
        "status": status,
        "message": message,
        "timestamp": datetime.now(UTC).isoformat(),
    })
    return new_logs


def get_agent_llm(state: AgentState, temperature: float = 0.2):
    """Resolve the LLM client for an agent based on graph state provider override."""
    provider = state.get("llm_provider") or None
    return get_llm(provider=provider, temperature=temperature)


def get_agent_llm_label(state: AgentState) -> str:
    """Human-readable label for logs indicating live vs mock LLM mode."""
    status = get_llm_status(state.get("llm_provider"))
    if status["mode"] == "live":
        return f"{status['provider']} ({status['model']})"
    return "mock templates"


def strip_code_fence(text: str) -> str:
    """Remove markdown code fences from LLM output when present."""
    cleaned = (text or "").strip()
    match = re.search(r"```(?:[\w+-]*)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        return match.group(1).strip()

    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        return "\n".join(lines).strip()

    return cleaned


def extract_json_from_llm(text: str) -> Dict[str, Any]:
    """Extract and parse JSON content from raw LLM output text, handling markdown code blocks."""
    if not text:
        return {}

    cleaned = strip_code_fence(text)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(cleaned[start : end + 1])
            except json.JSONDecodeError:
                pass
        return {}
