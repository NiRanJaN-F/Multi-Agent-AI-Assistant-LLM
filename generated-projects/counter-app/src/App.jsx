import React from 'react';
import Counter from './components/Counter';

export default function App() {
  return (
    <div className="min-h-full flex flex-col bg-slate-950 text-slate-100 relative overflow-hidden font-['Inter',sans-serif]">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Quantum Counter
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-block px-3 py-1 text-xs font-medium bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
              React 18 + Vite
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero & Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
            Next-Gen <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Interactive State</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Experience state management with smooth spring animations, haptic-style feedback, and quantum precision increments.
          </p>
        </div>

        {/* Counter Component Card Grid / Single Focus Showcase */}
        <div className="w-full max-w-md">
          <Counter />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Quantum Counter App. Crafted with precision for React + Vite.</p>
      </footer>
    </div>
  );
}