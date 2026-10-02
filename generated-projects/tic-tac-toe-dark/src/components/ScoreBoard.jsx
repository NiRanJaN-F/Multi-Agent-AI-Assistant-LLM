import React from 'react';

export default function ScoreBoard({ scores, gameMode, xName = 'Player X', oName = 'Player O' }) {
  const { x: xWins, o: oWins, ties } = scores;

  return (
    <div className="w-full grid grid-cols-3 gap-3 mb-6">
      {/* Player X Score Card */}
      <div className={`relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${
        xWins >= oWins ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-500/10' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />
        <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 mb-1">
          {xName} (X)
        </span>
        <span className="text-2xl sm:text-3xl font-black text-cyan-100 tracking-tight">
          {xWins}
        </span>
      </div>

      {/* Ties Score Card */}
      <div className="relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl border bg-slate-900/60 border-slate-800 transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-40" />
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
          Ties
        </span>
        <span className="text-2xl sm:text-3xl font-black text-slate-300 tracking-tight">
          {ties}
        </span>
      </div>

      {/* Player O / AI Score Card */}
      <div className={`relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${
        oWins >= xWins ? 'bg-fuchsia-950/20 border-fuchsia-500/40 shadow-lg shadow-fuchsia-500/10' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-60" />
        <span className="text-xs uppercase tracking-wider font-semibold text-fuchsia-400 mb-1">
          {gameMode === 'ai' ? 'Nexus AI' : oName} (O)
        </span>
        <span className="text-2xl sm:text-3xl font-black text-fuchsia-100 tracking-tight">
          {oWins}
        </span>
      </div>
    </div>
  );
}