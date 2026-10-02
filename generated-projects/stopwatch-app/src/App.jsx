import React from 'react';
import Stopwatch from './components/Stopwatch';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white font-['Inter',sans-serif]">
      {/* Background ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="font-bold tracking-wider text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">CHRONOCRAFT</span>
              <span className="block text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Precision Lab</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
              SYSTEM READY
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        <Stopwatch />
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>ChronoCraft Precision Stopwatch & Lap Analyzer • Engineered for Ultimate Accuracy</p>
      </footer>
    </div>
  );
}