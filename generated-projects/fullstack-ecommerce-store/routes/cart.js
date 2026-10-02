const express = require('express');
const router = express.Router();

// Mock products database for validation and price calculation (matching routes/products.js data)
const PRODUCTS = [
    {
        id: 1,
        name: "Wireless Noise-Canceling Headphones",
        price: 199.99,
        description: "Experience premium sound quality with active noise cancellation and 30-hour battery life.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"
    },
    {
        id: 2,
        name: "Ergonomic Mechanical Keyboard",
        price: 129.99,
        description: "Tactile mechanical switches with customizable RGB lighting and ergonomic wrist rest.",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80"
    },
    {
        id: 3,
        name: "Ultra-Wide Gaming Monitor",
        price: 499.99,
        description: "34-inch curved ultra-wide display with 144Hz refresh rate and 1ms response time.",
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80"
    },
    {
        id: 4,
        name: "Precision Wireless Mouse",
        price: 79.99,
        description: "High-precision optical sensor with customizable buttons and ultra-fast scrolling.",
        image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80"
    },
    {
        id: 5,
        name: "USB-C Multi-Port Hub",
        price: 49.99,
        description: "Expand your connectivity with 4K HDMI, 3x USB 3.0 ports, and Power Delivery passthrough.",
        image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&q=80"
    },
    {
        id: 6,
        name: "HD Webcam with Ring Light",
        price: 89.99,
        description: "Crystal clear 1080p streaming with built-in adjustable ring light for professional calls.",
        image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80"
    }
];

/**
 * POST /api/checkout
 * Request Body:
 * {
 *   "items": [{"id": 1, "quantity": 2}],
 *   "customer": {"name": "John Doe", "address": "123 St"}
 * }
 * 
 * Response:
 * {"success": true, "orderId": "ORD-12345", "total": 59.98}
 */
router.post('/checkout', (req, res) => {
    try {
        const { items, customer } = req.body;

        // Validate request body structure
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cart is empty or invalid items format provided.' 
            });
        }

        if (!customer || typeof customer.name !== 'string' || !customer.name.trim() || 
            typeof customer.address !== 'string' || !customer.address.trim()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid customer name and address are required.' 
            });
        }

        let calculatedTotal = 0;

        // Validate items, check existence, and compute the total price server-side
        for (const item of items) {
            if (!item.id || typeof item.quantity !== 'number' || item.quantity <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Each item must have a valid id and positive quantity.' 
                });
            }

            const product = PRODUCTS.find(p => p.id === Number(item.id));
            if (!product) {
                return res.status(404).json({ 
                    success: false, 
                    error: `Product with ID ${item.id} not found.` 
                });
            }

            calculatedTotal += product.price * item.quantity;
        }

        // Format total to 2 decimal places
        const total = Number(calculatedTotal.toFixed(2));

        // Generate a mock unique order ID
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const orderId = `ORD-${randomNum}`;

        // Return successful order confirmation
        return res.status(200).json({
            success: true,
            orderId: orderId,
            total: total
        });

    } catch (error) {
        console.error('Checkout processing error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal server error while processing checkout.' 
        });
    }
});

module.exports = router;