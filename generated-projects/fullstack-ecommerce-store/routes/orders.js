const express = require('express');
const router = express.Router();

// In-memory product catalog matching routes/products.js for price calculations
const productsCatalog = [
  { id: 1, name: "Wireless Headphones", price: 99.99, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", description: "High-quality wireless headphones with active noise cancellation." },
  { id: 2, name: "Smart Watch", price: 199.99, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80", description: "Feature-packed smartwatch with fitness tracking and notifications." },
  { id: 3, name: "Ergonomic Office Chair", price: 249.99, image: "https://images.unsplash.com/photo-1580481077494-e3299ac25b0e?w=500&q=80", description: "Comfortable ergonomic chair designed for long working hours." },
  { id: 4, name: "Mechanical Keyboard", price: 89.99, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80", description: "RGB mechanical gaming keyboard with tactile switches." },
  { id: 5, name: "Ultra-Wide Monitor", price: 399.99, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80", description: "34-inch ultra-wide curved monitor for immersive productivity." },
  { id: 6, name: "USB-C Hub", price: 49.99, image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&q=80", description: "Multiport USB-C adapter with HDMI, USB 3.0, and power delivery." }
];

// POST /api/orders
router.post('/', (req, res) => {
  try {
    const { items, shipping } = req.body;

    // Validate request body structure
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid or empty items array." 
      });
    }

    if (!shipping || typeof shipping !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: "Missing or invalid shipping information." 
      });
    }

    const { name, address } = shipping;
    if (!name || !address || typeof name !== 'string' || typeof address !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: "Shipping information must include valid 'name' and 'address'." 
      });
    }

    let calculatedTotal = 0;

    // Validate items and calculate total securely on the backend
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || !quantity || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: "Each item must have a valid productId and a positive quantity." 
        });
      }

      const product = productsCatalog.find(p => p.id === productId);
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          error: `Product with ID ${productId} not found.` 
        });
      }

      calculatedTotal += product.price * quantity;
    }

    // Generate unique order ID and format total to 2 decimal places
    const orderId = `ord_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const total = Number(calculatedTotal.toFixed(2));

    // Simulate order persistence (e.g., saving to a database)
    const newOrder = {
      orderId,
      items,
      shipping: { name, address },
      total,
      createdAt: new Date().toISOString()
    };

    // In a real application, you would save `newOrder` to your database here.

    return res.status(201).json({
      success: true,
      orderId: newOrder.orderId,
      total: newOrder.total
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