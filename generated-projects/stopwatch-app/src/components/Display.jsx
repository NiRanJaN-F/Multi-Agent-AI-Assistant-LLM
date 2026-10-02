import React, { useEffect, useState } from 'react';

export default function Display({ time, mode = 'stopwatch', countdownDuration = 0, targetTime = 0 }) {
  // Helper to format time components
  const formatTime = (ms) => {
    if (ms < 0) ms = 0;
    const totalCentiseconds = Math.floor(ms / 10);
    const centiseconds = totalCentiseconds % 100;
    const totalSeconds = Math.floor(totalCentiseconds / 100);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      centiseconds: String(centiseconds).padStart(2, '0')
    };
  };

  // Determine current display value based on mode
  let displayMs = time;
  let progressPercent = 0;

  if (mode === 'countdown') {
    displayMs = Math.max(0, countdownDuration - time);
    if (countdownDuration > 0) {
      progressPercent = Math.min(100, Math.max(0, (time / countdownDuration) * 100));
    }
  } else if (mode === 'pacer') {
    if (targetTime > 0) {
      progressPercent = Math.min(100, Math.max(0, (time / targetTime) * 100));
    }
  }

  const { hours, minutes, seconds, centiseconds } = formatTime(displayMs);

  // Calculate SVG circle progress for circular timer ring (Radius = 135, Circumference = 2 * PI * 135 ≈ 848.23)
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  // For countdown / pacer we stroke-dashoffset
  const strokeOffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center py-6 sm:py-10 select-none">
      {/* Outer Glow Ring */}
      <div className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none animate-pulse"></div>

      {/* Main Clock Interface Container */}
      <div className="relative flex flex-col items-center">
        
        {/* SVG Circular Progress & Outer Bezel */}
        <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
            {/* Background track */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              className="stroke-slate-900/80"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress / Ticker track */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              className={`transition-all duration-100 ease-linear ${
                mode === 'countdown' ? 'stroke-amber-500' : 'stroke-cyan-500'
              }`}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={mode !== 'stopwatch' ? strokeOffset : 0}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Inner Display Glass Container */}
          <div className="absolute inset-4 sm:inset-6 rounded-full bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)]">
            
            {/* Mode Sub-label */}
            <div className="mb-1 flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/50">
              <span className={`w-1.5 h-1.5 rounded-full ${mode === 'countdown' ? 'bg-amber-400' : 'bg-cyan-400'} animate-ping`}></span>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                {mode === 'stopwatch' ? 'Precision Chrono' : mode === 'countdown' ? 'Countdown Timer' : 'Target Pacer'}
              </span>
            </div>

            {/* Time Digits */}
            <div className="flex items-baseline justify-center font-mono tracking-tighter text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              {/* Hours (only show if > 0 or in specific modes if needed, but robust to always show or hide if 0) */}
              {parseInt(hours) > 0 && (
                <>
                  <span className="text-3xl sm:text-4xl font-bold text-slate-200">{hours}</span>
                  <span className="text-xl sm:text-2xl font-light text-slate-500 mx-0.5">:</span>
                </>
              )}

              {/* Minutes */}
              <span className="text-4xl sm:text-6xl font-extrabold bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {minutes}
              </span>
              <span className="text-2xl sm:text-4xl font-light text-cyan-500/80 mx-0.5 sm:mx-1 animate-pulse">:</span>

              {/* Seconds */}
              <span className="text-4xl sm:text-6xl font-extrabold bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {seconds}
              </span>

              {/* Centiseconds / Milliseconds */}
              <div className="ml-1.5 sm:ml-2 flex flex-col justify-end h-10 sm:h-14">
                <span className="text-lg sm:text-2xl font-bold font-mono text-cyan-400">
                  .{centiseconds}
                </span>
              </div>
            </div>

            {/* Secondary info / Progress text */}
            <div className="mt-2 text-xs font-mono text-slate-400 flex items-center space-x-2">
              {mode === 'countdown' && (
                <span className="text-amber-400 font-medium">
                  Remaining: {Math.ceil(displayMs / 1000)}s
                </span>
              )}
              {mode === 'pacer' && targetTime > 0 && (
                <span className="text-cyan-400 font-medium">
                  Target: {(targetTime / 1000).toFixed(1)}s ({progressPercent.toFixed(0)}%)
                </span>
              )}
              {mode === 'stopwatch' && (
                <span className="text-slate-500 tracking-wider text-[11px]">
                  HR:MIN:SEC:MS
                </span>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}