const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');

// Setup Express app for integration testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRoutes);

test('Fullstack Book Store API Integration Test Suite', async (t) => {
    
    await t.test('GET /api/products should return a list of books', async () => {
        const response = await request(app)
            .get('/api/products')
            .expect('Content-Type', /json/)
            .expect(200);

        assert.ok(Array.isArray(response.body), 'Response body should be an array');
        assert.ok(response.body.length > 0, 'Products array should not be empty');
        
        const firstBook = response.body[0];
        assert.ok(firstBook.id, 'Book should have an id');
        assert.ok(firstBook.title, 'Book should have a title');
        assert.ok(typeof firstBook.price === 'number', 'Book price should be a number');
    });

    await t.test('POST /api/checkout should successfully process an order', async () => {
        const orderPayload = {
            items: [
                { id: 1, title: 'The Pragmatic Programmer', price: 49.99, quantity: 2 }
            ],
            shippingInfo: {
                name: 'Jane Doe',
                address: '123 Test St',
                city: 'Testville',
                zip: '12345'
            }
        };

        const response = await request(app)
            .post('/api/checkout')
            .send(orderPayload)
            .expect('Content-Type', /json/)
            .expect(200);

        assert.equal(response.body.success, true, 'Checkout should return success: true');
        assert.ok(response.body.orderId, 'Checkout response should include an orderId');
        assert.equal(response.body.total, 99.98, 'Total calculation should match item price * quantity');
    });

    await t.test('POST /api/checkout should fail if items are missing', async () => {
        const invalidPayload = {
            shippingInfo: {
                name: 'Jane Doe',
                address: '123 Test St'
            }
        };

        const response = await request(app)
            .post('/api/checkout')
            .send(invalidPayload)
            .expect('Content-Type', /json/)
            .expect(400);

        assert.equal(response.body.success, false, 'Checkout should return success: false for invalid payload');
        assert.ok(response.body.error, 'Should provide an error message');
    });

});