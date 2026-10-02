const express = require('express');
const router = express.Router();

// Mock database for products to validate prices, matching routes/products.js
const PRODUCTS = [
  { id: 1, name: "Wireless Headphones", price: 99.99, description: "High-quality noise-canceling wireless headphones with 30-hour battery life.", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80" },
  { id: 2, name: "Smart Watch", price: 199.99, description: "Feature-packed smartwatch with fitness tracking, heart rate monitor, and GPS.", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80" },
  { id: 3, name: "Ergonomic Office Chair", price: 249.99, description: "Comfortable ergonomic office chair with lumbar support and adjustable armrests.", image: "https://images.unsplash.com/photo-1580481077494-e3299acae527?w=500&q=80" },
  { id: 4, name: "Mechanical Keyboard", price: 89.99, description: "RGB backlit mechanical keyboard with tactile switches for ultimate typing experience.", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80" },
  { id: 5, name: "Ultra-Wide Monitor", price: 499.99, description: "34-inch ultra-wide curved monitor with stunning 4K resolution and 144Hz refresh rate.", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80" },
  { id: 6, name: "Minimalist Backpack", price: 59.99, description: "Durable, water-resistant minimalist backpack with a dedicated 15-inch laptop compartment.", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80" }
];

// In-memory store for orders
const orders = [];
let nextOrderId = 101;

// POST /api/orders
router.post('/', (req, res) => {
  try {
    const { items, customer } = req.body;

    // Validate request body structure
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty items array' });
    }

    if (!customer || !customer.name || !customer.address) {
      return res.status(400).json({ error: 'Customer name and address are required' });
    }

    let calculatedTotal = 0;
    const validatedItems = [];

    // Validate each item and calculate total server-side
    for (const item of items) {
      const { productId, quantity } = item;

      if (!productId || !quantity || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid product ID or quantity' });
      }

      const product = PRODUCTS.find(p => p.id === Number(productId));
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${productId} not found` });
      }

      calculatedTotal += product.price * quantity;
      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity
      });
    }

    // Round total to 2 decimal places to avoid floating point issues
    const total = Number(calculatedTotal.toFixed(2));
    const orderId = nextOrderId++;

    const newOrder = {
      orderId,
      items: validatedItems,
      customer: {
        name: customer.name.trim(),
        address: customer.address.trim()
      },
      total,
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);

    // Respond according to API contract
    return res.status(201).json({
      success: true,
      orderId: newOrder.orderId,
      total: newOrder.total
    });

  } catch (error) {
    console.error('Error processing order:', error);
    return res.status(500).json({ error: 'Internal server error while processing order' });
  }
});

module.exports = router;