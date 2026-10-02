import React, { useState, useEffect, useRef, useCallback } from 'react';
import Display from './Display';
import Controls from './Controls';
import LapList from './LapList';

export default function Stopwatch() {
  const [time, setTime] = useState(0); // in milliseconds
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  
  // Audio context for haptic sound effects
  const audioCtxRef = useRef(null);

  const playBeep = (freq = 440, type = 'sine', duration = 0.05, vol = 0.03) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // AudioContext not allowed or supported without user gesture
    }
  };

  // High-precision tick loop using requestAnimationFrame
  const requestRef = useRef(null);
  const previousTimeRef = useRef(null);

  const animate = useCallback((currentTime) => {
    if (previousTimeRef.current !== null) {
      const deltaTime = currentTime - previousTimeRef.current;
      setTime((prevTime) => prevTime + deltaTime);
    }
    previousTimeRef.current = currentTime;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isRunning) {
      previousTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      previousTimeRef.current = null;
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning, animate]);

  // Keyboard shortcuts (Space: Start/Pause, L: Lap, R: Reset)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleStartPause();
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        if (isRunning) handleLap();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        if (!isRunning && time > 0) handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, time, laps]);

  const handleStartPause = () => {
    if (!isRunning) {
      playBeep(587.33, 'sine', 0.08, 0.04); // D5 note start
      setIsRunning(true);
    } else {
      playBeep(440, 'sine', 0.08, 0.04); // A4 note pause
      setIsRunning(false);
    }
  };

  const handleLap = () => {
    playBeep(880, 'triangle', 0.06, 0.03); // High beep for lap
    setLaps((prevLaps) => {
      const lastLapTotal = prevLaps.length > 0 ? prevLaps[0].totalTime : 0;
      const currentLapTime = time - lastLapTotal;
      const newLap = {
        id: prevLaps.length + 1,
        lapTime: currentLapTime,
        totalTime: time,
      };
      return [newLap, ...prevLaps];
    });
  };

  const handleReset = () => {
    playBeep(330, 'sawtooth', 0.1, 0.03); // Low reset sound
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };

  const handleClearLaps = () => {
    playBeep(300, 'sine', 0.05, 0.02);
    setLaps([]);
  };

  // Compute best and worst lap IDs if at least 2 laps exist
  let bestLapId = null;
  let worstLapId = null;
  if (laps.length >= 2) {
    let minTime = Infinity;
    let maxTime = -Infinity;
    laps.forEach((lap) => {
      if (lap.lapTime < minTime) {
        minTime = lap.lapTime;
        bestLapId = lap.id;
      }
      if (lap.lapTime > maxTime) {
        maxTime = lap.lapTime;
        worstLapId = lap.id;
      }
    });
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-8">
      {/* Main Stopwatch Glass Card */}
      <div className="w-full relative group">
        {/* Ambient glow behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500"></div>

        <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center">
          
          {/* Top Status Pill */}
          <div className="mb-6 flex items-center justify-between w-full">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-cyan-400 animate-ping' : time > 0 ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
              <span>{isRunning ? 'RECORDING ACTIVE' : time > 0 ? 'PAUSED' : 'READY'}</span>
            </div>
            <div className="text-xs font-mono text-slate-500">
              {laps.length} {laps.length === 1 ? 'Lap' : 'Laps'} recorded
            </div>
          </div>

          {/* Time Display component */}
          <Display time={time} />

          {/* Controls component */}
          <Controls
            isRunning={isRunning}
            onStartPause={handleStartPause}
            onLap={handleLap}
            onReset={handleReset}
            disabledReset={time === 0}
          />

          {/* Keyboard shortcut hint bar */}
          <div className="mt-8 pt-4 border-t border-slate-800/60 w-full flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
            <span className="flex items-center space-x-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">Space</kbd>
              <span>Start/Pause</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">L</kbd>
              <span>Lap</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">R</kbd>
              <span>Reset</span>
            </span>
          </div>
        </div>
      </div>

      {/* Lap List Component */}
      <LapList
        laps={laps}
        bestLapId={bestLapId}
        worstLapId={worstLapId}
        onClearLaps={handleClearLaps}
      />
    </div>
  );
}