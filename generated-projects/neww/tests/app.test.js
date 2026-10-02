// test/api.test.js
// Automated test suite for the generated "neww" project (HTML/CSS/JS + Express API)

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Helper: perform an HTTP request against a running server and resolve with
// the response object and the raw body string.
// ---------------------------------------------------------------------------
function httpRequest({ method = 'GET', hostname, port, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = { method, hostname, port, path, headers };
    const req = http.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ res, data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Test suite setup: spin up a minimal Express app that mounts the API router.
// ---------------------------------------------------------------------------
let server;
let port;

before(async () => {
  // Import the router defined in routes/api.js
  const apiRouter = require('../routes/api');

  // Build a tiny Express app that only serves the API routes.
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  // Listen on an OS‑assigned random port.
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  port = server.address().port;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

// ---------------------------------------------------------------------------
// 1️⃣ Verify that the router exported from routes/api.js is a valid Express
//    router and contains the expected route definitions.
// ---------------------------------------------------------------------------
test('routes/api.js exports a functional Express router', () => {
  const router = require('../routes/api');
  // An Express router is essentially a callable function with a stack property.
  assert.equal(typeof router, 'function', 'router should be a function');
  assert.ok(Array.isArray(router.stack), 'router.stack should be an array');
  // At least one route (GET /products) must be defined in the stack.
  const hasProductsRoute = router.stack.some(
    (layer) => layer.route && layer.route.path === '/products' && layer.route.methods.get
  );
  assert.ok(hasProductsRoute, 'router should define GET /products');
});

// ---------------------------------------------------------------------------
// 2️⃣ GET /api/products – should return the full product catalog as JSON.
// ---------------------------------------------------------------------------
test('GET /api/products returns the complete product list', async () => {
  const { res, data } = await httpRequest({
    hostname: 'localhost',
    port,
    path: '/api/products',
    headers: { Accept: 'application/json' },
  });

  // Basic HTTP assertions
  assert.strictEqual(res.statusCode, 200, 'status code should be 200');
  assert.ok(
    res.headers['content-type']?.includes('application/json'),
    'Content-Type should be application/json'
  );

  // Parse and validate payload
  const payload = JSON.parse(data);
  assert.ok(Array.isArray(payload), 'response body should be an array');
  assert.strictEqual(payload.length, 6, 'catalog should contain 6 products');

  // Spot‑check first product fields
  const first = payload[0];
  assert.strictEqual(first.id, 1);
  assert.strictEqual(first.name, 'Wireless Headphones');
  assert.strictEqual(typeof first.price, 'number');
  assert.ok(first.image?.startsWith('https://'), 'image should be a URL');
});

// ---------------------------------------------------------------------------
// 3️⃣ GET /api/products/:id – valid ID returns product, invalid ID 404.
// ---------------------------------------------------------------------------
test('GET /api/products/:id returns a single product when ID exists', async () => {
  const { res, data } = await httpRequest({
    hostname: 'localhost',
    port,
    path: '/api/products/2',
    headers: { Accept: 'application/json' },
  });

  assert.strictEqual(res.statusCode, 200);
  const product = JSON.parse(data);
  assert.strictEqual(product.id, 2);
  assert.strictEqual(product.name, 'Smart Watch');
});

test('GET /api/products/:id returns 404 for unknown ID', async () => {
  const { res } = await httpRequest({
    hostname: 'localhost',
    port,
    path: '/api/products/999',
    headers: { Accept: 'application/json' },
  });

  assert.strictEqual(res.statusCode, 404);
});

// ---------------------------------------------------------------------------
// 4️⃣ POST /api/cart – creates a new cart and returns a cartId.
// ---------------------------------------------------------------------------
test('POST /api/cart creates a new cart and returns a cartId', async () => {
  const { res, data } = await httpRequest({
    method: 'POST',
    hostname: 'localhost',
    port,
    path: '/api/cart',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}), // empty payload – server should generate a cart
  });

  assert.strictEqual(res.statusCode, 201);
  const payload = JSON.parse(data);
  assert.ok(payload.cartId, 'response should contain a cartId');
  assert.equal(typeof payload.cartId, 'string');
});

// ---------------------------------------------------------------------------
// 5️⃣ POST /api/cart/:cartId/items – add an item to the cart.
// ---------------------------------------------------------------------------
test('POST /api/cart/:cartId/items adds an item to the cart', async () => {
  // First, create a cart
  const { data: cartData } = await httpRequest({
    method: 'POST',
    hostname: 'localhost',
    port,
    path: '/api/cart',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const { cartId } = JSON.parse(cartData);
  assert.ok(cartId, 'cartId must exist');

  // Add a product (id:3) with quantity 2
  const { res, data } = await httpRequest({
    method: 'POST',
    hostname: 'localhost',
    port,
    path: `/api/cart/${cartId}/items`,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: 3, quantity: 2 }),
  });

  assert.strictEqual(res.statusCode, 200);
  const result = JSON.parse(data);
  assert.deepStrictEqual(result, { success: true });
});

// ---------------------------------------------------------------------------
// 6️⃣ GET /api/cart/:cartId – retrieve cart contents.
// ---------------------------------------------------------------------------
test('GET /api/cart/:cartId returns the current cart items', async () => {
  // Create cart and add an item (reuse previous test logic)
  const { data: cartData } = await httpRequest({
    method: 'POST',
    hostname: 'localhost',
    port,
    path: '/api/cart',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const { cartId } = JSON.parse(cartData);

  await httpRequest({
    method: 'POST',
    hostname: 'localhost',
    port,
    path: `/api/cart/${cartId}/items`,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: 1, quantity: 1 }),
  });

  const { res, data } = await httpRequest({
    hostname: 'localhost',
    port,
    path: `/api/cart/${cartId}`,
    headers: { Accept: 'application/json' },
  });

  assert.strictEqual(res.statusCode, 200);
  const cart = JSON.parse(data);
  assert.ok(Array.isArray(cart.items), 'cart should contain an items array');
  const item = cart.items.find((i) => i.productId === 1);
  assert.ok(item, 'added product should be present in cart');
  assert.strictEqual(item.quantity, 1);
});