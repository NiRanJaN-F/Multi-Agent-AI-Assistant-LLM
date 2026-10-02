const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const apiRouter = require('./routes/api.js');

// --- Setup Express App for Integration Tests ---
const app = express();
app.use(express.json());
app.use('/api', apiRouter);

test('Food Store App - Integration Test Suite', async (t) => {
  
  await t.test('GET /api/products should return list of products with correct schema', async () => {
    const response = await request(app).get('/api/products');
    
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.body), 'Response body should be an array');
    assert.ok(response.body.length > 0, 'Products array should not be empty');

    // Verify schema of the first item
    const product = response.body[0];
    assert.ok(typeof product.id === 'number', 'Product must have numeric id');
    assert.ok(typeof product.name === 'string', 'Product must have string name');
    assert.ok(typeof product.price === 'number', 'Product must have numeric price');
    assert.ok(typeof product.image === 'string', 'Product must have string image URL');
  });

  await t.test('POST /api/orders should successfully process a valid order payload', async () => {
    const orderPayload = {
      items: [
        { id: 1, name: "Classic Cheeseburger", price: 9.99, quantity: 2 },
        { id: 2, name: "Crispy French Fries", price: 3.49, quantity: 1 }
      ],
      customer: {
        name: "Jane Doe",
        address: "123 Gourmet Street",
        phone: "555-0199"
      },
      total: 23.47
    };

    const response = await request(app)
      .post('/api/orders')
      .send(orderPayload);

    // Depending on route implementation, accept standard 200 or 201
    assert.ok([200, 201].includes(response.status), `Expected 200 or 201, got ${response.status}`);
    assert.ok(response.body, 'Response body should exist');
    
    // Verify order response contract
    assert.strictEqual(response.body.status, 'success');
    assert.ok(response.body.orderId, 'Order response should contain an orderId');
    assert.strictEqual(response.body.total, orderPayload.total);
  });

  await t.test('POST /api/orders should handle invalid or empty payloads gracefully', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({});

    // If the endpoint validates required fields, it might return 400 or handle gracefully
    // Let's ensure it doesn't crash the server (status < 500)
    assert.ok(response.status < 500, `Server errored with status ${response.status}`);
  });

});