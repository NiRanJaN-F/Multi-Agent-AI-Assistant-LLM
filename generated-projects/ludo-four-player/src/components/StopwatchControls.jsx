import React, { useEffect } from 'react';

export default function StopwatchControls({
  isRunning,
  time,
  start,
  pause,
  reset,
  lap,
}) {
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [isRunning, time]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto my-6 px-4">
      {/* Reset / Lap Button */}
      <button
        onClick={time === 0 ? undefined : isRunning ? lap : reset}
        disabled={time === 0}
        className={`w-full sm:w-1/2 h-14 rounded-2xl font-medium tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 border ${
          time === 0
            ? 'bg-slate-900/30 border-slate-800/50 text-slate-600 cursor-not-allowed'
            : isRunning
            ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white shadow-lg shadow-black/40 active:scale-[0.98]'
            : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white shadow-lg shadow-black/40 active:scale-[0.98]'
        }`}
        title={isRunning ? "Record Lap" : "Reset Stopwatch"}
      >
        {isRunning ? (
          <>
            <i data-lucide="flag" className="w-5 h-5 text-indigo-400"></i>
            <span>Lap</span>
          </>
        ) : (
          <>
            <i data-lucide="rotate-ccw" className="w-5 h-5 text-slate-400"></i>
            <span>Reset</span>
          </>
        )}
      </button>

      {/* Start / Pause Button */}
      {isRunning ? (
        <button
          onClick={pause}
          className="w-full sm:w-1/2 h-14 rounded-2xl font-medium tracking-wide flex items-center justify-center space-x-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10 transition-all duration-300 active:scale-[0.98]"
          title="Pause Stopwatch"
        >
          <i data-lucide="pause" className="w-5 h-5 fill-current"></i>
          <span>Pause</span>
        </button>
      ) : (
        <button
          onClick={start}
          className="w-full sm:w-1/2 h-14 rounded-2xl font-medium tracking-wide flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/25 border border-indigo-400/30 transition-all duration-300 active:scale-[0.98]"
          title="Start Stopwatch"
        >
          <i data-lucide="play" className="w-5 h-5 fill-current"></i>
          <span>Start</span>
        </button>
      )}
    </div>
  );
}