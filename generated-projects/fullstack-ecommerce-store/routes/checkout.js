const express = require('express');
const router = express.Router();

// In-memory reference to shared cart data (matching server.js / routes/cart.js implementation)
// Assuming cart is attached to app.locals or required from a shared state module.
// For robust server.js integration, we can manage cart via req.app.locals.cart if initialized there.

router.post('/', (express.json()), (req, res) => {
    try {
        const { shipping, payment } = req.body;

        // Basic data validation
        if (!shipping || !shipping.name || !shipping.address) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid shipping details. Name and address are required.' 
            });
        }

        if (!payment || !payment.cardNumber) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid payment details. Card number is required.' 
            });
        }

        const cart = req.app.locals.cart || { items: [], total: 0 };

        if (!cart.items || cart.items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cart is empty. Cannot process checkout.' 
            });
        }

        const finalTotal = cart.total;
        const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

        // Clear the cart after successful checkout simulation
        cart.items = [];
        cart.total = 0;
        req.app.locals.cart = cart;

        return res.status(200).json({
            success: true,
            orderId: orderId,
            total: finalTotal
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error during checkout.' 
        });
    }
});

module.exports = router;