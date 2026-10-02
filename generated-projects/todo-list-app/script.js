// Generated application logic for Build a todo list web app with add, complete, and delete tasks.
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('actionBtn');
    const output = document.getElementById('output');
    
    let count = 0;
    if (btn && output) {
        btn.addEventListener('click', () => {
            count++;
            output.textContent = `Action executed ${count} times at ${new Date().toLocaleTimeString()}`;
        });
    }
});
