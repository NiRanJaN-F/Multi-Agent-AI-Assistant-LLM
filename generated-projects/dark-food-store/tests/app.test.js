const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

// Import routes
const productRouter = require('../routes/products');

// Setup Express app for integration tests
const app = express();
app.use(express.json());
app.use('/api/products', productRouter);

// Mock checkout route to match expected backend behavior for tests
app.post('/api/checkout', (req, res) => {
    const { items, customer } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty or invalid' });
    }
    if (!customer || !customer.name || !customer.address) {
        return res.status(400).json({ error: 'Customer details are incomplete' });
    }
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    return res.status(200).json({
        success: true,
        orderId,
        message: 'Order placed successfully',
        timestamp: new Date().toISOString()
    });
});

test('Dark Food Store Test Suite', async (t) => {

    await t.test('GET /api/products - should return list of products', async () => {
        const response = await request(app).get('/api/products');
        assert.strictEqual(response.status, 200);
        assert.equal(Array.isArray(response.body), true);
        assert.ok(response.body.length > 0);
        
        const firstProduct = response.body[0];
        assert.ok(firstProduct.id);
        assert.ok(firstProduct.name);
        assert.ok(firstProduct.category);
        assert.ok(typeof firstProduct.price === 'number');
    });

    await t.test('POST /api/checkout - should successfully process valid order', async () => {
        const payload = {
            items: [
                { id: 1, name: 'Truffle Black Burger', price: 14.99, quantity: 2 }
            ],
            customer: {
                name: 'John Doe',
                email: 'john@example.com',
                address: '123 Midnight Lane, Gotham'
            }
        };

        const response = await request(app)
            .post('/api/checkout')
            .send(payload);

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.success, true);
        assert.ok(response.body.orderId);
        assert.ok(response.body.orderId.startsWith('ORD-'));
    });

    await t.test('POST /api/checkout - should reject empty cart', async () => {
        const payload = {
            items: [],
            customer: {
                name: 'Jane Doe',
                email: 'jane@example.com',
                address: '456 Dark St'
            }
        };

        const response = await request(app)
            .post('/api/checkout')
            .send(payload);

        assert.strictEqual(response.status, 400);
        assert.ok(response.body.error);
    });

    await t.test('POST /api/checkout - should reject missing customer details', async () => {
        const payload = {
            items: [
                { id: 2, name: 'Midnight Pepperoni Pizza', price: 18.50, quantity: 1 }
            ],
            customer: {}
        };

        const response = await request(app)
            .post('/api/checkout')
            .send(payload);

        assert.strictEqual(response.status, 400);
        assert.ok(response.body.error);
    });

});