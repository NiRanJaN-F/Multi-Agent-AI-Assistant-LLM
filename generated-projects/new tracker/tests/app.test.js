const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

// Import routers from the generated project structure
const savingsRouter = require('./routes/savings');
const checkoutRouter = require('./routes/checkout');

// Setup a minimal Express application for testing the API routes
function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/savings', savingsRouter);
    app.use('/api/checkout', checkoutRouter);
    return app;
}

test('API Integration Tests - Savings and Checkout Suite', async (t) => {
    const app = createApp();

    await t.test('GET /api/savings should return initial savings goals array', async () => {
        const response = await request(app).get('/api/savings');
        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(response.body), 'Response body should be an array');
        assert.strictEqual(response.body.length, 1);
        assert.strictEqual(response.body[0].goal, 'Vacation');
        assert.strictEqual(response.body[0].target, 1000);
    });

    await t.test('POST /api/savings should create a new savings goal', async () => {
        const newGoalPayload = {
            goal: 'New Laptop',
            target: 1500,
            current: 100
        };

        const response = await request(app)
            .post('/api/savings')
            .send(newGoalPayload);

        assert.strictEqual(response.status, 201);
        assert.strictEqual(response.body.success, true);
        assert.ok(response.body.data);
        assert.strictEqual(response.body.data.goal, 'New Laptop');
        assert.strictEqual(response.body.data.target, 1500);
        assert.strictEqual(response.body.data.current, 100);
    });

    await t.test('POST /api/savings should return 400 for missing required fields', async () => {
        const invalidPayload = {
            target: 500
        };

        const response = await request(app)
            .post('/api/savings')
            .send(invalidPayload);

        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.success, false);
        assert.ok(response.body.message);
    });

    await t.test('POST /api/checkout should successfully process a savings contribution', async () => {
        // First get the list to grab a valid goal ID (e.g., 's1' from initial data)
        const savingsRes = await request(app).get('/api/savings');
        const targetGoal = savingsRes.body[0];

        const checkoutPayload = {
            goalId: targetGoal.id,
            amount: 50,
            paymentMethod: 'Credit Card'
        };

        const response = await request(app)
            .post('/api/checkout')
            .send(checkoutPayload);

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.success, true);
        assert.ok(response.body.goal);
        assert.strictEqual(response.body.goal.current, targetGoal.current + 50);
    });

    await t.test('POST /api/checkout should return 400 when goalId is missing', async () => {
        const invalidPayload = {
            amount: 50,
            paymentMethod: 'Credit Card'
        };

        const response = await request(app)
            .post('/api/checkout')
            .send(invalidPayload);

        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.success, false);
        assert.strictEqual(response.body.error, 'Goal ID is required');
    });

    await t.test('POST /api/checkout should return 400 when goal is not found', async () => {
        const invalidPayload = {
            goalId: 'non-existent-id-999',
            amount: 50,
            paymentMethod: 'Credit Card'
        };

        const response = await request(app)
            .post('/api/checkout')
            .send(invalidPayload);

        assert.strictEqual(response.status, 404);
        assert.strictEqual(response.body.success, false);
        assert.strictEqual(response.body.error, 'Savings goal not found');
    });
});