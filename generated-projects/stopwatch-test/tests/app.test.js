// test/stopwatch.test.js
// ------------------------------------------------------------
// Automated test suite for the "stopwatch-test" project.
// Tech stack: HTML5, CSS3, Vanilla JavaScript.
// ------------------------------------------------------------

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

let dom;
let window;
let document;

// Helpers to load the HTML and the script in a JSDOM environment
function loadPage() {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
  dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'http://localhost',
    pretendToBeVisual: true,
  });
  window = dom.window;
  document = window.document;
}

/**
 * Loads `app.js` into the JSDOM instance.
 * The script is wrapped in a `<script>` element so that it executes
 * in the same context as the page.
 */
function loadAppScript() {
  const scriptContent = fs.readFileSync(path.resolve(__dirname, '..', 'app.js'), 'utf8');
  const scriptEl = document.createElement('script');
  scriptEl.textContent = scriptContent;
  document.body.appendChild(scriptEl);
}

/**
 * Replaces native timer functions with spies so we can assert
 * that the stopwatch logic uses `setInterval`/`clearInterval` correctly.
 */
function mockTimers() {
  const originalSetInterval = window.setInterval;
  const originalClearInterval = window.clearInterval;

  let intervalId = 0;
  const intervals = new Map();

  window.setInterval = (cb, ms) => {
    intervalId += 1;
    intervals.set(intervalId, { cb, ms });
    return intervalId;
  };

  window.clearInterval = (id) => {
    intervals.delete(id);
  };

  // expose helpers for the tests
  window.__test__ = {
    getIntervals: () => intervals,
    triggerInterval: (id) => {
      const entry = intervals.get(id);
      if (entry) entry.cb();
    },
    restoreTimers: () => {
      window.setInterval = originalSetInterval;
      window.clearInterval = originalClearInterval;
    },
  };
}

// ------------------------------------------------------------
// Test Suite
// ------------------------------------------------------------
describe('Stopwatch UI & Logic', () => {
  beforeEach(() => {
    loadPage();
    mockTimers();
    loadAppScript();
  });

  afterEach(() => {
    // clean up JSDOM & timer mocks
    if (window && window.__test__) {
      window.__test__.restoreTimers();
    }
    dom.window.close();
  });

  test('DOM elements are present', () => {
    const requiredIds = [
      'time-display',
      'hours',
      'minutes',
      'seconds',
      'start-btn',
      'pause-btn',
      'lap-btn',
      'reset-btn',
      'lap-list',
      'lap-count',
    ];
    requiredIds.forEach((id) => {
      const el = document.getElementById(id);
      assert.ok(el, `Element with id="${id}" should exist`);
    });
  });

  test('Clicking start initiates a timer interval', () => {
    const startBtn = document.getElementById('start-btn');
    assert.ok(startBtn, 'Start button must exist');

    // No intervals before clicking start
    assert.strictEqual(window.__test__.getIntervals().size, 0, 'No intervals should be active initially');

    // Simulate click
    startBtn.dispatchEvent(new window.Event('click'));

    // After click, one interval should be registered
    const intervals = window.__test__.getIntervals();
    assert.strictEqual(intervals.size, 1, 'One interval should be created after start');
  });

  test('Clicking pause clears the active interval', () => {
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');

    // Start the stopwatch first
    startBtn.dispatchEvent(new window.Event('click'));
    const intervalsBefore = window.__test__.getIntervals();
    assert.strictEqual(intervalsBefore.size, 1, 'Interval should exist after start');

    // Capture the interval id
    const intervalId = [...intervalsBefore.keys()][0];

    // Pause the stopwatch
    pauseBtn.dispatchEvent(new window.Event('click'));

    // Interval should be cleared
    const intervalsAfter = window.__test__.getIntervals();
    assert.strictEqual(intervalsAfter.size, 0, 'Interval should be cleared after pause');
    assert.ok(!intervalsAfter.has(intervalId), 'Specific interval id should be removed');
  });

  test('Lap button creates a new lap entry', () => {
    const lapBtn = document.getElementById('lap-btn');
    const lapList = document.getElementById('lap-list');
    const lapCount = document.getElementById('lap-count');

    // Ensure list starts empty
    assert.strictEqual(lapList.children.length, 0, 'Lap list should start empty');
    assert.strictEqual(lapCount.textContent.trim(), '0', 'Lap count should start at 0');

    // Simulate a lap press
    lapBtn.dispatchEvent(new window.Event('click'));

    // Verify a new list item appears
    assert.strictEqual(lapList.children.length, 1, 'One lap entry should be added');
    assert.strictEqual(lapCount.textContent.trim(), '1', 'Lap count should be updated to 1');

    // Add a second lap
    lapBtn.dispatchEvent(new window.Event('click'));
    assert.strictEqual(lapList.children.length, 2, 'Two lap entries should be present');
    assert.strictEqual(lapCount.textContent.trim(), '2', 'Lap count should be updated to 2');
  });

  test('Reset button clears time display, laps and stops timer', () => {
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const lapBtn = document.getElementById('lap-btn');
    const lapList = document.getElementById('lap-list');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    // Start stopwatch and add a lap
    startBtn.dispatchEvent(new window.Event('click'));
    lapBtn.dispatchEvent(new window.Event('click'));

    // Verify timer interval exists
    assert.strictEqual(window.__test__.getIntervals().size, 1, 'Timer should be running before reset');

    // Perform reset
    resetBtn.dispatchEvent(new window.Event('click'));

    // Timer should be cleared
    assert.strictEqual(window.__test__.getIntervals().size, 0, 'Timer should be cleared after reset');

    // Time display should be reset to 00:00:00
    assert.strictEqual(hoursEl.textContent, '00', 'Hours reset to 00');
    assert.strictEqual(minutesEl.textContent, '00', 'Minutes reset to 00');
    assert.strictEqual(secondsEl.textContent, '00', 'Seconds reset to 00');

    // Laps should be cleared
    assert.strictEqual(lapList.children.length, 0, 'Lap list should be empty after reset');
  });

  test('Timer updates display after interval tick', () => {
    const startBtn = document.getElementById('start-btn');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    // Start the stopwatch
    startBtn.dispatchEvent(new window.Event('click'));

    // Grab the interval id created by the script
    const intervalId = [...window.__test__.getIntervals().keys()][0];
    assert.ok(intervalId, 'Interval id should exist after start');

    // Simulate a tick (the script's interval callback should increment elapsed time)
    window.__test__.triggerInterval(intervalId);

    // After one tick (usually 10ms or 100ms depending on implementation) the display
    // should show a non‑zero value. We only assert that at least one segment changed.
    const timeSegments = [hoursEl.textContent, minutesEl.textContent, secondsEl.textContent];
    const hasNonZero = timeSegments.some((seg) => seg !== '00');
    assert.ok(hasNonZero, 'At least one time segment should have advanced after a tick');
  });
});