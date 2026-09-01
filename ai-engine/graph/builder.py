"""LangGraph StateGraph workflow builder module."""

import logging
from typing import Literal

from langgraph.graph import END, START, StateGraph

from agents.architecture_agent import architecture_agent
from agents.coder_agent import coder_agent
from agents.doc_agent import doc_agent
from agents.planner_agent import planner_agent
from agents.qa_agent import qa_agent
from agents.refine_agent import refine_coder_agent, refine_planner_agent
from agents.tester_agent import tester_agent
from graph.state import AgentState

logger = logging.getLogger(__name__)


def should_retry_coder(state: AgentState) -> Literal["coder", "doc_writer"]:
    """Conditional edge decision function following QA code review."""
    review_results = state.get("review_results", {})
    passed = review_results.get("passed", True)
    retry_count = state.get("retry_count", 0)

    if not passed and retry_count < 2:
        logger.info(f"QA review failed. Returning to CoderAgent (Retry count: {retry_count + 1})")
        return "coder"
    
    return "doc_writer"


def create_agent_graph():
    """Build and compile the multi-agent execution StateGraph."""
    workflow = StateGraph(AgentState)

    # Register Nodes
    workflow.add_node("planner", planner_agent)
    workflow.add_node("architect", architecture_agent)
    workflow.add_node("coder", coder_agent)
    workflow.add_node("tester", tester_agent)
    workflow.add_node("qa", qa_agent)
    workflow.add_node("doc_writer", doc_agent)

    # Wire Edges
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "architect")
    workflow.add_edge("architect", "coder")
    workflow.add_edge("coder", "tester")
    workflow.add_edge("tester", "qa")

    # Conditional Routing from QA
    workflow.add_conditional_edges(
        "qa",
        should_retry_coder,
        {
            "coder": "coder",
            "doc_writer": "doc_writer",
        },
    )

    workflow.add_edge("doc_writer", END)

    app_graph = workflow.compile()
    return app_graph


def create_refinement_graph():
    """Build the graph that edits an already generated project from a follow-up prompt."""
    workflow = StateGraph(AgentState)

    workflow.add_node("refine_planner", refine_planner_agent)
    workflow.add_node("coder", refine_coder_agent)
    workflow.add_node("tester", tester_agent)
    workflow.add_node("qa", qa_agent)
    workflow.add_node("doc_writer", doc_agent)

    workflow.add_edge(START, "refine_planner")
    workflow.add_edge("refine_planner", "coder")
    workflow.add_edge("coder", "tester")
    workflow.add_edge("tester", "qa")

    workflow.add_conditional_edges(
        "qa",
        should_retry_coder,
        {
            "coder": "coder",
            "doc_writer": "doc_writer",
        },
    )

    workflow.add_edge("doc_writer", END)

    return workflow.compile()
