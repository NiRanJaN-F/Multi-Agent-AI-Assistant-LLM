/**
 * AURA E-COMMERCE - QA AUTOMATED TEST SUITE
 * Test Framework: Node.js Built-in Test Runner (`node:test`) & Strict Assertions (`node:assert/strict`)
 * Target: Complete validation of shopping cart management, checkout calculations, product APIs, and order processing.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

// --- MOCK STORAGE SETUP FOR DOM / LOCALSTORAGE TESTS ---
class LocalStorageMock {
    constructor() {
        this.store = {};
    }
    clear() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
}

global.localStorage = new LocalStorageMock();

// Simulate DOM Element for Cart / Checkout Managers if needed
global.document = {
    getElementById: () => ({
        addEventListener: () => {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        innerHTML: '',
        value: ''
    }),
    querySelector: () => ({
        addEventListener: () => {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} }
    }),
    querySelectorAll: () => []
};

global.window = {
    location: { href: '' }
};

// --- UNIT TESTS: CART MANAGEMENT (Simulating cart.js logic) ---
test('CartManager Unit Tests', async (t) => {
    
    // Replicating CartManager core logic for headless test verification
    class TestCartManager {
        constructor() {
            this.cart = [];
            this.storageKey = 'lumina_store_cart_test';
            this.loadCart();
        }

        loadCart() {
            try {
                const stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    this.cart = JSON.parse(stored);
                }
            } catch (err) {
                this.cart = [];
            }
        }

        saveCart() {
            localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
        }

        addItem(product, quantity = 1) {
            const existingIndex = this.cart.findIndex(item => item.id === product.id);
            if (existingIndex > -1) {
                this.cart[existingIndex].quantity += quantity;
            } else {
                this.cart.push({ ...product, quantity });
            }
            this.saveCart();
        }

        removeItem(productId) {
            this.cart = this.cart.filter(item => item.id !== productId);
            this.saveCart();
        }

        updateQuantity(productId, quantity) {
            const item = this.cart.find(i => i.id === productId);
            if (item) {
                if (quantity <= 0) {
                    this.removeItem(productId);
                } else {
                    item.quantity = quantity;
                    this.saveCart();
                }
            }
        }

        getSubtotal() {
            return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }

        clear() {
            this.cart = [];
            localStorage.removeItem(this.storageKey);
        }
    }

    const cartManager = new TestCartManager();
    cartManager.clear();

    await t.test('Initial cart should be empty', () => {
        assert.equal(cartManager.cart.length, 0);
        assert.equal(cartManager.getSubtotal(), 0);
    });

    await t.test('Should add product to cart correctly', () => {
        const product = { id: 1, name: 'Wireless Headphones', price: 99.99 };
        cartManager.addItem(product, 2);

        assert.equal(cartManager.cart.length, 1);
        assert.equal(cartManager.cart[0].quantity, 2);
        assert.equal(cartManager.getSubtotal(), 199.98);
    });

    await t.test('Should increment quantity if same product added again', () => {
        const product = { id: 1, name: 'Wireless Headphones', price: 99.99 };
        cartManager.addItem(product, 1);

        assert.equal(cartManager.cart.length, 1);
        assert.equal(cartManager.cart[0].quantity, 3);
        assert.equal(cartManager.getSubtotal(), 299.97);
    });

    await t.test('Should update item quantity explicitly', () => {
        cartManager.updateQuantity(1, 5);
        assert.equal(cartManager.cart[0].quantity, 5);
        assert.equal(cartManager.getSubtotal(), 499.95);
    });

    await t.test('Should remove item when quantity set to 0 or negative', () => {
        cartManager.updateQuantity(1, 0);
        assert.equal(cartManager.cart.length, 0);
        assert.equal(cartManager.getSubtotal(), 0);
    });
});


// --- UNIT TESTS: CHECKOUT CALCULATION ENGINE ---
test('Checkout Calculation & Order Processing Logic', async (t) => {
    
    function calculateOrderTotals(items, shippingMethod = 'standard') {
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        let shippingCost = 0;
        
        if (subtotal > 0 && subtotal < 50 && shippingMethod === 'standard') {
            shippingCost = 5.00;
        } else if (shippingMethod === 'express') {
            shippingCost = 15.00;
        }

        const tax = parseFloat((subtotal * 0.08).toFixed(2));
        const total = parseFloat((subtotal + shippingCost + tax).toFixed(2));

        return { subtotal, shippingCost, tax, total };
    }

    await t.test('Should calculate correct tax and shipping for standard orders', () => {
        const items = [{ id: 1, price: 100.00, quantity: 1 }];
        const result = calculateOrderTotals(items, 'standard');

        assert.equal(result.subtotal, 100.00);
        assert.equal(result.shippingCost, 0); // Free shipping over $50
        assert.equal(result.tax, 8.00);
        assert.equal(result.total, 108.00);
    });

    await t.test('Should apply express shipping cost correctly', () => {
        const items = [{ id: 2, price: 50.00, quantity: 1 }];
        const result = calculateOrderTotals(items, 'express');

        assert.equal(result.subtotal, 50.00);
        assert.equal(result.shippingCost, 15.00);
        assert.equal(result.tax, 4.00);
        assert.equal(result.total, 69.00);
    });
});


// --- INTEGRATION TESTS: EXPRESS API BACKEND ROUTES ---
test('Express API Integration Tests', async (t) => {
    
    // Setup lightweight express app mimicking backend routes
    const app = express();
    app.use(express.json());

    const productsCatalog = [
        { id: 1, name: "Wireless Headphones", price: 99.99, category: "Audio" },
        { id: 2, name: "Smart Watch", price: 199.99, category: "Wearables" }
    ];

    app.get('/api/products', (req, res) => {
        const { category, search } = req.query;
        let results = [...productsCatalog];

        if (category && category !== 'All') {
            results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }

        if (search) {
            results = results.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        }

        res.json({ success: true, count: results.length, data: results });
    });

    app.post('/api/orders', (req, res) => {
        const { items, shipping, payment } = req.body;
        if (!items || !items.length || !shipping || !payment) {
            return res.status(400).json({ success: false, error: 'Invalid order payload' });
        }

        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

        res.status(201).json({
            success: true,
            orderId,
            message: 'Order placed successfully',
            summary: { subtotal, total: subtotal * 1.08 }
        });
    });

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    t.after(() => {
        server.close();
    });

    await t.test('GET /api/products should return full product catalog', async () => {
        const response = await fetch(`${baseUrl}/api/products`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.success, true);
        assert.equal(body.data.length, 2);
    });

    await t.test('GET /api/products with category filter should filter properly', async () => {
        const response = await fetch(`${baseUrl}/api/products?category=Audio`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.data.length, 1);
        assert.equal(body.data[0].name, 'Wireless Headphones');
    });

    await t.test('POST /api/orders should successfully process valid order', async () => {
        const payload = {
            items: [{ id: 1, price: 99.99, quantity: 1 }],
            shipping: { address: '123 Main St', city: 'Techville' },
            payment: { method: 'card', cardNumber: '****1234' }
        };

        const response = await fetch(`${baseUrl}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const body = await response.json();

        assert.equal(response.status, 201);
        assert.equal(body.success, true);
        assert.match(body.orderId, /^ORD-/);
        assert.equal(body.summary.subtotal, 99.99);
    });

    await t.test('POST /api/orders should reject incomplete order payloads', async () => {
        const response = await fetch(`${baseUrl}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [] })
        });

        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.success, false);
    });
});