"""Coder Agent node for generating source code implementations."""

import logging
import re
from config.llm import FallbackLLM, invoke_with_retry, is_quota_error
from config.settings import settings
from graph.state import AgentState
from agents.utils import (
    add_log,
    get_agent_llm,
    llm_label,
    parse_multi_file_response,
    strip_code_fence,
)

logger = logging.getLogger(__name__)

MAX_SIBLING_CONTEXT_CHARS = 4000
HIGH_VALUE_LINE_PATTERN = re.compile(
    r"(id|className|class)\s*[=:]\s*['\"][^'\"]+['\"]|"
    r"(export\s+(default\s+)?(function|const|class|let|var))\s+\w+|"
    r"(import\s+.+?from\s+['\"][^'\"]+['\"])|"
    r"^(def|class)\s+\w+|"
    r"^(const|let|var)\s+\w+\s*[=:]",
    re.MULTILINE | re.IGNORECASE,
)

FORMAT_RETRY_PROMPT = """CRITICAL FORMAT REMINDER — You must prepend EVERY file with EXACTLY this header:

FILE: full/path/to/file.ext
```
<complete file content here>
```

Missing files you STILL need to write now: {missing_paths}

You already wrote these files (do NOT rewrite them): {already_written}

Write ONLY the missing files now, each prefixed with `FILE: path` on its own line and wrapped in a markdown code fence. No other commentary."""


CODER_PROMPT_TEMPLATE = """You are a Principal Software Engineer and Senior UI/UX Designer.
Write clean, modern, fully functional, highly interactive, and visually stunning code tailored SPECIFICALLY to the user's request for EVERY file listed below.

{qa_header}
User Request: "{user_prompt}"
Tech Stack: "{tech_stack}"
Files To Write: {file_paths}

CRITICAL REQUIREMENTS:
- PURPOSE-BUILT UI ARCHITECTURE:
  * Design the exact layout and user interface tailored directly to what the user requested:
    - For Games & Puzzles (e.g. Snake, Tic-Tac-Toe, Card games, Ludo): Create a dedicated game arena/canvas or interactive board, score/high-score HUD, start/pause/game-over screens, restart buttons, and keyboard/touch event handlers.
    - For Dashboards & Analytics: Build KPI cards, visual charts, searchable data tables, filter tabs, and real-time status badges.
    - For E-Commerce & Stores: Build product grids, category filtering, cart drawers with badges, and checkout modals.
    - For Utilities & Tools (e.g. timers, converters, calculators, note apps): Build custom interactive controls, immediate live feedback, and action buttons.
- STYLING & AESTHETICS:
  * In HTML files, ALWAYS include Tailwind CSS CDN in <head>:
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  * Design with modern aesthetics: clean surfaces, subtle borders, polished color accents, and responsive layout.
- COMPLETE FUNCTIONALITY:
  * NO TODOs, stubs, or empty handlers. Write 100% production-ready logic.
  * Implement complete, fully functional event handlers, animations, state transitions, or game loops.
  * DEFENSIVE JS: guard DOM lookups (`if (el) ...` or `el?.addEventListener`). Call `lucide.createIcons();` after rendering DOM nodes.
  * Synchronize IDs and class names between HTML and JavaScript files precisely.

FORMAT — EVERY file prefixed like this (no other text):
FILE: path/of/file.ext
```
<complete file content>
```
"""

SINGLE_FILE_PROMPT_TEMPLATE = """You are a Principal Software Engineer and Senior UI/UX Designer.
Write the COMPLETE, visually stunning, fully interactive content of ONE file tailored SPECIFICALLY to the user's request. Match all sibling file IDs/classes/imports exactly.

{qa_header}
User Request: "{user_prompt}"
Tech Stack: "{tech_stack}"
All Project Files: {file_paths}
File To Write: {file_path}

ALREADY-WRITTEN SIBLING FILES (use their exact IDs, classNames, function names, import paths):
{sibling_context}

CRITICAL RULES for {file_path}:
- 100% COMPLETE implemented code. No TODOs, stubs, or placeholders.
- If writing HTML:
  * In <head>, ALWAYS include Tailwind CSS CDN:
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  * Structure the layout appropriately for the requested application (e.g. game canvas/board for games, tool workspace for utilities, KPI/table for dashboards, product grid for shops).
- If writing JS:
  * Implement complete event handlers, game loops, or data flows matching the user prompt.
  * Call `lucide.createIcons();` after updating DOM elements. Guard every selector safely.
- If writing CSS: provide sleek glassmorphism effects, modern scrollbars, and keyframe animations.

Return ONLY the raw source code inside a SINGLE markdown code fence (```...```), no commentary.
"""


LOCAL_PROVIDERS = {"ollama"}


def one_call_per_file(llm: FallbackLLM) -> bool:
    """Whether this model should write one file per call instead of all files in one."""
    mode = settings.coder_file_mode.lower()
    if mode == "file":
        return True
    if mode == "batch":
        return False
    return llm.candidates[0][0] in LOCAL_PROVIDERS


def _format_sibling_context(written_so_far: dict[str, str]) -> tuple[str, int]:
    """Format already-written files into a compact context block, prioritizing high-value lines. Hard cap at MAX_SIBLING_CONTEXT_CHARS."""
    if not written_so_far:
        return "(no sibling files written yet)", 0

    blocks: list[str] = []
    total_chars = 0
    truncated_files: list[str] = []
    budget = MAX_SIBLING_CONTEXT_CHARS

    for path, content in written_so_far.items():
        if total_chars >= budget:
            truncated_files.append(path)
            continue
        lines = content.splitlines()
        kept: list[str] = []
        for idx, line in enumerate(lines):
            stripped = line.strip()
            if not stripped:
                continue
            is_hv = bool(HIGH_VALUE_LINE_PATTERN.search(line))
            is_near_top = idx < 12
            is_near_bottom = idx >= max(0, len(lines) - 5)
            if is_hv or is_near_top or is_near_bottom:
                kept.append(f"  L{idx+1}: {stripped[:160]}")
        snippet = "\n".join(kept) if kept else f"  (content: {len(lines)} lines)"
        header = f"--- SIBLING FILE: {path} ({len(lines)} lines, key lines shown) ---\n{snippet}"
        header_chars = len(header) + 1
        if total_chars + header_chars > budget:
            remaining = max(0, budget - total_chars - 40)
            if remaining > 80:
                header = header[:remaining] + "\n  ...[truncated]"
            else:
                truncated_files.append(path)
                continue
        blocks.append(header)
        total_chars += len(header) + 1

    if truncated_files:
        footer = f"\n--- ADDITIONAL SIBLINGS (names only, content omitted to fit budget): {', '.join(truncated_files)} ---"
        blocks.append(footer)

    return "\n".join(blocks), total_chars


def _generate_file_by_file(
    llm: FallbackLLM,
    file_paths: list[str],
    user_prompt: str,
    tech_stack: str,
    qa_header: str = "",
    call_budget_remaining: int = 50,
) -> tuple[dict[str, str], BaseException | None, int]:
    """One call per file. Injects CONTENTS of already-written files as sibling context for cross-file consistency."""
    generated: dict[str, str] = {}
    last_error: BaseException | None = None
    budget = call_budget_remaining

    for file_path in file_paths:
        if budget <= 0:
            logger.warning("Coder: call budget exhausted, skipping %s", file_path)
            break
        sibling_context, _ = _format_sibling_context(generated)
        try:
            raw = invoke_with_retry(
                llm,
                SINGLE_FILE_PROMPT_TEMPLATE.format(
                    qa_header=qa_header,
                    user_prompt=user_prompt,
                    tech_stack=tech_stack,
                    file_paths=file_paths,
                    file_path=file_path,
                    sibling_context=sibling_context,
                ),
            )
            budget -= 1
        except Exception as error:
            logger.warning("Coder Agent failed on %s: %s", file_path, error)
            last_error = error
            if is_quota_error(error):
                break
            continue


        parsed = parse_multi_file_response(raw, expected_paths=file_paths)
        content = parsed.get(file_path) or strip_code_fence(raw)
        if content:
            generated[file_path] = content

    return generated, last_error, budget


def _get_fallback_code(file_path: str, user_prompt: str) -> str:
    """Generate fully functional, modern Tailwind CSS application code when LLM output is partial or unconfigured."""
    title = user_prompt.title() or "Interactive Application"
    prompt_lower = user_prompt.lower()
    is_ecommerce = any(k in prompt_lower for k in ("ecommerce", "e-commerce", "store", "shop", "market", "product", "cart", "shopping"))
    is_dashboard = any(k in prompt_lower for k in ("dashboard", "analytics", "metrics", "admin", "crm", "finance", "stat"))
    is_todo = any(k in prompt_lower for k in ("todo", "to-do", "task", "list", "checklist", "kanban", "tracker"))

    if file_path.endswith(".html"):
        if is_ecommerce:
            return f"""<!DOCTYPE html>
<html lang="en" class="h-full bg-zinc-950">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body class="min-h-full bg-zinc-950 text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
    <!-- Sticky Navigation -->
    <header class="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
                    ⬡
                </div>
                <span class="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">{title}</span>
            </div>

            <div class="flex-1 max-w-md hidden md:block relative">
                <input type="text" id="searchInput" placeholder="Search products, tech, gear..."
                       class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition">
            </div>

            <div class="flex items-center gap-3">
                <button id="cartBtn" class="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium text-zinc-200 transition">
                    <i data-lucide="shopping-bag" class="w-4 h-4 text-indigo-400"></i>
                    <span>Cart</span>
                    <span id="cartCountBadge" class="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">0</span>
                </button>
            </div>
        </div>
    </header>

    <!-- Hero Banner -->
    <section class="relative overflow-hidden border-b border-zinc-800/60 bg-gradient-to-b from-indigo-950/20 via-zinc-950 to-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto text-center relative z-10">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
                ✨ Multi-Agent Engineered Storefront
            </span>
            <h1 class="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
                Premium Hardware & Studio Gear
            </h1>
            <p class="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400">
                Engineered for developers, designers, and creators. Instant dispatch with global warranty.
            </p>

            <!-- Category Pills -->
            <div id="categoryTabs" class="flex flex-wrap items-center justify-center gap-2 mt-8">
                <button data-category="all" class="category-pill active px-4 py-1.5 rounded-full text-xs font-medium bg-indigo-600 text-white transition">All Items</button>
                <button data-category="Audio" class="category-pill px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition">Audio</button>
                <button data-category="Wearables" class="category-pill px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition">Wearables</button>
                <button data-category="Workspace" class="category-pill px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition">Workspace</button>
            </div>
        </div>
    </section>

    <!-- Main Product Grid -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span>Featured Catalog</span>
                <span id="productCounter" class="text-xs font-normal text-zinc-500">(6 products)</span>
            </h2>
        </div>

        <div id="productGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
        <div id="emptyCatalog" class="hidden text-center py-16 text-zinc-500">No products match your filter.</div>
    </main>

    <!-- Cart Slide-Over Drawer -->
    <div id="cartModal" class="fixed inset-0 z-50 hidden">
        <div id="cartBackdrop" class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
        <div class="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div class="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col">
                <div class="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i data-lucide="shopping-bag" class="w-5 h-5 text-indigo-400"></i>
                        <h3 class="text-lg font-bold text-white">Your Shopping Cart</h3>
                    </div>
                    <button id="closeCartBtn" class="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <div id="cartItemsContainer" class="flex-1 overflow-y-auto p-6 space-y-4"></div>

                <div class="p-6 border-t border-zinc-800 bg-zinc-900/50 space-y-4">
                    <div class="flex items-center justify-between text-sm text-zinc-400">
                        <span>Subtotal</span>
                        <span id="cartSubtotal" class="text-white font-semibold">$0.00</span>
                    </div>
                    <div class="flex items-center justify-between text-sm text-zinc-400">
                        <span>Shipping (Standard)</span>
                        <span class="text-emerald-400 font-medium">Free</span>
                    </div>
                    <div class="flex items-center justify-between text-base text-white font-bold pt-2 border-t border-zinc-800">
                        <span>Total Due</span>
                        <span id="cartTotal" class="text-indigo-400 text-lg">$0.00</span>
                    </div>
                    <button id="checkoutBtn" class="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2">
                        <i data-lucide="lock" class="w-4 h-4"></i>
                        <span>Checkout with Instant Demo</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Alert Notification -->
    <div id="toast" class="fixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 transition-all duration-300 pointer-events-none bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
        <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400"></i>
        <span id="toastMsg" class="text-sm font-medium">Added to cart</span>
    </div>

    <!-- Footer -->
    <footer class="border-t border-zinc-800/80 bg-zinc-950 py-8 px-4 text-center text-xs text-zinc-500">
        <p>© 2026 {title}. Built autonomously with Multi-Agent AI Assistant.</p>
    </footer>

    <script src="app.js"></script>
</body>
</html>
"""
        elif is_dashboard:
            return f"""<!DOCTYPE html>
<html lang="en" class="h-full bg-zinc-950">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — Analytics & Operations</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body class="min-h-full bg-zinc-950 text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
    <!-- Top Navbar -->
    <header class="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-zinc-950">⚡</div>
                <h1 class="text-base font-bold text-white">{title}</h1>
                <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live v2.4</span>
            </div>
            <div class="flex items-center gap-3">
                <button id="refreshBtn" class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition">
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                    <span>Sync Metrics</span>
                </button>
            </div>
        </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <!-- 4 KPI Metrics -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
                <span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Volume</span>
                <div class="text-2xl font-bold text-white mt-2">$148,920.00</div>
                <div class="flex items-center gap-1 text-xs text-emerald-400 font-medium mt-2">
                    <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
                    <span>+18.4% vs last period</span>
                </div>
            </div>
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
                <span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Deployments</span>
                <div class="text-2xl font-bold text-white mt-2">1,284</div>
                <div class="flex items-center gap-1 text-xs text-emerald-400 font-medium mt-2">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    <span>99.98% uptime SLA</span>
                </div>
            </div>
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
                <span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Avg Latency</span>
                <div class="text-2xl font-bold text-white mt-2">34ms</div>
                <div class="flex items-center gap-1 text-xs text-indigo-400 font-medium mt-2">
                    <i data-lucide="zap" class="w-3.5 h-3.5"></i>
                    <span>Optimized routing</span>
                </div>
            </div>
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
                <span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Success Rate</span>
                <div class="text-2xl font-bold text-white mt-2">99.4%</div>
                <div class="flex items-center gap-1 text-xs text-emerald-400 font-medium mt-2">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                    <span>0 security alerts</span>
                </div>
            </div>
        </div>

        <!-- Recent Activity Table -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-base font-bold text-white">Live Transactions & Operations</h2>
                <input type="text" id="filterInput" placeholder="Filter records..." class="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500">
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="text-xs uppercase text-zinc-500 border-b border-zinc-800">
                        <tr>
                            <th class="py-3 px-4">Event ID</th>
                            <th class="py-3 px-4">Entity</th>
                            <th class="py-3 px-4">Status</th>
                            <th class="py-3 px-4">Amount</th>
                            <th class="py-3 px-4">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody" class="divide-y divide-zinc-800/60 text-zinc-300"></tbody>
                </table>
            </div>
        </div>
    </main>

    <script src="app.js"></script>
</body>
</html>
"""
        else:
            return f"""<!DOCTYPE html>
<html lang="en" class="h-full bg-zinc-950">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body class="min-h-full bg-zinc-950 text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
    <header class="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
        <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">✓</div>
                <h1 class="text-base font-bold text-white">{title}</h1>
            </div>
            <span id="taskCounter" class="text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">0 tasks</span>
        </div>
    </header>

    <main class="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        <form id="todoForm" class="flex gap-2">
            <input type="text" id="taskInput" placeholder="Add a new item or task..." required
                   class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition">
            <button type="submit" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition">Add</button>
        </form>

        <div class="flex gap-2 border-b border-zinc-800 pb-3">
            <button class="filter-btn active px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white" data-filter="all">All</button>
            <button class="filter-btn px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-400" data-filter="active">Active</button>
            <button class="filter-btn px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-400" data-filter="completed">Completed</button>
        </div>

        <ul id="taskList" class="space-y-3"></ul>
        <div id="emptyState" class="text-center py-12 text-zinc-500 text-sm">No items yet. Create one above!</div>
    </main>

    <script src="app.js"></script>
</body>
</html>
"""

    elif file_path.endswith(".css"):
        return """/* Custom Modern Polish Stylesheet */
@layer utilities {
    .glass-card {
        background: rgba(24, 24, 27, 0.7);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(63, 63, 70, 0.4);
    }
}

/* Custom Scrollbars */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: #09090b;
}
::-webkit-scrollbar-thumb {
    background: #27272a;
    border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
    background: #3f3f46;
}
"""

    elif file_path.endswith(".js"):
        if is_ecommerce:
            return """// Full E-Commerce Storefront Application State & Logic
const PRODUCTS = [
    {
        id: "prod-1",
        title: "Wireless ANC Studio Headphones",
        category: "Audio",
        price: 249.99,
        rating: 4.9,
        reviews: 128,
        badge: "Best Seller",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
        description: "Active noise cancellation with 40h battery life and spatial audio."
    },
    {
        id: "prod-2",
        title: "Smart Fitness Watch Ultra",
        category: "Wearables",
        price: 179.99,
        rating: 4.8,
        reviews: 94,
        badge: "New",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
        description: "Titanium casing, sapphire crystal display, and multi-day GPS tracking."
    },
    {
        id: "prod-3",
        title: "Custom Mechanical Keyboard 75%",
        category: "Workspace",
        price: 129.50,
        rating: 4.9,
        reviews: 210,
        badge: "Popular",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80",
        description: "Hot-swappable tactile switches with acoustic foam dampening."
    },
    {
        id: "prod-4",
        title: "Ergonomic Aluminum Laptop Stand",
        category: "Workspace",
        price: 59.00,
        rating: 4.7,
        reviews: 82,
        badge: null,
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80",
        description: "Precision CNC milled aluminum with adjustable dual-pivot elevation."
    },
    {
        id: "prod-5",
        title: "Waterproof Commuter Backpack",
        category: "Workspace",
        price: 189.00,
        rating: 4.8,
        reviews: 65,
        badge: "Limited",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80",
        description: "Weatherproof Cordura fabric with padded 16-inch laptop compartment."
    },
    {
        id: "prod-6",
        title: "Studio Broadcast Condenser Mic",
        category: "Audio",
        price: 149.00,
        rating: 4.9,
        reviews: 140,
        badge: "Top Rated",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80",
        description: "24-bit 192kHz USB-C microphone for crystal clear podcasting and vocals."
    }
];

let cart = JSON.parse(localStorage.getItem('apex_cart') || '[]');
let activeCategory = 'all';
let searchQuery = '';

function saveCart() {
    localStorage.setItem('apex_cart', JSON.stringify(cart));
    updateCartUI();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
}

function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    showToast(`Added "${product.title}" to cart!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
    }
}

function updateCartUI() {
    const badge = document.getElementById('cartCountBadge');
    const container = document.getElementById('cartItemsContainer');
    const subtotalEl = document.getElementById('cartSubtotal');
    const totalEl = document.getElementById('cartTotal');

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (badge) badge.textContent = totalCount;
    if (subtotalEl) subtotalEl.textContent = `$${totalPrice.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${totalPrice.toFixed(2)}`;

    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 text-zinc-500">
                <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto mb-3 opacity-40"></i>
                <p class="text-sm font-medium">Your cart is currently empty.</p>
            </div>
        `;
    } else {
        container.innerHTML = cart.map(item => `
            <div class="flex items-center gap-4 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                <img src="${item.image}" alt="${item.title}" class="w-16 h-16 rounded-lg object-cover bg-zinc-800">
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-semibold text-white truncate">${item.title}</h4>
                    <p class="text-xs text-indigo-400 font-bold mt-0.5">$${item.price.toFixed(2)}</p>
                    <div class="flex items-center gap-2 mt-2">
                        <button onclick="updateQuantity('${item.id}', -1)" class="w-6 h-6 rounded bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-bold">-</button>
                        <span class="text-xs font-semibold text-white px-1">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', 1)" class="w-6 h-6 rounded bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-bold">+</button>
                    </div>
                </div>
                <button onclick="removeFromCart('${item.id}')" class="text-zinc-500 hover:text-rose-400 p-2 transition">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');
    }
    if (window.lucide) window.lucide.createIcons();
}

function renderProducts() {
    const grid = document.getElementById('productGrid');
    const empty = document.getElementById('emptyCatalog');
    const counter = document.getElementById('productCounter');
    if (!grid) return;

    const filtered = PRODUCTS.filter(p => {
        const matchesCat = activeCategory === 'all' || p.category === activeCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    if (counter) counter.textContent = `(${filtered.length} products)`;

    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        return;
    }
    if (empty) empty.classList.add('hidden');

    grid.innerHTML = filtered.map(p => `
        <div class="group bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/5">
            <div class="relative h-52 overflow-hidden bg-zinc-800">
                <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                ${p.badge ? `<span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-md">${p.badge}</span>` : ''}
                <span class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-950/70 backdrop-blur-md text-zinc-300 border border-zinc-800">${p.category}</span>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <div class="flex items-center gap-1 text-amber-400 text-xs mb-1.5 font-medium">
                        <span>★ ${p.rating}</span>
                        <span class="text-zinc-500">(${p.reviews})</span>
                    </div>
                    <h3 class="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">${p.title}</h3>
                    <p class="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">${p.description}</p>
                </div>
                <div class="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800/60">
                    <span class="text-lg font-bold text-white">$${p.price.toFixed(2)}</span>
                    <button onclick="addToCart('${p.id}')" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 active:scale-95">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                        <span>Add to Cart</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const cartBtn = document.getElementById('cartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartModal = document.getElementById('cartModal');
    const cartBackdrop = document.getElementById('cartBackdrop');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const categoryTabs = document.querySelectorAll('.category-pill');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => {
                t.classList.remove('bg-indigo-600', 'text-white');
                t.classList.add('bg-zinc-900', 'text-zinc-400');
            });
            tab.classList.remove('bg-zinc-900', 'text-zinc-400');
            tab.classList.add('bg-indigo-600', 'text-white');
            activeCategory = tab.dataset.category;
            renderProducts();
        });
    });

    function toggleCart(open) {
        if (!cartModal) return;
        if (open) {
            cartModal.classList.remove('hidden');
        } else {
            cartModal.classList.add('hidden');
        }
    }

    if (cartBtn) cartBtn.addEventListener('click', () => toggleCart(true));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
    if (cartBackdrop) cartBackdrop.addEventListener('click', () => toggleCart(false));

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Your cart is empty.');
                return;
            }
            showToast('Order confirmed! Processing fulfillment…');
            cart = [];
            saveCart();
            toggleCart(false);
        });
    }

    renderProducts();
    updateCartUI();
    if (window.lucide) window.lucide.createIcons();
});
"""
        elif is_dashboard:
            return """// Analytics Dashboard Logic & Transactions Mock Table
const TRANSACTIONS = [
    { id: "TX-9021", entity: "Acme Corp Cloud", status: "Completed", amount: "$3,400.00", date: "2 mins ago" },
    { id: "TX-9020", entity: "Starlight SaaS", status: "Completed", amount: "$1,290.00", date: "15 mins ago" },
    { id: "TX-9019", entity: "DevStudio Pro", status: "Processing", amount: "$890.00", date: "1 hour ago" },
    { id: "TX-9018", entity: "Veloce API Tier", status: "Completed", amount: "$4,500.00", date: "3 hours ago" },
    { id: "TX-9017", entity: "HyperScale Compute", status: "Failed", amount: "$220.00", date: "6 hours ago" }
];

function renderTable(filter = '') {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    const filtered = TRANSACTIONS.filter(t => t.entity.toLowerCase().includes(filter.toLowerCase()) || t.id.toLowerCase().includes(filter.toLowerCase()));
    tbody.innerHTML = filtered.map(t => {
        const badgeColor = t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                           t.status === 'Processing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                           'bg-rose-500/10 text-rose-400 border-rose-500/20';
        return `
            <tr class="hover:bg-zinc-800/40 transition">
                <td class="py-3.5 px-4 font-mono text-xs text-indigo-400">${t.id}</td>
                <td class="py-3.5 px-4 font-medium text-white">${t.entity}</td>
                <td class="py-3.5 px-4"><span class="px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}">${t.status}</span></td>
                <td class="py-3.5 px-4 font-bold text-white">${t.amount}</td>
                <td class="py-3.5 px-4 text-xs text-zinc-500">${t.date}</td>
            </tr>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    const filterInput = document.getElementById('filterInput');
    if (filterInput) {
        filterInput.addEventListener('input', (e) => renderTable(e.target.value));
    }
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            renderTable();
            alert('Live metrics synchronized.');
        });
    }
    if (window.lucide) window.lucide.createIcons();
});
"""
        else:
            return """// Interactive Task App Logic
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('todoForm');
    const input = document.getElementById('taskInput');
    const list = document.getElementById('taskList');
    const counter = document.getElementById('taskCounter');
    const empty = document.getElementById('emptyState');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let tasks = JSON.parse(localStorage.getItem('app_tasks_v2') || '[{"id":"1","text":"Explore AI Assistant Architecture","completed":false},{"id":"2","text":"Deploy generated project with Tailwind CSS","completed":true}]');
    let filter = 'all';

    function save() {
        localStorage.setItem('app_tasks_v2', JSON.stringify(tasks));
        render();
    }

    function render() {
        if (!list) return;
        const filtered = tasks.filter(t => filter === 'all' ? true : filter === 'completed' ? t.completed : !t.completed);
        list.innerHTML = '';
        if (filtered.length === 0) {
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
        }

        filtered.forEach(t => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 transition hover:border-zinc-700';
            li.innerHTML = `
                <div class="flex items-center gap-3 flex-1 cursor-pointer">
                    <input type="checkbox" ${t.completed ? 'checked' : ''} class="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-indigo-500">
                    <span class="text-sm ${t.completed ? 'line-through text-zinc-500' : 'text-zinc-200'} font-medium">${t.text}</span>
                </div>
                <button class="text-zinc-500 hover:text-rose-400 p-1 transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            `;
            const checkbox = li.querySelector('input');
            const delBtn = li.querySelector('button');
            checkbox.addEventListener('change', () => {
                t.completed = checkbox.checked;
                save();
            });
            delBtn.addEventListener('click', () => {
                tasks = tasks.filter(item => item.id !== t.id);
                save();
            });
            list.appendChild(li);
        });

        if (counter) {
            const activeCount = tasks.filter(t => !t.completed).length;
            counter.textContent = `${activeCount} task${activeCount === 1 ? '' : 's'} remaining`;
        }
        if (window.lucide) window.lucide.createIcons();
    }

    if (form && input) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (input.value.trim()) {
                tasks.unshift({ id: Date.now().toString(), text: input.value.trim(), completed: false });
                input.value = '';
                save();
            }
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('bg-indigo-600', 'text-white');
                b.classList.add('bg-zinc-900', 'text-zinc-400');
            });
            btn.classList.remove('bg-zinc-900', 'text-zinc-400');
            btn.classList.add('bg-indigo-600', 'text-white');
            filter = btn.dataset.filter;
            render();
        });
    });

    render();
});
"""

    else:
        return f"// Source file: {file_path}\n// Generated for: {user_prompt}\n"



def coder_agent(state: AgentState) -> dict:
    """Executes code generation. Sibling content injected, 3-pass parse recovery, 1 format-retry on missed files."""
    logs = add_log(state.get("logs", []), "CoderAgent", "started", "Generating source code for project files...")

    user_prompt = state.get("user_prompt", "")
    tech_stack = state.get("tech_stack", "HTML/CSS/JS")
    architecture = state.get("architecture", {})
    file_paths = architecture.get("file_paths", ["index.html", "styles.css", "app.js"])

    qa_fix_instructions = state.get("qa_fix_instructions") or ""
    if qa_fix_instructions:
        qa_header = f"=== PREVIOUS QA ISSUES TO FIX IN THIS GENERATION ===\n{qa_fix_instructions}\n=== END QA FEEDBACK ===\n\n"
    else:
        qa_header = ""

    llm = get_agent_llm(state, temperature=0.2, role="coder")

    if llm is None:
        generated_files = {path: _get_fallback_code(path, user_prompt) for path in file_paths}
        logs = add_log(
            logs,
            "CoderAgent",
            "completed",
            f"Generated code for {len(generated_files)} files via mock templates.",
        )
        return {"files": generated_files, "logs": logs, "current_step": "coded"}

    per_file = one_call_per_file(llm)
    call_budget = max(3, len(file_paths) + 4)

    if per_file:
        generated_files, error, budget_left = _generate_file_by_file(
            llm, file_paths, user_prompt, tech_stack, qa_header, call_budget
        )
        if not generated_files and error is not None:
            logger.error(f"Coder Agent error: {error}")
            status = "quota_exceeded" if is_quota_error(error) else "error"
            logs = add_log(logs, "CoderAgent", status, f"Code generation failed: {error}")
            return {"error": str(error), "logs": logs, "current_step": "coding_failed"}
    else:
        try:
            raw = invoke_with_retry(
                llm,
                CODER_PROMPT_TEMPLATE.format(
                    qa_header=qa_header,
                    user_prompt=user_prompt,
                    tech_stack=tech_stack,
                    file_paths=file_paths,
                ),
            )
        except Exception as e:
            logger.error(f"Coder Agent error: {e}")
            status = "quota_exceeded" if is_quota_error(e) else "error"
            logs = add_log(logs, "CoderAgent", status, f"Code generation failed: {e}")
            return {"error": str(e), "logs": logs, "current_step": "coding_failed"}

        generated_files = parse_multi_file_response(raw, expected_paths=file_paths)
        budget_left = call_budget - 1

    missing = [path for path in file_paths if path not in generated_files]

    if missing and 0 < len(missing) < len(file_paths) and budget_left >= 2:
        already = sorted(generated_files.keys())
        try:
            retry_prompt = FORMAT_RETRY_PROMPT.format(
                missing_paths=missing,
                already_written=already,
            )
            raw2 = invoke_with_retry(llm, retry_prompt)
            budget_left -= 1
            recovered = parse_multi_file_response(raw2, expected_paths=file_paths)
            for path, content in recovered.items():
                if path not in generated_files:
                    generated_files[path] = content
            still_missing = [p for p in file_paths if p not in generated_files]
            if still_missing != missing:
                logs = add_log(
                    logs,
                    "CoderAgent",
                    "info",
                    f"Format-retry recovered {len(missing) - len(still_missing)} file(s). Still missing: {still_missing or 'none'}.",
                )
                missing = still_missing
        except Exception as retry_err:
            logger.warning("Format-retry failed: %s", retry_err)

    for path in missing:
        generated_files[path] = _get_fallback_code(path, user_prompt)

    strategy = f"{len(file_paths)} calls" if per_file else "one call"
    message = (
        f"Generated code for {len(generated_files)} files in {strategy} "
        f"via {llm_label(llm, state)}."
    )
    if missing:
        message += f" Used deterministic templates for {len(missing)} file(s): {', '.join(missing)}."

    logs = add_log(logs, "CoderAgent", "warning" if missing else "completed", message)
    return {
        "files": generated_files,
        "logs": logs,
        "current_step": "coded",
    }
