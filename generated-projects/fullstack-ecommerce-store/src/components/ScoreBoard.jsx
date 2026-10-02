import React from 'react';
import './ScoreBoard.css';

export default function ScoreBoard({ scores, xIsNext, gameMode }) {
  const { X, O, draws } = scores;

  return (
    <div className="scoreboard-container">
      <div className={`score-card player-x ${xIsNext && gameMode ? 'active-turn' : ''}`}>
        <div className="score-badge bg-blue-500/10 text-blue-400 border-blue-500/30">
          X
        </div>
        <div className="score-info">
          <span className="player-label">{gameMode === 'ai' ? 'You (Player)' : 'Player X'}</span>
          <span className="player-score text-blue-400">{X}</span>
        </div>
      </div>

      <div className="score-card draw-card">
        <div className="score-badge bg-slate-800 text-slate-300 border-slate-700">
          VS
        </div>
        <div className="score-info">
          <span className="player-label">Draws</span>
          <span className="player-score text-slate-300">{draws}</span>
        </div>
      </div>

      <div className={`score-card player-o ${!xIsNext ? 'active-turn' : ''}`}>
        <div className="score-badge bg-purple-500/10 text-purple-400 border-purple-500/30">
          O
        </div>
        <div className="score-info">
          <span className="player-label">{gameMode === 'ai' ? 'AI Bot' : 'Player O'}</span>
          <span className="player-score text-purple-400">{O}</span>
        </div>
      </div>
    </div>
  );
}