# Phase 3 — Live LLM Integration

Phase 3 enables real Gemini / OpenAI calls across all LangGraph agents.

## Configuration

Set in repository root `.env`:

```env
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-3.6-flash
LLM_PROVIDER=gemini

# Or OpenAI:
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
# LLM_PROVIDER=openai
```

Restart the AI engine after changing `.env`.

## LLM modes

| Mode | When | Agent behavior |
| --- | --- | --- |
| `live` | API key configured | Real LLM calls with retry |
| `mock` | No API key | Fallback templates (Phase 2 behavior) |

## AI engine endpoints

### `GET /api/llm/status`

Returns configuration without a live API call.

```json
{
  "provider": "gemini",
  "model": "gemini-3.6-flash",
  "configured": true,
  "mode": "live"
}
```

### `GET /api/llm/verify`

Makes a lightweight test call to confirm the key and model work.

**Response `200`**

```json
{
  "provider": "gemini",
  "model": "gemini-3.6-flash",
  "configured": true,
  "mode": "live",
  "reachable": true,
  "message": "LLM connection verified.",
  "latency_ms": 1200,
  "sample": "OK"
}
```

**Response `503`** — key invalid or model unavailable

### `GET /health`

Now includes an `llm` object (same shape as `/api/llm/status`).

### `POST /api/generate`

Response includes `llm` metadata:

```json
{
  "status": "completed",
  "llm": {
    "provider": "gemini",
    "model": "gemini-3.6-flash",
    "configured": true,
    "mode": "live"
  }
}
```

Agent logs indicate live vs mock, e.g.:
`Plan created via gemini (gemini-3.6-flash): 4 tasks for 'todo-app'.`

## Verify from PowerShell

```powershell
# Status (no API call)
Invoke-RestMethod http://127.0.0.1:8000/api/llm/status

# Live verification
Invoke-RestMethod http://127.0.0.1:8000/api/llm/verify
```

## Supported models (Gemini)

Google periodically deprecates models. If you see a 404 model error, update `GEMINI_MODEL` in `.env`.

Currently working: **`gemini-3.6-flash`**

## Frontend

- **System Health → LLM card** shows mode, provider, model
- **Verify LLM connection** button runs a live test call
- **Generate results** show LLM mode and model used

## Backend proxy endpoints

| Method | Path | Proxies to |
| --- | --- | --- |
| GET | `/api/ai/llm/status` | AI engine `/api/llm/status` |
| GET | `/api/ai/llm/verify` | AI engine `/api/llm/verify` |

## Rate limits

Gemini free tier has daily/per-minute limits (e.g. 20 requests/day for `gemini-3.6-flash`). If you see `429 quota exceeded`, wait or upgrade your plan at [Google AI Studio](https://aistudio.google.com/).

## Run tests (mock mode — no API cost)

```powershell
cd ai-engine
python -m unittest discover -s tests -v
```

Tests force mock LLM mode so CI and local runs do not consume API quota.
