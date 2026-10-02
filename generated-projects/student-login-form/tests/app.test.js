// test.js
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

// Load source files
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const jsContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

// Helper to create a fresh DOM for each test
function createDOM() {
  const dom = new JSDOM(htmlContent, { runScripts: 'outside-only', url: 'http://localhost' });
  // Inject the app.js script
  const scriptEl = dom.window.document.createElement('script');
  scriptEl.textContent = jsContent;
  dom.window.document.body.appendChild(scriptEl);
  // Trigger DOMContentLoaded manually
  dom.window.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom;
}

describe('Student Login Form', () => {
  test('shows greeting and hides form when localStorage has data', () => {
    const dom = createDOM();
    const { window } = dom;
    const { localStorage, document } = window;

    // Set stored data
    localStorage.setItem('studentName', 'Alice');
    localStorage.setItem('studentReg', '12345');

    // Re-trigger DOMContentLoaded to apply logic
    window.dispatchEvent(new window.Event('DOMContentLoaded'));

    const form = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    assert.strictEqual(form.style.display, 'none', 'Form should be hidden');
    assert.strictEqual(
      messageDiv.textContent,
      'Welcome, Alice (Reg #: 12345)',
      'Greeting message should be correct'
    );
  });

  test('shows form and empty message when localStorage is empty', () => {
    const dom = createDOM();
    const { window } = dom;
    const { document } = window;

    const form = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    assert.strictEqual(form.style.display, '', 'Form should be visible');
    assert.strictEqual(messageDiv.textContent, '', 'Message should be empty');
  });

  test('submitting form stores data and shows greeting', () => {
    const dom = createDOM();
    const { window } = dom;
    const { document, localStorage } = window;

    const form = document.getElementById('loginForm');
    const nameInput = document.getElementById('nameInput');
    const regInput = document.getElementById('regInput');
    const messageDiv = document.getElementById('message');

    // Fill inputs
    nameInput.value = 'Bob';
    regInput.value = '67890';

    // Submit form
    const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);

    // Verify localStorage
    assert.strictEqual(localStorage.getItem('studentName'), 'Bob', 'Name should be stored');
    assert.strictEqual(localStorage.getItem('studentReg'), '67890', 'Reg should be stored');

    // Verify UI changes
    assert.strictEqual(form.style.display, 'none', 'Form should be hidden after submit');
    assert.strictEqual(
      messageDiv.textContent,
      'Welcome, Bob (Reg #: 67890)',
      'Greeting message should reflect submitted data'
    );
  });

  test('logout clears data and shows form again', () => {
    const dom = createDOM();
    const { window } = dom;
    const { document, localStorage } = window;

    // Prepopulate storage and UI
    localStorage.setItem('studentName', 'Carol');
    localStorage.setItem('studentReg', '54321');
    window.dispatchEvent(new window.Event('DOMContentLoaded'));

    const logoutBtn = document.getElementById('logoutBtn');
    const form = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    // Click logout
    const clickEvent = new window.Event('click', { bubbles: true, cancelable: true });
    logoutBtn.dispatchEvent(clickEvent);

    // Verify storage cleared
    assert.strictEqual(localStorage.getItem('studentName'), null, 'Name should be cleared');
    assert.strictEqual(localStorage.getItem('studentReg'), null, 'Reg should be cleared');

    // Verify UI restored
    assert.strictEqual(form.style.display, '', 'Form should be visible after logout');
    assert.strictEqual(messageDiv.textContent, '', 'Message should be cleared after logout');
  });
});