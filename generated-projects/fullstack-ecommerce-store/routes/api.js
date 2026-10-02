const express = require('express');
const router = express.Router();

// Mock database of products matching the required API contract
const PRODUCTS = [
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
    name: "Ergonomic Vertical Mouse",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80"
  },
  {
    id: 4,
    name: "Ultra-Wide 4K Gaming Monitor",
    price: 499.99,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80"
  },
  {
    id: 5,
    name: "USB-C Multi-Port Hub",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&q=80"
  },
  {
    id: 6,
    name: "Adjustable Laptop Stand",
    price: 45.00,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80"
  }
];

/**
 * GET /api/products
 * Returns the list of all available products.
 */
router.get('/products', (req, res) => {
  try {
    res.status(200).json(PRODUCTS);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/checkout
 * Processes a customer cart and returns order confirmation details.
 * Expected Request Body:
 * {
 *   "cart": [{"id": 1, "quantity": 2}],
 *   "customer": {"name": "John Doe", "address": "123 Main St"}
 * }
 */
router.post('/checkout', (req, res) => {
  try {
    const { cart, customer } = req.body;

    // Validate payload structure
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or empty cart provided.' 
      });
    }

    if (!customer || !customer.name || !customer.address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer name and address are required.' 
      });
    }

    let calculatedTotal = 0;

    // Validate items and calculate total securely on the backend
    for (const item of cart) {
      if (!item.id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid item structure or quantity in cart.' 
        });
      }

      const product = PRODUCTS.find((p) => p.id === item.id);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product with ID ${item.id} not found.` 
        });
      }

      calculatedTotal += product.price * item.quantity;
    }

    // Format total to 2 decimal places
    const total = Number(calculatedTotal.toFixed(2));
    
    // Generate a mock unique order ID
    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    // Return the successful checkout response conforming to the contract
    return res.status(200).json({
      success: true,
      orderId: orderId,
      total: total
    });

  } catch (error) {
    console.error('Error processing checkout:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while processing your order.' 
    });
  }
});

module.exports = router;