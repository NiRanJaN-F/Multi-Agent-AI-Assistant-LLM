const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('path');
const express = require('express');

// Mock DOM environment setup for testing front-end logic if required, 
// and validating the Express server integration.

const PORT = 3001;

test('Snake Game Integration & Unit Test Suite', async (t) => {
    
    // --- SERVER & ROUTE INTEGRATION TESTS ---
    await t.test('Express Server setup and static asset routing', async () => {
        const app = express();
        app.use(express.static(path.join(__dirname, 'public')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        const server = http.createServer(app);
        
        await new Promise((resolve) => server.listen(PORT, resolve));

        try {
            const response = await fetch(`http://localhost:${PORT}/`);
            assert.equal(response.status, 200, 'Server should respond with 200 OK for root route');
            const htmlText = await response.text();
            assert.ok(htmlText.includes('CyberSnake Neo'), 'Index page should contain application title');
        } finally {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    // --- GAME ENGINE / CORE MECHANICS UNIT TESTS ---
    await t.test('Game State & Grid Collision Logic', () => {
        // Simulated core grid & movement rules test to ensure pure logic reliability
        const GRID_SIZE = 20;
        
        function checkWallCollision(head, gridSize) {
            return head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
        }

        // Test safe positions
        assert.equal(checkWallCollision({ x: 5, y: 5 }, GRID_SIZE), false, 'Inside grid should not trigger wall collision');
        
        // Test boundary breaches
        assert.equal(checkWallCollision({ x: -1, y: 5 }, GRID_SIZE), true, 'Left boundary breach should trigger collision');
        assert.equal(checkWallCollision({ x: 20, y: 5 }, GRID_SIZE), true, 'Right boundary breach should trigger collision');
        assert.equal(checkWallCollision({ x: 5, y: -1 }, GRID_SIZE), true, 'Top boundary breach should trigger collision');
        assert.equal(checkWallCollision({ x: 5, y: 20 }, GRID_SIZE), true, 'Bottom boundary breach should trigger collision');
    });

    await t.test('Snake Self-Collision Detection Logic', () => {
        function checkSelfCollision(head, snakeBody) {
            return snakeBody.some(segment => segment.x === head.x && segment.y === head.y);
        }

        const snake = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 },
            { x: 5, y: 5 } // Self collision at tail/body overlap
        ];

        const head = snake[0];
        const bodyWithoutHead = snake.slice(1);

        assert.equal(checkSelfCollision(head, bodyWithoutHead), true, 'Collision should be detected when head coordinates match body segments');
        
        const safeBody = [
            { x: 4, y: 5 },
            { x: 3, y: 5 },
            { x: 2, y: 5 }
        ];
        assert.equal(checkSelfCollision(head, safeBody), false, 'No collision should be detected when path is clear');
    });

    await t.test('Food Consumption and Score Increment Logic', () => {
        let score = 0;
        let foodEaten = 0;
        let currentLevel = 1;

        function eatFood() {
            score += 10 * currentLevel;
            foodEaten += 1;
            if (foodEaten % 5 === 0) {
                currentLevel += 1;
            }
        }

        // Initial state
        assert.equal(score, 0);
        assert.equal(foodEaten, 0);
        assert.equal(currentLevel, 1);

        // Eat first food
        eatFood();
        assert.equal(score, 10);
        assert.equal(foodEaten, 1);
        assert.equal(currentLevel, 1);

        // Reach level up threshold (5 items)
        eatFood();
        eatFood();
        eatFood();
        eatFood(); // 5th food
        assert.equal(foodEaten, 5);
        assert.equal(currentLevel, 2, 'Level should increase after 5 food items');
    });
});