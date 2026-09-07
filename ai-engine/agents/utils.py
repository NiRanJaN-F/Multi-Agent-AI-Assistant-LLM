"""Utilities for logging state events and parsing LLM outputs."""

from datetime import UTC, datetime
import json
import re
from difflib import SequenceMatcher
from typing import Any, Dict

from config.llm import FallbackLLM, get_model_candidates
from graph.state import AgentState, LogEntry

FILE_MARKER_PATTERN = re.compile(
    r"^\s*(?:#{1,6}\s*|\*{1,3}\s*)?FILE:\s*[`\"']?(.+?)[`\"']?\s*:?\s*\*{0,3}\s*$",
    re.MULTILINE | re.IGNORECASE,
)

CODE_FENCE_PATTERN = re.compile(r"```([\w+\-]*)\s*\n([\s\S]*?)\n?```", re.MULTILINE)

PATH_LIKE_EXT = r"(?:py|js|jsx|ts|tsx|html|css|scss|json|md|yml|yaml|toml|txt|env\.example|conf|cfg)"

PATH_LIKE_PATTERN = re.compile(
    r"(?:^|\n)\s*[`\"']?([\w\-\.\/\\]+?\." + PATH_LIKE_EXT + r")[`\"']?\s*(?::|$)",
    re.MULTILINE | re.IGNORECASE,
)

_EXT_LANG_HINT = {
    "py": ("python",), "js": ("javascript", "js"), "jsx": ("jsx", "javascript"),
    "ts": ("typescript", "ts"), "tsx": ("tsx", "typescript"), "html": ("html",),
    "css": ("css",), "json": ("json",), "md": ("markdown", "md"),
    "yml": ("yaml", "yml"), "yaml": ("yaml",), "toml": ("toml",),
}


def _path_basename(path: str) -> str:
    return path.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]


def _fuzzy_basename_match(candidate: str, expected_paths: list[str]) -> str | None:
    """Fuzzy-match a recovered path candidate against expected_paths. Returns the closest expected path or None."""
    if not expected_paths:
        return None
    candidate_base = _path_basename(candidate).lower()
    best = None
    best_score = 0.0
    for expected in expected_paths:
        exp_base = _path_basename(expected).lower()
        if candidate_base == exp_base:
            return expected
        score = SequenceMatcher(None, candidate_base, exp_base).ratio()
        if candidate.endswith("/" + _path_basename(expected)):
            score = max(score, 0.95)
        if score > best_score and score >= 0.72:
            best_score = score
            best = expected
    return best


def _parse_pass1_strict_markers(text: str) -> Dict[str, str]:
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


def _parse_pass2_codefence_hints(text: str, expected_paths: list[str]) -> Dict[str, str]:
    """Pair each markdown code fence with nearest preceding path-like string or matching lang extension."""
    recovered: Dict[str, str] = {}
    fences = list(CODE_FENCE_PATTERN.finditer(text))
    if not fences:
        return recovered

    path_matches = list(PATH_LIKE_PATTERN.finditer(text))
    used_paths: set[str] = set()

    for fence_idx, fence in enumerate(fences):
        lang = (fence.group(1) or "").strip().lower()
        content = fence.group(2).strip()
        if not content or len(content) < 10:
            continue

        nearest_path = None
        best_distance = float("inf")
        for pm in path_matches:
            if pm.end() <= fence.start():
                dist = fence.start() - pm.end()
                if dist < best_distance:
                    best_distance = dist
                    nearest_path = pm.group(1).strip()
            else:
                break

        matched_expected = None
        if nearest_path:
            matched_expected = _fuzzy_basename_match(nearest_path, [p for p in expected_paths if p not in used_paths])

        if matched_expected is None and lang:
            candidates = [
                p for p in expected_paths
                if p not in used_paths and (
                    lang in _EXT_LANG_HINT.get(p.rsplit(".", 1)[-1].lower(), ())
                    or p.rsplit(".", 1)[-1].lower() == lang
                )
            ]
            if len(candidates) == 1:
                matched_expected = candidates[0]
            elif len(candidates) > 1 and fence_idx < len(candidates):
                matched_expected = candidates[fence_idx] if candidates else None

        if matched_expected:
            recovered[matched_expected] = content
            used_paths.add(matched_expected)
        elif nearest_path and not expected_paths:
            recovered[nearest_path] = content

    return recovered


def _parse_pass3_path_split(text: str, expected_paths: list[str]) -> Dict[str, str]:
    """Split text at every path-like regex match and pair each segment."""
    recovered: Dict[str, str] = {}
    matches = list(PATH_LIKE_PATTERN.finditer(text))
    if len(matches) < 2:
        return recovered

    for idx, m in enumerate(matches):
        path_candidate = m.group(1).strip()
        seg_start = m.end()
        seg_end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        segment = text[seg_start:seg_end]
        content = strip_code_fence(segment)
        if len(content) < 10:
            continue
        matched = _fuzzy_basename_match(path_candidate, [p for p in expected_paths if p not in recovered])
        if matched:
            recovered[matched] = content
        elif not expected_paths:
            recovered[path_candidate] = content
    return recovered


def _fuzzy_parse_multi_file(text: str, expected_paths: list[str]) -> Dict[str, str]:
    """3-pass recovery: strict FILE markers → code-fence pairing → path-regex splitting. Never empties strict parse."""
    if not text:
        return {}

    strict = _parse_pass1_strict_markers(text)
    coverage = 0
    if expected_paths:
        coverage = sum(1 for p in expected_paths if any(
            _path_basename(p).lower() == _path_basename(k).lower() for k in strict
        ))
        if strict and (coverage >= len(expected_paths) or coverage >= max(1, len(expected_paths) - 1)):
            return strict

    result: Dict[str, str] = dict(strict)
    remaining = [p for p in expected_paths if not any(
        _path_basename(p).lower() == _path_basename(k).lower() for k in result
    )]

    if remaining or not strict:
        pass2 = _parse_pass2_codefence_hints(text, remaining or expected_paths)
        for k, v in pass2.items():
            if k not in result:
                result[k] = v

    remaining = [p for p in expected_paths if not any(
        _path_basename(p).lower() == _path_basename(k).lower() for k in result
    )]
    if remaining and len(result) < max(2, len(expected_paths) - 1):
        pass3 = _parse_pass3_path_split(text, remaining)
        for k, v in pass3.items():
            if k not in result:
                result[k] = v

    return result


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
    """Remove reasoning <think> blocks and markdown code fences from LLM output."""
    cleaned = (text or "").strip()
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", cleaned, flags=re.IGNORECASE).strip()

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


def parse_multi_file_response(text: str, expected_paths: list[str] | None = None) -> Dict[str, str]:
    """Parse multi-file LLM response. Runs 3-pass fuzzy recovery if expected_paths provided and strict parse under-recovers."""
    if not text:
        return {}
    if expected_paths:
        return _fuzzy_parse_multi_file(text, list(expected_paths))
    return _parse_pass1_strict_markers(text)


def _coerce_to_dict(data: Any) -> Dict[str, Any]:
    if isinstance(data, dict):
        return data
    if isinstance(data, list):
        if data and isinstance(data[0], dict):
            return data[0]
        return {"tasks": data}
    return {}


def extract_json_from_llm(text: str) -> Dict[str, Any]:
    """Extract and parse JSON content from raw LLM output text, handling markdown code blocks."""
    if not text:
        return {}

    cleaned = strip_code_fence(text)

    try:
        data = json.loads(cleaned)
        return _coerce_to_dict(data)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                data = json.loads(cleaned[start : end + 1])
                return _coerce_to_dict(data)
            except json.JSONDecodeError:
                pass
        return {}
