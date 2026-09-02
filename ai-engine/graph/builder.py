"""LangGraph StateGraph workflow builder module.

Orchestrates the Multi-Agent AI Software Engineering pipeline across specialist agents:
Planner → Architect → [Backend + Frontend | Coder] → Tester → QA → DocWriter
"""

import logging
from typing import Literal

from langgraph.graph import END, START, StateGraph

from agents.architecture_agent import architecture_agent
from agents.backend_agent import backend_agent
from agents.coder_agent import coder_agent
from agents.doc_agent import doc_agent
from agents.frontend_agent import frontend_agent
from agents.planner_agent import planner_agent
from agents.qa_agent import qa_agent
from agents.refine_agent import refine_coder_agent, refine_planner_agent
from agents.tester_agent import tester_agent
from graph.state import AgentState

logger = logging.getLogger(__name__)

MAX_CODER_RETRIES = 1


def route_by_project_type(state: AgentState) -> Literal["backend", "coder"]:
    """Conditional edge decision function after Architect node."""
    if state.get("error"):
        return END
    pt = state.get("project_type", "web").lower()
    if pt in ("node", "python", "fullstack"):
        logger.info(f"Routing to BackendAgent + FrontendAgent pipeline for project_type='{pt}'")
        return "backend"
    logger.info(f"Routing to CoderAgent for project_type='{pt}'")
    return "coder"


def should_retry_coder(state: AgentState) -> Literal["coder", "backend", "doc_writer"]:
    """Conditional edge decision function following QA code review."""
    review_results = state.get("review_results", {})
    passed = review_results.get("passed", True)
    retry_count = state.get("retry_count", 0)

    if not passed and retry_count <= MAX_CODER_RETRIES:
        pt = state.get("project_type", "web").lower()
        if pt in ("node", "python", "fullstack"):
            logger.info(f"QA review failed. Returning to BackendAgent (Retry count: {retry_count})")
            return "backend"
        logger.info(f"QA review failed. Returning to CoderAgent (Retry count: {retry_count})")
        return "coder"

    return "doc_writer"


def _halt_on_error(next_node: str):
    """Route to END when an agent recorded an error, so failures surface immediately."""

    def route(state: AgentState) -> str:
        return END if state.get("error") else next_node

    return route


def create_agent_graph():
    """Build and compile the multi-agent execution StateGraph."""
    workflow = StateGraph(AgentState)

    # Register Nodes
    workflow.add_node("planner", planner_agent)
    workflow.add_node("architect", architecture_agent)
    workflow.add_node("backend", backend_agent)
    workflow.add_node("frontend", frontend_agent)
    workflow.add_node("coder", coder_agent)
    workflow.add_node("tester", tester_agent)
    workflow.add_node("qa", qa_agent)
    workflow.add_node("doc_writer", doc_agent)

    # Wire Edges
    workflow.add_edge(START, "planner")
    workflow.add_conditional_edges("planner", _halt_on_error("architect"), {"architect": "architect", END: END})

    # Routing from Architect to Specialist Coders
    workflow.add_conditional_edges(
        "architect",
        route_by_project_type,
        {
            "backend": "backend",
            "coder": "coder",
            END: END,
        },
    )

    # Backend hands off to Frontend
    workflow.add_conditional_edges("backend", _halt_on_error("frontend"), {"frontend": "frontend", END: END})

    # Frontend and Coder both hand off to Tester
    workflow.add_conditional_edges("frontend", _halt_on_error("tester"), {"tester": "tester", END: END})
    workflow.add_conditional_edges("coder", _halt_on_error("tester"), {"tester": "tester", END: END})

    # Tester hands off to QA
    workflow.add_edge("tester", "qa")

    # Conditional Routing from QA
    workflow.add_conditional_edges(
        "qa",
        should_retry_coder,
        {
            "coder": "coder",
            "backend": "backend",
            "doc_writer": "doc_writer",
        },
    )

    workflow.add_edge("doc_writer", END)

    return workflow.compile()


def should_retry_refine_coder(state: AgentState) -> Literal["coder", "doc_writer"]:
    """Conditional edge decision function following QA code review during refinement."""
    review_results = state.get("review_results", {})
    passed = review_results.get("passed", True)
    retry_count = state.get("retry_count", 0)

    if not passed and retry_count <= MAX_CODER_RETRIES:
        logger.info(f"QA review failed during refinement. Returning to RefineCoder (Retry count: {retry_count})")
        return "coder"

    return "doc_writer"


def create_refinement_graph():
    """Build the graph that edits an already generated project from a follow-up prompt."""
    workflow = StateGraph(AgentState)

    workflow.add_node("refine_planner", refine_planner_agent)
    workflow.add_node("coder", refine_coder_agent)
    workflow.add_node("tester", tester_agent)
    workflow.add_node("qa", qa_agent)
    workflow.add_node("doc_writer", doc_agent)

    workflow.add_edge(START, "refine_planner")
    workflow.add_conditional_edges("refine_planner", _halt_on_error("coder"), {"coder": "coder", END: END})
    workflow.add_conditional_edges("coder", _halt_on_error("tester"), {"tester": "tester", END: END})
    workflow.add_edge("tester", "qa")

    workflow.add_conditional_edges(
        "qa",
        should_retry_refine_coder,
        {
            "coder": "coder",
            "doc_writer": "doc_writer",
        },
    )

    workflow.add_edge("doc_writer", END)

    return workflow.compile()
