---
name: testing-multi-agent-app
description: How to bring up and end-to-end test the Multi-Agent AI Assistant (React frontend + Express backend + FastAPI ai-engine + MongoDB) in a browser.
---

# Testing the Multi-Agent AI Assistant

## Bringing the stack up
```bash
cp -n .env.example .env
docker compose up -d --build     # first run; later `docker compose up -d`
```
Services: frontend http://localhost:5173 (nginx, proxies `/api/` to backend), backend
http://localhost:5000/api/health, ai-engine http://localhost:8000/docs, mongo :27017.
No login/auth exists — just open http://localhost:5173.

Quick readiness check before touching the UI:
```bash
curl -s localhost:5000/api/health
curl -s localhost:5000/api/ai/health
curl -s "localhost:5000/api/agents/history?limit=5"
```

## Mock LLM mode
With no `GEMINI_API_KEY`/`OPENAI_API_KEY`, the ai-engine runs deterministic mock templates.
Generations still succeed (`llm.mode: "mock"`) but complete in **well under a second**, so
loading/pipeline UI is never visible under normal conditions.

To observe loading states (chat pipeline indicator Planner→Architect→Coder→Tester→QA→Doc Writer,
disabled composer, "Running agents…" button), stall the engine instead of relying on real latency:
```bash
docker pause maa-ai-engine     # submit prompt in UI, watch indicator advance every 4s
docker unpause maa-ai-engine   # request then completes normally
```
This also produces a realistic non-zero `durationMs` for the history entry.

## Exercising failure paths
- MongoDB down: `docker stop maa-mongodb` (wait ~5s). `/api/agents/history` returns 503 and the
  History tab shows "MongoDB is not connected — generation history is disabled." Restart with
  `docker start maa-mongodb`; the backend reconnects automatically after ~10s.
- The System Health panel does **not** auto-poll — click its own "Refresh" button to see state
  changes; the History panel has a separate Refresh button.

## UI notes
- Tabs (Chat / Form / History) unmount each other, so the chat thread resets when you leave and
  return to the Chat tab. That is current expected behaviour, not a regression.
- Chat: Enter sends, Shift+Enter inserts a newline, Send is disabled while the textarea is empty
  or a generation is in flight (double-submit guard).
- Known layout issue to watch for: a history row whose prompt is very long may not wrap, causing
  horizontal page overflow and pushing the row's Delete button far off-screen. Workaround while
  testing: scroll the page right (many clicks) to reach the button, or delete via
  `DELETE /api/agents/history/:id`.

## Devin Secrets Needed
None for mock-mode testing. `GEMINI_API_KEY` or `OPENAI_API_KEY` would be required to test
live LLM mode (`llm.mode: "live"`).
