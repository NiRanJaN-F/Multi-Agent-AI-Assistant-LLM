import React, { useState, useEffect } from 'react';
import Counter from './components/Counter';

export default function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Initialize Lucide icons if available globally
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 font-sans`}>
      {/* Sticky Header / Navbar */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <i data-lucide="cpu" className="w-6 h-6 text-white"></i>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                QuantumCounter
              </span>
              <span className="hidden sm:block text-xs text-slate-400">Next-Gen Interactive Suite</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-100'
              }`}
              title="Toggle Theme"
            >
              <i data-lucide={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5"></i>
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <i data-lucide="github" className="w-4 h-4"></i>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-30">
          <div className="w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-full blur-[120px]"></div>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <i data-lucide="sparkles" className="w-3.5 h-3.5"></i>
            <span>React + Vite + Tailwind CSS</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Precision State Management
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto">
            Experience fluid counter mechanics, custom step scaling, bounds validation, and instant state preservation.
          </p>
        </div>
      </section>

      {/* Main Content / Counter Component */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Counter theme={theme} />
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs text-slate-500 ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white/40 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} QuantumCounter Suite. All rights reserved.</p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Privacy</span>
            <span>•</span>
            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Terms</span>
            <span>•</span>
            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}