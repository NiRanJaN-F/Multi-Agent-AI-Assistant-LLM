import React from 'react';

/**
 * LapList Component
 * Displays recorded laps and split times with analytics (fastest/slowest lap highlights)
 * and options to clear laps or export data.
 */
export default function LapList({ laps, onClear }) {
  if (!laps || laps.length === 0) {
    return (
      <div className="w-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-8 text-center shadow-xl">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-slate-300 font-medium text-sm">No Laps Recorded</h3>
        <p className="text-slate-500 text-xs mt-1">Press the "Lap" button while the stopwatch is running to record splits.</p>
      </div>
    );
  }

  // Calculate fastest and slowest laps when there are 2 or more laps
  let fastestIndex = -1;
  let slowestIndex = -1;

  if (laps.length > 1) {
    let minTime = Infinity;
    let maxTime = -1;

    laps.forEach((lap, idx) => {
      if (lap.lapTime < minTime) {
        minTime = lap.lapTime;
        fastestIndex = idx;
      }
      if (lap.lapTime > maxTime) {
        maxTime = lap.lapTime;
        slowestIndex = idx;
      }
    });
  }

  const formatTime = (timeInMs) => {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    const milliseconds = Math.floor((timeInMs % 1000) / 10);

    return {
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      milliseconds: String(milliseconds).padStart(2, '0')
    };
  };

  const handleExportCSV = () => {
    const headers = 'Lap,Lap Time,Total Time\n';
    const rows = laps
      .slice()
      .reverse()
      .map((lap, idx) => {
        const lapNum = laps.length - idx;
        const lt = formatTime(lap.lapTime);
        const tt = formatTime(lap.totalTime);
        return `${lapNum},${lt.minutes}:${lt.seconds}.${lt.milliseconds},${tt.minutes}:${tt.seconds}.${tt.milliseconds}`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chronocraft-laps-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden flex flex-col">
      {/* Header with stats & actions */}
      <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-slate-200 tracking-wide text-sm flex items-center">
            <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Lap History
            <span className="ml-2.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-800 text-cyan-400 border border-slate-700/60">
              {laps.length}
            </span>
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            title="Export Laps as CSV"
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            onClick={onClear}
            title="Reset All Laps"
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Laps Table / Scroll Container */}
      <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-slate-800/40">
        <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md px-6 py-2.5 grid grid-cols-3 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider z-10 border-b border-slate-800/80">
          <div>Lap</div>
          <div className="text-center">Lap Time</div>
          <div className="text-right">Total Time</div>
        </div>

        {laps.map((lap, index) => {
          const lapNum = laps.length - index;
          const lapTimeFormatted = formatTime(lap.lapTime);
          const totalTimeFormatted = formatTime(lap.totalTime);

          const isFastest = index === fastestIndex;
          const isSlowest = index === slowestIndex;

          let badgeStyles = '';
          let rowHighlight = '';

          if (isFastest) {
            badgeStyles = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
            rowHighlight = 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]';
          } else if (isSlowest) {
            badgeStyles = 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
            rowHighlight = 'bg-rose-500/[0.03] hover:bg-rose-500/[0.06]';
          } else {
            rowHighlight = 'hover:bg-slate-800/30';
          }

          return (
            <div
              key={lap.id || lapNum}
              className={`px-6 py-3 grid grid-cols-3 items-center text-sm font-mono transition-colors ${rowHighlight}`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-slate-300 font-medium">Lap {lapNum}</span>
                {isFastest && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans tracking-wide font-semibold ${badgeStyles}`}>
                    Fastest
                  </span>
                )}
                {isSlowest && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans tracking-wide font-semibold ${badgeStyles}`}>
                    Slowest
                  </span>
                )}
              </div>

              <div className={`text-center font-semibold ${isFastest ? 'text-emerald-400' : isSlowest ? 'text-rose-400' : 'text-cyan-400'}`}>
                +{lapTimeFormatted.minutes}:{lapTimeFormatted.seconds}.
                <span className="text-xs opacity-80">{lapTimeFormatted.milliseconds}</span>
              </div>

              <div className="text-right text-slate-300">
                {totalTimeFormatted.minutes}:{totalTimeFormatted.seconds}.
                <span className="text-xs opacity-70">{totalTimeFormatted.milliseconds}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}