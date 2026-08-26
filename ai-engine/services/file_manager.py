"""Service to persist generated project files onto the filesystem."""

import logging
from pathlib import Path
from typing import Dict, List

logger = logging.getLogger(__name__)

# Root repository directory: 2 levels up from ai-engine/services/
REPO_ROOT = Path(__file__).resolve().parents[2]
GENERATED_PROJECTS_DIR = REPO_ROOT / "generated-projects"


def save_project_files(project_name: str, files: Dict[str, str]) -> Dict[str, str | List[str]]:
    """Save generated dictionary of files into generated-projects/<project_name>/.

    :param project_name: Target folder name slug.
    :param files: Dict mapping relative file path -> code content.
    :return: Summary dict with status, output_dir, and saved_files.
    """
    output_dir = GENERATED_PROJECTS_DIR / project_name
    output_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    for rel_path, content in files.items():
        file_path = output_dir / rel_path
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
