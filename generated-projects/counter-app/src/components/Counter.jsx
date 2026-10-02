import React, { useState, useEffect, useRef } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);
  const [history, setHistory] = useState([0]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [autoIncrementActive, setAutoIncrementActive] = useState(false);
  const [autoIncrementSpeed, setAutoIncrementSpeed] = useState(1000); // ms
  const [maxRecord, setMaxRecord] = useState(0);
  const [minRecord, setMinRecord] = useState(0);
  const [milestones, setMilestones] = useState([10, 50, 100, 500, 1000]);
  const [newMilestoneInput, setNewMilestoneInput] = useState('');
  const [unlockedMilestones, setUnlockedMilestones] = useState(new Set());
  const [toastMessage, setToastMessage] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const autoIncRef = useRef(null);

  // Show Toast helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Update records & check milestones when count changes
  useEffect(() => {
    if (count > maxRecord) setMaxRecord(count);
    if (count < minRecord) setMinRecord(count);

    // Check count for 10 alert as requested
    if (count === 10) {
      window.alert('Count has reached 10!');
    }

    // Check milestones
    milestones.forEach((m) => {
      if (count >= m && !unlockedMilestones.has(m)) {
        setUnlockedMilestones((prev) => new Set(prev).add(m));
        triggerToast(`🎉 Milestone Unlocked: Reached ${m}!`);
      }
    });
  }, [count, milestones, unlockedMilestones, maxRecord, minRecord]);

  // Handle auto-increment interval
  useEffect(() => {
    if (autoIncrementActive) {
      autoIncRef.current = setInterval(() => {
        setCount((prevCount) => {
          const nextVal = prevCount + step;
          // record history
          pushHistory(nextVal);
          return nextVal;
        });
      }, autoIncrementSpeed);
    } else {
      if (autoIncRef.current) clearInterval(autoIncRef.current);
    }
    return () => {
      if (autoIncRef.current) clearInterval(autoIncRef.current);
    };
  }, [autoIncrementActive, autoIncrementSpeed, step]);

  const pushHistory = (newVal) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newVal];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleIncrement = () => {
    const nextVal = count + step;
    setCount(nextVal);
    pushHistory(nextVal);
    setAnimKey((k) => k + 1);
  };

  const handleDecrement = () => {
    const nextVal = count - step;
    setCount(nextVal);
    pushHistory(nextVal);
    setAnimKey((k) => k + 1);
  };

  const handleReset = () => {
    setCount(0);
    pushHistory(0);
    setAnimKey((k) => k + 1);
    setAutoIncrementActive(false);
    triggerToast('Counter reset to 0');
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setCount(history[newIdx]);
      setAnimKey((k) => k + 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setCount(history[newIdx]);
      setAnimKey((k) => k + 1);
    }
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    const val = parseInt(newMilestoneInput, 10);
    if (!isNaN(val) && !milestones.includes(val)) {
      const updated = [...milestones, val].sort((a, b) => a - b);
      setMilestones(updated);
      setNewMilestoneInput('');
      triggerToast(`Milestone ${val} added!`);
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-8 pb-12 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 z-50 animate-bounce bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl border border-indigo-400/30 flex items-center space-x-2 backdrop-blur-md">
          <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Main Counter Card */}
      <div className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
        {/* Ambient card glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/25 transition-all duration-700" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/25 transition-all duration-700" />

        {/* Step Size Selector */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 gap-3">
          <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Step Increment Size:
          </span>
          <div className="flex items-center gap-2">
            {[1, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  step === s
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                +{s}
              </button>
            ))}
          </div>
        </div>

        {/* Counter Display & Controls Section */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="text-6xl sm:text-8xl font-black tracking-tight text-white font-mono drop-shadow-md">
            {count}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleDecrement}
              className="px-6 py-3 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 font-bold text-xl transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
            >
              -{step}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-sm transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
            >
              Reset
            </button>
            <button
              onClick={handleIncrement}
              className="px-6 py-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-bold text-xl transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
            >
              +{step}
            </button>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                historyIndex === 0
                  ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                historyIndex === history.length - 1
                  ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Redo
            </button>
          </div>
        </div>

        {/* Stats & Milestones Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Statistics</span>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-400">Max: <strong className="text-slate-200">{maxRecord}</strong></span>
              <span className="text-slate-400">Min: <strong className="text-slate-200">{minRecord}</strong></span>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Milestones</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {milestones.map((m) => (
                <span
                  key={m}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    unlockedMilestones.has(m)
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}