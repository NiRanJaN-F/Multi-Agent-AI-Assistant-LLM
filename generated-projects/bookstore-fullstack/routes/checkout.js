const express = require('express');
const router = express.Router();

// Mock data and cart state (shared across routes in a real app or imported)
// For the sake of this file, we reference the cart/product storage mechanism.
// Assuming we store cart state or import it from a shared store or `cart.js`.
const { cart, products } = require('./cart'); // Adjust if cart is stored differently, or manage in-memory

// POST /api/checkout
router.post('/', (req, res) => {
    try {
        const { customerName, address } = req.body;

        // Data validation
        if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
            return res.status(400).json({ error: 'Valid customer name is required.' });
        }

        if (!address || typeof address !== 'string' || address.trim() === '') {
            return res.status(400).json({ error: 'Valid shipping address is required.' });
        }

        // Access current cart state (imported or managed)
        // If cart is exported from cart.js:
        const currentCart = require('./cart').cart || { items: [], total: 0 };

        if (!currentCart.items || currentCart.items.length === 0) {
            return res.status(400).json({ error: 'Cannot checkout with an empty cart.' });
        }

        const orderTotal = currentCart.total;

        // Generate a mock order ID
        const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

        // Clear the cart after successful checkout
        currentCart.items = [];
        currentCart.total = 0;

        return res.status(200).json({
            success: true,
            orderId: orderId,
            total: orderTotal
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return res.status(500).json({ error: 'An internal server error occurred during checkout.' });
    }
});

module.exports = router;