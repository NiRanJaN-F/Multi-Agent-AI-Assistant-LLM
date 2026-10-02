const tasks = ["Buy groceries"];
console.log("Loaded tasks:", tasks);

// Dark mode toggle functionality with localStorage persistence
window.ThemeManager = {
    init() {
        const toggleBtn = document.getElementById("dark-mode-toggle");
        
        // Load persisted theme choice on startup
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            document.body.classList.add("dark");
        }

        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                document.body.classList.toggle("dark");
                
                // Save current state to localStorage
                if (document.body.classList.contains("dark")) {
                    localStorage.setItem("theme", "dark");
                } else {
                    localStorage.setItem("theme", "light");
                }
            });
        }
    }
};

// Export to JSON functionality with download trigger
window.ExportManager = {
    init() {
        const exportBtn = document.getElementById("export-json");
        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
                const downloadAnchor = document.createElement("a");
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", "tasks.json");
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
            });
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    window.ThemeManager.init();
    window.ExportManager.init();
});