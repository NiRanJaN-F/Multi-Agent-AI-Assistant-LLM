"""Utilities for logging state events and parsing LLM outputs."""

from datetime import UTC, datetime
import json
import re
from typing import Any, Dict
from graph.state import LogEntry


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


def extract_json_from_llm(text: str) -> Dict[str, Any]:
    """Extract and parse JSON content from raw LLM output text, handling markdown code blocks."""
    if not text:
        return {}

    # Strip markdown code fencing if present
    cleaned = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
    if match:
        cleaned = match.group(1).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: attempt to find first '{' and last '}'
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(cleaned[start:end+1])
            except json.JSONDecodeError:
                pass
        return {}
