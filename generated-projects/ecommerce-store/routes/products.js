const express = require('express');
const router = express.Router();

// Mock database for products fulfilling the API contract
const products = [
  {
    id: 1,
    name: "Wireless Noise-Canceling Headphones",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Experience premium sound quality and active noise cancellation with up to 30 hours of battery life."
  },
  {
    id: 2,
    name: "Minimalist Mechanical Keyboard",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Compact 75% layout mechanical keyboard featuring hot-swappable switches and customizable RGB backlighting."
  },
  {
    id: 3,
    name: "Ergonomic Vertical Mouse",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Designed for natural hand positioning, reducing wrist strain and improving daily productivity."
  },
  {
    id: 4,
    name: "Ultra-Wide 4K Monitor",
    price: 499.99,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Immersive 34-inch ultra-wide display with stunning 4K resolution, perfect for creators and multitasking professionals."
  },
  {
    id: 5,
    name: "USB-C Multi-Port Hub",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Expand your connectivity with 4K HDMI, high-speed USB ports, SD card reader, and 100W Power Delivery pass-through."
  },
  {
    id: 6,
    name: "Smart LED Desk Lamp",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Adjustable color temperature and brightness levels with touch controls and integrated wireless charging base."
  }
];

/**
 * GET /api/products
 * Retrieves the full list of products available in the store.
 */
router.get('/', (req, res, next) => {
  try {
    res.json(products);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:id
 * Retrieves a single product by its unique identifier.
 */
router.get('/:id', (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format. Must be a number.' });
    }

    const product = products.find(p => p.id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

module.exports = router;