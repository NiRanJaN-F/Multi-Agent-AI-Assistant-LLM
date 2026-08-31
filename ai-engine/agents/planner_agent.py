"""Planner Agent node for requirement analysis and task decomposition."""

import logging
from config.llm import invoke_with_retry
from graph.state import AgentState
from agents.utils import add_log, extract_json_from_llm, get_agent_llm, get_agent_llm_label

logger = logging.getLogger(__name__)

PLANNER_PROMPT_TEMPLATE = """You are an expert Software Architecture Planner.
Analyze the user request and generate a structured JSON execution plan.

User Request:
"{user_prompt}"

Return ONLY a valid JSON object matching this schema:
{{
  "project_name": "kebab-case-project-name",
  "tech_stack": "Short summary of technologies to use (e.g. HTML/CSS/JavaScript, React + Express, Python FastAPI)",
  "tasks": [
    "Task 1: Project setup and folder structure",
    "Task 2: UI/Frontend components implementation",
    "Task 3: Backend API routes or application logic",
    "Task 4: Unit testing and documentation"
  ]
}}
"""


def planner_agent(state: AgentState) -> dict:
    """Executes the planning phase of the workflow."""
    logs = add_log(state.get("logs", []), "PlannerAgent", "started", "Analyzing user prompt and building execution plan...")
    user_prompt = state.get("user_prompt", "Sample Application")
    existing_name = state.get("project_name", "").strip()

    llm = get_agent_llm(state, temperature=0.2)
    if llm is None:
        logger.info("No LLM key configured. Using default planning template.")
        slug = existing_name or ("".join(c if c.isalnum() else "-" for c in user_prompt.lower())[:25].strip("-") or "generated-app")
        logs = add_log(logs, "PlannerAgent", "completed", "Generated mock execution plan (no API key configured).")
        return {
            "project_name": slug,
            "tech_stack": "HTML / Vanilla CSS / JavaScript",
            "tasks": [
                "Structure HTML layout and DOM containers",
                "Style components with modern CSS responsive layout",
                "Implement frontend application logic",
                "Add README documentation and setup instructions",
            ],
            "logs": logs,
            "current_step": "planned",
        }

    try:
        raw = invoke_with_retry(llm, PLANNER_PROMPT_TEMPLATE.format(user_prompt=user_prompt))
        parsed = extract_json_from_llm(raw)

        project_name = existing_name or (parsed.get("project_name") or "generated-app")
        tech_stack = parsed.get("tech_stack") or "Web Application Stack"
        tasks = parsed.get("tasks") or ["Project structure setup", "Feature implementation", "Documentation"]

        logs = add_log(
            logs,
            "PlannerAgent",
            "completed",
            f"Plan created via {get_agent_llm_label(state)}: {len(tasks)} tasks for '{project_name}'.",
        )
        return {
            "project_name": project_name,
            "tech_stack": tech_stack,
            "tasks": tasks,
            "logs": logs,
            "current_step": "planned",
        }
    except Exception as e:
        logger.error(f"Planner Agent error: {e}")
        logs = add_log(logs, "PlannerAgent", "error", f"Planning failed: {str(e)}")
        return {
            "error": str(e),
            "logs": logs,
            "current_step": "planning_failed",
        }
