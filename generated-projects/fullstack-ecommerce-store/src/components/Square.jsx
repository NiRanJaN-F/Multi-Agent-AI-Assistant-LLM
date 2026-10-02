import React from 'react';
import './Square.css';

export default function Square({ value, onClick, isWinning, isLastMove }) {
  // Determine color and styling classes based on the value (X or O)
  let valueColorClass = '';
  if (value === 'X') {
    valueColorClass = 'text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]';
  } else if (value === 'O') {
    valueColorClass = 'text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]';
  }

  return (
    <button
      className={`
        square relative group aspect-square w-full rounded-2xl
        bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700
        flex items-center justify-center text-4xl md:text-5xl font-black
        transition-all duration-300 transform active:scale-95 shadow-md shadow-slate-950/40
        overflow-hidden cursor-pointer
        ${isWinning ? 'winning-square !bg-emerald-500/20 !border-emerald-500/60 !shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-pulse' : ''}
        ${isLastMove && !isWinning ? 'ring-2 ring-indigo-500/50 bg-slate-800/60' : ''}
      `}
      onClick={onClick}
      aria-label={`Square ${value ? value : 'empty'}`}
    >
      {/* Subtle interior gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Value Render with entrance animation */}
      <span className={`transform transition-transform duration-300 ${value ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} ${valueColorClass}`}>
        {value}
      </span>
    </button>
  );
}