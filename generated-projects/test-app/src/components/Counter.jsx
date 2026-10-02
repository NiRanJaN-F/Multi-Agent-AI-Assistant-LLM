import React, { useState, useEffect } from 'react';

export default function Counter({
  id = 'default',
  title = 'Quantum Counter',
  category = 'general',
  initialValue = 0,
  step = 1,
  min = -9999,
  max = 99999,
  onUpdate = () => {}
}) {
  const [count, setCount] = useState(initialValue);
  const [customStep, setCustomStep] = useState(step);
  const [isAnimating, setIsAnimating] = useState(false);
  const [historyLog, setHistoryLog] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isTargetReached, setIsTargetReached] = useState(false);
  const targetValue = 50; // milestone example

  useEffect(() => {
    if (count >= targetValue && !isTargetReached) {
      setIsTargetReached(true);
    } else if (count < targetValue && isTargetReached) {
      setIsTargetReached(false);
    }
  }, [count, targetValue, isTargetReached]);

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleIncrement = () => {
    if (count + customStep <= max) {
      const nextVal = count + customStep;
      setCount(nextVal);
      triggerAnimation();
      addLog(`Incremented +${customStep}`, nextVal);
      onUpdate(id, nextVal);
    }
  };

  const handleDecrement = () => {
    if (count - customStep >= min) {
      const nextVal = count - customStep;
      setCount(nextVal);
      triggerAnimation();
      addLog(`Decremented -${customStep}`, nextVal);
      onUpdate(id, nextVal);
    }
  };

  const handleReset = () => {
    setCount(initialValue);
    triggerAnimation();
    addLog('Reset counter', initialValue);
    onUpdate(id, initialValue);
  };

  const addLog = (action, val) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistoryLog(prev => [{ id: Date.now(), action, value: val, time: timeStr }, ...prev.slice(0, 9)]);
  };

  return (
    <div className="relative group rounded-3xl bg-slate-900/80 border border-slate-800/80 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500"></div>

      {/* Top Meta Info */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 font-semibold text-xs border border-indigo-500/20">
            {category.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h3 className="font-semibold text-slate-100 text-base tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400">ID: {id}</p>
          </div>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
            showHistory 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Toggle Activity Log"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Main Counter Display */}
      <div className="my-6 text-center z-10 relative">
        <div className={`text-6xl sm:text-7xl font-black tracking-tighter bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent transition-transform duration-200 ${isAnimating ? 'scale-110 text-indigo-400' : 'scale-100'}`}>
          {count}
        </div>
        {isTargetReached && (
          <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 animate-pulse">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Target Milestone Reached ({targetValue})
          </div>
        )}
      </div>

      {/* History Drawer Overlay or Panel */}
      {showHistory && (
        <div className="mb-4 bg-slate-950/90 rounded-2xl p-4 border border-slate-800 text-xs max-h-40 overflow-y-auto custom-scrollbar animate-fadeIn z-20">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-semibold text-slate-300">
            <span>Recent Activity</span>
            <span className="text-[10px] text-slate-500">{historyLog.length} events</span>
          </div>
          {historyLog.length === 0 ? (
            <p className="text-slate-500 text-center py-2">No actions recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {historyLog.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-slate-400">
                  <span className="truncate max-w-[140px] text-slate-300">{log.action}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-mono font-bold">val: {log.value}</span>
                    <span className="text-[10px] text-slate-600">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step Adjuster and Controls */}
      <div className="space-y-4 z-10">
        <div className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded-2xl border border-slate-800/60">
          <span className="text-xs text-slate-400 font-medium pl-1">Step Increment:</span>
          <div className="flex items-center gap-1">
            {[1, 5, 10, 25].map((s) => (
              <button
                key={s}
                onClick={() => setCustomStep(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  customStep === s
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                +{s}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleDecrement}
            className="flex items-center justify-center py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold transition-all shadow-lg border border-slate-700/50 group"
            title={`Subtract ${customStep}`}
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
            </svg>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center justify-center py-3 px-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-slate-200 font-medium text-xs transition-all border border-slate-800"
            title="Reset Counter"
          >
            Reset
          </button>

          <button
            onClick={handleIncrement}
            className="flex items-center justify-center py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white font-bold transition-all shadow-lg shadow-indigo-600/25 border border-indigo-500/30 group"
            title={`Add ${customStep}`}
          >
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}