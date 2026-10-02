import React, { useEffect, useRef } from 'react';

export default function KpiCard(props) {
  const item = props?.data || props || {};
  const { 
    title = item.title || '', 
    value = item.value || '', 
    change = item.change || '', 
    isPositive = item.isPositive ?? true, 
    icon = item.icon || 'activity', 
    period = item.period || item.timeframe || 'vs last month' 
  } = item;

  const iconContainerRef = useRef(null);

  useEffect(() => {
    // Re-initialize Lucide icons if loaded globally
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }, [icon]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      {/* Subtle top border gradient accent on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div 
          ref={iconContainerRef}
          className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm"
        >
          <i data-lucide={icon} className="w-5 h-5"></i>
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
          <div className="flex items-center gap-1.5 mt-2">
            <span 
              className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                isPositive 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}
            >
              <i 
                data-lucide={isPositive ? 'trending-up' : 'trending-down'} 
                className="w-3.5 h-3.5"
              ></i>
              {change}
            </span>
            <span className="text-xs text-slate-400 font-medium">{period}</span>
          </div>
        </div>
      </div>

      {/* Decorative background glow circle */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-50/50 rounded-full blur-xl group-hover:bg-indigo-100/60 transition-colors pointer-events-none"></div>
    </div>
  );
}