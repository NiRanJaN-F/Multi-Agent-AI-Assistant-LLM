'use strict';

(function () {
  // ─── State ──────────────────────────────────────────────────────────────────

  const STORAGE_KEY = 'kanban-board-data';
  const FILTER_KEY = 'kanban-board-filter';

  let state = {
    tasks: [],
    filter: 'all', // 'all' | 'high' | 'medium' | 'low'
  };

  // ─── DOM References ─────────────────────────────────────────────────────────

  let columns = {};
  let addTaskBtn = null;
  let modal = null;
  let modalOverlay = null;
  let taskForm = null;
  let taskTitleInput = null;
  let taskPrioritySelect = null;
  let taskColumnSelect = null;
  let taskDescriptionInput = null;
  let saveTaskBtn = null;
  let cancelTaskBtn = null;
  let filterButtons = {};
  let taskCountElements = {};

  // ─── Utility ────────────────────────────────────────────────────────────────

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ─── Persistence ────────────────────────────────────────────────────────────

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
      localStorage.setItem(FILTER_KEY, state.filter);
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }

  function loadState() {
    try {
      const tasksRaw = localStorage.getItem(STORAGE_KEY);
      const filterRaw = localStorage.getItem(FILTER_KEY);
      if (tasksRaw) {
        state.tasks = JSON.parse(tasksRaw);
      }
      if (filterRaw) {
        state.filter = filterRaw;
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
      state.tasks = [];
      state.filter = 'all';
    }
  }

  // ─── Task CRUD ──────────────────────────────────────────────────────────────

  function addTask(title, priority, column, description) {
    const task = {
      id: generateId(),
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority,
      column: column,
      createdAt: new Date().toISOString(),
    };
    state.tasks.push(task);
    saveState();
    return task;
  }

  function updateTask(id, updates) {
    const index = state.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    state.tasks[index] = { ...state.tasks[index], ...updates };
    saveState();
    return state.tasks[index];
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveState();
  }

  function moveTask(id, targetColumn) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    task.column = targetColumn;
    saveState();
  }

  function getFilteredTasks(column) {
    let tasks = state.tasks.filter((t) => t.column === column);
    if (state.filter !== 'all') {
      tasks = tasks.filter((t) => t.priority === state.filter);
    }
    return tasks;
  }

  // ─── DOM Initialization ─────────────────────────────────────────────────────

  function initDomReferences() {
    columns = {
      todo: document.getElementById('column-todo'),
      inprogress: document.getElementById('column-inprogress'),
      done: document.getElementById('column-done'),
    };

    addTaskBtn = document.getElementById('add-task-btn');
    modal = document.getElementById('task-modal');
    modalOverlay = document.getElementById('modal-overlay');
    taskForm = document.getElementById('task-form');
    taskTitleInput = document.getElementById('task-title-input');
    taskPrioritySelect = document.getElementById('task-priority-select');
    taskColumnSelect = document.getElementById('task-column-select');
    taskDescriptionInput = document.getElementById('task-description-input');
    saveTaskBtn = document.getElementById('save-task-btn');
    cancelTaskBtn = document.getElementById('cancel-task-btn');

    filterButtons = {
      all: document.getElementById('filter-all'),
      high: document.getElementById('filter-high'),
      medium: document.getElementById('filter-medium'),
      low: document.getElementById('filter-low'),
    };

    taskCountElements = {
      todo: document.getElementById('count-todo'),
      inprogress: document.getElementById('count-inprogress'),
      done: document.getElementById('count-done'),
    };
  }

  // ─── Rendering ──────────────────────────────────────────────────────────────

  function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('draggable', 'true');
    card.dataset.taskId = task.id;

    const priorityClass = `priority-${task.priority.toLowerCase()}`;

    card.innerHTML = `
      <div class="task-card-header">
        <span class="task-priority-tag ${priorityClass}">${escapeHtml(task.priority)}</span>
        <div class="task-card-actions">
          <button class="btn-edit" title="Edit task" aria-label="Edit task">✏️</button>
          <button class="btn-delete" title="Delete task" aria-label="Delete task">🗑️</button>
        </div>
      </div>
      <h3 class="task-title">${escapeHtml(task.title)}</h3>
      ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
      <span class="task-date">${formatDate(task.createdAt)}</span>
    `;

    // Drag events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    // Edit button
    const editBtn = card.querySelector('.btn-edit');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(task);
      });
    }

    // Delete button
    const deleteBtn = card.querySelector('.btn-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
        renderBoard();
      });
    }

    return card;
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function renderColumn(columnId) {
    const columnEl = columns[columnId];
    if (!columnEl) return;

    const taskList = columnEl.querySelector('.task-list');
    if (!taskList) return