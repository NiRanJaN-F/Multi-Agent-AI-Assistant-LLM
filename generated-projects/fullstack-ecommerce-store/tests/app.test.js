const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const path = require('path');
const apiRouter = require('./routes/api.js');

// --- Helper function to start a test server ---
async function createTestServer() {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api', apiRouter);

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseURL = `http://localhost:${port}`;

    return {
        baseURL,
        close: () => new Promise((resolve) => server.close(resolve))
    };
}

// --- API Integration Tests ---
test('API Integration Test Suite', async (t) => {
    let server;

    t.before(async () => {
        server = await createTestServer();
    });

    t.after(async () => {
        await server.close();
    });

    await t.test('GET /api/products returns a list of products', async () => {
        const response = await fetch(`${server.baseURL}/api/products`);
        assert.strictEqual(response.status, 200);

        const data = await response.json();
        assert.ok(Array.isArray(data), 'Response should be an array of products');
        assert.ok(data.length > 0, 'Products list should not be empty');

        const firstProduct = data[0];
        assert.ok(firstProduct.id, 'Product should have an id');
        assert.ok(firstProduct.name, 'Product should have a name');
        assert.ok(typeof firstProduct.price === 'number', 'Product price should be a number');
        assert.ok(firstProduct.category, 'Product should have a category');
    });

    await t.test('GET /api/products/:id returns a single product when valid', async () => {
        const response = await fetch(`${server.baseURL}/api/products/1`);
        assert.strictEqual(response.status, 200);

        const product = await response.json();
        assert.strictEqual(product.id, 1);
        assert.ok(product.name);
    });

    await t.test('GET /api/products/:id returns 404 when product not found', async () => {
        const response = await fetch(`${server.baseURL}/api/products/99999`);
        assert.strictEqual(response.status, 404);

        const data = await response.json();
        assert.ok(data.error, 'Should return an error message');
    });

    await t.test('POST /api/orders successfully creates an order', async () => {
        const orderPayload = {
            items: [
                { id: 1, quantity: 2 },
                { id: 2, quantity: 1 }
            ],
            shipping: {
                fullName: "Jane Doe",
                address: "123 Main St",
                city: "New York",
                postalCode: "10001",
                country: "USA"
            },
            paymentMethod: "card"
        };

        const response = await fetch(`${server.baseURL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderPayload)
        });

        assert.strictEqual(response.status, 201);

        const result = await response.json();
        assert.ok(result.success, 'Order creation should report success');
        assert.ok(result.orderId, 'Order response should include an orderId');
        assert.strictEqual(result.order.shipping.fullName, orderPayload.shipping.fullName);
        assert.strictEqual(result.order.items.length, 2);
    });

    await t.test('POST /api/orders rejects invalid order payloads', async () => {
        const invalidPayloads = [
            { shipping: { fullName: "Test" } }, // missing items
            { items: [] }, // empty items
            { items: [{ id: 1, quantity: 1 }] } // missing shipping info
        ];

        for (const payload of invalidPayloads) {
            const response = await fetch(`${server.baseURL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            assert.strictEqual(response.status, 400);
            const data = await response.json();
            assert.ok(data.error, 'Should return a validation error');
        }
    });
});

// --- Unit Tests for Utility / Business Logic ---
test('E-Commerce Business Logic Unit Tests', async (t) => {
    
    await t.test('Cart calculation and total price computation', () => {
        const products = [
            { id: 1, price: 50.00 },
            { id: 2, price: 25.50 }
        ];

        const cart = [
            { id: 1, quantity: 2 }, // 100.00
            { id: 2, quantity: 3 }  // 76.50
        ];

        const calculateTotal = (cartItems, productList) => {
            return cartItems.reduce((total, cartItem) => {
                const product = productList.find(p => p.id === cartItem.id);
                return total + (product ? product.price * cartItem.quantity : 0);
            }, 0);
        };

        const total = calculateTotal(cart, products);
        assert.strictEqual(Number(total.toFixed(2)), 176.50);
    });

    await t.test('Product filtering by category and search query', () => {
        const products = [
            { id: 1, name: "Wireless Headphones", category: "Electronics" },
            { id: 2, name: "Mechanical Keyboard", category: "Electronics" },
            { id: 3, name: "Minimalist Ceramic Lamp", category: "Home" }
        ];

        const filterProducts = (items, category, query) => {
            return items.filter(item => {
                const matchesCategory = category === 'all' || item.category.toLowerCase() === category.toLowerCase();
                const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase());
                return matchesCategory && matchesSearch;
            });
        };

        const electronics = filterProducts(products, 'Electronics', '');
        assert.strictEqual(electronics.length, 2);

        const searchResult = filterProducts(products, 'all', 'Lamp');
        assert.strictEqual(searchResult.length, 1);
        assert.strictEqual(searchResult[0].id, 3);

        const combinedFilter = filterProducts(products, 'Home', 'Wireless');
        assert.strictEqual(combinedFilter.length, 0);
    });
});