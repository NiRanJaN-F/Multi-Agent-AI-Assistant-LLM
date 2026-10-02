// Generated application logic for Build a modern dark-mode Food Delivery web app with menu items (Pizza, Burger, Sushi), an interactive add-to-cart counter, dynamic bill total with tax/delivery, and a checkout order modal.
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mainForm');
    const input = document.getElementById('itemInput');
    const list = document.getElementById('itemList');
    const status = document.getElementById('statusOutput');

    let items = JSON.parse(localStorage.getItem('app_items') || '[]');

    function save() {
        localStorage.setItem('app_items', JSON.stringify(items));
        render();
    }

    function render() {
        if (!list) return;
        list.innerHTML = '';
        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `<span>${item}</span>`;
            
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = 'Remove';
            delBtn.onclick = () => {
                items.splice(index, 1);
                save();
            };
            li.appendChild(delBtn);
            list.appendChild(li);
        });

        if (status) {
            status.textContent = `Total active items: ${items.length}`;
        }
    }

    if (form && input) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (input.value.trim()) {
                items.push(input.value.trim());
                input.value = '';
                save();
            }
        });
    }

    render();
});
