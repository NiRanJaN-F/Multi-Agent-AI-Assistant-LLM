// test/app.test.js
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { JSDOM } = require('jsdom');
const vm = require('node:vm');

let window;
let document;
let qs;
let qsa;
let initSmoothScroll;

/**
 * Loads the app.js source into a JSDOM environment and extracts the
 * exported utility functions for testing.
 */
function loadApp() {
  // Minimal HTML needed for the utilities to work
  const html = `
    <!DOCTYPE html>
    <html><head></head><body>
      <a href="#section1" class="link1">Go to Section 1</a>
      <div id="section1">Section 1</div>

      <div class="container">
        <p class="para">Paragraph 1</p>
        <p class="para">Paragraph 2</p>
      </div>
    </body></html>
  `;

  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  window = dom.window;
  document = window.document;

  // Create a sandbox that mimics the browser globals used by app.js
  const sandbox = {
    window,
    document,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  };

  // Load and evaluate the source file inside the sandbox
  const appPath = join(__dirname, '..', 'app.js');
  const code = readFileSync(appPath, 'utf-8');
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  // Pull the functions out of the sandbox for direct use in tests
  qs = sandbox.qs;
  qsa = sandbox.qsa;
  initSmoothScroll = sandbox.initSmoothScroll;
}

describe('Utility Functions (qs, qsa)', () => {
  beforeEach(() => {
    loadApp();
  });

  test('qs returns the first element that matches the selector', () => {
    const para = qs('.para');
    assert.ok(para, 'Element should be found');
    assert.equal(para.textContent, 'Paragraph 1');
  });

  test('qsa returns an array of all matching elements', () => {
    const paragraphs = qsa('.para');
    assert.ok(Array.isArray(paragraphs), 'Result should be an array');
    assert.equal(paragraphs.length, 2, 'Should find two paragraph elements');
    assert.equal(paragraphs[0].textContent, 'Paragraph 1');
    assert.equal(paragraphs[1].textContent, 'Paragraph 2');
  });
});

describe('initSmoothScroll', () => {
  beforeEach(() => {
    loadApp();
  });

  test('clicking an internal anchor prevents default and scrolls smoothly', () => {
    // Prepare the target element with a spy for scrollIntoView
    const target = qs('#section1');
    let scrollCalled = false;
    let scrollOptions = null;
    target.scrollIntoView = function (options) {
      scrollCalled = true;
      scrollOptions = options;
    };

    // Initialise the smooth‑scroll listeners
    initSmoothScroll();

    // Simulate a click on the anchor link
    const link = qs('.link1');
    const clickEvent = new window.Event('click', {
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(clickEvent);

    // Assertions
    assert.ok(scrollCalled, 'scrollIntoView should have been called');
    assert.deepEqual(
      scrollOptions,
      { behavior: 'smooth' },
      'scrollIntoView should be called with smooth behavior'
    );
    assert.ok(clickEvent.defaultPrevented, 'Default action should be prevented');
  });

  test('clicking a link with a non‑existent target does nothing', () => {
    // Add a link that points to an ID that does not exist
    const orphanLink = document.createElement('a');
    orphanLink.setAttribute('href', '#nope');
    document.body.appendChild(orphanLink);

    // Initialise listeners again (they will also bind to the new link)
    initSmoothScroll();

    // Spy on preventDefault
    let prevented = false;
    const clickEvent = new window.Event('click', {
      bubbles: true,
      cancelable: true,
    });
    orphanLink.addEventListener('click', (e) => {
      prevented = e.defaultPrevented;
    });

    orphanLink.dispatchEvent(clickEvent);

    // Since the target does not exist, default should NOT be prevented
    assert.equal(prevented, false, 'Default should not be prevented for missing target');
  });
});