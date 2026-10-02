import test from 'node:test';
import assert from 'node:assert/strict';

// Import game logic utility functions directly from the project source
import { checkWinner, findBestMove, getWinningLineCoords } from '../src/utils/gameLogic.js';

test('gameLogic - checkWinner should correctly identify empty boards', () => {
  const board = Array(9).fill(null);
  const result = checkWinner(board);
  assert.equal(result, null);
});

test('gameLogic - checkWinner should detect horizontal X win on top row', () => {
  const board = [
    'X', 'X', 'X',
    'O', 'O', null,
    null, null, null
  ];
  const result = checkWinner(board);
  assert.deepEqual(result, { winner: 'X', line: [0, 1, 2] });
});

test('gameLogic - checkWinner should detect vertical O win on middle column', () => {
  const board = [
    'X', 'O', 'X',
    null, 'O', null,
    'X', 'O', null
  ];
  const result = checkWinner(board);
  assert.deepEqual(result, { winner: 'O', line: [1, 4, 7] });
});

test('gameLogic - checkWinner should detect diagonal X win', () => {
  const board = [
    'X', 'O', null,
    'O', 'X', null,
    null, null, 'X'
  ];
  const result = checkWinner(board);
  assert.deepEqual(result, { winner: 'X', line: [0, 4, 8] });
});

test('gameLogic - checkWinner should detect a tie (draw)', () => {
  const board = [
    'X', 'O', 'X',
    'X', 'O', 'O',
    'O', 'X', 'X'
  ];
  const result = checkWinner(board);
  assert.deepEqual(result, { winner: 'tie', line: null });
});

test('gameLogic - findBestMove should block imminent opponent win on hard difficulty', () => {
  // O is about to win if X doesn't block index 2
  const board = [
    'O', 'O', null,
    'X', 'X', null,
    null, null, null
  ];
  const bestMove = findBestMove(board, 'hard', 'O');
  // AI playing as 'O' should take the winning move at index 2
  assert.equal(bestMove, 2);
});

test('gameLogic - findBestMove should return a valid legal move on an empty board', () => {
  const board = Array(9).fill(null);
  const bestMove = findBestMove(board, 'easy', 'O');
  assert.ok(bestMove >= 0 && bestMove <= 8);
  assert.equal(board[bestMove], null);
});

test('gameLogic - getWinningLineCoords should return valid SVG coordinate percentages', () => {
  const coords = getWinningLineCoords([0, 1, 2]);
  assert.ok(coords);
  assert.equal(typeof coords.x1, 'number');
  assert.equal(typeof coords.y1, 'number');
  assert.equal(typeof coords.x2, 'number');
  assert.equal(typeof coords.y2, 'number');
});