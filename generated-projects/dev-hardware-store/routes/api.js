const express = require('express');
const router = express.Router();

// In-memory data store for products, cart, and orders
const products = [
    {
        id: 1,
        name: "Wireless Noise-Canceling Headphones",
        price: 199.99,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"
    },
    {
        id: 2,
        name: "Minimalist Mechanical Keyboard",
        price: 89.99,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80"
    },
    {
        id: 3,
        name: "Ergonomic Office Chair",
        price: 249.99,
        image: "https://images.unsplash.com/photo-1580481077494-e3299acae5c7?w=500&q=80"
    },
    {
        id: 4,
        name: "Ultra-Wide Gaming Monitor",
        price: 499.99,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80"
    },
    {
        id: 5,
        name: "USB-C Multi-Port Hub",
        price: 45.50,
        image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&q=80"
    },
    {
        id: 6,
        name: "Precision Gaming Mouse",
        price: 59.99,
        image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80"
    }
];

// Cart structure: { items: [{ productId, quantity }], total: number }
let cart = {
    items: [],
    total: 0.00
};

// Helper function to calculate cart total
function calculateCartTotal() {
    let subtotal = 0;
    cart.items.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.productId);
        if (product) {
            subtotal += product.price * cartItem.quantity;
        }
    });
    cart.total = parseFloat(subtotal.toFixed(2));
}

// GET /api/products
router.get('/products', (req, res) => {
    try {
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching products' });
    }
});

// GET /api/cart
router.get('/cart', (req, res) => {
    try {
        calculateCartTotal();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching cart' });
    }
});

// POST /api/cart
router.post('/cart', (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || typeof quantity !== 'number' || quantity <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid input: productId and a positive quantity are required.' 
            });
        }

        const productExists = products.some(p => p.id === productId);
        if (!productExists) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, quantity });
        }

        calculateCartTotal();

        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error updating cart' });
    }
});

// DELETE /api/cart/:productId
router.delete('/cart/:productId', (req, res) => {
    try {
        const productId = parseInt(req.params.productId, 10);

        if (isNaN(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID.' });
        }

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => item.productId !== productId);

        if (cart.items.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Item not found in cart.' });
        }

        calculateCartTotal();

        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error removing item from cart' });
    }
});

// POST /api/checkout
router.post('/checkout', (req, res) => {
    try {
        const { name, address, paymentMethod } = req.body;

        if (!name || !address || !paymentMethod) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required checkout fields: name, address, and paymentMethod.' 
            });
        }

        calculateCartTotal();

        if (cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cannot checkout an empty cart.' });
        }

        const finalTotal = cart.total;
        const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

        // Clear cart after successful checkout
        cart = {
            items: [],
            total: 0.00
        };

        res.status(200).json({
            success: true,
            orderId: orderId,
            total: finalTotal
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error processing checkout' });
    }
});

module.exports = router;