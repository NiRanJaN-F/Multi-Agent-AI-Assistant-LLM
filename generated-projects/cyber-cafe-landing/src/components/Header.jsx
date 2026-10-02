import React, { useState, useEffect } from 'react';

export default function Header({ onOpenBooking }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-cyber-950/80 backdrop-blur-xl border-b border-cyan-500/20 py-4 shadow-[0_4px_30px_rgba(0,240,255,0.08)]' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-500 p-[1px] shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_25px_rgba(255,0,127,0.6)] transition-all duration-300">
            <div className="w-full h-full bg-cyber-950 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400 group-hover:text-fuchsia-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-['Orbitron'] font-bold text-lg tracking-wider text-white group-hover:text-cyan-400 transition-colors">
              NEO<span className="text-fuchsia-500">-</span>CAFE
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              // CYBER_BREW v2.4
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#menu" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors tracking-wide uppercase font-mono">
            Neural Menu
          </a>
          <a href="#about" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors tracking-wide uppercase font-mono">
            System Specs
          </a>
          <a href="#reviews" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors tracking-wide uppercase font-mono">
            User Logs
          </a>
        </nav>

        {/* Action Button & Status */}
        <div className="hidden md:flex items-center gap-5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>NODE_ONLINE</span>
          </div>

          <button 
            onClick={onOpenBooking}
            className="relative group overflow-hidden rounded-xl p-[1px] focus:outline-none"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 rounded-xl animate-gradient-x"></span>
            <span className="relative px-5 py-2.5 rounded-[11px] bg-cyber-950 flex items-center gap-2 text-xs font-['Orbitron'] font-bold tracking-wider text-cyan-400 group-hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              BOOK POD
            </span>
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-cyber-900 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
          aria-label="Toggle Mobile Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-cyber-950/95 backdrop-blur-2xl border-b border-cyan-500/20 px-6 py-6 flex flex-col gap-5 shadow-2xl animate-fadeIn">
          <nav className="flex flex-col gap-4">
            <a 
              href="#menu" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-cyan-400 transition-colors font-mono uppercase tracking-wider"
            >
              Neural Menu
            </a>
            <a 
              href="#about" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-cyan-400 transition-colors font-mono uppercase tracking-wider"
            >
              System Specs
            </a>
            <a 
              href="#reviews" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-cyan-400 transition-colors font-mono uppercase tracking-wider"
            >
              User Logs
            </a>
          </nav>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono w-max">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>NODE_ONLINE</span>
            </div>

            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-black font-['Orbitron'] font-bold text-sm tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-transform"
            >
              BOOK POD
            </button>
          </div>
        </div>
      )}
    </header>
  );
}