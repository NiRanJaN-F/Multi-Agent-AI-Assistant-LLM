const express = require('express');
const router = express.Router();

// In-memory mock products database (to validate prices and calculate totals accurately)
// In a production environment, this would be imported from a shared database module or products.js
const PRODUCTS = [
  { id: 1, name: 'Wireless Ergonomic Mouse', price: 49.99, image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80', description: 'Comfortable wireless mouse with customizable buttons and smooth tracking.' },
  { id: 2, name: 'Mechanical Keyboard', price: 89.99, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80', description: 'RGB backlit mechanical keyboard with tactile switches for an optimal typing experience.' },
  { id: 3, name: 'HD Monitor 27"', price: 249.99, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80', description: 'Crystal clear 27-inch IPS monitor with 144Hz refresh rate and thin bezels.' },
  { id: 4, name: 'USB-C Hub Multiport Adapter', price: 34.99, image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&q=80', description: '7-in-1 USB-C hub featuring 4K HDMI, USB 3.0 ports, and SD card reader.' },
  { id: 5, name: 'Noise-Cancelling Headphones', price: 199.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', description: 'Over-ear active noise-cancelling headphones with 30-hour battery life and deep bass.' },
  { id: 6, name: 'Laptop Stand', price: 29.99, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80', description: 'Adjustable aluminum laptop stand for improved ergonomics and cooling.' }
];

// POST /api/orders
router.post('/', (req, res) => {
  try {
    const { items, shipping } = req.body;

    // Validate request body structure
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request: "items" must be a non-empty array.' 
      });
    }

    if (!shipping || typeof shipping !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request: "shipping" details are required.' 
      });
    }

    const { name, address } = shipping;
    if (!name || typeof name !== 'string' || name.trim() === '' ||
        !address || typeof address !== 'string' || address.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error: Shipping "name" and "address" are required and must be valid strings.' 
      });
    }

    // Calculate total and validate items against the product catalog
    let calculatedTotal = 0;

    for (const item of items) {
      const { productId, quantity } = item;

      if (!productId || !quantity || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid item structure: each item must have a valid "productId" and positive "quantity".' 
        });
      }

      const product = PRODUCTS.find(p => p.id === Number(productId));
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          error: `Product with ID ${productId} not found.` 
        });
      }

      calculatedTotal += product.price * quantity;
    }

    // Round total to 2 decimal places to avoid floating-point precision issues
    const finalTotal = Number(calculatedTotal.toFixed(2));

    // Generate a unique order ID
    const orderId = `ord_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    // In a production app, you would save the order to a database here (e.g., MongoDB, PostgreSQL)

    // Respond with success contract
    return res.status(201).json({
      success: true,
      orderId: orderId,
      total: finalTotal
    });

  } catch (error) {
    console.error('Error processing order:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error while processing the order.' 
    });
  }
});

module.exports = router;