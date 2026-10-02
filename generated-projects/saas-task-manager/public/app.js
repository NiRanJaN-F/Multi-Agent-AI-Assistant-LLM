/**
 * Modern SaaS Task Management App - Client Application
 * Author: Principal Frontend Architect & Senior UI/UX Designer
 * Tech Stack: Vanilla JS (ES6+), Tailwind CSS, WebSockets, REST API
 */

(function () {
    'use strict';

    // --- State Management ---
    const state = {
        token: localStorage.getItem('token') || null,
        currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
        workspaces: [],
        activeWorkspace: null,
        tasks: [],
        ws: null,
        filter: 'all',
        searchQuery: '',
        activeModalTaskId: null
    };

    // --- DOM Elements Cache ---
    let dom = {};

    function cacheDom() {
        dom.authContainer = document.getElementById('auth-container');
        dom.dashboard = document.getElementById('dashboard');
        dom.loginForm = document.getElementById('login-form');
        dom.signupForm = document.getElementById('signup-form');
        dom.authToggleBtn = document.getElementById('auth-toggle-btn');
        dom.authTitle = document.getElementById('auth-title');
        dom.loginSection = document.getElementById('login-section');
        dom.signupSection = document.getElementById('signup-section');
        
        dom.userGreeting = document.getElementById('user-greeting');
        dom.logoutBtn = document.getElementById('logout-btn');
        dom.workspaceList = document.getElementById('workspace-list');
        dom.newWorkspaceBtn = document.getElementById('new-workspace-btn');
        dom.currentWorkspaceName = document.getElementById('current-workspace-name');
        dom.activeWorkspaceMeta = document.getElementById('active-workspace-meta');
        
        dom.columnTodo = document.getElementById('column-todo');
        dom.columnInprogress = document.getElementById('column-inprogress');
        dom.columnDone = document.getElementById('column-done');
        dom.taskCountTodo = document.getElementById('task-count-todo');
        dom.taskCountInprogress = document.getElementById('task-count-inprogress');
        dom.taskCountDone = document.getElementById('task-count-done');
        
        dom.newTaskBtn = document.getElementById('new-task-btn');
        dom.taskModal = document.getElementById('task-modal');
        dom.taskForm = document.getElementById('task-form');
        dom.taskModalTitle = document.getElementById('task-modal-title');
        dom.taskIdInput = document.getElementById('task-id');
        dom.taskTitleInput = document.getElementById('task-title');
        dom.taskDescInput = document.getElementById('task-desc');
        dom.taskStatusInput = document.getElementById('task-status');
        dom.taskModalClose = document.getElementById('task-modal-close');
        dom.taskModalCancel = document.getElementById('task-modal-cancel');
        dom.deleteTaskBtn = document.getElementById('delete-task-btn');
        
        dom.searchInput = document.getElementById('search-input');
        dom.wsStatusIndicator = document.getElementById('ws-status-indicator');
        dom.toastContainer = document.getElementById('toast-container');
    }

    // --- Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
        cacheDom();
        setupEventListeners();
        
        if (state.token && state.currentUser) {
            showDashboard();
            initApp();
        } else {
            showAuth();
        }
    });

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // Auth Toggle
        dom.authToggleBtn.addEventListener('click', () => {
            const isLogin = dom.loginSection.classList.toggle('hidden');
            dom.signupSection.classList.toggle('hidden', !isLogin);
            dom.authTitle.textContent = isLogin ? 'Welcome Back' : 'Create Account';
            dom.authToggleBtn.textContent = isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in';
        });

        dom.loginForm.addEventListener('submit', handleLogin);
        dom.signupForm.addEventListener('submit', handleSignup);
        dom.logoutBtn.addEventListener('click', handleLogout);

        // Workspace
        dom.newWorkspaceBtn.addEventListener('click', handleCreateWorkspace);

        // Tasks Modal
        dom.newTaskBtn.addEventListener('click', () => openTaskModal());
        dom.taskModalClose.addEventListener('click', closeTaskModal);
        dom.taskModalCancel.addEventListener('click', closeTaskModal);
        dom.taskForm.addEventListener('submit', handleTaskFormSubmit);
        dom.deleteTaskBtn.addEventListener('click', handleDeleteTask);

        // Search & Filter
        dom.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase();
            renderTasks();
        });

        // Drag and Drop setup on columns
        ['todo', 'inprogress', 'done'].forEach(status => {
            const col = document.getElementById(`column-${status}`);
            col.addEventListener('dragover', (e) => e.preventDefault());
            col.addEventListener('drop', (e) => handleTaskDrop(e, status));
        });
    }

    // --- Toast Notifications System ---
    function showToast(message, type = 'info') {
        if (!dom.toastContainer) return;
        const toast = document.createElement('div');
        let bgClass = 'bg-slate-800 text-white border-slate-700';
        let icon = 'info';
        
        if (type === 'success') {
            bgClass = 'bg-emerald-900/90 text-emerald-100 border-emerald-700';
            icon = 'check-circle';
        } else if (type === 'error') {
            bgClass = 'bg-rose-900/90 text-rose-100 border-rose-700';
            icon = 'alert-circle';
        }

        toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transform transition-all duration-300 translate-y-2 opacity-0 ${bgClass}`;
        toast.innerHTML = `
            <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i>
            <span class="text-sm font-medium">${escapeHtml(message)}</span>
        `;
        
        dom.toastContainer.appendChild(toast);
        lucide.createIcons();

        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        });

        setTimeout(() => {
            toast.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // --- Authentication Flow ---
    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            saveAuthData(data);
            showDashboard();
            initApp();
            showToast(`Welcome back, ${state.currentUser.username}!`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value;

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Signup failed');

            saveAuthData(data);
            showDashboard();
            initApp();
            showToast(`Account created successfully! Welcome, ${state.currentUser.username}`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function saveAuthData(data) {
        state.token = data.token;
        state.currentUser = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
    }

    function handleLogout() {
        state.token = null;
        state.currentUser = null;
        state.activeWorkspace = null;
        state.tasks = [];
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        if (state.ws) state.ws.close();
        showAuth();
        showToast('Logged out securely', 'info');
    }

    function showAuth() {
        dom.authContainer.classList.remove('hidden');
        dom.dashboard.classList.add('hidden');
    }

    function showDashboard() {
        dom.authContainer.classList.add('hidden');
        dom.dashboard.classList.remove('hidden');
        dom.userGreeting.textContent = state.currentUser.username;
    }

    // --- Main App Initialization ---
    async function initApp() {
        await fetchWorkspaces();
        connectWebSocket();
    }

    // --- WebSocket Real-time Updates ---
    function connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        state.ws = new WebSocket(wsUrl);

        state.ws.onopen = () => {
            updateConnectionStatus(true);
        };

        state.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };

        state.ws.onclose = () => {
            updateConnectionStatus(false);
            // Try reconnecting after 3 seconds
            setTimeout(connectWebSocket, 3000);
        };

        state.ws.onerror = () => {
            updateConnectionStatus(false);
        };
    }

    function updateConnectionStatus(isConnected) {
        if (!dom.wsStatusIndicator) return;
        if (isConnected) {
            dom.wsStatusIndicator.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
            dom.wsStatusIndicator.title = 'Real-time sync active';
        } else {
            dom.wsStatusIndicator.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse';
            dom.wsStatusIndicator.title = 'Reconnecting real-time sync...';
        }
    }

    function handleWebSocketMessage(msg) {
        if (!state.activeWorkspace) return;
        
        // Only process events for current active workspace
        if (msg.workspaceId && msg.workspaceId !== state.activeWorkspace.id) return;

        switch (msg.type) {
            case 'TASK_CREATED':
                if (!state.tasks.some(t => t.id === msg.task.id)) {
                    state.tasks.push(msg.task);
                    renderTasks();
                    showToast(`New task added: "${msg.task.title}"`, 'info');
                }
                break;
            case 'TASK_UPDATED':
                state.tasks = state.tasks.map(t => t.id === msg.task.id ? msg.task : t);
                renderTasks();
                break;
            case 'TASK_DELETED':
                state.tasks = state.tasks.filter(t => t.id !== msg.taskId);
                renderTasks();
                break;
            default:
                break;
        }
    }

    // --- Workspace Operations ---
    async function fetchWorkspaces() {
        try {
            const res = await fetch('/api/workspaces', {
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load workspaces');

            state.workspaces = data;
            renderWorkspaces();

            if (state.workspaces.length > 0) {
                // Select first workspace by default or keep active if still valid
                const currentActiveExists = state.workspaces.some(w => state.activeWorkspace && w.id === state.activeWorkspace.id);
                if (!currentActiveExists) {
                    selectWorkspace(state.workspaces[0]);
                }
            } else {
                // Auto-create default workspace if none exist
                createDefaultWorkspace();
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    async function createDefaultWorkspace() {
        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ name: 'General Workspace' })
            });
            const data = await res.json();
            if (res.ok) {
                state.workspaces.push(data);
                selectWorkspace(data);
                renderWorkspaces();
            }
        } catch (e) {
            console.error('Auto workspace creation failed', e);
        }
    }

    async function handleCreateWorkspace() {
        const name = prompt('Enter new workspace name:');
        if (!name || !name.trim()) return;

        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ name: name.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create workspace');

            state.workspaces.push(data);
            renderWorkspaces();
            selectWorkspace(data);
            showToast(`Workspace "${data.name}" created`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function selectWorkspace(workspace) {
        state.activeWorkspace = workspace;
        dom.currentWorkspaceName.textContent = workspace.name;
        dom.activeWorkspaceMeta.textContent = `ID: #${workspace.id} • Owner ID: ${workspace.owner_id}`;
        
        renderWorkspaces();
        fetchTasksForActiveWorkspace();
    }

    function renderWorkspaces() {
        dom.workspaceList.innerHTML = '';
        state.workspaces.forEach(ws => {
            const isActive = state.activeWorkspace && state.activeWorkspace.id === ws.id;
            const btn = document.createElement('button');
            btn.className = `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`;
            btn.innerHTML = `
                <div class="flex items-center gap-3 truncate">
                    <i data-lucide="folder-kanban" class="w-4 h-4 flex-shrink-0"></i>
                    <span class="truncate">${escapeHtml(ws.name)}</span>
                </div>
                ${isActive ? '<i data-lucide="chevron-right" class="w-4 h-4 opacity-75"></i>' : ''}
            `;
            btn.addEventListener('click', () => selectWorkspace(ws));
            dom.workspaceList.appendChild(btn);
        });
        lucide.createIcons();
    }

    // --- Task Operations ---
    async function fetchTasksForActiveWorkspace() {
        if (!state.activeWorkspace) return;

        try {
            const res = await fetch(`/api/workspaces/${state.activeWorkspace.id}/tasks`, {
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch tasks');

            state.tasks = data;
            renderTasks();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function renderTasks() {
        const query = state.searchQuery.toLowerCase();
        const filteredTasks = state.tasks.filter(task => {
            const matchQuery = task.title.toLowerCase().includes(query) || 
                               (task.description && task.description.toLowerCase().includes(query));
            return matchQuery;
        });

        const todoTasks = filteredTasks.filter(t => t.status === 'todo');
        const inprogressTasks = filteredTasks.filter(t => t.status === 'inprogress');
        const doneTasks = filteredTasks.filter(t => t.status === 'done');

        // Render columns
        renderColumn(dom.columnTodo, todoTasks);
        renderColumn(dom.columnInprogress, inprogressTasks);
        renderColumn(dom.columnDone, doneTasks);

        // Update counts
        dom.taskCountTodo.textContent = todoTasks.length;
        dom.taskCountInprogress.textContent = inprogressTasks.length;
        dom.taskCountDone.textContent = doneTasks.length;

        lucide.createIcons();
    }

    function renderColumn(container, tasks) {
        container.innerHTML = '';
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    <i data-lucide="inbox" class="w-8 h-8 mb-2 opacity-40"></i>
                    <p class="text-xs font-medium">No tasks here</p>
                </div>
            `;
            return;
        }

        tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'group relative bg-slate-900 border border-slate-800/80 hover:border-slate-700 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer';
            card.draggable = true;
            card.dataset.id = task.id;

            card.innerHTML = `
                <div class="flex items-start justify-between gap-2 mb-2">
                    <h4 class="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">${escapeHtml(task.title)}</h4>
                    <span class="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300">
                        <i data-lucide="more-vertical" class="w-4 h-4"></i>
                    </span>
                </div>
                ${task.description ? `<p class="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">${escapeHtml(task.description)}</p>` : ''}
                <div class="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                    <span class="flex items-center gap-1 font-mono">
                        <i data-lucide="hash" class="w-3 h-3"></i>${task.id}
                    </span>
                    <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                        Task
                    </span>
                </div>
            `;

            // Drag events
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', task.id);
                card.classList.add('opacity-50', 'scale-95');
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('opacity-50', 'scale-95');
            });

            // Click to edit
            card.addEventListener('click', () => openTaskModal(task));

            container.appendChild(card);
        });
    }

    async function handleTaskDrop(e, newStatus) {
        e.preventDefault();
        const taskId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!taskId) return;

        const task = state.tasks.find(t => t.id === taskId);
        if (!task || task.status === newStatus) return;

        // Optimistic UI update
        const oldStatus = task.status;
        task.status = newStatus;
        renderTasks();

        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({
                    title: task.title,
                    description: task.description,
                    status: newStatus
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update task status');
            showToast(`Task moved to ${formatStatusName(newStatus)}`, 'success');
        } catch (err) {
            // Revert on failure
            task.status = oldStatus;
            renderTasks();
            showToast(err.message, 'error');
        }
    }

    // --- Task Modal & CRUD ---
    function openTaskModal(task = null) {
        if (!state.activeWorkspace) {
            showToast('Please select a workspace first', 'error');
            return;
        }

        if (task) {
            state.activeModalTaskId = task.id;
            dom.taskModalTitle.textContent = 'Edit Task';
            dom.taskIdInput.value = task.id;
            dom.taskTitleInput.value = task.title;
            dom.taskDescInput.value = task.description || '';
            dom.taskStatusInput.value = task.status;
            dom.deleteTaskBtn.classList.remove('hidden');
        } else {
            state.activeModalTaskId = null;
            dom.taskModalTitle.textContent = 'Create New Task';
            dom.taskIdInput.value = '';
            dom.taskTitleInput.value = '';
            dom.taskDescInput.value = '';
            dom.taskStatusInput.value = 'todo';
            dom.deleteTaskBtn.classList.add('hidden');
        }

        dom.taskModal.classList.remove('hidden');
        dom.taskTitleInput.focus();
    }

    function closeTaskModal() {
        dom.taskModal.classList.add('hidden');
        state.activeModalTaskId = null;
    }

    async function handleTaskFormSubmit(e) {
        e.preventDefault();
        const title = dom.taskTitleInput.value.trim();
        const description = dom.taskDescInput.value.trim();
        const status = dom.taskStatusInput.value;
        const taskId = dom.taskIdInput.value;

        if (!title) return;

        try {
            if (taskId) {
                // Update
                const res = await fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    },
                    body: JSON.stringify({ title, description, status })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to update task');
                
                state.tasks = state.tasks.map(t => t.id === parseInt(taskId) ? { ...t, title, description, status } : t);
                showToast('Task updated successfully', 'success');
            } else {
                // Create
                const res = await fetch(`/api/workspaces/${state.activeWorkspace.id}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    },
                    body: JSON.stringify({ title, description, status })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to create task');

                if (!state.tasks.some(t => t.id === data.id)) {
                    state.tasks.push(data);
                }
                showToast('Task created successfully', 'success');
            }

            renderTasks();
            closeTaskModal();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    async function handleDeleteTask() {
        const taskId = dom.taskIdInput.value;
        if (!taskId) return;

        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete task');

            state.tasks = state.tasks.filter(t => t.id !== parseInt(taskId));
            renderTasks();
            closeTaskModal();
            showToast('Task deleted', 'info');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    // --- Helpers ---
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatStatusName(status) {
        switch (status) {
            case 'todo': return 'To Do';
            case 'inprogress': return 'In Progress';
            case 'done': return 'Done';
            default: return status;
        }
    }

})();