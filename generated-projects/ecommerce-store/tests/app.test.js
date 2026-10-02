const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

// Import orders router or re-implement similar test logic if module export format varies
// Assuming orders router exports an Express router handling /api/orders
const ordersRouter = require('../routes/orders');

const app = express();
app.use(express.json());
app.use('/api/orders', ordersRouter);

test('E-Commerce Order API Integration Tests', async (t) => {
    
    await t.test('POST /api/orders - should successfully create an order with valid items', async () => {
        const payload = {
            items: [
                { id: 1, quantity: 2 },
                { id: 2, quantity: 1 }
            ],
            shipping: {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane.doe@example.com',
                address: '123 Main St',
                city: 'New York',
                postalCode: '10001',
                country: 'US'
            },
            payment: {
                cardNumber: '**** **** **** 1234',
                expiry: '12/25',
                cvv: '123'
            }
        };

        const response = await request(app)
            .post('/api/orders')
            .send(payload)
            .expect('Content-Type', /json/)
            .expect(201);

        assert.ok(response.body.success, 'Response should indicate success');
        assert.ok(response.body.orderId, 'Response should contain an orderId');
        assert.equal(typeof response.body.total, 'number', 'Total should be a calculated number');
        // Product 1: 49.99 * 2 = 99.98
        // Product 2: 89.99 * 1 = 89.99
        // Total = 189.97
        assert.equal(response.body.total, 189.97);
    });

    await t.test('POST /api/orders - should fail with 400 when cart items are missing', async () => {
        const payload = {
            items: [],
            shipping: {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john@example.com',
                address: '456 Oak Rd',
                city: 'Boston',
                postalCode: '02108',
                country: 'US'
            },
            payment: {
                cardNumber: '**** **** **** 5678',
                expiry: '10/26',
                cvv: '456'
            }
        };

        const response = await request(app)
            .post('/api/orders')
            .send(payload)
            .expect('Content-Type', /json/)
            .expect(400);

        assert.equal(response.body.success, false);
        assert.ok(response.body.error, 'Should return an error message for empty cart');
    });

    await t.test('POST /api/orders - should fail with 400 when shipping details are incomplete', async () => {
        const payload = {
            items: [
                { id: 1, quantity: 1 }
            ],
            shipping: {
                firstName: '',
                lastName: '',
                email: '',
                address: '',
                city: '',
                postalCode: '',
                country: ''
            },
            payment: {
                cardNumber: '1234567812345678',
                expiry: '11/24',
                cvv: '999'
            }
        };

        const response = await request(app)
            .post('/api/orders')
            .send(payload)
            .expect('Content-Type', /json/)
            .expect(400);

        assert.equal(response.body.success, false);
        assert.ok(response.body.error, 'Should return an error message for missing shipping information');
    });
});