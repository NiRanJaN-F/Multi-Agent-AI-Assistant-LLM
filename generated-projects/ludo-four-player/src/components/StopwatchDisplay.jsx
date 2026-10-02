import React, { useEffect, useRef } from 'react';

export default function StopwatchDisplay({ time }) {
  // Format the time into hours, minutes, seconds, and milliseconds
  const getFormattedTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10); // centiseconds (00-99)

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      milliseconds: String(milliseconds).padStart(2, '0'),
    };
  };

  const { hours, minutes, seconds, milliseconds } = getFormattedTime(time);

  // Calculate subtle progress ring or bar percentage for a minute cycle
  const currentSecondsNum = (time / 1000) % 60;
  const progressPercent = (currentSecondsNum / 60) * 100;

  // Render glowing aesthetic feedback when active
  const hasStarted = time > 0;

  return (
    <div className="relative flex flex-col items-center justify-center py-10 px-4">
      {/* Ambient background glow behind the timer */}
      <div className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none transition-all duration-700 ${hasStarted ? 'scale-125 bg-indigo-500/20' : 'scale-100'}`} />

      {/* Main Stopwatch Glass Container */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-2xl shadow-2xl shadow-slate-950/50 w-full max-w-xl group">
        
        {/* Subtle decorative outer ring */}
        <div className="absolute inset-0 rounded-3xl border border-indigo-500/10 pointer-events-none transition-colors duration-500 group-hover:border-indigo-500/20" />

        {/* Digital Time Readout */}
        <div className="flex items-baseline font-['JetBrains_Mono',monospace] tracking-tighter select-none py-2">
          {/* Hours (only show if hours > 0 or if desired for layout consistency, but let's always show or conditionally show) */}
          <div className="flex items-baseline">
            <span className="text-5xl sm:text-7xl font-light text-slate-100 drop-shadow-sm">
              {hours}
            </span>
            <span className="text-2xl sm:text-4xl font-light text-slate-500 mx-1 sm:mx-2">:</span>
          </div>

          {/* Minutes */}
          <div className="flex items-baseline">
            <span className="text-5xl sm:text-7xl font-light text-slate-100 drop-shadow-sm">
              {minutes}
            </span>
            <span className="text-2xl sm:text-4xl font-light text-slate-500 mx-1 sm:mx-2">:</span>
          </div>

          {/* Seconds */}
          <div className="flex items-baseline">
            <span className="text-5xl sm:text-7xl font-medium text-white drop-shadow-md">
              {seconds}
            </span>
          </div>

          {/* Milliseconds / Centiseconds */}
          <div className="ml-2 sm:ml-3 flex items-baseline">
            <span className="text-xl sm:text-3xl font-light text-indigo-400/90 font-mono">
              .{milliseconds}
            </span>
          </div>
        </div>

        {/* Minimal Progress Bar tracker for minute completion */}
        <div className="w-full max-w-xs h-1 bg-slate-800/80 rounded-full mt-6 overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-100 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status Badge */}
        <div className="mt-6 flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${hasStarted ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-slate-600'}`} />
          <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
            {hasStarted ? 'Precision Active' : 'Ready'}
          </span>
        </div>

      </div>
    </div>
  );
}