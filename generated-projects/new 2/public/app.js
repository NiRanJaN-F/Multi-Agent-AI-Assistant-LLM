// Interactive Todo List Application Logic
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
