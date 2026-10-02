const express = require('express');
const router = express.Router();

// Mock database for products matching the API contract
const products = [
  {
    id: 1,
    name: "Wireless Noise-Canceling Headphones",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    description: "Experience premium sound quality and active noise cancellation for ultimate listening comfort."
  },
  {
    id: 2,
    name: "Ergonomic Mechanical Keyboard",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60",
    description: "Boost your productivity and gaming experience with tactile switches and customizable RGB backlighting."
  },
  {
    id: 3,
    name: "Ultra-Wide 4K Gaming Monitor",
    price: 499.99,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60",
    description: "Immerse yourself in stunning 4K resolution with a smooth refresh rate and ultra-wide viewing angles."
  },
  {
    id: 4,
    name: "Precision Wireless Mouse",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60",
    description: "Designed for comfort and precision tracking on any surface with long-lasting battery life."
  },
  {
    id: 5,
    name: "USB-C Multi-Port Hub",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&auto=format&fit=crop&q=60",
    description: "Expand your connectivity with 4K HDMI, high-speed USB ports, and power delivery pass-through."
  },
  {
    id: 6,
    name: "Minimalist Desk Pad",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60",
    description: "Protect your workspace and enhance mouse glide with a smooth, water-resistant faux leather surface."
  }
];

// GET /api/products - Retrieve all products
router.get('/', (req, res, next) => {
  try {
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - Retrieve a single product by ID
router.get('/:id', (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const product = products.find(p => p.id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

module.exports = router;