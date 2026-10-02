import React, { useEffect, useRef } from 'react';

export default function CategoryChart({ transactions = [], categoryBreakdown = {} }) {
  const chartRef = useRef(null);

  // Fallback calculations if breakdown isn't directly supplied
  const breakdown = Object.keys(categoryBreakdown).length > 0
    ? categoryBreakdown
    : transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
          return acc;
        }, {});

  const entries = Object.entries(breakdown);
  const totalExpense = entries.reduce((sum, [, val]) => sum + val, 0);

  // Modern soft color palette for categories
  const COLORS = [
    'bg-indigo-500 text-indigo-500',
    'bg-rose-500 text-rose-500',
    'bg-amber-500 text-amber-500',
    'bg-emerald-500 text-emerald-500',
    'bg-sky-500 text-sky-500',
    'bg-purple-500 text-purple-500',
    'bg-teal-500 text-teal-500',
    'bg-orange-500 text-orange-500',
  ];

  const HEX_COLORS = [
    '#6366f1', // indigo
    '#f43f5e', // rose
    '#f59e0b', // amber
    '#10b981', // emerald
    '#0ea5e9', // sky
    '#a855f7', // purple
    '#14b8a6', // teal
    '#f97316', // orange
  ];

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [entries]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Category Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">Expense distribution by category</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
            <i data-lucide="pie-chart" className="w-5 h-5"></i>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
              <i data-lucide="donut" className="w-8 h-8"></i>
            </div>
            <p className="text-sm font-medium text-slate-600">No expense data yet</p>
            <p className="text-xs text-slate-400 mt-1">Add transactions to view category analytics</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Visual multi-segment progress bar representing the whole */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-0.5">
              {entries.map(([category, amount], index) => {
                const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                const hexColor = HEX_COLORS[index % HEX_COLORS.length];
                return (
                  <div
                    key={category}
                    style={{ width: `${percentage}%`, backgroundColor: hexColor }}
                    className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 hover:opacity-90 cursor-pointer"
                    title={`${category}: $${amount.toFixed(2)} (${percentage.toFixed(1)}%)`}
                  />
                );
              })}
            </div>

            {/* Detailed list with custom color indicators */}
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
              {entries.map(([category, amount], index) => {
                const percentage = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;
                const hexColor = HEX_COLORS[index % HEX_COLORS.length];

                return (
                  <div
                    key={category}
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-all border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-md shadow-sm shrink-0"
                        style={{ backgroundColor: hexColor }}
                      ></div>
                      <div>
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {category}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-medium text-slate-400">{percentage}% of total</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">
                        ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {entries.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <i data-lucide="layers" className="w-3.5 h-3.5 text-indigo-500"></i>
            {entries.length} Active Categories
          </span>
          <span className="font-semibold text-slate-900">
            Total: ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}