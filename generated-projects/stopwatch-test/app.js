'use strict';

(function () {
  // ── DOM References ──────────────────────────────────────────────
  const displayEl = document.getElementById('time-display');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const lapBtn = document.getElementById('lap-btn');
  const resetBtn = document.getElementById('reset-btn');
  const lapListEl = document.getElementById('lap-list');
  const lapCountEl = document.getElementById('lap-count');

  // ── State ───────────────────────────────────────────────────────
  let startTime = 0;
  let elapsedTime = 0;
  let savedElapsed = 0;
  let timerInterval = null;
  let isRunning = false;
  let laps = [];

  // ── Constants ───────────────────────────────────────────────────
  const STORAGE_KEY = 'stopwatch_laps';
  const STORAGE_ELAPSED_KEY = 'stopwatch_elapsed';

  // ── Utility Functions ───────────────────────────────────────────

  /**
   * Formats a millisecond value into HH:MM:SS:ms string.
   * @param {number} ms - Total milliseconds.
   * @returns {string} Formatted time string.
   */
  function formatTime(ms) {
    const totalMs = Math.floor(ms);
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const centiseconds = Math.floor((totalMs % 1000) / 10);

    const pad = (n, digits = 2) => String(n).padStart(digits, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(centiseconds)}`;
  }

  /**
   * Updates the main time display.
   * @param {number} ms - Total milliseconds to display.
   */
  function updateDisplay(ms) {
    if (displayEl) {
      displayEl.textContent = formatTime(ms);
    }
  }

  /**
   * Saves laps to localStorage.
   */
  function saveLaps() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(laps));
    } catch (e) {
      // Storage full or unavailable — silently fail
    }
  }

  /**
   * Loads laps from localStorage.
   * @returns {Array} Array of lap objects.
   */
  function loadLaps() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Saves current elapsed time to localStorage.
   */
  function saveElapsed() {
    try {
      localStorage.setItem(STORAGE_ELAPSED_KEY, String(elapsedTime));
    } catch (e) {
      // Silently fail
    }
  }

  /**
   * Loads saved elapsed time from localStorage.
   * @returns {number} Saved elapsed time in ms.
   */
  function loadElapsed() {
    try {
      const stored = localStorage.getItem(STORAGE_ELAPSED_KEY);
      return stored ? Number(stored) : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Creates a lap entry DOM element.
   * @param {number} index - Lap number (1-based).
   * @param {number} lapTime - Time for this lap in ms.
   * @param {number} totalTime - Total elapsed time at this lap in ms.
   * @returns {HTMLElement} The created lap element.
   */
  function createLapElement(index, lapTime, totalTime) {
    const lapItem = document.createElement('li');
    lapItem.className = 'lap-item';
    lapItem.setAttribute('data-lap', index);

    const lapNumber = document.createElement('span');
    lapNumber.className = 'lap-number';
    lapNumber.textContent = `Lap ${index}`;

    const lapDuration = document.createElement('span');
    lapDuration.className = 'lap-duration';
    lapDuration.textContent = formatTime(lapTime);

    const lapTotal = document.createElement('span');
    lapTotal.className = 'lap-total';
    lapTotal.textContent = formatTime(totalTime);

    lapItem.appendChild(lapNumber);
    lapItem.appendChild(lapDuration);
    lapItem.appendChild(lapTotal);

    return lapItem;
  }

  /**
   * Renders all laps to the DOM.
   */
  function renderLaps() {
    if (!lapListEl) return;

    lapListEl.innerHTML = '';

    for (let i = 0; i < laps.length; i++) {
      const lap = laps[i];
      const lapEl = createLapElement(i + 1, lap.duration, lap.total);
      lapListEl.appendChild(lapEl);
    }

    // Scroll to bottom to show latest lap
    if (lapListEl.scrollHeight > lapListEl.clientHeight) {
      lapListEl.scrollTop = lapListEl.scrollHeight;
    }

    if (lapCountEl) {
      lapCountEl.textContent = laps.length;
    }
  }

  /**
   * Updates button states based on current stopwatch state.
   */
  function updateButtonStates() {
    if (startBtn) {
      startBtn.disabled = isRunning;
      startBtn.classList.toggle('active', !isRunning);
    }
    if (pauseBtn) {
      pauseBtn.disabled = !isRunning;
      pauseBtn.classList.toggle('active', isRunning);
    }
    if (lapBtn) {
      lapBtn.disabled = !isRunning;
      lapBtn.classList.toggle('active', isRunning);
    }
    if (resetBtn) {
      resetBtn.disabled = isRunning || elapsedTime === 0;
      resetBtn.classList.toggle('active', !isRunning && elapsedTime > 0);
    }
  }

  // ── Core Stopwatch Functions ────────────────────────────────────

  /**
   * Starts the stopwatch.
   */
  function start() {
    if (isRunning) return;

    isRunning = true;
    startTime = performance.now();
    savedElapsed = elapsedTime;

    timerInterval = setInterval(function () {
      elapsedTime = savedElapsed + (performance.now() - startTime);
      updateDisplay(elapsedTime);
    }, 10);

    updateButtonStates();
  }

  /**
   * Pauses the stopwatch.
   */
  function pause() {
    if (!isRunning) return;

    isRunning = false;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    elapsedTime = savedElapsed + (performance.now() - startTime);
    updateDisplay(elapsedTime);
    saveElapsed();

    updateButtonStates();
  }

  /**
   * Records a lap.
   */
  function recordLap() {
    if (!isRunning) return;

    const currentTotal = savedElapsed + (performance.now() - startTime);
    const previousTotal = laps.length > 0 ? laps[laps.length - 1].total : 0;
    const lapDuration = currentTotal - previousTotal;

    const lap = {
      duration: lapDuration,
      total: currentTotal,
      timestamp: Date.now()
    };

    laps.push(lap);
    renderLaps();
    saveLaps();
  }

  /**
   * Resets the stopwatch.
   */
  function reset() {
    if (isRunning) return;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    isRunning = false;
    startTime = 0;
    elapsedTime = 0;
    savedElapsed = 0;