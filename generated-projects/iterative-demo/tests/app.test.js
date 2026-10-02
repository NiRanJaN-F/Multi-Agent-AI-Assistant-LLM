const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

// Read source files
const htmlPath = path.join(__dirname, 'index.html');
const jsPath = path.join(__dirname, 'app.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');

test('Integration & Unit Test Suite for iterative-demo', async (t) => {
    
    // Setup a simulated browser environment using JSDOM
    const setupDOM = (savedTheme = null) => {
        const dom = new JSDOM(htmlContent, {
            runScripts: 'dangerously',
            resources: 'usable',
            url: 'http://localhost'
        });

        // Mock localStorage
        const storage = {};
        if (savedTheme) {
            storage['theme'] = savedTheme;
        }
        
        dom.window.localStorage = {
            getItem: (key) => storage[key] || null,
            setItem: (key, value) => { storage[key] = value; },
            clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
        };

        // Inject script content since external src won't fetch automatically in virtual console without server
        const scriptEl = dom.window.document.createElement('script');
        scriptEl.textContent = jsContent;
        dom.window.document.body.appendChild(scriptEl);

        // Manually trigger ThemeManager init if not auto-invoked
        if (dom.window.ThemeManager && typeof dom.window.ThemeManager.init === 'function') {
            dom.window.ThemeManager.init();
        }

        return dom;
    };

    await t.test('DOM Structure and Initial State Tests', () => {
        const dom = setupDOM();
        const document = dom.window.document;

        const title = document.getElementById('title');
        assert.equal(title.textContent, 'Task Manager', 'Title should be Task Manager');

        const taskList = document.getElementById('task-list');
        assert.equal(taskList.children.length, 1, 'Should have exactly 1 initial task');
        assert.equal(taskList.children[0].textContent, 'Buy groceries', 'Initial task text should match');

        const toggleBtn = document.getElementById('dark-mode-toggle');
        assert.ok(toggleBtn, 'Dark mode toggle button must exist');

        const exportBtn = document.getElementById('export-json');
        assert.ok(exportBtn, 'Export JSON button must exist');
    });

    await t.test('ThemeManager Unit & Integration Tests - Initial Load', () => {
        // Test loading with saved dark theme
        const domDark = setupDOM('dark');
        const docDark = domDark.window.document;

        assert.ok(
            docDark.body.classList.contains('dark'), 
            'Body should have "dark" class if savedTheme is "dark"'
        );

        // Test loading with no saved theme
        const domLight = setupDOM(null);
        const docLight = domLight.window.document;

        assert.equal(
            docLight.body.classList.contains('dark'), 
            false, 
            'Body should NOT have "dark" class initially if no theme is saved'
        );
    });

    await t.test('ThemeManager Toggle Interaction Tests', () => {
        const dom = setupDOM(null);
        const window = dom.window;
        const document = window.document;
        const toggleBtn = document.getElementById('dark-mode-toggle');

        // Initially light
        assert.equal(document.body.classList.contains('dark'), false);

        // Click to enable dark mode
        toggleBtn.click();
        assert.equal(document.body.classList.contains('dark'), true, 'Clicking toggle should add dark class');
        assert.equal(window.localStorage.getItem('theme'), 'dark', 'Clicking toggle should save theme to localStorage');

        // Click to disable dark mode
        toggleBtn.click();
        assert.equal(document.body.classList.contains('dark'), false, 'Second click should remove dark class');
    });

    await t.test('Global tasks array availability', () => {
        const dom = setupDOM();
        // Verify tasks array exists in execution context (via script load)
        // Since tasks is declared locally inside app.js, we check console or evaluate script behavior
        assert.doesNotThrow(() => {
            dom.window.eval('console.log(tasks);');
        }, 'tasks array should be accessible in global/script context');
    });
});