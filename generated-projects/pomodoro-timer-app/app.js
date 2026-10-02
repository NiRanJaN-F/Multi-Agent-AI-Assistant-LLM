// app.js – Pomodoro Timer
// Vanilla JS (ES6+)

(() => {
    // ---------- Default Settings ----------
    const DEFAULTS = {
        workDuration: 25 * 60,      // seconds
        breakDuration: 5 * 60,
        longBreakDuration: 15 * 60,
        sessionsBeforeLongBreak: 4
    };

    // ---------- State ----------
    let timerInterval = null;
    let remainingSeconds = 0;
    let currentMode = 'work'; // 'work' | 'break' | 'longBreak'
    let isPaused = false;
    let sessionCount = 0; // completed work sessions

    // ---------- DOM Elements ----------
    const $timerDisplay = document.getElementById('timer-display');
    const $sessionCounter = document.getElementById('session-counter');
    const $startBtn = document.getElementById('start-btn');
    const $pauseBtn = document.getElementById('pause-btn');
    const $resetBtn = document.getElementById('reset-btn');
    const $settingsForm = document.getElementById('settings-form');
    const $workInput = document.getElementById('work-duration');
    const $breakInput = document.getElementById('break-duration');
    const $longBreakInput = document.getElementById('long-break-duration');
    const $sessionsBeforeLongInput = document.getElementById('sessions-before-long');

    // ---------- Utility ----------
    const formatTime = sec => {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    const saveState = () => {
        const state = {
            settings: {
                workDuration: DEFAULTS.workDuration,
                breakDuration: DEFAULTS.breakDuration,
                longBreakDuration: DEFAULTS.longBreakDuration,
                sessionsBeforeLongBreak: DEFAULTS.sessionsBeforeLongBreak
            },
            sessionCount,
            currentMode,
            remainingSeconds,
            isPaused
        };
        localStorage.setItem('pomodoroState', JSON.stringify(state));
    };

    const loadState = () => {
        const raw = localStorage.getItem('pomodoroState');
        if (!raw) return;
        try {
            const state = JSON.parse(raw);
            if (state.settings) {
                DEFAULTS.workDuration = Number(state.settings.workDuration) || DEFAULTS.workDuration;
                DEFAULTS.breakDuration = Number(state.settings.breakDuration) || DEFAULTS.breakDuration;
                DEFAULTS.longBreakDuration = Number(state.settings.longBreakDuration) || DEFAULTS.longBreakDuration;
                DEFAULTS.sessionsBeforeLongBreak = Number(state.settings.sessionsBeforeLongBreak) || DEFAULTS.sessionsBeforeLongBreak;
            }
            sessionCount = Number(state.sessionCount) || 0;
            currentMode = state.currentMode || 'work';
            remainingSeconds = Number(state.remainingSeconds) || getCurrentModeDuration();
            isPaused = !!state.isPaused;
        } catch (_) {
            // ignore malformed data
        }
    };

    const getCurrentModeDuration = () => {
        switch (currentMode) {
            case 'work': return DEFAULTS.workDuration;
            case 'break': return DEFAULTS.breakDuration;
            case 'longBreak': return DEFAULTS.longBreakDuration;
            default: return DEFAULTS.workDuration;
        }
    };

    const updateDisplay = () => {
        $timerDisplay.textContent = formatTime(remainingSeconds);
        $sessionCounter.textContent = `Sessions: ${sessionCount}`;
        $startBtn.disabled = timerInterval !== null && !isPaused;
        $pauseBtn.disabled = timerInterval === null;
        $resetBtn.disabled = timerInterval === null && remainingSeconds === getCurrentModeDuration();
    };

    // ---------- Timer Logic ----------
    const tick = () => {
        if (remainingSeconds > 0) {
            remainingSeconds--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            handleModeTransition();
            startTimer(); // auto‑start next period
        }
    };

    const startTimer = () => {
        if (timerInterval) return; // already running
        if (isPaused) {
            // resume from pause
            isPaused = false;
        } else {
            // fresh start for current mode
            remainingSeconds = getCurrentModeDuration();
        }
        timerInterval = setInterval(tick, 1000);
        updateDisplay();
    };

    const pauseTimer = () => {
        if (!timerInterval) return;
        clearInterval(timerInterval);
        timerInterval = null;
        isPaused = true;
        updateDisplay();
    };

    const resetTimer = () => {
        clearInterval(timerInterval);
        timerInterval = null;
        isPaused = false;
        currentMode = 'work';
        remainingSeconds = DEFAULTS.workDuration;
        sessionCount = 0;
        updateDisplay();
        saveState();
    };

    const handleModeTransition = () => {
        if (currentMode === 'work') {
            sessionCount++;
            if (sessionCount % DEFAULTS.sessionsBeforeLongBreak === 0) {
                currentMode = 'longBreak';
            } else {
                currentMode = 'break';
            }
        } else {
            currentMode = 'work';
        }
        remainingSeconds = getCurrentModeDuration();
        updateDisplay();
    };

    // ---------- Settings ----------
    const applySettings = (e) => {
        e.preventDefault();
        const w = Number($workInput.value) * 60;
        const b = Number($breakInput.value) * 60;
        const lb = Number($longBreakInput.value) * 60;
        const sb = Number($sessionsBeforeLongInput.value);

        if (w > 0) DEFAULTS.workDuration = w;
        if (b > 0) DEFAULTS.breakDuration = b;
        if (lb > 0) DEFAULTS.longBreakDuration = lb;
        if (sb > 0) DEFAULTS.sessionsBeforeLongBreak = sb;

        // If timer not running, reset to new work duration
        if (!timerInterval) {
            currentMode = 'work';
            remainingSeconds = DEFAULTS.workDuration;
            updateDisplay();
        }

        saveState();
    };

    const populateSettingsForm = () => {
        $workInput.value = Math.floor(DEFAULTS.workDuration / 60);
        $breakInput.value = Math.floor(DEFAULTS.breakDuration / 60);
        $longBreakInput.value = Math.floor(DEFAULTS.longBreakDuration / 60);
        $sessionsBeforeLongInput.value = DEFAULTS.sessionsBeforeLongBreak;
    };

    // ---------- Init ----------
    const init = () => {
        loadState();
        populateSettingsForm();
        updateDisplay();

        $startBtn.addEventListener('click', startTimer);
        $pauseBtn.addEventListener('click', pauseTimer);
        $resetBtn.addEventListener('click', resetTimer);
        $settingsForm.addEventListener('submit', applySettings);

        // Persist state on page unload
        window.addEventListener('beforeunload', saveState);
    };

    // Run init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();