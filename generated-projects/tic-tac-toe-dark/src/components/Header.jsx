import React from 'react';
import { Gamepad2, Volume2, VolumeX, Sparkles } from 'lucide-react';

export default function Header({ soundEnabled, setSoundEnabled }) {
  return (
    <header className="w-full max-w-md mx-auto pt-4 pb-2 px-4 flex items-center justify-between z-10">
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <Gamepad2 className="w-5 h-5 text-cyan-400" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-500 bg-clip-text text-transparent flex items-center gap-1.5">
            NEXUS X/O
            <Sparkles className="w-4 h-4 text-fuchsia-400 animate-spin" style={{ animationDuration: '6s' }} />
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide">Modern Dark Tic-Tac-Toe</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setSoundEnabled((prev) => !prev)}
          className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${
            soundEnabled
              ? 'bg-slate-900/80 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-500/60'
              : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
          }`}
          title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          aria-label={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 transition-transform hover:scale-110" />
          ) : (
            <VolumeX className="w-4 h-4 transition-transform hover:scale-110" />
          )}
        </button>
      </div>
    </header>
  );
}