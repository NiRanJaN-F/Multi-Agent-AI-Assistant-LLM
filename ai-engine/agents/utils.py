"""Utilities for logging state events and parsing LLM outputs."""

from datetime import UTC, datetime
import json
import re
from typing import Any, Dict

from config.llm import FallbackLLM, get_model_candidates
from graph.state import AgentState, LogEntry

FILE_MARKER_PATTERN = re.compile(
    r"^\s*(?:#{1,6}\s*|\*{1,3}\s*)?FILE:\s*[`\"']?(.+?)[`\"']?\s*:?\s*\*{0,3}\s*$",
    re.MULTILINE | re.IGNORECASE,
)


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


def get_agent_llm(
    state: AgentState,
    temperature: float = 0.2,
    role: str | None = None,
) -> FallbackLLM | None:
    """Resolve the LLM client for an agent, with automatic model/provider fallback."""
    candidates = get_model_candidates(state.get("llm_provider") or None, role=role)
    if not candidates:
        return None
    return FallbackLLM(candidates, temperature=temperature)


def get_agent_llm_label(state: AgentState, role: str | None = None) -> str:
    """Human-readable label for logs indicating live vs mock LLM mode."""
    candidates = get_model_candidates(state.get("llm_provider") or None, role=role)
    if not candidates:
        return "mock templates"

    provider, model = candidates[0]
    return f"{provider} ({model})"


def llm_label(llm: FallbackLLM | None, state: AgentState) -> str:
    """Label naming the model that actually served the call, falling back to config."""
    if llm is None:
        return "mock templates"
    return llm.label if llm.last_model else get_agent_llm_label(state)


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


def parse_multi_file_response(text: str) -> Dict[str, str]:
    """Parse a single LLM response containing several files delimited by ``FILE: <path>``."""
    if not text:
        return {}

    markers = list(FILE_MARKER_PATTERN.finditer(text))
    files: Dict[str, str] = {}

    for index, marker in enumerate(markers):
        end = markers[index + 1].start() if index + 1 < len(markers) else len(text)
        raw_path = marker.group(1).strip()
        path = re.sub(r"^[\*`\"'\#\s]+|[\*`\"':\s]+$", "", raw_path).strip()
        content = strip_code_fence(text[marker.end() : end])
        if path and content:
            files[path] = content

    return files


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
