const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');

// Initialize the Express app for integration testing
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/api', apiRoutes);
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}

const app = createTestApp();

test('API Integration Tests - Fullstack E-Commerce Store', async (t) => {
  
  await t.test('GET /api/health returns status ok', async () => {
    const response = await request(app).get('/api/health');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok' });
  });

  await t.test('GET /api/products returns an array of products', async () => {
    const response = await request(app).get('/api/products');
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body), 'Response body should be an array');
    assert.ok(response.body.length > 0, 'Products array should not be empty');
    
    // Validate product structure
    const product = response.body[0];
    assert.ok(product.hasOwnProperty('id'), 'Product should have an id');
    assert.ok(product.hasOwnProperty('name'), 'Product should have a name');
    assert.ok(product.hasOwnProperty('price'), 'Product should have a price');
    assert.ok(product.hasOwnProperty('image'), 'Product should have an image');
  });

  await t.test('POST /api/checkout successfully processes orders with valid items', async () => {
    const orderPayload = {
      items: [
        { id: 1, quantity: 2 },
        { id: 2, quantity: 1 }
      ],
      customer: {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        address: '123 Test Street, Suite 100'
      }
    };

    const response = await request(app)
      .post('/api/checkout')
      .send(orderPayload);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.ok(response.body.orderId, 'Response should include an orderId');
    assert.ok(typeof response.body.total === 'number', 'Response should calculate a numeric total');
  });

  await t.test('POST /api/checkout handles invalid or empty items gracefully', async () => {
    const invalidPayload = {
      items: [],
      customer: {
        name: 'Incomplete User'
      }
    };

    const response = await request(app)
      .post('/api/checkout')
      .send(invalidPayload);

    // Depending on route implementation, expects 400 Bad Request or proper validation handling
    assert.ok(response.status >= 400 && response.status < 500, 'Should return a 4xx client error for empty items');
  });

  await t.test('GET /non-existent-route returns 404 fallback or error response', async () => {
    const response = await request(app).get('/api/non-existent-endpoint-12345');
    assert.equal(response.status, 404);
  });

});