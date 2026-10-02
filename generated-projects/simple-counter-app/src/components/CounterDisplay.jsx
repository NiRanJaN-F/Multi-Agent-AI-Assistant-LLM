import React, { useEffect } from 'react';

export default function CounterDisplay({ count, step, history }) {
  // Determine color theme based on value
  const getBadgeStyle = () => {
    if (count > 0) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (count < 0) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
  };

  const getStatusText = () => {
    if (count > 0) return 'Positive Momentum';
    if (count < 0) return 'Negative Deviation';
    return 'Equilibrium / Zero State';
  };

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [count]);

  // Calculate statistics for history
  const maxVal = history.length > 0 ? Math.max(...history) : count;
  const minVal = history.length > 0 ? Math.min(...history) : count;
  const avgVal = history.length > 0 
    ? (history.reduce((a, b) => a + b, 0) / history.length).toFixed(1) 
    : count;

  return (
    <div className="space-y-6">
      {/* Main Display Glass Card */}
      <div className="relative group rounded-3xl p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10">
        
        {/* Absolute ambient glow behind the number */}
        <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

        {/* Top bar info inside display */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors duration-300 shadow-sm">
            <span className={`w-2 h-2 rounded-full animate-pulse ${count > 0 ? 'bg-emerald-500' : count < 0 ? 'bg-rose-500' : 'bg-indigo-500'}`}></span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{getStatusText()}</span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <i data-lucide="zap" className="w-3.5 h-3.5 text-amber-500"></i>
            <span>Step Size: <strong className="text-slate-900 dark:text-white">±{step}</strong></span>
          </div>
        </div>

        {/* The Big Counter Number */}
        <div className="text-center py-6 select-none">
          <div className="text-7xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent drop-shadow-sm transition-transform duration-200 hover:scale-105">
            {count}
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-3 font-semibold">
            Current Quantum Value
          </p>
        </div>

        {/* Mini stats footer inside card */}
        <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Peak High</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{maxVal}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Average</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{avgVal}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Peak Low</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{minVal}</span>
          </div>
        </div>

      </div>

      {/* History Stream Widget */}
      <div className="rounded-2xl p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <i data-lucide="activity" className="w-4 h-4 text-indigo-500"></i>
            <span>Recent Sequence Stream</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
            {history.length} states recorded
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none min-h-[44px]">
          {history.length === 0 ? (
            <span className="text-xs text-slate-400 italic py-2">No history recorded yet. Interact with the counter to begin tracing.</span>
          ) : (
            history.slice(-10).reverse().map((val, idx) => (
              <div 
                key={idx}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-300 animate-fadeIn ${
                  idx === 0 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {val > 0 ? `+${val}` : val}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}