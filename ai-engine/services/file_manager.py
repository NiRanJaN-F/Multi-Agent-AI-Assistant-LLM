"""Service to persist and reload generated project files on the filesystem."""

import logging
from pathlib import Path
from typing import Dict, List

MAX_LOADED_FILE_CHARS = 20000
SKIPPED_DIRS = {"node_modules", ".git", "__pycache__", "dist", "build", ".venv"}

logger = logging.getLogger(__name__)

# Root repository directory: 2 levels up from ai-engine/services/
REPO_ROOT = Path(__file__).resolve().parents[2]
GENERATED_PROJECTS_DIR = REPO_ROOT / "generated-projects"


def resolve_project_dir(project_name: str) -> Path:
    """Resolve a project folder inside generated-projects, rejecting path traversal."""
    candidate = (GENERATED_PROJECTS_DIR / project_name).resolve()
    root = GENERATED_PROJECTS_DIR.resolve()

    if candidate == root or root not in candidate.parents:
        raise ValueError(f"Invalid project name: '{project_name}'")

    return candidate


def _resolve_file_path(output_dir: Path, rel_path: str) -> Path:
    """Resolve a generated file path, rejecting anything escaping the project folder."""
    candidate = (output_dir / rel_path).resolve()

    if output_dir.resolve() not in candidate.parents:
        raise ValueError(f"Invalid generated file path: '{rel_path}'")

    return candidate


def save_project_files(project_name: str, files: Dict[str, str]) -> Dict[str, str | List[str]]:
    """Save generated dictionary of files into generated-projects/<project_name>/.

    :param project_name: Target folder name slug.
    :param files: Dict mapping relative file path -> code content.
    :return: Summary dict with status, output_dir, and saved_files.
    """
    output_dir = resolve_project_dir(project_name)
    output_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    for rel_path, content in files.items():
        try:
            file_path = _resolve_file_path(output_dir, rel_path)
        except ValueError as exc:
            logger.warning("Skipping unsafe generated file path: %s", exc)
            continue

        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content or "")

        saved_files.append(rel_path)
        logger.info(f"Saved generated file: {file_path}")

    return {
        "status": "success",
        "output_dir": str(output_dir),
        "saved_files": saved_files,
    }


def project_exists(project_name: str) -> bool:
    """Return True when a generated project folder is present on disk."""
    try:
        return resolve_project_dir(project_name).is_dir()
    except ValueError:
        return False


def load_project_files(project_name: str) -> Dict[str, str]:
    """Load an existing generated project into a relative path -> content mapping."""
    try:
        project_dir = resolve_project_dir(project_name)
    except ValueError:
        return {}

    if not project_dir.is_dir():
        return {}

    files: Dict[str, str] = {}
    for path in sorted(project_dir.rglob("*")):
        if not path.is_file():
            continue
        if any(part in SKIPPED_DIRS for part in path.relative_to(project_dir).parts):
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError) as exc:
            logger.warning("Skipping unreadable project file %s: %s", path, exc)
            continue
        files[path.relative_to(project_dir).as_posix()] = content[:MAX_LOADED_FILE_CHARS]

    return files


def list_projects() -> List[str]:
    """List the generated project folder names available on disk."""
    if not GENERATED_PROJECTS_DIR.is_dir():
        return []
    return sorted(entry.name for entry in GENERATED_PROJECTS_DIR.iterdir() if entry.is_dir())
