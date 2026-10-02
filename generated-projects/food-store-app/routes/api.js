const express = require('express');
const router = express.Router();

// Mock database of products matching the requested API contract
const products = [
  {
    id: 1,
    name: "Classic Cheeseburger",
    price: 9.99,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60"
  },
  {
    id: 2,
    name: "Crispy French Fries",
    price: 3.49,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=60"
  },
  {
    id: 3,
    name: "Pepperoni Pizza Slice",
    price: 4.99,
    image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=500&q=60"
  },
  {
    id: 4,
    name: "Chocolate Milkshake",
    price: 4.50,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=60"
  },
  {
    id: 5,
    name: "Caesar Salad",
    price: 7.99,
    image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=60"
  }
];

/**
 * GET /api/products
 * Returns the list of available products
 */
router.get('/products', (req, res) => {
  try {
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/checkout
 * Processes order checkout, validates cart items against inventory, calculates total, and returns order ID
 */
router.post('/checkout', (req, res) => {
  try {
    const { items, customer } = req.body;

    // Validate request body structure
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty or invalid.' });
    }

    if (!customer || !customer.name || !customer.address) {
      return res.status(400).json({ success: false, error: 'Customer name and address are required.' });
    }

    let calculatedTotal = 0;

    // Validate items and compute total securely on the backend
    for (const cartItem of items) {
      if (!cartItem.id || !cartItem.quantity || typeof cartItem.quantity !== 'number' || cartItem.quantity <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid item structure or quantity.' });
      }

      const product = products.find(p => p.id === cartItem.id);
      if (!product) {
        return res.status(404).json({ success: false, error: `Product with ID ${cartItem.id} not found.` });
      }

      calculatedTotal += product.price * cartItem.quantity;
    }

    // Round total to 2 decimal places to avoid floating point precision issues
    const total = Math.round(calculatedTotal * 100) / 100;

    // Generate a mock unique order ID
    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    // Return successful response matching contract
    return res.status(200).json({
      success: true,
      orderId: orderId,
      total: total
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error during checkout.' });
  }
});

module.exports = router;