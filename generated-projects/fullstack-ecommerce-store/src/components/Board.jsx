import React from 'react';
import Square from './Square';
import './Board.css';

export default function Board({ squares, onClick, winningLine }) {
  return (
    <div className="board-wrapper relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-purple-500/10 rounded-3xl blur-xl pointer-events-none" />
      <div className="grid grid-cols-3 gap-3.5 p-4 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl shadow-blue-950/40 relative z-10">
        {squares.map((value, index) => {
          const isWinningSquare = winningLine && winningLine.includes(index);
          return (
            <Square
              key={index}
              value={value}
              onClick={() => onClick(index)}
              isWinningSquare={isWinningSquare}
            />
          );
        })}
      </div>
    </div>
  );
}