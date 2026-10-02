const express = require('express');
const router = express.Router();

// Mock product database to verify prices and existence during checkout
const products = [
  { id: 1, name: "Wireless Headphones", price: 99.99, category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80" },
  { id: 2, name: "Smart Watch", price: 199.99, category: "Electronics", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80" },
  { id: 3, name: "Ergonomic Office Chair", price: 249.99, category: "Home", image: "https://images.unsplash.com/photo-1580481077494-e3299ac25b0e?w=500&q=80" },
  { id: 4, name: "Minimalist Backpack", price: 49.99, category: "Fashion", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80" },
  { id: 5, name: "Mechanical Keyboard", price: 129.99, category: "Electronics", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80" },
  { id: 6, name: "Stainless Steel Water Bottle", price: 24.99, category: "Home", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80" }
];

router.post('/', (req, res) => {
  try {
    const { cart, shipping } = req.body;

    // Validate request body structure
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or empty cart provided.' 
      });
    }

    if (!shipping || !shipping.name || !shipping.address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Incomplete shipping information provided.' 
      });
    }

    let calculatedTotal = 0;

    // Validate cart items and compute total securely on the server
    for (const item of cart) {
      if (!item.id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid item structure or quantity in cart.' 
        });
      }

      const product = products.find(p => p.id === item.id);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product with ID ${item.id} not found.` 
        });
      }

      calculatedTotal += product.price * item.quantity;
    }

    // Generate unique order ID
    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    // Round total to 2 decimal places to avoid floating point precision issues
    const finalTotal = Number(calculatedTotal.toFixed(2));

    // Respond with success and order details
    return res.status(200).json({
      success: true,
      orderId: orderId,
      total: finalTotal
    });

  } catch (error) {
    console.error('Checkout processing error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An internal server error occurred during checkout.' 
    });
  }
});

module.exports = router;