import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import ScoreBoard from './components/ScoreBoard';
import GameBoard from './components/GameBoard';
import Controls from './components/Controls';
import { checkWinner, findBestMove, getWinningLineCoords } from './utils/gameLogic';
import { playSound } from './utils/sound';

export default function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState('pvp'); // 'pvp' or 'ai'
  const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
  const [scores, setScores] = useState({ X: 0, O: 0, ties: 0 });
  const [winningInfo, setWinningInfo] = useState(null); // { winner, line }
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const isAiTurn = gameMode === 'ai' && !isXNext && !winningInfo && !board.every(Boolean);

  // Reset Game Board
  const handleReset = () => {
    playSound('click', isSoundEnabled);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinningInfo(null);
    setIsAiThinking(false);
  };

  // Reset Scores and Board
  const handleFullReset = () => {
    playSound('click', isSoundEnabled);
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinningInfo(null);
    setScores({ X: 0, O: 0, ties: 0 });
    setIsAiThinking(false);
  };

  // Handle Square Click
  const handleSquareClick = useCallback((index) => {
    if (board[index] || winningInfo || isAiThinking) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    playSound(isXNext ? 'x' : 'o', isSoundEnabled);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinningInfo(winResult);
      playSound('win', isSoundEnabled);
      setScores(prev => ({
        ...prev,
        [winResult.winner]: prev[winResult.winner] + 1
      }));
    } else if (newBoard.every(Boolean)) {
      setWinningInfo({ winner: 'tie', line: null });
      playSound('tie', isSoundEnabled);
      setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
    } else {
      setIsXNext(!isXNext);
    }
  }, [board, winningInfo, isAiThinking, isXNext, isSoundEnabled]);

  // AI Turn effect
  useEffect(() => {
    if (isAiTurn) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiMove = findBestMove(board, difficulty);
        if (aiMove !== null && aiMove !== undefined) {
          const newBoard = [...board];
          newBoard[aiMove] = 'O';
          setBoard(newBoard);
          playSound('o', isSoundEnabled);

          const winResult = checkWinner(newBoard);
          if (winResult) {
            setWinningInfo(winResult);
            playSound('win', isSoundEnabled);
            setScores(prev => ({
              ...prev,
              [winResult.winner]: prev[winResult.winner] + 1
            }));
          } else if (newBoard.every(Boolean)) {
            setWinningInfo({ winner: 'tie', line: null });
            playSound('tie', isSoundEnabled);
            setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
          } else {
            setIsXNext(true);
          }
        }
        setIsAiThinking(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAiTurn, board, difficulty, isSoundEnabled]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white relative overflow-hidden">
      {/* Background Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <Header 
        isSoundEnabled={isSoundEnabled} 
        onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)} 
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 z-10 max-w-md mx-auto w-full">
        <ScoreBoard 
          scores={scores} 
          gameMode={gameMode} 
          isXNext={isXNext} 
          isAiThinking={isAiThinking}
        />

        <GameBoard 
          board={board} 
          onSquareClick={handleSquareClick} 
          winningLine={winningInfo?.line} 
          isAiThinking={isAiThinking}
        />

        <Controls 
          gameMode={gameMode}
          onGameModeChange={(mode) => {
            setGameMode(mode);
            handleReset();
          }}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          onReset={handleReset}
          onFullReset={handleFullReset}
          winningInfo={winningInfo}
        />
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 z-10">
        Nexus X/O &bull; Modern Dark Mode Tic-Tac-Toe
      </footer>
    </div>
  );
}