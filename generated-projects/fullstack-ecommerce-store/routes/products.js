const express = require('express');
const router = express.Router();

// Mock database for products
const products = [
    {
        id: 1,
        name: "Wireless Noise-Canceling Headphones",
        price: 199.99,
        description: "Experience premium sound quality and industry-leading noise cancellation with these comfortable over-ear wireless headphones.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: 2,
        name: "Minimalist Mechanical Keyboard",
        price: 89.99,
        description: "Compact 65% layout mechanical keyboard featuring customizable RGB backlighting and tactile switches for an optimal typing experience.",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: 3,
        name: "Ergonomic Vertical Mouse",
        price: 49.99,
        description: "Designed for all-day comfort, this vertical wireless mouse reduces wrist strain and promotes a natural handshake position.",
        image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: 4,
        name: "Ultra-Wide Gaming Monitor",
        price: 499.99,
        description: "Immerse yourself in your favorite games and workflows with a stunning 34-inch ultra-wide curved display and 144Hz refresh rate.",
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: 5,
        name: "USB-C Multi-Port Hub",
        price: 39.99,
        description: "Expand your connectivity with 4K HDMI, high-speed USB ports, SD card readers, and Power Delivery pass-through charging.",
        image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: 6,
        name: "Smart Desk LED Lamp",
        price: 59.99,
        description: "Adjustable color temperature and brightness levels with built-in wireless smartphone charging pad on the base.",
        image: "https://images.unsplash.com/photo-1534349762230-e0cadfefcffc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    }
];

// GET /api/products - Retrieve all products (summary info)
router.get('/', (req, res) => {
    try {
        const productList = products.map(({ id, name, price, image }) => ({
            id,
            name,
            price,
            image
        }));
        res.json(productList);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/products/:id - Retrieve a single product's detailed info
router.get('/:id', (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        
        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID format' });
        }

        const product = products.find(p => p.id === productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error(`Error fetching product with ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/checkout - Process checkout and generate an order
router.post('/checkout', (req, res) => {
    try {
        const { items, customer } = req.body;

        // Validation: Check if request body contains items and customer info
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty or invalid items payload' });
        }

        if (!customer || !customer.name || !customer.address) {
            return res.status(400).json({ error: 'Customer name and address are required' });
        }

        let calculatedTotal = 0;

        // Validate items and calculate total based on server-side product prices
        for (const item of items) {
            if (!item.id || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({ error: 'Invalid item structure or quantity' });
            }

            const product = products.find(p => p.id === item.id);
            if (!product) {
                return res.status(400).json({ error: `Product with ID ${item.id} not found` });
            }

            calculatedTotal += product.price * item.quantity;
        }

        // Format total to 2 decimal places
        const total = parseFloat(calculatedTotal.toFixed(2));
        
        // Generate a pseudo-random order ID
        const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

        // Return success response conforming to API contract
        return res.status(200).json({
            success: true,
            orderId: orderId,
            total: total
        });

    } catch (error) {
        console.error('Checkout processing error:', error);
        return res.status(500).json({ error: 'Internal Server Error during checkout' });
    }
});

module.exports = router;