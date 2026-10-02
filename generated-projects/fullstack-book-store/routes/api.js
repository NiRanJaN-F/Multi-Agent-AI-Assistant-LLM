const express = require('express');
const router = express.Router();

// Mock database for books
const products = [
    {
        id: 1,
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt, David Thomas",
        price: 49.99,
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80"
    },
    {
        id: 2,
        title: "Clean Code",
        author: "Robert C. Martin",
        price: 42.50,
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=300&q=80"
    },
    {
        id: 3,
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        price: 55.00,
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80"
    },
    {
        id: 4,
        title: "You Don't Know JS Yet",
        author: "Kyle Simpson",
        price: 29.99,
        image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=300&q=80"
    }
];

// In-memory cart storage for session/server state
let cart = {
    items: [],
    total: 0
};

// Helper function to calculate cart total
function calculateCartTotal() {
    let total = 0;
    for (const item of cart.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            total += product.price * item.quantity;
        }
    }
    cart.total = Number(total.toFixed(2));
}

// GET /api/products
router.get('/products', (req, res) => {
    try {
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/cart
router.get('/cart', (req, res) => {
    try {
        calculateCartTotal();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// POST /api/cart
router.post('/cart', (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const parsedProductId = parseInt(productId, 10);
        const parsedQuantity = parseInt(quantity, 10);

        if (isNaN(parsedProductId) || isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid product ID or quantity' });
        }

        const product = products.find(p => p.id === parsedProductId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const existingItem = cart.items.find(item => item.productId === parsedProductId);

        if (existingItem) {
            existingItem.quantity += parsedQuantity;
        } else {
            cart.items.push({ productId: parsedProductId, quantity: parsedQuantity });
        }

        calculateCartTotal();
        res.json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add item to cart' });
    }
});

// DELETE /api/cart/:id
router.delete('/cart/:id', (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);

        if (isNaN(productId)) {
            return res.status(400).json({ success: false, error: 'Invalid product ID' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, error: 'Item not found in cart' });
        }

        cart.items.splice(itemIndex, 1);
        calculateCartTotal();

        res.json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to remove item from cart' });
    }
});

// POST /api/checkout
router.post('/checkout', (req, res) => {
    try {
        const { name, address, paymentMethod } = req.body;

        if (!name || !address || !paymentMethod) {
            return res.status(400).json({ success: false, error: 'Missing required checkout information' });
        }

        if (cart.items.length === 0) {
            return res.status(400).json({ success: false, error: 'Cart is empty' });
        }

        const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

        // Clear the cart after successful checkout
        cart = {
            items: [],
            total: 0
        };

        res.json({
            success: true,
            orderId: orderId,
            message: 'Order placed successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Checkout failed' });
    }
});

module.exports = router;