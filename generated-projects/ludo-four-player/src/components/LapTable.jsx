import React, { useEffect } from 'react';

export default function LapTable({ laps }) {
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [laps]);

  if (!laps || laps.length === 0) {
    return (
      <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 text-center shadow-xl shadow-black/20">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-4 text-slate-500 shadow-inner">
          <i data-lucide="flag" className="w-5 h-5"></i>
        </div>
        <h3 className="text-slate-300 font-medium text-sm mb-1">No laps recorded yet</h3>
        <p className="text-slate-500 text-xs">Press the "Lap" button while the stopwatch is running to record split times.</p>
      </div>
    );
  }

  // Calculate fastest and slowest laps if more than 1 lap exists
  const lapTimes = laps.map(l => l.lapTime);
  const minTime = Math.min(...lapTimes);
  const maxTime = Math.max(...lapTimes);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-slate-950/60 backdrop-blur-xl border border-slate-950/90 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 flex flex-col">
      <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <i data-lucide="flag" className="w-3.5 h-3.5"></i>
          </div>
          <h3 className="font-semibold text-slate-200 text-sm tracking-wide">Lap History</h3>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60">
          {laps.length} {laps.length === 1 ? 'Lap' : 'Laps'}
        </span>
      </div>

      <div className="overflow-x-auto max-h-[320px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-md text-slate-400 text-xs uppercase font-mono tracking-wider border-b border-slate-800/80 z-10">
            <tr>
              <th className="py-3 px-6 font-semibold w-24">Lap</th>
              <th className="py-3 px-6 font-semibold">Lap Time</th>
              <th className="py-3 px-6 font-semibold text-right">Total Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/80 text-sm font-mono">
            {laps.map((lap, index) => {
              const isFastest = laps.length > 1 && lap.lapTime === minTime;
              const isSlowest = laps.length > 1 && lap.lapTime === maxTime;

              let rowBadge = null;
              let timeColor = "text-slate-300";

              if (isFastest) {
                rowBadge = (
                  <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                    Fastest
                  </span>
                );
                timeColor = "text-emerald-400 font-medium";
              } else if (isSlowest) {
                rowBadge = (
                  <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-500/5">
                    Slowest
                  </span>
                );
                timeColor = "text-rose-400 font-medium";
              }

              return (
                <tr 
                  key={lap.id} 
                  className="hover:bg-slate-900/40 transition-colors duration-150 group"
                >
                  <td className="py-3.5 px-6 text-slate-400 font-medium flex items-center">
                    <span className="w-6 inline-block text-slate-500">#{laps.length - index}</span>
                    {rowBadge}
                  </td>
                  <td className={`py-3.5 px-6 ${timeColor}`}>
                    {formatTime(lap.lapTime)}
                  </td>
                  <td className="py-3.5 px-6 text-right text-slate-400">
                    {formatTime(lap.totalTime)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}