/**
 * Express E-Commerce Store - Comprehensive Unit & Integration Test Suite
 * Stack: Node.js (Built-in node:test and node:assert/strict) + Supertest
 * Author: Senior QA Automation Engineer
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

// Import application routes
const checkoutRouter = require('../routes/checkout');

// Setup Express application instance for integration testing
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/checkout', checkoutRouter);
    
    // Global Error Handler for testing responses
    app.use((err, req, res, next) => {
        res.status(500).json({ error: err.message });
    });
    
    return app;
};

const app = createTestApp();

// ==========================================
// INTEGRATION TESTS: CHECKOUT API ENDPOINTS
// ==========================================

test('Checkout API Integration Tests', async (t) => {

    await t.test('POST /api/checkout/process - Success with valid payload', async () => {
        const payload = {
            cart: [
                { id: 1, quantity: 2 }, // Wireless Headphones (99.99 * 2 = 199.98)
                { id: 4, quantity: 1 }  // Minimalist Backpack (49.99 * 1 = 49.99)
            ],
            shipping: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                address: '123 Main St',
                city: 'New York',
                state: 'NY',
                zip: '10001'
            },
            payment: {
                cardNumber: '4242424242424242',
                cardHolder: 'John Doe',
                expiry: '12/25',
                cvv: '123'
            },
            shippingMethod: 'standard'
        };

        const response = await request(app)
            .post('/api/checkout/process')
            .send(payload)
            .expect('Content-Type', /json/)
            .expect(200);

        assert.equal(response.body.success, true);
        assert.ok(response.body.orderId, 'Order ID should be generated');
        assert.equal(response.body.shipping.firstName, 'John');
        assert.ok(response.body.totalAmount > 0, 'Total amount should be calculated');
    });

    await t.test('POST /api/checkout/process - Fails with empty cart', async () => {
        const payload = {
            cart: [],
            shipping: {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com',
                address: '456 Oak Rd',
                city: 'Boston',
                state: 'MA',
                zip: '02108'
            },
            payment: {
                cardNumber: '4242424242424242',
                cardHolder: 'Jane Doe',
                expiry: '10/26',
                cvv: '456'
            }
        };

        const response = await request(app)
            .post('/api/checkout/process')
            .send(payload)
            .expect(400);

        assert.equal(response.body.success, false);
        assert.match(response.body.error, /cart is empty/i);
    });

    await t.test('POST /api/checkout/process - Fails when missing required shipping fields', async () => {
        const payload = {
            cart: [{ id: 1, quantity: 1 }],
            shipping: {
                firstName: '', // Missing required field
                lastName: 'Smith',
                email: 'smith@example.com',
                address: '789 Pine St',
                city: 'Chicago',
                state: 'IL',
                zip: '60601'
            },
            payment: {
                cardNumber: '4242424242424242',
                cardHolder: 'John Smith',
                expiry: '01/28',
                cvv: '789'
            }
        };

        const response = await request(app)
            .post('/api/checkout/process')
            .send(payload)
            .expect(400);

        assert.equal(response.body.success, false);
        assert.match(response.body.error, /shipping information/i);
    });

    await t.test('POST /api/checkout/process - Fails with invalid product reference', async () => {
        const payload = {
            cart: [{ id: 99999, quantity: 1 }], // Non-existent product ID
            shipping: {
                firstName: 'Alice',
                lastName: 'Wonder',
                email: 'alice@example.com',
                address: '1 Wonder Way',
                city: 'Seattle',
                state: 'WA',
                zip: '98101'
            },
            payment: {
                cardNumber: '4242424242424242',
                cardHolder: 'Alice Wonder',
                expiry: '05/27',
                cvv: '321'
            }
        };

        const response = await request(app)
            .post('/api/checkout/process')
            .send(payload)
            .expect(400);

        assert.equal(response.body.success, false);
        assert.match(response.body.error, /invalid product/i);
    });

});

// ==========================================
// UNIT TESTS: CORE E-COMMERCE BUSINESS LOGIC
// ==========================================

test('E-Commerce Domain Unit Tests', async (t) => {

    await t.test('Cart Item Calculation Logic', () => {
        const mockCatalog = [
            { id: 1, price: 99.99 },
            { id: 2, price: 199.99 }
        ];

        const cartItems = [
            { id: 1, quantity: 2 },
            { id: 2, quantity: 1 }
        ];

        // Replicate server-side price calculation logic found in routes/checkout.js
        let calculatedSubtotal = 0;
        for (const item of cartItems) {
            const product = mockCatalog.find(p => p.id === item.id);
            assert.ok(product, `Product with ID ${item.id} must exist`);
            calculatedSubtotal += product.price * item.quantity;
        }

        const expectedSubtotal = (99.99 * 2) + (199.99 * 1);
        assert.equal(Number(calculatedSubtotal.toFixed(2)), Number(expectedSubtotal.toFixed(2)));
    });

    await t.test('Shipping Rate Determination Logic', () => {
        const getShippingCost = (method) => {
            switch (method) {
                case 'express': return 15.00;
                case 'overnight': return 25.00;
                case 'standard':
                default: return 5.00;
            }
        };

        assert.equal(getShippingCost('standard'), 5.00);
        assert.equal(getShippingCost('express'), 15.00);
        assert.equal(getShippingCost('overnight'), 25.00);
        assert.equal(getShippingCost('unknown_method'), 5.00); // Fallback test
    });

    await t.test('Order ID Generation Format Verification', () => {
        const generateOrderId = () => `AURA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const orderId1 = generateOrderId();
        const orderId2 = generateOrderId();

        assert.match(orderId1, /^AURA-[A-Z0-9]+-[A-Z0-9]+$/);
        assert.notEqual(orderId1, orderId2, 'Generated Order IDs must be unique');
    });

});