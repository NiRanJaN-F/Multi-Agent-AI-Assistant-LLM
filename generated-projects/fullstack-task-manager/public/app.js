<think>
The user wants me to write the complete `public/app.js` file for a task manager app. Since there's no backend API and we're using localStorage for persistence, I need to build a fully functional client-side task manager.

Let me think about what a complete task manager needs:

1. **State Management**: Tasks stored in localStorage, with CRUD operations
2. **UI Interactions**: Add tasks, edit tasks, delete tasks, mark complete, filter tasks
3. **DOM Manipulation**: Dynamic creation/removal of task elements
4. **Event Handling**: Form submission, button clicks, input changes

I need to make sure the JS aligns with what would be in `public/index.html` and `public/styles.css`. Since I'm only writing the JS file, I need to assume reasonable HTML structure that would exist in index.html.

Let me design a comprehensive task manager with:
- Task creation (title, description, priority, due date)
- Task editing (inline or modal)
- Task deletion with confirmation
- Task completion toggle
- Filtering (all, active, completed)
- Sorting options
- Search functionality
- Task categories/tags
- LocalStorage persistence
- Responsive interactions

I'll write clean, well-structured vanilla JavaScript with proper event delegation, state management, and DOM manipulation.

Let me write the complete file now.
</think>

```javascript
'use strict';

(function () {
  // ─── State ───────────────────────────────────────────────────────────────────
  const STORAGE_KEY = 'taskmanager_tasks';
  const FILTER_KEY = 'taskmanager_filter';
  const SORT_KEY = 'taskmanager_sort';

  let state = {
    tasks: [],
    filter: 'all', // 'all' | 'active' | 'completed'
    sort: 'created', // 'created' | 'priority' | 'dueDate' | 'alphabetical'
    searchQuery: '',
    editingId: null,
  };

  // ─── DOM References ──────────────────────────────────────────────────────────
  let dom = {};

  function cacheDOM() {
    dom = {
      app: document.getElementById('app'),
      taskForm: document.getElementById('task-form'),
      titleInput: document.getElementById('task-title'),
      descriptionInput: document.getElementById('task-description'),
      prioritySelect: document.getElementById('task-priority'),
      dueDateInput: document.getElementById('task-due-date'),
      categoryInput: document.getElementById('task-category'),
      submitBtn: document.getElementById('submit-btn'),
      cancelEditBtn: document.getElementById('cancel-edit-btn'),
      taskList: document.getElementById('task-list'),
      taskCount: document.getElementById('task-count'),
      filterButtons: document.querySelectorAll('.filter-btn'),
      sortSelect: document.getElementById('sort-select'),
      searchInput: document.getElementById('search-input'),
      clearCompletedBtn: document.getElementById('clear-completed-btn'),
      emptyState: document.getElementById('empty-state'),
      statsContainer: document.getElementById('stats-container'),
      totalTasks: document.getElementById('stat-total'),
      completedTasks: document.getElementById('stat-completed'),
      pendingTasks: document.getElementById('stat-pending'),
    };
  }

  // ─── Persistence ─────────────────────────────────────────────────────────────
  function loadState() {
    try {
      const storedTasks = localStorage.getItem(STORAGE_KEY);
      if (storedTasks) {
        state.tasks = JSON.parse(storedTasks);
      }
      const storedFilter = localStorage.getItem(FILTER_KEY);
      if (storedFilter) {
        state.filter = storedFilter;
      }
      const storedSort = localStorage.getItem(SORT_KEY);
      if (storedSort) {
        state.sort = storedSort;
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
      state.tasks = [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage:', e);
    }
  }

  function saveFilter() {
    try {
      localStorage.setItem(FILTER_KEY, state.filter);
    } catch (e) {
      console.error('Failed to save filter:', e);
    }
  }

  function saveSort() {
    try {
      localStorage.setItem(SORT_KEY, state.sort);
    } catch (e) {
      console.error('Failed to save sort:', e);
    }
  }

  // ─── Utility ─────────────────────────────────────────────────────────────────
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    return due < today;
  }

  function getPriorityClass(priority) {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-low';
    }
  }

  function getPriorityLabel(priority) {
    switch (priority) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Low';
    }
  }

  // ─── Task CRUD ───────────────────────────────────────────────────────────────
  function addTask(title, description, priority, dueDate, category) {
    const task = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'medium',
      dueDate: dueDate || '',
      category: category.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.tasks.unshift(task);
    saveTasks();
    return task;
  }

  function updateTask(id, updates) {
    const index = state.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    state.tasks[index] = {
      ...state.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveTasks();
    return state.tasks[index];
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveTasks();
  }

  function toggleTask(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.updatedAt = new Date().toISOString();
      saveTasks();
    }
  }

  function clearCompletedTasks() {
    state.tasks = state.tasks.filter((t) => !t.completed);
    saveTasks();
  }

  // ─── Filtering & Sorting ─────────────────────────────────────────────────────
  function getFilteredAndSortedTasks() {
    let filtered = [...state.tasks];

    // Search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          (t.category && t.category.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (state.filter === 'active') {
      filtered = filtered.filter((t) => !t.completed);
    } else if (state.filter === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    }

    // Sort
    switch (state.sort) {
      case 'priority': {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        filtered.sort(
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
        );
        break;
      }
      case 'dueDate': {
        filtered.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.d