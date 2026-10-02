import React, { useState, useEffect } from 'react';
import CounterDisplay from './CounterDisplay';
import CounterControls from './CounterControls';

export default function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);
  const [minLimit, setMinLimit] = useState(-100);
  const [maxLimit, setMaxLimit] = useState(100);
  const [history, setHistory] = useState([0]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [autoIncrementActive, setAutoIncrementActive] = useState(false);
  const [autoInterval, setAutoInterval] = useState(1000);
  const [presetTags, setPresetTags] = useState([1, 5, 10, 25, 50, 100]);
  const [isAnimate, setIsAnimate] = useState(false);
  const [animationType, setAnimationType] = useState('bounce'); // 'bounce', 'pulse', 'shake'
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Play subtle sound feedback (synthesized using Web Audio API)
  const playSound = (type = 'increment') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'increment') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'decrement') {
        osc.frequency.setValueAtTime(660, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(330, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'reset') {
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      }
    } catch (e) {
      // Audio context error fallback
    }
  };

  // Trigger brief CSS animation on value change
  const triggerAnimation = (type = 'bounce') => {
    setAnimationType(type);
    setIsAnimate(false);
    setTimeout(() => setIsAnimate(true), 10);
  };

  // Update history stack
  const updateCountWithHistory = (newVal, anim = 'bounce') => {
    const clamped = Math.max(minLimit, Math.min(maxLimit, newVal));
    if (clamped !== count) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(clamped);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setCount(clamped);
      triggerAnimation(anim);
      if (clamped > count) playSound('increment');
      else playSound('decrement');
    }
  };

  const handleIncrement = () => {
    updateCountWithHistory(count + step, 'bounce');
  };

  const handleDecrement = () => {
    updateCountWithHistory(count - step, 'shake');
  };

  const handleReset = () => {
    if (count !== 0) {
      updateCountWithHistory(0, 'pulse');
      playSound('reset');
    }
  };

  const handleSetSpecific = (val) => {
    updateCountWithHistory(val, 'bounce');
  };

  // Auto-increment / decrement ticker
  useEffect(() => {
    let intervalId = null;
    if (autoIncrementActive) {
      intervalId = setInterval(() => {
        setCount((prevCount) => {
          const nextVal = prevCount + step;
          if (nextVal > maxLimit || nextVal < minLimit) {
            setAutoIncrementActive(false);
            return prevCount;
          }
          return nextVal;
        });
      }, autoInterval);
    }
    return () => clearInterval(intervalId);
  }, [autoIncrementActive, step, maxLimit, minLimit, autoInterval]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'ArrowDown' || e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleDecrement();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [count, step, history, historyIndex]);

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCount(history[newIndex]);
      triggerAnimation('pulse');
      playSound('decrement');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCount(history[newIndex]);
      triggerAnimation('bounce');
      playSound('increment');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Bar Status & Quick Tools */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-400">
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
            <i data-lucide="sliders" className="w-4 h-4"></i>
            <span>Step: {step}</span>
          </span>
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">
            <i data-lucide="shield-alert" className="w-4 h-4"></i>
            <span>Range: [{minLimit} ... {maxLimit}]</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Disable Audio Cues' : 'Enable Audio Cues'}
            className={`p-2 rounded-xl transition-all duration-200 border ${
              soundEnabled
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 shadow-sm shadow-indigo-500/20'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <i data-lucide={soundEnabled ? 'volume-2' : 'volume-x'} className="w-4 h-4"></i>
          </button>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            title="Undo (Ctrl+Z)"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <i data-lucide="rotate-ccw" className="w-4 h-4"></i>
          </button>

          {/* Redo Button */}
          <button
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            title="Redo (Ctrl+Shift+Z)"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <i data-lucide="rotate-cw" className="w-4 h-4"></i>
          </button>
        </div>
      </div>

      {/* Main Counter Hub Card */}
      <div className="relative rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-indigo-500/5 p-6 sm:p-10 overflow-hidden">
        {/* Background decorative glow effects */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-pink-500/10 dark:bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Counter Display Component */}
        <CounterDisplay
          count={count}
          minLimit={minLimit}
          maxLimit={maxLimit}
          isAnimate={isAnimate}
          animationType={animationType}
        />

        {/* Counter Controls Component */}
        <CounterControls
          count={count}
          step={step}
          minLimit={minLimit}
          maxLimit={maxLimit}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onReset={handleReset}
          setStep={setStep}
          setMinLimit={setMinLimit}
          setMaxLimit={setMaxLimit}
          autoIncrementActive={autoIncrementActive}
          setAutoIncrementActive={setAutoIncrementActive}
          autoInterval={autoInterval}
          setAutoInterval={setAutoInterval}
          presetTags={presetTags}
          setPresetTags={setPresetTags}
          onSetSpecific={handleSetSpecific}
        />
      </div>

      {/* Keyboard Shortcut Hint Footer */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 space-x-4">
        <span>💡 Pro-tip: Use <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">↑</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">↓</kbd> to step</span>
        <span>•</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">R</kbd> to reset</span>
        <span>•</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">Ctrl+Z</kbd> to undo</span>
      </div>
    </div>
  );
}