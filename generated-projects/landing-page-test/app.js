// Interactive Task App Logic
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
