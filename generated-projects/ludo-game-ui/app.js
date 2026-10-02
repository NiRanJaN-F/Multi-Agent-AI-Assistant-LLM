// ============================================================
// LUDO GAME - app.js
// Complete game logic for a 4-player Ludo game
// ============================================================

(function () {
  'use strict';

  // ==================== CONSTANTS ====================

  const PLAYERS = [
    { id: 0, name: 'Red',    color: '#e74c3c', colorLight: '#fadbd8', colorDark: '#c0392b', emoji: '🔴' },
    { id: 1, name: 'Green',  color: '#2ecc71', colorLight: '#d5f5e3', colorDark: '#27ae60', emoji: '🟢' },
    { id: 2, name: 'Yellow', color: '#f1c40f', colorLight: '#fef9e7', colorDark: '#f39c12', emoji: '🟡' },
    { id: 3, name: 'Blue',   color: '#3498db', colorLight: '#d6eaf8', colorDark: '#2980b9', emoji: '🔵' }
  ];

  const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47]; // Safe spots on the outer track

  // Outer track path (52 positions) - clockwise around the board
  // Each position is [row, col] on a 15x15 grid
  const OUTER_PATH = [
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    [0, 7], [0, 8],
    [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    [6, 9], [6,10], [6,11], [6,12], [6,13], [6,14],
    [7,14], [8,14],
    [8,13], [8,12], [8,11], [8,10], [8, 9],
    [9, 8], [10,8], [11,8], [12,8], [13,8], [14,8],
    [14,7], [14,6],
    [13,6], [12,6], [11,6], [10,6], [9, 6],
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    [7, 0], [6, 0]
  ];

  // Home column paths (5 positions each, leading to center)
  const HOME_PATHS = [
    // Red home column (from bottom of red's entry)
    [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    // Green home column
    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    // Yellow home column
    [[7,13], [7,12], [7,11], [7,10], [7, 9]],
    // Blue home column
    [[13,7], [12,7], [11,7], [10,7], [9, 7]]
  ];

  // Starting index on outer path for each player
  const START_INDICES = [0, 13, 26, 39];

  // Token positions in home base (3x3 grid positions within each base)
  const BASE_POSITIONS = [
    // Red base (top‑left 6×6 area, tokens in 3×3 inner area)
    [[1, 1], [1, 2], [2, 1], [2, 2]],
    // Green base (top‑right 6×6 area)
    [[1,11], [1,12], [2,11], [2,12]],
    // Yellow base (bottom‑right 6×6 area)
    [[11,11], [11,12], [12,11], [12,12]],
    // Blue base (bottom‑left 6×6 area)
    [[11,1], [11,2], [12,1], [12,2]]
  ];

  // ==================== GAME STATE ====================

  let gameState = {
    currentPlayer: 0,
    diceValue: 0,
    diceRolling: false,
    phase: 'roll', // 'roll', 'move', 'gameover'
    tokens: [], // Array of 4 arrays, each with 4 token states
    consecutiveSixes: 0,
    winner: null,
    moveHistory: [],
    animating: false
  };

  // ==================== DOM REFERENCES ====================

  let boardEl = null;
  let diceEl = null;
  let diceValueEl = null;
  let currentPlayerEl = null;
  let messageEl = null;
  let statusEl = null;
  let newGameBtn = null;
  let playerInfoContainer = null;
  let soundEnabled = true;

  // ==================== INITIALIZATION ====================

  function init() {
    cacheDOMElements();
    loadState();
    if (gameState.phase === 'gameover' || !gameState.tokens.length) {
      resetGame();
    }
    // Apply player colours to CSS variables for easy theming
    applyPlayerColorsToCSS();

    // Render the colour‑coded player info panel
    renderPlayerInfo();

    // Render board and tokens
    renderBoard();
    // Colour the board squares according to player zones
    applyBoardColors();

    renderTokens();
    updateUI();
    bindEvents();
  }

  function cacheDOMElements() {
    boardEl = document.getElementById('ludo-board');
    diceEl = document.getElementById('dice');
    diceValueEl = document.getElementById('dice-value');
    currentPlayerEl = document.getElementById('current-player');
    messageEl = document.getElementById('message');
    statusEl = document.getElementById('game-status');
    newGameBtn = document.getElementById('new-game');
    playerInfoContainer = document.getElementById('player-info');
  }

  // ------------------------------------------------------------
  //  Colour the board for the four players
  // ------------------------------------------------------------
  /**
   * Colours the board cells according to the four player zones.
   *   • Each player's 6×6 home base gets a light tint (`colorLight`).
   *   • The five‑cell home column (the “track” that leads to the centre)
   *     gets a darker shade (`colorDark`).
   *   • All other cells keep the default board colour.
   *
   * The function assumes that `renderBoard()` creates a grid where each
   * cell has the class `cell` and data attributes `data-row` and
   * `data-col` that correspond to the coordinates used in the path
   * definitions above.
   */
  function applyBoardColors() {
    if (!boardEl) return;

    const cells = boardEl.querySelectorAll('.cell');

    cells.forEach(cell => {
      const row = parseInt(cell.dataset.row, 10);
      const col = parseInt(cell.dataset.col, 10);

      // -----------------------------------------------------------------
      // 1️⃣  Home bases (light colours)
      // -----------------------------------------------------------------
      // Red base – top‑left quadrant (rows 0‑5, cols 0‑5)
      if (row <= 5 && col <= 5) {
        cell.style.backgroundColor = PLAYERS[0].colorLight;
        return;
      }
      // Green base – top‑right quadrant (rows 0‑5, cols 9‑14)
      if (row <= 5 && col >= 9) {
        cell.style.backgroundColor = PLAYERS[1].colorLight;
        return;
      }
      // Yellow base – bottom‑right quadrant (rows 9‑14, cols 9‑14)
      if (row >= 9 && col >= 9) {
        cell.style.backgroundColor = PLAYERS[2].colorLight;
        return;
      }
      // Blue base – bottom‑left quadrant (rows 9‑14, cols 0‑5)
      if (row >= 9 && col <= 5) {
        cell.style.backgroundColor = PLAYERS[3].colorLight;
        return;
      }

      // -----------------------------------------------------------------
      // 2️⃣  Home columns (dark colours)
      // -----------------------------------------------------------------
      HOME_PATHS.forEach((path, playerIdx) => {
        path.forEach(([pRow, pCol]) => {
          if (row === pRow && col === pCol) {
            cell.style.backgroundColor = PLAYERS[playerIdx].colorDark;
          }
        });