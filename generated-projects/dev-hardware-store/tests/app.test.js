const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

// Import the API router from the generated source structure
const apiRouter = require('../routes/api');

// Setup express app for testing integration routes
const app = express();
app.use(express.json());
app.use('/api', apiRouter);

test('dev-hardware-store Integration & Unit Test Suite', async (t) => {

    await t.test('GET /api/products - should return the list of hardware store products', async () => {
        const response = await request(app)
            .get('/api/products')
            .expect('Content-Type', /json/)
            .expect(200);

        assert.ok(Array.isArray(response.body), 'Response body should be an array');
        assert.ok(response.body.length > 0, 'Products list should not be empty');
        
        // Validate product shape
        const sampleProduct = response.body[0];
        assert.ok(sampleProduct.id, 'Product should have an id');
        assert.ok(sampleProduct.name, 'Product should have a name');
        assert.ok(typeof sampleProduct.price === 'number', 'Product price should be a number');
        assert.ok(sampleProduct.image, 'Product should have an image URL');
    });

    await t.test('GET /api/cart - should retrieve current shopping cart state', async () => {
        const response = await request(app)
            .get('/api/cart')
            .expect('Content-Type', /json/)
            .expect(200);

        assert.ok(response.body, 'Cart response should exist');
        assert.ok(Array.isArray(response.body.items), 'Cart should contain an items array');
        assert.equal(typeof response.body.total, 'number', 'Cart should compute a numerical total');
    });

    await t.test('POST /api/cart - should add an item to the cart', async () => {
        const itemToAdd = { id: 1, quantity: 2 };

        const response = await request(app)
            .post('/api/cart')
            .send(itemToAdd)
            .expect('Content-Type', /json/)
            .expect(200);

        assert.ok(response.body, 'Response should return updated cart state');
        assert.ok(response.body.items.length > 0, 'Cart items length should be greater than 0');
        
        const addedItem = response.body.items.find(i => i.id === 1);
        assert.ok(addedItem, 'Item ID 1 should be present in cart');
        assert.equal(addedItem.quantity, 2, 'Quantity for item ID 1 should match request');
    });

    await t.test('POST /api/checkout - should successfully process checkout and return order confirmation', async () => {
        const checkoutPayload = {
            customer: {
                name: "Ada Lovelace",
                email: "ada@analytical.engine",
                address: "123 Computing Way"
            },
            payment: {
                method: "card"
            }
        };

        const response = await request(app)
            .post('/api/checkout')
            .send(checkoutPayload)
            .expect('Content-Type', /json/)
            .expect(200);

        assert.ok(response.body, 'Checkout response should exist');
        assert.equal(response.body.success, true, 'Checkout success flag should be true');
        assert.ok(response.body.orderId, 'Order confirmation should generate an orderId');
        assert.ok(response.body.message, 'Order confirmation should include a status message');
    });

});