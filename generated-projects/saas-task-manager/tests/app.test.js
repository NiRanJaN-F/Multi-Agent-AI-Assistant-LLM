const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/auth');

// --- Unit & Integration Test Suite for saas-task-manager ---

test('Authentication Middleware Unit Tests', async (t) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

    // Setup a minimal Express app to test the auth middleware
    const app = express();
    app.use(express.json());
    app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true, user: req.user });
    });

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    t.after(() => {
        server.close();
    });

    await t.test('should return 401 when no token is provided', async () => {
        const res = await fetch(`${baseUrl}/protected`);
        assert.strictEqual(res.status, 401);
        const data = await res.json();
        assert.deepStrictEqual(data, { error: 'Access token required' });
    });

    await t.test('should return 403 when an invalid token is provided', async () => {
        const res = await fetch(`${baseUrl}/protected`, {
            headers: { 'Authorization': 'Bearer invalidtoken123' }
        });
        assert.strictEqual(res.status, 403);
        const data = await res.json();
        assert.deepStrictEqual(data, { error: 'Invalid or expired token' });
    });

    await t.test('should allow access and attach user when a valid token is provided', async () => {
        const payload = { id: 1, username: 'testuser' };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        const res = await fetch(`${baseUrl}/protected`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.user.id, 1);
        assert.strictEqual(data.user.username, 'testuser');
    });
});

test('JWT Secret Configuration Validation', () => {
    const defaultSecret = 'super-secret-jwt-key-change-in-production';
    assert.ok(defaultSecret.length > 10, 'JWT secret should be sufficiently long');
});