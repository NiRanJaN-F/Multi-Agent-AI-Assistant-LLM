import React, { useState, useEffect } from 'react';
import Counter from './components/Counter';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('quantum');
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState([
    { id: 1, type: 'System Init', detail: 'Quantum flux initialized', time: 'Just now' }
  ]);
  const [stats, setStats] = useState({
    totalIncrements: 0,
    totalDecrements: 0,
    peakValue: 0,
  });
  const [toast, setToast] = useState(null);

  // Sync theme class to HTML root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Initialize Lucide icons
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, toast, theme]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const logAction = (detail) => {
    const newEntry = {
      id: Date.now(),
      type: 'Counter Action',
      detail,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setHistory(prev => [newEntry, ...prev.slice(0, 19)]);
  };

  const handleStatUpdate = (actionType, val) => {
    setStats(prev => {
      const peak = Math.max(prev.peakValue, val);
      return {
        totalIncrements: prev.totalIncrements + (actionType === 'increment' ? 1 : 0),
        totalDecrements: prev.totalDecrements + (actionType === 'decrement' ? 1 : 0),
        peakValue: peak,
      };
    });
    if (actionType === 'increment') logAction(`Value incremented to ${val}`);
    if (actionType === 'decrement') logAction(`Value decremented to ${val}`);
    if (actionType === 'reset') logAction(`Counter reset to ${val}`);
  };

  // Filter counters based on search query
  const countersList = [
    {
      id: 'quantum-main',
      title: 'Quantum Main Core',
      description: 'Primary oscillating frequency node with high-precision stepping and sound feedback.',
      category: 'quantum',
      initialValue: 42,
      min: -100,
      max: 1000,
      step: 1
    },
    {
      id: 'energy-flux',
      title: 'Plasma Energy Flux',
      description: 'High-yield surge counter designed for rapid multi-step energy accumulation.',
      category: 'energy',
      initialValue: 100,
      min: 0,
      max: 5000,
      step: 10
    },
    {
      id: 'neural-sync',
      title: 'Neural Synapse Sync',
      description: 'Micro-adjustment cognitive pulse counter for fine-tuned parameters.',
      category: 'neural',
      initialValue: 7,
      min: 0,
      max: 100,
      step: 1
    },
    {
      id: 'tachyon-drift',
      title: 'Tachyon Chrono Drift',
      description: 'Temporal displacement gauge tracking anomaly variance across timelines.',
      category: 'quantum',
      initialValue: -15,
      min: -500,
      max: 500,
      step: 5
    },
    {
      id: 'shield-integrity',
      title: 'Deflector Shield Integrity',
      description: 'Hull polarization monitor with automatic safe-threshold boundaries.',
      category: 'energy',
      initialValue: 85,
      min: 0,
      max: 100,
      step: 1
    },
    {
      id: 'biometric-pulse',
      title: 'Biometric Load Factor',
      description: 'Real-time metabolic stress index and exertion frequency tracker.',
      category: 'neural',
      initialValue: 3,
      min: 1,
      max: 10,
      step: 1
    }
  ];

  const filteredCounters = countersList.filter(c => {
    const matchesTab = activeTab === 'all' || c.category === activeTab;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl bg-indigo-600 text-white font-medium border border-indigo-400/30">
          <i data-lucide="zap" className="w-5 h-5 text-indigo-200"></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sticky Navbar */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('all'); setSearchQuery(''); showToast('Reset view filters'); }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <i data-lucide="cpu" className="w-5 h-5 text-white"></i>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">QuantumCount</span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Pro Suite v2.5</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md relative">
            <i data-lucide="search" className="w-4 h-4 text-slate-400 absolute left-3.5"></i>
            <input 
              type="text"
              placeholder="Search quantum nodes, energy cores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-950/50 border-slate-800 text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' 
                  : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-slate-200 text-xs bg-slate-800/50 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* Actions & Theme toggle */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
                showToast(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} mode`);
              }}
              className={`p-2.5 rounded-xl border transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-100'
              }`}
              title="Toggle Theme"
            >
              <i data-lucide={theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5"></i>
            </button>

            <button 
              onClick={() => showToast('Quantum Cloud Sync Active. All telemetry saved.')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 transition-all active:scale-95"
            >
              <i data-lucide="cloud-lightning" className="w-4 h-4"></i>
              <span>Sync Status</span>
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800/40">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
              <i data-lucide="sparkles" className="w-3.5 h-3.5"></i>
              <span>Next-Gen Interactive Computation</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Precision Counters for <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Complex Systems</span>
            </h1>
            <p className={`text-base sm:text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Monitor, increment, and analyze multiple realtime data streams with haptic feedback, custom stepping intervals, and telemetry logs.
            </p>
          </div>

          {/* Live Quick Stats Widget */}
          <div className={`w-full md:w-auto p-6 rounded-2xl border shadow-xl backdrop-blur-md grid grid-cols-3 gap-4 text-center ${
            theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'
          }`}>
            <div>
              <span className="block text-2xl font-bold text-indigo-500">{stats.totalIncrements}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Increments</span>
            </div>
            <div className="border-x border-slate-700/30 px-2">
              <span className="block text-2xl font-bold text-pink-500">{stats.totalDecrements}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Decrements</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-emerald-500">{stats.peakValue}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Peak Value</span>
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Category Tabs & Mobile Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {[
              { id: 'quantum', label: 'Quantum Core', icon: 'cpu' },
              { id: 'energy', label: 'Energy Flux', icon: 'zap' },
              { id: 'neural', label: 'Neural Sync', icon: 'brain' },
              { id: 'all', label: 'All Modules', icon: 'grid' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  showToast(`Switched view to ${tab.label}`);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : theme === 'dark'
                      ? 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <i data-lucide={tab.icon} className="w-4 h-4"></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="md:hidden">
            <input 
              type="text"
              placeholder="Search counters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2 text-sm rounded-xl border outline-none ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}
            />
          </div>

        </div>

        {/* Counter Grid */}
        {filteredCounters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredCounters.map((counterProps) => (
              <div 
                key={counterProps.id}
                className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-2xl flex flex-col justify-between ${
                  theme === 'dark' 
                    ? 'bg-slate-900/40 border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/80' 
                    : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-indigo-500/5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                      {counterProps.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Step: ±{counterProps.step}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{counterProps.title}</h3>
                  <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {counterProps.description}
                  </p>
                </div>

                {/* Counter Component Integration */}
                <Counter 
                  {...counterProps} 
                  onUpdate={(type, val) => handleStatUpdate(type, val)}
                  theme={theme}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-20 rounded-3xl border border-dashed ${theme === 'dark' ? 'border-slate-800 bg-slate-900/20' : 'border-slate-300 bg-slate-50'}`}>
            <i data-lucide="search-x" className="w-12 h-12 text-slate-400 mx-auto mb-4"></i>
            <h3 className="text-lg font-semibold mb-1">No Active Counters Found</h3>
            <p className="text-sm text-slate-400 mb-4">Try adjusting your search query or switching category tabs.</p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Telemetry Activity Log Section */}
        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <i data-lucide="activity" className="w-5 h-5 text-indigo-500"></i>
              <h3 className="font-bold text-base">Real-Time Telemetry & Event Log</h3>
            </div>
            <button 
              onClick={() => { setHistory([]); showToast('Telemetry log cleared'); }}
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <i data-lucide="trash-2" className="w-3.5 h-3.5"></i>
              <span>Clear Log</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {history.length > 0 ? (
              history.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between text-xs p-3 rounded-xl border ${
                    theme === 'dark' ? 'bg-slate-950/50 border-slate-800/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="font-semibold">{item.type}:</span>
                    <span>{item.detail}</span>
                  </div>
                  <span className="text-slate-400 font-mono">{item.time}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-slate-400 py-6">No telemetry events recorded yet. Interact with any counter above.</p>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className={`border-t py-8 px-4 sm:px-6 lg:px-8 mt-12 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">Q</div>
            <span>Quantum Counter App &copy; {new Date().getFullYear()} &mdash; Enterprise React UI Architecture</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => showToast('Documentation loaded')}>Docs</span>
            <span className="hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => showToast('API Telemetry endpoint connected')}>API Endpoint</span>
            <span className="hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => showToast('Security sandbox active')}>Security</span>
          </div>
        </div>
      </footer>

    </div>
  );
}