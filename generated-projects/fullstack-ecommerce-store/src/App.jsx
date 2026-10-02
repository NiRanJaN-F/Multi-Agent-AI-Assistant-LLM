import React, { useState, useEffect } from 'react';
import Board from './components/Board';
import ScoreBoard from './components/ScoreBoard';
import './App.css';

export default function App() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [stepNumber, setStepNumber] = useState(0);
  const [xIsNext, setXIsNext] = useState(true);
  const [gameMode, setGameMode] = useState('pvp'); // 'pvp' or 'ai'
  const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', 'unbeatable'
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [theme, setTheme] = useState('neon'); // 'neon', 'cyber', 'sunset'

  const currentSquares = history[stepNumber];
  const winInfo = calculateWinner(currentSquares);
  const winner = winInfo ? winInfo.winner : null;
  const winningLine = winInfo ? winInfo.line : [];

  const isBoardFull = currentSquares.every((square) => square !== null);
  const isDraw = !winner && isBoardFull;

  // AI Turn Handling
  useEffect(() => {
    if (gameMode === 'ai' && !xIsNext && !winner && !isDraw) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [xIsNext, gameMode, winner, isDraw, stepNumber]);

  // Update scores on game end
  useEffect(() => {
    if (winner) {
      setScores((prev) => ({
        ...prev,
        [winner]: prev[winner] + 1,
      }));
    } else if (isDraw) {
      setScores((prev) => ({
        ...prev,
        draws: prev.draws + 1,
      }));
    }
  }, [winner, isDraw]);

  const handleClick = (i) => {
    if (winner || currentSquares[i]) return;
    if (gameMode === 'ai' && !xIsNext) return; // Prevent player clicks during AI turn

    const newHistory = history.slice(0, stepNumber + 1);
    const squares = [...currentSquares];
    squares[i] = xIsNext ? 'X' : 'O';

    setHistory([...newHistory, squares]);
    setStepNumber(newHistory.length);
    setXIsNext(!xIsNext);
  };

  const makeAIMove = () => {
    const squares = [...currentSquares];
    let move = null;

    if (difficulty === 'easy') {
      move = getRandomMove(squares);
    } else if (difficulty === 'medium') {
      // 50% optimal, 50% random
      if (Math.random() < 0.5) {
        move = getBestMove(squares, 'O');
      } else {
        move = getRandomMove(squares);
      }
    } else {
      // Unbeatable minimax
      move = getBestMove(squares, 'O');
    }

    if (move !== null && squares[move] === null) {
      const newHistory = history.slice(0, stepNumber + 1);
      squares[move] = 'O';
      setHistory([...newHistory, squares]);
      setStepNumber(newHistory.length);
      setXIsNext(true);
    }
  };

  const getRandomMove = (squares) => {
    const emptyIndices = squares
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null);
    if (emptyIndices.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * emptyIndices.length);
    return emptyIndices[randomIndex];
  };

  // Minimax algorithm for AI
  const getBestMove = (squares, player) => {
    // Simple AI heuristic or full minimax for 3x3
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null) {
        squares[i] = player;
        let score = minimax(squares, 0, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const scoresMap = { X: 10, O: -10, tie: 0 };

  const minimax = (squares, depth, isMaximizing) => {
    const res = calculateWinner(squares);
    if (res) {
      return res.winner === 'O' ? 10 - depth : depth - 10;
    }
    if (squares.every((s) => s !== null)) {
      return 0;
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          let evaluation = minimax(squares, depth + 1, false);
          squares[i] = null;
          maxEval = Math.max(maxEval, evaluation);
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) {
          squares[i] = 'X';
          let evaluation = minimax(squares, depth + 1, true);
          squares[i] = null;
          minEval = Math.min(minEval, evaluation);
        }
      }
      return minEval;
    }
  };

  const jumpTo = (step) => {
    setStepNumber(step);
    setXIsNext(step % 2 === 0);
  };

  const resetGame = () => {
    setHistory([Array(9).fill(null)]);
    setStepNumber(0);
    setXIsNext(true);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0, draws: 0 });
    resetGame();
  };

  return (
    <div className={`app-container theme-${theme} min-h-screen flex flex-col items-center justify-between p-4 md:p-6 transition-colors duration-500`}>
      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between mb-4 bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-lg">
            #
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Tic Tac Toe
          </h1>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setTheme('neon')}
            title="Neon Theme"
            className={`w-6 h-6 rounded-lg transition-all ${
              theme === 'neon' ? 'bg-blue-500 shadow-md shadow-blue-500/50 scale-105' : 'bg-slate-800 opacity-60 hover:opacity-100'
            }`}
          />
          <button
            onClick={() => setTheme('cyber')}
            title="Cyberpunk Theme"
            className={`w-6 h-6 rounded-lg transition-all ${
              theme === 'cyber' ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 scale-105' : 'bg-slate-800 opacity-60 hover:opacity-100'
            }`}
          />
          <button
            onClick={() => setTheme('sunset')}
            title="Sunset Theme"
            className={`w-6 h-6 rounded-lg transition-all ${
              theme === 'sunset' ? 'bg-rose-500 shadow-md shadow-rose-500/50 scale-105' : 'bg-slate-800 opacity-60 hover:opacity-100'
            }`}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md flex flex-col items-center space-y-6 my-auto">
        {/* Game Mode Controls */}
        <div className="w-full grid grid-cols-2 gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800/80">
          <button
            onClick={() => {
              setGameMode('pvp');
              resetGame();
            }}
            className={`py-2 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
              gameMode === 'pvp'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>👥 2 Players</span>
          </button>
          <button
            onClick={() => {
              setGameMode('ai');
              resetGame();
            }}
            className={`py-2 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
              gameMode === 'ai'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>🤖 vs AI</span>
          </button>
        </div>

        {/* AI Difficulty Selector (Conditional) */}
        {gameMode === 'ai' && (
          <div className="w-full flex justify-between items-center bg-slate-900/40 px-4 py-2.5 rounded-xl border border-slate-800/60 text-xs">
            <span className="text-slate-400 font-medium">Difficulty:</span>
            <div className="flex space-x-1">
              {['easy', 'medium', 'unbeatable'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setDifficulty(lvl);
                    resetGame();
                  }}
                  className={`capitalize px-3 py-1 rounded-lg transition-all ${
                    difficulty === lvl
                      ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50 font-semibold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Score Board */}
        <ScoreBoard scores={scores} gameMode={gameMode} xIsNext={xIsNext} winner={winner} isDraw={isDraw} />

        {/* Board Component */}
        <Board squares={currentSquares} onClick={handleClick} winningLine={winningLine} />

        {/* Status and Action Buttons */}
        <div className="w-full flex flex-col space-y-3">
          <div className="text-center py-2">
            {winner ? (
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold animate-bounce">
                <span>🎉 Winner: {winner}</span>
              </div>
            ) : isDraw ? (
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
                <span>🤝 It's a Draw!</span>
              </div>
            ) : (
              <div className="text-slate-400 text-sm font-medium">
                Current turn:{' '}
                <span className={`font-bold ${xIsNext ? 'text-blue-400' : 'text-purple-400'}`}>
                  {xIsNext ? 'Player X' : gameMode === 'ai' ? 'AI (O)' : 'Player O'}
                </span>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={resetGame}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold border border-slate-700/80 shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>🔄 Restart Round</span>
            </button>
            <button
              onClick={resetScores}
              className="py-3 px-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 font-medium border border-slate-800 transition-all active:scale-95 text-sm"
              title="Reset All Scores"
            >
              Reset Stats
            </button>
          </div>
        </div>

        {/* History / Time Travel (optional dropdown or steps) */}
        {history.length > 1 && (
          <div className="w-full bg-slate-900/30 p-3 rounded-2xl border border-slate-800/60 flex items-center justify-between overflow-x-auto space-x-2">
            <span className="text-xs text-slate-500 whitespace-nowrap font-medium">History:</span>
            <div className="flex space-x-1.5 overflow-x-auto py-1">
              {history.map((_, move) => (
                <button
                  key={move}
                  onClick={() => jumpTo(move)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    stepNumber === move
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {move}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-2 text-xs text-slate-600">
        Tic Tac Toe Ultimate &bull; Crafted with React & Tailwind
      </footer>
    </div>
  );
}

// Helper function to calculate winner and winning line
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return null;
}