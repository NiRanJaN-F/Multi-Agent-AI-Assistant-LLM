// test/chessBoard.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const INDEX_HTML = 'index.html';
const BOARD_CSS = 'css/board.css';
const STYLES_CSS = 'styles.css';

test('index.html loads and contains a chessboard grid', async () => {
  const html = await readFile(INDEX_HTML, 'utf8');
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const board = document.querySelector('#chessboard');
  assert.ok(board, 'Chessboard element with id="chessboard" should exist');
  assert.strictEqual(board.getAttribute('role'), 'grid', 'Chessboard should have role="grid"');

  const squares = board.querySelectorAll('.square');
  assert.strictEqual(squares.length, 64, 'There should be exactly 64 squares');

  // Verify each square has data-row and data-col attributes 0-7
  const rows = new Set();
  const cols = new Set();
  squares.forEach((sq, idx) => {
    const row = sq.getAttribute('data-row');
    const col = sq.getAttribute('data-col');
    assert.ok(row !== null && col !== null, `Square ${idx} missing data-row or data-col`);
    const r = parseInt(row, 10);
    const c = parseInt(col, 10);
    assert.ok(r >= 0 && r <= 7, `Square ${idx} has invalid row ${row}`);
    assert.ok(c >= 0 && c <= 7, `Square ${idx} has invalid col ${col}`);
    rows.add(r);
    cols.add(c);
  });
  assert.strictEqual(rows.size, 8, 'There should be 8 unique rows');
  assert.strictEqual(cols.size, 8, 'There should be 8 unique columns');

  // Verify alternating light/dark pattern
  squares.forEach((sq) => {
    const r = parseInt(sq.getAttribute('data-row'), 10);
    const c = parseInt(sq.getAttribute('data-col'), 10);
    const isLight = (r + c) % 2 === 0;
    if (isLight) {
      assert.ok(sq.classList.contains('light'), `Square at (${r},${c}) should have class "light"`);
      assert.ok(!sq.classList.contains('dark'), `Square at (${r},${c}) should not have class "dark"`);
    } else {
      assert.ok(sq.classList.contains('dark'), `Square at (${r},${c}) should have class "dark"`);
      assert.ok(!sq.classList.contains('light'), `Square at (${r},${c}) should not have class "light"`);
    }
  });
});

test('index.html includes correct stylesheet links', async () => {
  const html = await readFile(INDEX_HTML, 'utf8');
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  const hrefs = links.map((l) => l.getAttribute('href'));
  assert.ok(hrefs.includes('styles.css'), 'styles.css should be linked');
  assert.ok(hrefs.includes('css/board.css'), 'css/board.css should be linked');
});

test('board.css defines expected selectors and properties', async () => {
  const css = await readFile(BOARD_CSS, 'utf8');

  // Check for .chess-board selector
  assert.ok(/\.chess-board\s*\{/.test(css), 'CSS should contain .chess-board selector');

  // Check for .square selector
  assert.ok(/\.square\s*\{/.test(css), 'CSS should contain .square selector');

  // Check for max-width: 480px
  assert.ok(/max-width\s*:\s*480px/.test(css), 'CSS should set max-width to 480px');

  // Check for aspect-ratio: 1 / 1
  assert.ok(/aspect-ratio\s*:\s*1\s*\/\s*1/.test(css), 'CSS should set aspect-ratio to 1 / 1');

  // Check for border: 2px solid #333
  assert.ok(/border\s*:\s*2px\s+solid\s+#333/.test(css), 'CSS should set border to 2px solid #333');

  // Check for margin: 0 auto
  assert.ok(/margin\s*:\s*0\s+auto/.test(css), 'CSS should set margin to 0 auto');
});

test('styles.css contains global reset and layout styles', async () => {
  const css = await readFile(STYLES_CSS, 'utf8');

  // Check for universal selector reset
  assert.ok(/\*\s*\{/.test(css), 'CSS should contain universal selector reset');

  // Check for body background color
  assert.ok(/body\s*\{[^}]*background-color\s*:\s*#1a1a2e/.test(css), 'Body should have background-color #1a1a2e');

  // Check for container max-width
  assert.ok(/\.container\s*\{[^}]*max-width\s*:\s*600px/.test(css), 'Container should have max-width 600px');
});

test('chessboard element uses correct class name', async () => {
  const html = await readFile(INDEX_HTML, 'utf8');
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const board = document.querySelector('#