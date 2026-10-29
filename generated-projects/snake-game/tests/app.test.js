const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const path = require('path');
const fs = require('node:fs');

// Helper to set up Express app mirroring server.js
function createTestApp() {
  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  return app;
}

test('Project Structure & Static Assets Verification', () => {
  const packageJsonPath = path.join(__dirname, 'package.json');
  assert.ok(fs.existsSync(packageJsonPath), 'package.json should exist');

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  assert.strictEqual(pkg.name, 'arcade-snake-game');
  assert.ok(pkg.dependencies.express, 'express dependency must be present');

  const publicDir = path.join(__dirname, 'public');
  assert.ok(fs.existsSync(path.join(publicDir, 'index.html')), 'index.html must exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'css', 'style.css')), 'style.css must exist');
  assert.ok(fs.existsSync(path.join(publicDir, 'js', 'game.js')), 'game.js must exist');
});

test('Express Server Integration Tests', async (t) => {
  const app = createTestApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  await t.test('GET / returns 200 OK and index.html content', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('CyberSnake 2077'), 'HTML should contain game title');
    assert.ok(html.includes('gameCanvas'), 'HTML should contain canvas element');
  });

  await t.test('GET /css/style.css returns stylesheet', async () => {
    const res = await fetch(`${baseUrl}/css/style.css`);
    assert.strictEqual(res.status, 200);
    const css = await res.text();
    assert.ok(css.includes('CyberSnake'), 'CSS should contain theme header');
  });

  await t.test('GET /js/game.js returns game logic script', async () => {
    const res = await fetch(`${baseUrl}/js/game.js`);
    assert.strictEqual(res.status, 200);
    const js = await res.text();
    assert.ok(js.includes('DOMContentLoaded'), 'JS should contain DOMContentLoaded listener');
  });

  await new Promise((resolve) => server.close(resolve));
});

test('Snake Game Core Logic Unit Simulations', () => {
  // Simulate grid movement and collision detection helpers commonly found in snake mechanics
  function moveSnake(snake, direction) {
    const head = { ...snake[0] };
    if (direction === 'UP') head.y -= 1;
    if (direction === 'DOWN') head.y += 1;
    if (direction === 'LEFT') head.x -= 1;
    if (direction === 'RIGHT') head.x += 1;
    
    snake.unshift(head);
    snake.pop();
    return snake;
  }

  function checkWallCollision(head, width, height) {
    return head.x < 0 || head.x >= width || head.y < 0 || head.y >= height;
  }

  function checkSelfCollision(snake) {
    const [head, ...body] = snake;
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }

  const initialSnake = [{x: 5, y: 5}, {x: 4, y: 5}, {x: 3, y: 5}];
  
  // Test Movement
  const moved = moveSnake([...initialSnake], 'RIGHT');
  assert.deepStrictEqual(moved[0], {x: 6, y: 5}, 'Snake head should move right');
  assert.strictEqual(moved.length, 3, 'Snake length should remain unchanged without food');

  // Test Wall Collision
  assert.strictEqual(checkWallCollision({x: -1, y: 5}, 20, 20), true, 'Out of bounds left should collide');
  assert.strictEqual(checkWallCollision({x: 20, y: 5}, 20, 20), true, 'Out of bounds right should collide');
  assert.strictEqual(checkWallCollision({x: 5, y: 5}, 20, 20), false, 'Inside bounds should not collide');

  // Test Self Collision
  const selfCollidingSnake = [{x: 5, y: 5}, {x: 4, y: 5}, {x: 4, y: 6}, {x: 5, y: 6}, {x: 5, y: 5}];
  assert.strictEqual(checkSelfCollision(selfCollidingSnake), true, 'Collision with body segments should be detected');
});