"""Architecture Agent node for designing software file structure."""

import logging
from config.llm import get_llm
from graph.state import AgentState
from agents.utils import add_log, extract_json_from_llm

logger = logging.getLogger(__name__)

ARCHITECT_PROMPT_TEMPLATE = """You are a Senior Software Architect.
Based on the user request and planned tech stack, design a complete project file structure.

User Request: "{user_prompt}"
Project Name: "{project_name}"
Tech Stack: "{tech_stack}"
Tasks: {tasks}

Return ONLY a valid JSON object matching this schema:
{{
  "design_notes": "Brief system design overview",
  "file_paths": [
    "index.html",
    "styles.css",
    "app.js"
  ]
}}
Ensure all necessary source files for a working application are included in file_paths.
"""


def architecture_agent(state: AgentState) -> dict:
    """Executes the architecture blueprint design phase."""
    logs = add_log(state.get("logs", []), "ArchitectureAgent", "started", "Designing file structure and system architecture...")

    user_prompt = state.get("user_prompt", "")
    project_name = state.get("project_name", "app")
    tech_stack = state.get("tech_stack", "HTML/CSS/JS")
    tasks = state.get("tasks", [])

    llm = get_llm(temperature=0.2)
    if llm is None:
        logger.info("No LLM key configured. Using standard web app file structure.")
        logs = add_log(logs, "ArchitectureAgent", "completed", "Architecture blueprint generated (Default template).")
        return {
            "architecture": {
                "design_notes": "Standard web application structure with index.html, styles.css, app.js.",
                "file_paths": ["index.html", "styles.css", "app.js"],
            },
            "logs": logs,
            "current_step": "architected",
        }

    try:
        response = llm.invoke(ARCHITECT_PROMPT_TEMPLATE.format(
            user_prompt=user_prompt,
            project_name=project_name,
            tech_stack=tech_stack,
            tasks=tasks,
        ))
        parsed = extract_json_from_llm(response.content if hasattr(response, "content") else str(response))

        file_paths = parsed.get("file_paths") or ["index.html", "styles.css", "app.js"]
        design_notes = parsed.get("design_notes") or "Single page web app architecture."

        architecture_data = {
            "design_notes": design_notes,
            "file_paths": file_paths,
        }

        logs = add_log(logs, "ArchitectureAgent", "completed", f"Blueprint created with {len(file_paths)} files.")
        return {
            "architecture": architecture_data,
            "logs": logs,
            "current_step": "architected",
        }
    except Exception as e:
        logger.error(f"Architecture Agent error: {e}")
        logs = add_log(logs, "ArchitectureAgent", "error", f"Architect design failed: {str(e)}")
        return {
            "error": str(e),
            "logs": logs,
            "current_step": "architecture_failed",
        }
