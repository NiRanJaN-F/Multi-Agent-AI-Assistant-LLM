import React from 'react';
import { RotateCcw, Volume2, VolumeX, Users, Bot, Shield } from 'lucide-react';

export default function Controls({
  gameMode,
  setGameMode,
  onReset,
  soundEnabled,
  setSoundEnabled,
  difficulty,
  setDifficulty
}) {
  return (
    <div className="w-full flex flex-col gap-4 mt-6">
      {/* Top Controls: Game Mode & Sound Toggle */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/60 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-xl">
        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 flex-1">
          <button
            onClick={() => setGameMode('pvp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-300 ${
              gameMode === 'pvp'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2 Player</span>
          </button>

          <button
            onClick={() => setGameMode('ai')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-300 ${
              gameMode === 'ai'
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Vs AI</span>
          </button>
        </div>

        {/* Sound Toggle Button */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-center ${
            soundEnabled
              ? 'bg-slate-950/80 border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/10 hover:border-cyan-400'
              : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          aria-label={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* AI Difficulty Selector (Visible only in AI mode) */}
      {gameMode === 'ai' && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-800/80 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Shield className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>AI Difficulty:</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setDifficulty('easy')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                difficulty === 'easy'
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => setDifficulty('hard')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                difficulty === 'hard'
                  ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unbeatable
            </button>
          </div>
        </div>
      )}

      {/* Reset / Restart Board Button */}
      <button
        onClick={onReset}
        className="w-full group relative flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-840 border border-slate-700/80 hover:border-slate-600 rounded-xl text-sm font-semibold text-slate-200 transition-all duration-300 shadow-lg shadow-slate-950/50 hover:shadow-cyan-500/10 active:scale-[0.98]"
      >
        <RotateCcw className="w-4 h-4 text-cyan-400 transition-transform duration-500 group-hover:-rotate-180" />
        <span>Reset Round</span>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </button>
    </div>
  );
}