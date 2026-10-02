import React from 'react';

export default function Controls({ 
  isRunning, 
  onStart, 
  onPause, 
  onReset, 
  onLap, 
  hasStarted 
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto my-6">
      {/* Lap / Reset Button */}
      <button
        onClick={isRunning ? onLap : onReset}
        disabled={!hasStarted && !isRunning}
        className={`w-full sm:w-36 h-14 rounded-2xl font-medium tracking-wide transition-all duration-300 flex items-center justify-center space-x-2 border shadow-lg ${
          !hasStarted && !isRunning
            ? 'bg-slate-900/40 text-slate-600 border-slate-800/40 cursor-not-allowed shadow-none'
            : isRunning
            ? 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white hover:border-slate-600 active:scale-95 shadow-slate-950/20'
            : 'bg-slate-900/80 text-rose-400 border-rose-500/20 hover:bg-rose-500/10 hover:border-rose-500/40 active:scale-95 shadow-rose-950/10'
        }`}
      >
        {isRunning ? (
          <>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">Lap</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-semibold">Reset</span>
          </>
        )}
      </button>

      {/* Start / Pause Main Action Button */}
      {isRunning ? (
        <button
          onClick={onPause}
          className="w-full sm:flex-1 h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold tracking-wide shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 border border-amber-400/30"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 9v6m4-6v6" />
          </svg>
          <span className="text-lg">Pause</span>
        </button>
      ) : (
        <button
          onClick={onStart}
          className="w-full sm:flex-1 h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold tracking-wide shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:brightness-110 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 border border-cyan-400/30"
        >
          <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="text-lg">{hasStarted ? 'Resume' : 'Start'}</span>
        </button>
      )}
    </div>
  );
}