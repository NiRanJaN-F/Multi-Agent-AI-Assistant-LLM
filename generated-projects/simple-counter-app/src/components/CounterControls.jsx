import React, { useEffect } from 'react';

export default function CounterControls({ 
  onIncrement, 
  onDecrement, 
  onReset, 
  step, 
  onStepChange, 
  minLimit, 
  maxLimit, 
  onMinLimitChange, 
  onMaxLimitChange,
  count,
  disabled
}) {
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onDecrement}
          disabled={disabled || (minLimit !== '' && count - Number(step || 1) < Number(minLimit))}
          className="group relative inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-rose-600 to-pink-600 rounded-2xl shadow-lg shadow-rose-600/25 hover:shadow-rose-600/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none transition-all duration-200 overflow-hidden"
          title="Decrease Count"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <i data-lucide="minus" className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110"></i>
          <span>Decrease (-{step || 1})</span>
        </button>

        <button
          onClick={onReset}
          disabled={disabled}
          className="group relative inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200"
          title="Reset Count to Zero"
        >
          <i data-lucide="rotate-ccw" className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400 transition-transform duration-200 group-hover:-rotate-90"></i>
          <span>Reset</span>
        </button>

        <button
          onClick={onIncrement}
          disabled={disabled || (maxLimit !== '' && count + Number(step || 1) > Number(maxLimit))}
          className="group relative inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none transition-all duration-200 overflow-hidden"
          title="Increase Count"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <span>Increase (+{step || 1})</span>
          <i data-lucide="plus" className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:scale-110"></i>
        </button>
      </div>

      {/* Advanced Configuration Panel */}
      <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <i data-lucide="sliders" className="w-4 h-4"></i>
          <span>Configuration Suite</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Step Increment
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="zap" className="w-4 h-4"></i>
              </div>
              <input
                type="number"
                min="1"
                value={step}
                onChange={(e) => onStepChange(e.target.value)}
                placeholder="1"
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Min Limit Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Minimum Limit
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="arrow-down-left" className="w-4 h-4"></i>
              </div>
              <input
                type="number"
                value={minLimit}
                onChange={(e) => onMinLimitChange(e.target.value)}
                placeholder="No limit"
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Max Limit Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
              Maximum Limit
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="arrow-up-right" className="w-4 h-4"></i>
              </div>
              <input
                type="number"
                value={maxLimit}
                onChange={(e) => onMaxLimitChange(e.target.value)}
                placeholder="No limit"
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}