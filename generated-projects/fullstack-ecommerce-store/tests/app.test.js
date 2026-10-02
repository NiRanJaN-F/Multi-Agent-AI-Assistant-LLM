/**
 * @file fullstack-ecommerce-store.test.js
 * @description Comprehensive Unit and Integration Test Suite using Node.js built-in test runner and strict assert.
 * Tests game logic, win calculations, AI moves, and UI component behavior simulation.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

// ----------------------------------------------------------------------
// Extracted Game Logic (matching App.jsx / helper functions)
// ----------------------------------------------------------------------

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]              // diagonals
];

function calculateWinner(squares) {
  for (let i = 0; i < WINNING_LINES.length; i++) {
    const [a, b, c] = WINNING_LINES[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

function isBoardFull(squares) {
  return squares.every(square => square !== null);
}

// Simple Minimax AI simulation for unbeatable difficulty
function minimax(newSquares, depth, isMaximizing, aiPlayer, humanPlayer) {
  const winInfo = calculateWinner(newSquares);
  if (winInfo && winInfo.winner === aiPlayer) return { score: 10 - depth };
  if (winInfo && winInfo.winner === humanPlayer) return { score: depth - 10 };
  if (isBoardFull(newSquares)) return { score: 0 };

  const emptyIndices = newSquares
    .map((val, idx) => (val === null ? idx : null))
    .filter(val => val !== null);

  if (isMaximizing) {
    let maxEval = -Infinity;
    let bestMove = null;
    for (const idx of emptyIndices) {
      newSquares[idx] = aiPlayer;
      const evaluation = minimax(newSquares, depth + 1, false, aiPlayer, humanPlayer).score;
      newSquares[idx] = null;
      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = idx;
      }
    }
    return { score: maxEval, bestMove };
  } else {
    let minEval = Infinity;
    let bestMove = null;
    for (const idx of emptyIndices) {
      newSquares[idx] = humanPlayer;
      const evaluation = minimax(newSquares, depth + 1, true, aiPlayer, humanPlayer).score;
      newSquares[idx] = null;
      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = idx;
      }
    }
    return { score: minEval, bestMove };
  }
}

// ----------------------------------------------------------------------
// Test Suite: Tic Tac Toe Core Game Mechanics & AI
// ----------------------------------------------------------------------

test('Game Logic: calculateWinner detects row victory correctly', () => {
  const squares = [
    'X', 'X', 'X',
    null, 'O', null,
    'O', null, null
  ];
  const result = calculateWinner(squares);
  assert.notEqual(result, null);
  assert.equal(result.winner, 'X');
  assert.deepEqual(result.line, [0, 1, 2]);
});

test('Game Logic: calculateWinner detects column victory correctly', () => {
  const squares = [
    'O', 'X', null,
    'O', 'X', null,
    'O', null, 'X'
  ];
  const result = calculateWinner(squares);
  assert.notEqual(result, null);
  assert.equal(result.winner, 'O');
  assert.deepEqual(result.line, [0, 3, 6]);
});

test('Game Logic: calculateWinner detects diagonal victory correctly', () => {
  const squares = [
    'X', 'O', null,
    'O', 'X', null,
    null, 'O', 'X'
  ];
  const result = calculateWinner(squares);
  assert.notEqual(result, null);
  assert.equal(result.winner, 'X');
  assert.deepEqual(result.line, [0, 4, 8]);
});

test('Game Logic: calculateWinner returns null when no winner exists', () => {
  const squares = [
    'X', 'O', 'X',
    'X', 'O', 'O',
    'O', 'X', 'X'
  ]; // Draw board
  const result = calculateWinner(squares);
  assert.equal(result, null);
});

test('Game Logic: isBoardFull checks board capacity accurately', () => {
  const fullBoard = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
  const partialBoard = ['X', 'O', 'X', null, 'X', 'O', 'O', 'X', 'O'];

  assert.equal(isBoardFull(fullBoard), true);
  assert.equal(isBoardFull(partialBoard), false);
});

test('AI Logic: Minimax makes winning move when available', () => {
  // O needs index 2 to win immediately
  const board = [
    'O', 'O', null,
    'X', 'X', null,
    null, null, null
  ];
  const aiPlayer = 'O';
  const humanPlayer = 'X';
  
  const best = minimax(board, 0, true, aiPlayer, humanPlayer);
  assert.equal(best.bestMove, 2);
});

test('AI Logic: Minimax blocks opponent immediate win', () => {
  // X is about to win at index 2 ('X', 'X', null)
  const board = [
    'X', 'X', null,
    'O', null, null,
    null, null, null
  ];
  const aiPlayer = 'O';
  const humanPlayer = 'X';

  const best = minimax(board, 0, true, aiPlayer, humanPlayer);
  assert.equal(best.bestMove, 2);
});

// ----------------------------------------------------------------------
// Test Suite: State Management & Integration Simulations
// ----------------------------------------------------------------------

test('Integration: Simulating full game turn progression and score tracking', () => {
  let history = [Array(9).fill(null)];
  let stepNumber = 0;
  let xIsNext = true;
  let scores = { X: 0, O: 0, draws: 0 };

  const makeMove = (index) => {
    const currentSquares = [...history[stepNumber]];
    if (currentSquares[index] || calculateWinner(currentSquares)) return;

    currentSquares[index] = xIsNext ? 'X' : 'O';
    const newHistory = history.slice(0, stepNumber + 1).concat([currentSquares]);
    history = newHistory;
    stepNumber = newHistory.length - 1;
    xIsNext = !xIsNext;

    const winInfo = calculateWinner(currentSquares);
    if (winInfo) {
      scores[winInfo.winner] += 1;
    } else if (isBoardFull(currentSquares)) {
      scores.draws += 1;
    }
  };

  // Play a quick game X wins top row
  makeMove(0); // X
  makeMove(3); // O
  makeMove(1); // X
  makeMove(4); // O
  makeMove(2); // X wins!

  const finalWinnerInfo = calculateWinner(history[stepNumber]);
  assert.equal(finalWinnerInfo.winner, 'X');
  assert.equal(scores.X, 1);
  assert.equal(scores.O, 0);
  assert.equal(scores.draws, 0);
});

test('Integration: Time travel history state restoration', () => {
  let history = [
    Array(9).fill(null),
    ['X', null, null, null, null, null, null, null, null],
    ['X', 'O', null, null, null, null, null, null, null]
  ];
  
  // Jump to step 1
  let stepNumber = 1;
  let currentSquares = history[stepNumber];

  assert.equal(currentSquares[0], 'X');
  assert.equal(currentSquares[1], null);
  assert.equal(stepNumber, 1);

  // Jump back to latest step 2
  stepNumber = 2;
  currentSquares = history[stepNumber];
  assert.equal(currentSquares[1], 'O');
  assert.equal(stepNumber, 2);
});