# Prompt templates

Agent prompt templates are defined alongside each agent module in `ai-engine/agents/`.

| Agent | Prompt constant | File |
| --- | --- | --- |
| Planner | `PLANNER_PROMPT_TEMPLATE` | `agents/planner_agent.py` |
| Architect | `ARCHITECT_PROMPT_TEMPLATE` | `agents/architecture_agent.py` |
| Coder | `CODER_PROMPT_TEMPLATE` | `agents/coder_agent.py` |
| Tester | `TESTER_PROMPT_TEMPLATE` | `agents/tester_agent.py` |
| QA | `QA_PROMPT_TEMPLATE` | `agents/qa_agent.py` |
| Doc Writer | `DOC_PROMPT_TEMPLATE` | `agents/doc_agent.py` |

In a later phase, these may be extracted into standalone `.md` or `.txt` files loaded at runtime.
