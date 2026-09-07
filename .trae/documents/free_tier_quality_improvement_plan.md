# Free-Tier Optimized Generation Quality — Implementation Plan

## Repository Research

### Current State (verified 2026-09-04)
- **Project**: Multi-Agent AI Software Engineering Assistant (Phase 5 — Iterative Refinement)
- **Tests**: Backend 8/8 pass, Frontend lint/build pass, AI Engine 51/64 pass (10 fails + 3 errors due to newly added `deepseek` in PROVIDER_ORDER not reflected in test assertions)
- **Configured providers** (`.env`): DeepSeek (key set, position 0 in PROVIDER_ORDER), Groq, Gemini, OpenRouter. Ollama enabled=true, OpenAI empty
- **Per-agent routing** (`.env`): Planner=Groq, Coder=Groq, Architect/Backend/Frontend/Tester=DeepSeek
- **Core problem**: Agent pipeline produces only trivial 3-file vanilla HTML/CSS/JS apps even when user asks for complex projects. 6 root causes identified:
  1. `_detect_project_type()` keyword heuristic defaults to "web" (3 files) on any prompt without explicit framework keywords
  2. `_generate_file_by_file()` passes only sibling file **names**, never **contents** → IDs/classes/functions never match across files
  3. 0 regex matches on FILE: markers → silent hardcoded fallback HTML replaces all files
  4. QA agent only does static bracket-balance/empty checks; no LLM review; retries coder with **same prompt** (no fix-instructions injected)
  5. Tester writes test files but **never runs them**; no VALIDATOR node in graph before END
  6. Planner/Architect produce sparse design_notes; no scaffold/bootstrap working boilerplate loaded as base

### Free-Tier API Constraints (drives all design choices)
- **Gemini free**: ~20 req/day, 15 RPM hard cap → use only as tertiary fallback for non-critical agents
- **Groq free**: generous RPM (~30) + TPM (~14k) → default for Planner + Coder (heavy tokens)
- **OpenRouter free**: rate-limited deepseek-v3.1:free → secondary coder fallback
- **DeepSeek direct**: currently key set but **free tier unknown / future paid** → reserved for Architect/Backend/Frontend specialists (light calls), NOT the default coder
- **Ollama local**: unlimited but slow → offline fallback, auto-detect
- **Token efficiency mandate**: every agent prompt must be minimal; cache repeated identical calls; use keyword heuristics BEFORE burning LLM tokens; use smaller/cheaper model profiles for simple tasks

## Files and Modules

| File | Expected Change |
|------|-----------------|
| `ai-engine/tests/test_llm_providers.py` | Add `deepseek_api_key` to `NO_PROVIDERS` dict, add deepseek to ALL_PROVIDERS, update candidate ordering assertions |
| `ai-engine/tests/test_llm_routing.py` | Add `deepseek_api_key: None` to `TWO_PROVIDERS` and `NO_PROVIDERS`, update set expectations |
| `ai-engine/agents/planner_agent.py` | P1.1 — expanded archetype taxonomy (12 types), 2-phase detection: keyword-heuristic FIRST (no tokens), LLM-classify only if ambiguous. Token-efficient classifier prompt. Free-tier: heuristic runs first, LLM classify only saves tokens on coder side by generating correct file count |
| `ai-engine/agents/architecture_agent.py` | P1.1 — expanded DEFAULT_LAYOUTS for 12 new archetypes; MAX_FILES 16→24; layout selection uses archetype not project_type |
| `ai-engine/agents/coder_agent.py` | P1.2 — sibling file CONTENT injection into `SINGLE_FILE_PROMPT_TEMPLATE` (files written so far, truncated to 4k chars total); P1.3 — retry on FILE: parse failure with verbose format reminder + context of already-parsed files |
| `ai-engine/agents/utils.py` | P1.3 — add fuzzy parse recovery pass: code-fence header guessing, back-tick block splitting, path-like string detection. Parse multi-file from code-fence language hints + newline heuristics when FILE marker regex gets 0 matches |
| `ai-engine/agents/qa_agent.py` | P2.1 — OPTIONAL LLM review (configurable, DISABLED by default for free-tier). When enabled, injects specific fix-instructions + failing issue list into retry prompt instead of blank retry |
| `ai-engine/graph/builder.py` | P2.1 — pass `review_results["issues"]` list into coder retry state as `qa_feedback` field so coder prompt includes fix instructions. MAX_CODER_RETRIES 1→2 |
| `ai-engine/config/llm.py` | Free-tier optimizations: add `TOKEN_BUDGET_PER_GENERATION` setting, prompt-cache decorator for identical prompts within same session, provider cost-tier annotation (cheap/standard/premium), smart model demotion on low budget |
| `ai-engine/config/settings.py` | Add settings: `ENABLE_LLM_QA_REVIEW=false`, `TOKEN_BUDGET_PER_GENERATION_K=25`, `ENABLE_PROMPT_CACHE=true`, `DEEPSEEK_PAID_TIER=false` (when true, promotes deepseek to coder primary) |

## Implementation Steps (dependency-ordered)

### Step 0 — Fix 13 failing AI-engine tests (blocking)
1. In `test_llm_providers.py`:
   - Add `"deepseek_api_key": None,` to `NO_PROVIDERS` dict (L39-45)
   - Add `"deepseek_api_key": "ds-key",` + model/fallback fields to `ALL_PROVIDERS` dict (L21-37)
   - Update `test_free_providers_precede_paid_openai` expected list: add `"deepseek"` at position 0, correct full list: `["deepseek", "gemini", "groq", "groq", "openrouter", "ollama", "openai"]`
   - Update `test_requested_provider_is_tried_first`: after 2 groq candidates, next should be deepseek not gemini (L109)
   - Update `test_status_reports_fallback_when_another_provider_can_serve` — with only groq key set, `available_providers` should still be `["groq"]` **iff NO_PROVIDERS includes deepseek_api_key=None**
2. In `test_llm_routing.py`:
   - Add `"deepseek_api_key": None,` to `TWO_PROVIDERS` and `NO_PROVIDERS`
   - Update `test_routing_still_falls_back_to_the_rest_of_the_chain` set assertion: `{"deepseek","gemini","groq"}` with key none → `{"gemini","groq"}` still

### Step 1.1 — Expanded archetype taxonomy + 2-phase detection (no extra tokens for 80% of prompts)
1. In `planner_agent.py`:
   - Add `_ARCHETYPE_DEFS` dict mapping 12 archetypes → (keyword_sets, tech_stack, default_file_count)
     Archetypes: `vanilla-web`, `react-spa`, `react-vite-spa`, `nextjs-app`, `vue-spa`, `node-express-api`, `node-express-mvc`, `python-fastapi`, `python-flask`, `django-app`, `fullstack-react-node`, `fullstack-react-python`, `cli-tool`, `data-script`
   - Rewrite `_detect_project_type(prompt)` → `_detect_archetype(prompt)` returning tuple `(archetype_id, confidence 0-1.0, project_type)`
   - Planner agent: run `_detect_archetype()` FIRST (0 tokens). If confidence ≥ 0.7, skip LLM-classify entirely and auto-set project_type, file_paths, tech_stack. Only call LLM planner when confidence < 0.7 OR user prompt > 200 chars ambiguous
   - Trim `PLANNER_PROMPT_TEMPLATE` by ~30%: remove redundant rules, use compact JSON schema (currently 57 lines → target 35 lines). Remove duplicate bullet-point instructions.
2. In `architecture_agent.py`:
   - Replace 5-entry `DEFAULT_LAYOUTS` with 14-archetype version. E.g. `python-fastapi` → `["main.py", "routers/items.py", "models/item.py", "schemas/item.py", "requirements.txt", ".env.example"]` (6 files not 2)
   - `MAX_FILES` 16 → 24 (accommodate archetype expansions)
   - Trim `ARCHITECT_PROMPT_TEMPLATE` 15% (compact rules section)

### Step 1.2 — Context accumulator: sibling file CONTENT injection (key for cross-file consistency)
1. In `coder_agent.py`:
   - Rewrite `_generate_file_by_file()` to maintain `context_so_far: dict[str, str]` of already-successfully-parsed files
   - Before each iteration, format `SIBLING_CONTEXT` block: for each written file, show `--- FILE: path (first N chars truncated) ---` + content snippet. Total sibling context cap at **4000 chars** (fits within free-tier TPM)
   - Update `SINGLE_FILE_PROMPT_TEMPLATE` to include new `{sibling_context}` parameter. Add explicit rule: "Use the exact IDs/classNames/imports/exports from sibling files below"
   - Update `CODER_PROMPT_TEMPLATE` (batch mode) to require cross-reference comment block

### Step 1.3 — Fuzzy parse recovery + FILE marker retry (no more silent HTML fallback)
1. In `agents/utils.py`:
   - Add `_fuzzy_parse_multi_file(text: str, expected_paths: list[str]) -> Dict[str, str]` function:
     - Pass 1: existing FILE_MARKER_PATTERN regex (strict)
     - Pass 2 (if 0 matches or <50% of expected_paths found): find ALL markdown code fences ```...```, pair each fence with nearest path-like string before it (file extension matching: .py/.js/.jsx/.html/.css/.ts/.tsx/.json/.md)
     - Pass 3: split by path-like regex `[\w\-./]+\.(py|js|jsx|html|css|ts|tsx|json)[\s:]*` + grab content until next match or EOF
     - Final pass: match recovered keys against `expected_paths` by basename fuzzy match (levenshtein ≤ 3)
   - Update `parse_multi_file_response()` to accept optional `expected_paths` param and run all 3 passes
2. In `coder_agent.py`:
   - Pass `expected_paths=file_paths` to all `parse_multi_file_response()` calls
   - After initial parse, compute `missed = [p for p in file_paths if p not in generated]`
   - If len(missed) > 0 AND len(missed) < len(file_paths): retry ONE extra LLM call for ONLY the missed files with a FORMAT-REMINDER prompt: "CRITICAL: You MUST prefix each file with exactly `FILE: path/name.ext` on its own line, followed by a markdown code fence." This costs 1 extra call but saves entire generation from degradation.
   - **Free-tier guard**: skip retry if this generation already used > `TOKEN_BUDGET_PER_GENERATION_K` calls (use counter in state)

### Step 2.1 (optional, gated behind config flag) — QA fix-instruction injection + MAX_RETRIES bump
1. In `qa_agent.py`:
   - Add `_build_fix_instructions(issues: list[str], files: dict[str, str]) -> str` helper: concatenate each issue with its file path and a 1-line code snippet from the file showing the problematic area
   - When `ENABLE_LLM_QA_REVIEW=true` (settings flag, DEFAULT FALSE for free-tier): run a compact LLM review prompt (~500 chars) on files with issues; else keep the existing static-only checks
   - Return new field `fix_instructions` in review_results dict
2. In `graph/builder.py`:
   - Add `qa_fix_instructions` to state (pass through conditional edge)
   - `MAX_CODER_RETRIES`: 1 → 2
3. In `coder_agent.py`:
   - When `state.get("qa_fix_instructions")` exists: prepend it to the user_prompt with a clear header `=== PREVIOUS QA ISSUES TO FIX ===`

### Step 2.2 — Free-tier LLM infra: prompt cache + budget guardrails
1. In `config/settings.py`:
   - Add: `enable_llm_qa_review: bool = False`, `token_budget_per_generation_k: int = 25`, `enable_prompt_cache: bool = True`, `deepseek_paid_tier: bool = False`
2. In `config/llm.py`:
   - Add in-memory LRU prompt cache (`@lru_cache(maxsize=64)`) on `invoke_with_retry()` keyed by (normalized_prompt, provider+model). Wrapped inside `FallbackLLM.invoke`: normalize prompt (strip extra whitespace) before call, check cache first
   - Add `PROVIDER_COST_TIER = {"ollama": "free_local", "groq": "cheap", "gemini": "standard_daily_cap", "openrouter": "standard", "deepseek": "premium_future_paid", "openai": "premium"}`
   - In `get_model_candidates()`: when `deepseek_paid_tier=false`, demote deepseek from position 0 → position 3 for coder/planner roles (keep Groq primary, Gemini secondary, OpenRouter tertiary, then DeepSeek). Architect roles can keep DeepSeek since they make only 1 call.
   - Budget counter: add to FallbackLLM a mutable call counter. After N calls, log warning and prefer local/free providers.

## Dependencies and Considerations
- **No new PyPI dependencies**: all changes use stdlib (`functools.lru_cache`, `re`, `difflib` for fuzzy match)
- **Backward compatible**: new settings default to safe/free-tier values; no existing .env needs updating
- **Deterministic tests must not break**: keyword heuristic is deterministic; LLM paths already mocked in test_agents_deterministic.py
- **Fuzzy parse recovery must NEVER return empty when strict regex returned something**: only supplement, never replace
- **DeepSeek future-proofing**: `DEEPSEEK_PAID_TIER=true` env flag flips the cost tier and promotes it to coder primary — single-line change for user when they purchase

## Validation
1. **AI engine tests**: re-run `cd ai-engine ; python -m unittest discover -s tests -v` from repo root. Target: 64/64 pass (was 51/64)
2. **Smoke test without LLM (mock mode)**: set all API keys blank, run generation via API curl with "fullstack react todo app with Node backend" prompt → verify file_paths count ≥ 8 not 3
3. **Cross-file consistency check**: take generated index.html + styles.css + app.js from a mock-templated run, grep for `id=` in HTML, verify each ID appears in both CSS and JS as selector
4. **Parse recovery**: feed `parse_multi_file_response()` a malformed response (no FILE markers, only code fences with lang hints, expected_paths provided) → verify ≥ 80% of files recovered
5. **Token efficiency**: count prompt chars before/after Step 1.1 — planner template: 57 lines → ≤ 40 lines, architect template: 53 lines → ≤ 45 lines
6. **Lint/build unchanged**: `cd frontend ; npm run lint` → 0 errors, `cd backend ; npm test` → 8/8 pass

## Risks
- **Fuzzy parse false positives**: code fence paired with wrong path. Mitigation: fuzzy levenshtein match to expected_paths only, never invent paths not in the list
- **Sibling context truncation**: 4k chars too small for large projects. Mitigation: truncation strategy prioritizes imports/export lines and DOM id/class lines via regex before cutting; add header comment listing truncated files
- **Cache staleness**: same prompt produces stale output in same session. Mitigation: LRU maxsize=64 evicts oldest; add `?v=` suffix seed to cache key if user explicitly re-generates
- **Heuristic misclassification**: keyword-only classifier mistakes "I want a dashboard with react-like component" for vanilla-web because "react" wasn't exact. Mitigation: confidence score < 0.7 ALWAYS falls through to LLM planner (current behavior)
