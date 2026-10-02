// Winning combinations for a standard 3x3 Tic-Tac-Toe board
const WINNING_LINES = [
  [0, 1, 2], // Row 0
  [3, 4, 5], // Row 1
  [6, 7, 8], // Row 2
  [0, 3, 6], // Col 0
  [1, 4, 7], // Col 1
  [2, 5, 8], // Col 2
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6]  // Diagonal top-right to bottom-left
];

/**
 * Checks the board for a winner or draw.
 * 
 * @param {Array<string|null>} board - Array of 9 elements representing the board ('X', 'O', or null)
 * @returns {Object} Result object { winner: 'X'|'O'|'DRAW'|null, line: Array<number>|null }
 */
export function checkWinner(board) {
  for (let i = 0; i < WINNING_LINES.length; i++) {
    const [a, b, c] = WINNING_LINES[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        line: WINNING_LINES[i]
      };
    }
  }

  // Check for draw (board is full)
  if (board.every((square) => square !== null)) {
    return {
      winner: 'DRAW',
      line: null
    };
  }

  return {
    winner: null,
    line: null
  };
}

/**
 * Returns coordinate configurations (for SVG line rendering) corresponding to the winning line index.
 * 
 * @param {Array<number>} line - Array of 3 indices representing the winning line
 * @returns {Object} SVG line coordinates { x1, y1, x2, y2 } or null
 */
export function getWinningLineCoords(line) {
  if (!line) return null;

  // Map 0-8 indices to percentage or absolute pixel layouts within a standard grid container
  // Here we use percentage coordinates from 0 to 100 for responsive scaling inside SVG viewBox="0 0 100 100"
  const coordsMap = {
    // Rows
    '0,1,2': { x1: 5, y1: 16.66, x2: 95, y2: 16.66 },
    '3,4,5': { x1: 5, y1: 50, x2: 95, y2: 50 },
    '6,7,8': { x1: 5, y1: 83.33, x2: 95, y2: 83.33 },

    // Columns
    '0,3,6': { x1: 16.66, y1: 5, x2: 16.66, y2: 95 },
    '1,4,7': { x1: 50, y1: 5, x2: 50, y2: 95 },
    '2,5,8': { x1: 83.33, y1: 5, x2: 83.33, y2: 95 },

    // Diagonals
    '0,4,8': { x1: 10, y1: 10, x2: 90, y2: 90 },
    '2,4,6': { x1: 90, y1: 10, x2: 10, y2: 90 }
  };

  // Sort line indices to match key format reliably
  const key = [...line].sort((a, b) => a - b).join(',');
  return coordsMap[key] || null;
}

/**
 * Minimax algorithm implementation for unbeatable AI player ('O').
 * 
 * @param {Array<string|null>} board - Current board state
 * @param {number} depth - Current recursion depth
 * @param {boolean} isMaximizing - True if AI turn ('O'), false if player turn ('X')
 * @returns {number} Score evaluation of the board
 */
function minimax(board, depth, isMaximizing) {
  const resultObj = checkWinner(board);
  
  if (resultObj.winner === 'O') return 10 - depth;
  if (resultObj.winner === 'X') return depth - 10;
  if (resultObj.winner === 'DRAW') return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        let score = minimax(board, depth + 1, false);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        let score = minimax(board, depth + 1, true);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

/**
 * Finds the optimal move index for the AI player ('O').
 * 
 * @param {Array<string|null>} board - Current board state
 * @returns {number} The best index (0-8) to place 'O'
 */
export function findBestMove(board) {
  // If the board is completely empty, taking the center or a corner is a strong opening
  const emptySquaresCount = board.filter(square => square === null).length;
  if (emptySquaresCount === 9) {
    return 4; // Center
  }

  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      board[i] = 'O';
      let score = minimax(board, 0, false);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove;
}