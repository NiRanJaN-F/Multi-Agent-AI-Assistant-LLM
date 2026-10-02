import React, { useEffect } from 'react';
import { useStopwatch } from './hooks/useStopwatch';
import StopwatchDisplay from './components/StopwatchDisplay';
import StopwatchControls from './components/StopwatchControls';
import LapTable from './components/LapTable';

export default function App() {
  const {
    time,
    isRunning,
    laps,
    start,
    pause,
    reset,
    lap,
  } = useStopwatch();

  // Initialize Lucide icons on mount and updates
  useEffect(() => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }, [time, isRunning, laps]);

  // Keyboard shortcuts for power users (Space: Start/Pause, L: Lap, R: Reset)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input (just in case)
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) {
          pause();
        } else {
          start();
        }
      } else if (e.code === 'KeyL' && isRunning) {
        e.preventDefault();
        lap();
      } else if (e.code === 'KeyR' && !isRunning && time > 0) {
        e.preventDefault();
        reset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, time, start, pause, lap, reset]);

  return (
    <div className="min-h-full flex flex-col justify-between bg-slate-950 text-slate-100 font-['Inter',sans-serif] selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-sky-500/5 blur-[160px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="relative z-10 w-full border-b border-slate-900/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i data-lucide="timer" className="w-5 h-5 text-white"></i>
            </div>
            <div>
              <span className="font-semibold tracking-wide text-slate-200">Chronos</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
                PRO
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500 font-mono">Space</span>
              <span className="text-slate-400">Toggle</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-500 font-mono">L</span>
              <span className="text-slate-400">Lap</span>
            </div>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
              title="View Source"
            >
              <i data-lucide="github" className="w-4 h-4"></i>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 py-10 flex flex-col items-center justify-start space-y-10">
        
        {/* Stopwatch Display Section */}
        <div className="w-full flex flex-col items-center justify-center space-y-8">
          <StopwatchDisplay time={time} isRunning={isRunning} />
          
          <StopwatchControls 
            isRunning={isRunning} 
            onStart={start} 
            onPause={pause} 
            onReset={reset} 
            onLap={lap} 
            canReset={time > 0}
          />
        </div>

        {/* Laps Section */}
        <div className="w-full max-w-xl">
          <LapTable laps={laps} />
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-900/80 bg-slate-950/60 backdrop-blur-md py-6 text-center text-xs text-slate-500">
        <p>Chronos Pro Stopwatch &bull; Built with React & Tailwind CSS</p>
      </footer>
    </div>
  );
}