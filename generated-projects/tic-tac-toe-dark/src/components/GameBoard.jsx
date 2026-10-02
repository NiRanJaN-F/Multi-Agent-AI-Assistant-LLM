import React from 'react';
import Square from './Square';

export default function GameBoard({ board, onSquareClick, winningLine }) {
  // Helper to determine if a specific square index is part of the winning line
  const isWinningSquare = (index) => {
    if (!winningLine) return false;
    return winningLine.includes(index);
  };

  // Generate SVG coordinates for the strike-through winning line animation
  const getLineCoordinates = () => {
    if (!winningLine) return null;

    // Map 3x3 grid positions to percentage coordinates (0 to 100)
    // Centers of cells:
    // Row 0: 16.66%, 50%, 83.33%
    // Col 0: 16.66%, 50%, 83.33%
    const coords = {
      0: { x: 16.66, y: 16.66 },
      1: { x: 50, y: 16.66 },
      2: { x: 83.33, y: 16.66 },
      3: { x: 16.66, y: 50 },
      4: { x: 50, y: 50 },
      5: { x: 83.33, y: 50 },
      6: { x: 16.66, y: 83.33 },
      7: { x: 50, y: 83.33 },
      8: { x: 83.33, y: 83.33 }
    };

    const start = coords[winningLine[0]];
    const end = coords[winningLine[2]];

    return { x1: `${start.x}%`, y1: `${start.y}%`, x2: `${end.x}%`, y2: `${end.y}%` };
  };

  const lineCoords = getLineCoordinates();

  return (
    <div className="relative w-full aspect-square max-w-[360px] sm:max-w-[400px] mx-auto p-3 sm:p-4 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl shadow-cyan-950/20 group">
      {/* Ambient board background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-fuchsia-500/5 rounded-3xl pointer-events-none" />

      {/* 3x3 Grid */}
      <div className="relative w-full h-full grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3 z-10">
        {board.map((value, index) => (
          <Square
            key={index}
            value={value}
            onClick={() => onSquareClick(index)}
            isWinning={isWinningSquare(index)}
          />
        ))}
      </div>

      {/* Winning Line SVG Overlay */}
      {winningLine && lineCoords && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
          <defs>
            <linearGradient id="winningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <line
            x1={lineCoords.x1}
            y1={lineCoords.y1}
            x2={lineCoords.x2}
            y2={lineCoords.y2}
            stroke="url(#winningGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#glow)"
            className="animate-draw-line"
          />
        </svg>
      )}
    </div>
  );
}