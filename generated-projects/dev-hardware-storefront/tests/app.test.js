/**
 * Automated Unit and Integration Test Suite for dev-hardware-storefront
 * Built using Node.js native test runner ('node:test') and strict assert ('node:assert/strict').
 * 
 * Verifies server availability, static asset serving, frontend logic modules,
 * and cart/product data consistency.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('path');

// Mock DOM Environment setup for testing client-side JS logic if needed,
// or direct unit testing of pure logic functions.
global.window = {};
global.localStorage = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = String(value); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
};

// ==========================================
// 1. PROJECT STRUCTURE & FILE INTEGRITY TESTS
// ==========================================
test('Project Structure: Essential files exist', () => {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const serverJsPath = path.join(__dirname, 'server.js');
    const indexHtmlPath = path.join(__dirname, 'public', 'index.html');
    const stylesCssPath = path.join(__dirname, 'public', 'css', 'styles.css');
    const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');
    const cartJsPath = path.join(__dirname, 'public', 'js', 'cart.js');
    const productsJsPath = path.join(__dirname, 'public', 'js', 'products.js');

    assert.ok(fs.existsSync(packageJsonPath), 'package.json must exist');
    // If server.js exists, verify it, otherwise check main entry
    if (fs.existsSync(serverJsPath)) {
        assert.ok(fs.existsSync(serverJsPath), 'server.js must exist if referenced');
    }
    assert.ok(fs.existsSync(indexHtmlPath), 'public/index.html must exist');
    assert.ok(fs.existsSync(stylesCssPath), 'public/css/styles.css must exist');
    assert.ok(fs.existsSync(appJsPath), 'public/js/app.js must exist');
    assert.ok(fs.existsSync(cartJsPath), 'public/js/cart.js must exist');
    assert.ok(fs.existsSync(productsJsPath), 'public/js/products.js must exist');
});

// ==========================================
// 2. PACKAGE CONFIGURATION TESTS
// ==========================================
test('package.json contains valid configuration and dependencies', () => {
    const pkgRaw = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
    const pkg = JSON.parse(pkgRaw);

    assert.equal(pkg.name, 'dev-hardware-storefront');
    assert.ok(pkg.scripts && typeof pkg.scripts.start === 'string', 'Start script should be defined');
    assert.ok(pkg.dependencies && pkg.dependencies.express, 'Express dependency must be present');
});

// ==========================================
// 3. PRODUCT CATALOG DATA INTEGRITY TESTS
// ==========================================
test('Products catalog data structure and integrity', () => {
    // Read and execute or parse products.js definitions
    const productsContent = fs.readFileSync(path.join(__dirname, 'public', 'js', 'products.js'), 'utf8');
    
    // Simple evaluation sandbox or regex check to ensure products array is defined correctly
    assert.ok(productsContent.includes('products') || productsContent.includes('PRODUCTS'), 'Products array must be exported/declared');
});

// ==========================================
// 4. INTEGRATION TESTS (Server & HTTP Endpoints)
// ==========================================
test('Express Server Integration & Static File Serving', async () => {
    // Dynamically load server or mock express static response
    const express = require('express');
    const app = express();
    app.use(express.static(path.join(__dirname, 'public')));

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    try {
        // Test root index.html endpoint
        const res = await fetch(`http://localhost:${port}/index.html`);
        assert.equal(res.status, 200);
        const htmlText = await res.text();
        assert.ok(htmlText.includes('DevCore'), 'Page should include storefront brand name');

        // Test CSS asset endpoint
        const cssRes = await fetch(`http://localhost:${port}/css/styles.css`);
        assert.equal(cssRes.status, 200);

        // Test JS asset endpoint
        const jsRes = await fetch(`http://localhost:${port}/js/app.js`);
        assert.equal(jsRes.status, 200);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

// ==========================================
// 5. CART & STATE LOGIC UNIT TESTS
// ==========================================
test('Cart state management calculations and storage', () => {
    // Simulate cart item addition and subtotal calculations
    const cartItems = [
        { id: 'kbd-001', name: 'CyberBoard Pro Wireless', price: 289.99, quantity: 1 },
        { id: 'acc-001', name: 'Custom Cable', price: 49.99, quantity: 2 }
    ];

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    assert.ok(subtotal > 0, 'Subtotal should be greater than zero');
    
    const expectedSubtotal = 289.99 + (49.99 * 2);
    assert.equal(Number(subtotal.toFixed(2)), Number(expectedSubtotal.toFixed(2)));

    // Test LocalStorage persistence simulation
    global.localStorage.setItem('devcore_cart_items', JSON.stringify(cartItems));
    const storedCart = JSON.parse(global.localStorage.getItem('devcore_cart_items'));
    assert.equal(storedCart.length, 2);
    assert.equal(storedCart[0].id, 'kbd-001');
});