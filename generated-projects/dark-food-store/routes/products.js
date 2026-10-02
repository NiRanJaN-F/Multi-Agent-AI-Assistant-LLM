const express = require('express');
const router = express.Router();

// Mock products database representing a dark-themed gourmet food store
const products = [
    {
        id: 1,
        name: "Truffle Black Burger",
        category: "fast-food",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 2,
        name: "Midnight Pepperoni Pizza",
        category: "pizza",
        price: 18.50,
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 3,
        name: "Obsidian Spicy Ramen",
        category: "asian",
        price: 13.99,
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 4,
        name: "Dark Chocolate Lava Cake",
        category: "desserts",
        price: 8.99,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 5,
        name: "Charcoal Grilled Ribeye",
        category: "steaks",
        price: 29.99,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 6,
        name: "Blood Orange Elixir",
        category: "beverages",
        price: 5.99,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
    }
];

// GET /api/products - Retrieve all products
router.get('/products', (req, res) => {
    try {
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/checkout - Process order checkout and calculate total
router.post('/checkout', (req, res) => {
    try {
        const { items, customer } = req.body;

        // Validation: Check if items exist and is an array
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Cart is empty or invalid items provided.' });
        }

        // Validation: Check if customer details exist
        if (!customer || !customer.name || !customer.address) {
            return res.status(400).json({ success: false, error: 'Customer name and address are required.' });
        }

        let calculatedTotal = 0;

        // Validate items and calculate total securely on the backend
        for (const cartItem of items) {
            const product = products.find(p => p.id === cartItem.id);
            
            if (!product) {
                return res.status(400).json({ success: false, error: `Product with ID ${cartItem.id} not found.` });
            }

            const quantity = parseInt(cartItem.quantity, 10);
            if (isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ success: false, error: `Invalid quantity for product ID ${cartItem.id}.` });
            }

            calculatedTotal += product.price * quantity;
        }

        // Round total to 2 decimal places
        const total = Math.round(calculatedTotal * 100) / 100;

        // Generate a mock unique order ID
        const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

        // Respond with success and order summary
        return res.status(200).json({
            success: true,
            orderId,
            total
        });

    } catch (error) {
        console.error('Error processing checkout:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error during checkout.' });
    }
});

module.exports = router;