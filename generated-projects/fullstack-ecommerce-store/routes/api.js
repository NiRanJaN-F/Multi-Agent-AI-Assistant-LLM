const express = require('express');
const router = express.Router();

// Mock database
const products = [
  { id: 1, name: "Wireless Headphones", price: 99.99, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60" },
  { id: 2, name: "Mechanical Keyboard", price: 129.99, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60" },
  { id: 3, name: "Ergonomic Mouse", price: 49.99, image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60" },
  { id: 4, name: "Ultra-Wide Monitor", price: 399.99, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60" },
  { id: 5, name: "USB-C Hub", price: 34.99, image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=60" },
  { id: 6, name: "Desk Pad", price: 24.99, image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60" }
];

// In-memory cart store
let cart = {
  items: []
};

// Helper function to calculate cart total
function calculateCartTotal(cartItems) {
  const total = cartItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  return Number(total.toFixed(2));
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
    const total = calculateCartTotal(cart.items);
    res.json({
      items: cart.items,
      total: total
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart
router.post('/cart', (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid productId or quantity' });
    }

    const product = products.find(p => p.id === Number(productId));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existingItemIndex = cart.items.findIndex(item => item.productId === Number(productId));

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId: Number(productId), quantity });
    }

    res.json({
      success: true,
      cart: {
        items: cart.items,
        total: calculateCartTotal(cart.items)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// DELETE /api/cart/:id
router.delete('/cart/:id', (req, res) => {
  try {
    const productId = Number(req.params.id);

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);

    res.json({
      success: true,
      cart: {
        items: cart.items,
        total: calculateCartTotal(cart.items)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// POST /api/checkout
router.post('/checkout', (req, res) => {
  try {
    const { shippingAddress, paymentDetails } = req.body;

    if (!shippingAddress || !paymentDetails) {
      return res.status(400).json({ error: 'Shipping address and payment details are required' });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const total = calculateCartTotal(cart.items);
    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

    // Clear the cart after successful checkout
    cart.items = [];

    res.json({
      success: true,
      orderId: orderId,
      total: total
    });
  } catch (error) {
    res.status(500).json({ error: 'Checkout failed' });
  }
});

module.exports = router;