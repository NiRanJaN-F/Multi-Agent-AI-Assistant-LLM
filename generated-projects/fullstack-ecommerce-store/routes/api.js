const express = require('express');
const router = express.Router();

// Mock products database matching the API contract
const products = [
    {
        id: 1,
        name: "Wireless Noise-Canceling Headphones",
        price: 199.99,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
        description: "Experience premium sound quality and active noise cancellation with up to 30 hours of battery life."
    },
    {
        id: 2,
        name: "Ergonomic Mechanical Keyboard",
        price: 89.99,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80",
        description: "Tactile mechanical switches with customizable RGB backlighting designed for optimal typing comfort."
    },
    {
        id: 3,
        name: "Minimalist Leather Backpack",
        price: 129.50,
        category: "Lifestyle",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80",
        description: "Crafted from full-grain leather with a dedicated padded compartment for up to a 15-inch laptop."
    },
    {
        id: 4,
        name: "Smart Fitness Watch",
        price: 149.99,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
        description: "Track your health, heart rate, workouts, and receive smartphone notifications on a vibrant AMOLED display."
    },
    {
        id: 5,
        name: "Portable Bluetooth Speaker",
        price: 59.99,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80",
        description: "Waterproof, rugged design delivering crisp highs and deep bass wherever your adventures take you."
    },
    {
        id: 6,
        name: "Ultra-Wide Gaming Monitor",
        price: 399.99,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80",
        description: "Immersive 34-inch curved display with a 144Hz refresh rate and 1ms response time for seamless gameplay."
    },
    {
        id: 7,
        name: "Classic Denim Jacket",
        price: 89.00,
        category: "Apparel",
        image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80",
        description: "Timeless denim jacket tailored for everyday wear with durable stitching and comfortable stretch fabric."
    },
    {
        id: 8,
        name: "Ceramic Pour-Over Coffee Dripper",
        price: 34.50,
        category: "Lifestyle",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80",
        description: "Handcrafted ceramic dripper designed for optimal water flow and a rich, clean-tasting morning brew."
    }
];

// GET /api/products
router.get('/products', (req, res) => {
    try {
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Internal server error while fetching products.' });
    }
});

// POST /api/checkout
router.post('/checkout', (req, res) => {
    try {
        const { items, total, payment_details } = req.body;

        // Basic validation for request body structure
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid request: Cart is empty or items are missing.' 
            });
        }

        if (typeof total !== 'number' || total <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid request: Total amount is invalid.' 
            });
        }

        if (!payment_details || !payment_details.cardNumber) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid request: Payment details are missing.' 
            });
        }

        // Server-side price verification and total calculation
        let calculatedTotal = 0;
        for (const item of items) {
            const product = products.find(p => p.id === item.id);
            if (!product) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Product with ID ${item.id} not found.` 
                });
            }
            if (typeof item.quantity !== 'number' || item.quantity <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Invalid quantity for product ID ${item.id}.` 
                });
            }
            calculatedTotal += product.price * item.quantity;
        }

        // Floating-point precision check (comparing within 2 decimal places)
        if (Math.abs(calculatedTotal - total) > 0.01) {
            return res.status(400).json({ 
                success: false, 
                message: 'Price mismatch detected. Total amount does not match cart items.' 
            });
        }

        // Simulate successful payment processing and order generation
        const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

        return res.status(200).json({
            success: true,
            orderId: orderId,
            message: "Payment processed successfully"
        });

    } catch (error) {
        console.error('Error during checkout processing:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'An internal server error occurred while processing your payment.' 
        });
    }
});

module.exports = router;