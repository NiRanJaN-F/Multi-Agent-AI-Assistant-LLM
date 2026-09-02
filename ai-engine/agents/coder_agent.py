"""Coder Agent node for generating source code implementations."""

import logging
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

CODER_PROMPT_TEMPLATE = """You are a Principal Software Engineer.
Write clean, modern, fully functional, interactive code for EVERY file listed below in a single response.

User Request: "{user_prompt}"
Tech Stack: "{tech_stack}"
Files To Write: {file_paths}

CRITICAL FUNCTIONALITY REQUIREMENTS:
- Write COMPLETE, fully working production code. Do NOT use TODO comments, placeholders, or empty event handlers.
- For HTML: build complete DOM elements (inputs, buttons, containers, forms, headers) matching the app requirements.
- For JavaScript: attach real event listeners (form submit, button click, input keyup), manipulate DOM nodes dynamically, handle task creation, completion toggles, deletion, state array management, and localStorage persistence.
- For CSS: provide complete responsive styling, flexbox/grid layout, hover effects, and clean UI design.
- Element IDs and classes MUST match exactly across index.html, styles.css, and app.js.

Format the response exactly like this, once per file and nothing else:

FILE: path/of/file
```
<complete file content>
```
"""

SINGLE_FILE_PROMPT_TEMPLATE = """You are a Principal Software Engineer.
Write the complete, fully functional content of ONE file for a web project.

User Request: "{user_prompt}"
Tech Stack: "{tech_stack}"
All Files In The Project: {file_paths}
File To Write Now: {file_path}

CRITICAL FUNCTIONALITY REQUIREMENTS:
- Write 100% COMPLETE, fully implemented code for {file_path}.
- Do NOT output placeholders, TODOs, or mock stubs.
- Keep element IDs, class names, function signatures, and file references perfectly aligned with the other project files.
- If writing HTML: include all interactive forms, inputs, buttons, and containers required by the prompt.
- If writing JavaScript: implement complete event handling (click, submit, change), dynamic DOM node creation/deletion, state updating, and localStorage persistence.
- If writing CSS: provide clean modern layout, responsive styles, and component styling.

Return ONLY the complete raw source code of {file_path} inside a single code fence, with no commentary.
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


def _generate_file_by_file(
    llm: FallbackLLM,
    file_paths: list[str],
    user_prompt: str,
    tech_stack: str,
) -> tuple[dict[str, str], BaseException | None]:
    """One call per file, so a weak model only has to hold one file's format at a time."""
    generated: dict[str, str] = {}
    last_error: BaseException | None = None

    for file_path in file_paths:
        try:
            raw = invoke_with_retry(
                llm,
                SINGLE_FILE_PROMPT_TEMPLATE.format(
                    user_prompt=user_prompt,
                    tech_stack=tech_stack,
                    file_paths=file_paths,
                    file_path=file_path,
                ),
            )
        except Exception as error:
            logger.warning("Coder Agent failed on %s: %s", file_path, error)
            last_error = error
            continue

        content = parse_multi_file_response(raw).get(file_path) or strip_code_fence(raw)
        if content:
            generated[file_path] = content

    return generated, last_error


def _get_fallback_code(file_path: str, user_prompt: str) -> str:
    """Generate fully functional interactive application code when LLM output is partial or unconfigured."""
    title = user_prompt.title() or "Interactive Application"
    is_todo = any(k in user_prompt.lower() for k in ("todo", "to-do", "task", "list", "checklist"))

    if file_path.endswith(".html"):
        if is_todo:
            return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>{title}</h1>
            <p class="subtitle">Multi-Agent AI Generated Workspace</p>
        </header>
        <main class="card">
            <form id="todoForm" class="input-group">
                <input type="text" id="taskInput" placeholder="Enter a new task..." required autocomplete="off">
                <button type="submit" id="addBtn" class="btn primary">Add Task</button>
            </form>
            <div class="controls">
                <span id="taskCounter">0 tasks remaining</span>
                <div class="filters">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="active">Active</button>
                    <button class="filter-btn" data-filter="completed">Completed</button>
                </div>
            </div>
            <ul id="taskList" class="task-list"></ul>
            <div id="emptyState" class="empty-state">No tasks yet. Add one above!</div>
        </main>
    </div>
    <script src="app.js"></script>
</body>
</html>
"""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>{title}</h1>
            <p class="subtitle">Multi-Agent AI Software Engineering Assistant</p>
        </header>
        <main class="card">
            <h2>Interactive Application Workspace</h2>
            <form id="mainForm" class="input-group">
                <input type="text" id="itemInput" placeholder="Enter input or item name..." required>
                <button type="submit" class="btn primary">Submit</button>
            </form>
            <ul id="itemList" class="task-list"></ul>
            <div id="statusOutput" class="output-box">Ready...</div>
        </main>
    </div>
    <script src="app.js"></script>
</body>
</html>
"""

    elif file_path.endswith(".css"):
        return """* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: #0f172a;
    color: #f8fafc;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 3rem 1.5rem;
}

.container {
    max-width: 650px;
    width: 100%;
}

header {
    text-align: center;
    margin-bottom: 2rem;
}

header h1 {
    font-size: 2.25rem;
    color: #38bdf8;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: #94a3b8;
    font-size: 0.95rem;
}

.card {
    background: #1e293b;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    border: 1px solid #334155;
}

.input-group {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.input-group input {
    flex: 1;
    background: #0f172a;
    border: 1px solid #334155;
    color: #f8fafc;
    padding: 0.85rem 1.2rem;
    border-radius: 10px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s ease;
}

.input-group input:focus {
    border-color: #38bdf8;
}

.btn {
    padding: 0.85rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn.primary {
    background: #3b82f6;
    color: #ffffff;
}

.btn.primary:hover {
    background: #2563eb;
}

.controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    color: #94a3b8;
    font-size: 0.9rem;
}

.filters {
    display: flex;
    gap: 0.4rem;
}

.filter-btn {
    background: transparent;
    border: 1px solid #334155;
    color: #94a3b8;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
}

.filter-btn.active {
    background: #38bdf8;
    color: #0f172a;
    border-color: #38bdf8;
    font-weight: 600;
}

.task-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.task-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0f172a;
    padding: 0.9rem 1.2rem;
    border-radius: 10px;
    border: 1px solid #334155;
    transition: transform 0.15s ease;
}

.task-item.completed span {
    text-decoration: line-through;
    color: #64748b;
}

.task-content {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;
    flex: 1;
}

.delete-btn {
    background: #ef4444;
    color: #fff;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
}

.delete-btn:hover {
    background: #dc2626;
}

.empty-state {
    text-align: center;
    color: #64748b;
    padding: 2rem 1rem;
    font-style: italic;
}

.output-box {
    margin-top: 1rem;
    padding: 1rem;
    background: #0f172a;
    border-radius: 8px;
    border: 1px solid #334155;
    font-family: monospace;
    color: #38bdf8;
}
"""

    elif file_path.endswith(".js"):
        if is_todo:
            return """// Interactive Todo List Application Logic
document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todoForm');
    const taskInput = document.getElementById('taskInput');
    const taskList = document.getElementById('taskList');
    const taskCounter = document.getElementById('taskCounter');
    const emptyState = document.getElementById('emptyState');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let tasks = JSON.parse(localStorage.getItem('app_tasks') || '[]');
    let currentFilter = 'all';

    function saveTasks() {
        localStorage.setItem('app_tasks', JSON.stringify(tasks));
        render();
    }

    function render() {
        taskList.innerHTML = '';
        const filtered = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }

        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            const content = document.createElement('div');
            content.className = 'task-content';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleTask(task.id));

            const text = document.createElement('span');
            text.textContent = task.text;
            content.appendChild(checkbox);
            content.appendChild(text);

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = 'Delete';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            li.appendChild(content);
            li.appendChild(delBtn);
            taskList.appendChild(li);
        });

        const activeCount = tasks.filter(t => !t.completed).length;
        taskCounter.textContent = `${activeCount} task${activeCount === 1 ? '' : 's'} remaining`;
    }

    function addTask(text) {
        if (!text.trim()) return;
        tasks.push({ id: Date.now().toString(), text: text.trim(), completed: false });
        saveTasks();
    }

    function toggleTask(id) {
        tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        saveTasks();
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
    }

    if (todoForm && taskInput) {
        todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addTask(taskInput.value);
            taskInput.value = '';
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    render();
});
"""
        return f"""// Generated application logic for {user_prompt}
document.addEventListener('DOMContentLoaded', () => {{
    const form = document.getElementById('mainForm');
    const input = document.getElementById('itemInput');
    const list = document.getElementById('itemList');
    const status = document.getElementById('statusOutput');

    let items = JSON.parse(localStorage.getItem('app_items') || '[]');

    function save() {{
        localStorage.setItem('app_items', JSON.stringify(items));
        render();
    }}

    function render() {{
        if (!list) return;
        list.innerHTML = '';
        items.forEach((item, index) => {{
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `<span>${{item}}</span>`;
            
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = 'Remove';
            delBtn.onclick = () => {{
                items.splice(index, 1);
                save();
            }};
            li.appendChild(delBtn);
            list.appendChild(li);
        }});

        if (status) {{
            status.textContent = `Total active items: ${{items.length}}`;
        }}
    }}

    if (form && input) {{
        form.addEventListener('submit', (e) => {{
            e.preventDefault();
            if (input.value.trim()) {{
                items.push(input.value.trim());
                input.value = '';
                save();
            }}
        }});
    }}

    render();
}});
"""

    else:
        return f"// Source file: {file_path}\n// Generated for: {user_prompt}\n"


def coder_agent(state: AgentState) -> dict:
    """Executes code generation for all planned files."""
    logs = add_log(state.get("logs", []), "CoderAgent", "started", "Generating source code for project files...")

    user_prompt = state.get("user_prompt", "")
    tech_stack = state.get("tech_stack", "HTML/CSS/JS")
    architecture = state.get("architecture", {})
    file_paths = architecture.get("file_paths", ["index.html", "styles.css", "app.js"])

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

    if per_file:
        generated_files, error = _generate_file_by_file(llm, file_paths, user_prompt, tech_stack)
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

        generated_files = parse_multi_file_response(raw)

    missing = [path for path in file_paths if path not in generated_files]

    for path in missing:
        generated_files[path] = _get_fallback_code(path, user_prompt)

    strategy = f"{len(file_paths)} calls" if per_file else "one call"
    message = (
        f"Generated code for {len(generated_files)} files in {strategy} "
        f"via {llm_label(llm, state)}."
    )
    if missing:
        message += f" Used templates for {len(missing)} file(s) the model did not return: {', '.join(missing)}."

    logs = add_log(logs, "CoderAgent", "warning" if missing else "completed", message)
    return {
        "files": generated_files,
        "logs": logs,
        "current_step": "coded",
    }
