import React, { useState } from 'react';

export default function Footer({ onOpenBooking }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="relative bg-cyber-900 border-t border-cyan-500/20 text-slate-400 pt-16 pb-12 overflow-hidden">
      {/* Background Cyber Glow Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,240,255,0.08),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center p-0.5 shadow-lg shadow-cyan-500/25">
                <div className="w-full h-full bg-cyber-950 rounded-[7px] flex items-center justify-center">
                  <span className="text-cyan-400 font-black font-['Orbitron'] text-xl tracking-tighter">N</span>
                </div>
              </div>
              <span className="text-2xl font-black font-['Orbitron'] tracking-wider text-white">
                NEO<span className="text-cyan-400">//</span>CAFE
              </span>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The ultimate cyberpunk sanctuary for hackers, neural nomads, and coffee purists. Engineered with precision, brewed with synth-organic beans, and served at absolute zero.
            </p>

            <div className="flex items-center space-x-4 pt-2">
              <a href="#twitter" aria-label="Twitter" className="w-9 h-9 rounded-lg bg-cyber-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all duration-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#instagram" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-cyber-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all duration-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#discord" aria-label="Discord" className="w-9 h-9 rounded-lg bg-cyber-800 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all duration-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.011c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-['Orbitron'] font-semibold text-sm tracking-wider uppercase border-l-2 border-cyan-400 pl-3">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#hero" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5">
                  <span className="text-cyan-500/60 font-mono text-xs">&gt;</span>
                  <span>Neural Core</span>
                </a>
              </li>
              <li>
                <a href="#menu" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5">
                  <span className="text-cyan-500/60 font-mono text-xs">&gt;</span>
                  <span>Elixir Menu</span>
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5">
                  <span className="text-cyan-500/60 font-mono text-xs">&gt;</span>
                  <span>Citizen Logs</span>
                </a>
              </li>
              <li>
                <button onClick={onOpenBooking} className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5 text-left w-full">
                  <span className="text-cyan-500/60 font-mono text-xs">&gt;</span>
                  <span>Reserve Booth</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Cyber Brews */}
          <div className="space-y-4">
            <h4 className="text-white font-['Orbitron'] font-semibold text-sm tracking-wider uppercase border-l-2 border-fuchsia-500 pl-3">
              Top Elixirs
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#menu" className="hover:text-fuchsia-400 transition-colors flex items-center space-x-1.5">
                  <span className="text-fuchsia-500/60 font-mono text-xs">#</span>
                  <span>Quantum Espresso</span>
                </a>
              </li>
              <li>
                <a href="#menu" className="hover:text-fuchsia-400 transition-colors flex items-center space-x-1.5">
                  <span className="text-fuchsia-500/60 font-mono text-xs">#</span>
                  <span>Cyberpunk Cappuccino</span>
                </a>
              </li>
              <li>
                <a href="#menu" className="hover:text-fuchsia-400 transition-colors flex items-center space-x-1.5">
                  <span className="text-fuchsia-500/60 font-mono text-xs">#</span>
                  <span>Bionic Cold Brew</span>
                </a>
              </li>
              <li>
                <a href="#menu" className="hover:text-fuchsia-400 transition-colors flex items-center space-x-1.5">
                  <span className="text-fuchsia-500/60 font-mono text-xs">#</span>
                  <span>Matrix Matcha</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter / Terminal Feed */}
          <div className="space-y-4">
            <h4 className="text-white font-['Orbitron'] font-semibold text-sm tracking-wider uppercase border-l-2 border-cyan-400 pl-3">
              Neural Feed
            </h4>
            <p className="text-xs text-slate-400">
              Subscribe to receive encrypted daily specials and priority booking passes straight to your deck.
            </p>
            
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@net-runner.io"
                  required
                  className="w-full bg-cyber-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-cyber-950 font-['Orbitron'] font-bold text-xs uppercase tracking-wider rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-500/20 active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>Transmit Signal</span>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </form>

            {subscribed && (
              <div className="p-2 bg-cyan-950/80 border border-cyan-500/40 rounded text-xs text-cyan-300 font-mono animate-pulse text-center">
                [SUCCESS] Neural link established. Welcome to the grid.
              </div>
            )}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-mono text-slate-400">STATUS: ALL SECTORS OPERATIONAL // SECURE 256-BIT</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <a href="#privacy" className="hover:text-slate-300 transition-colors">Privacy Protocol</a>
            <span className="text-slate-700">•</span>
            <a href="#terms" className="hover:text-slate-300 transition-colors">Terms of Neural Use</a>
            <span className="text-slate-700">•</span>
            <a href="#security" className="hover:text-slate-300 transition-colors">Security Index</a>
          </div>

          <div className="font-mono text-slate-600">
            &copy; {new Date().getFullYear()} NEO-CAFE. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}