import React from 'react';

export default function Square({ value, onClick, isWinningSquare }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative group aspect-square flex items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800/80 hover:border-slate-700 transition-all duration-300 shadow-lg hover:shadow-cyan-500/5 active:scale-95 overflow-hidden ${
        isWinningSquare ? 'winner-square !border-cyan-400 !bg-cyan-950/40 shadow-cyan-500/20' : ''
      }`}
    >
      {/* Subtle hover radial glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Value rendering with smooth scale-in animation */}
      {value === 'X' && (
        <span className="text-4xl sm:text-5xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)] transform scale-100 animate-in fade-in zoom-in-75 duration-200 select-none">
          X
        </span>
      )}

      {value === 'O' && (
        <span className="text-4xl sm:text-5xl font-black text-fuchsia-400 drop-shadow-[0_0_15px_rgba(232,121,249,0.5)] transform scale-100 animate-in fade-in zoom-in-75 duration-200 select-none">
          O
        </span>
      )}
    </button>
  );
}