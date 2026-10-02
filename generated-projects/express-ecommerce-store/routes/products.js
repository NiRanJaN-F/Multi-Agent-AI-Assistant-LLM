const express = require('express');
const router = express.Router();

// Mock product database adhering to the requested schema
const products = [
  {
    id: 1,
    name: "Wireless Noise-Canceling Headphones",
    price: 199.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    name: "Minimalist Mechanical Keyboard",
    price: 89.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 3,
    name: "Ergonomic Office Chair",
    price: 249.50,
    category: "Furniture",
    image: "https://images.unsplash.com/photo-1580481077494-e3299ac2567e?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 4,
    name: "Stainless Steel Water Bottle",
    price: 24.99,
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 5,
    name: "Ultra-Wide Gaming Monitor",
    price: 499.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 6,
    name: "Drip Coffee Maker",
    price: 59.99,
    category: "Kitchen",
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&auto=format&fit=crop&q=60"
  }
];

/**
 * GET /api/products
 * Retrieves the full list of products
 */
router.get('/', (req, res) => {
  try {
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error while fetching products.' });
  }
});

/**
 * GET /api/products/filter
 * Filters products by query parameters (e.g., category, search term, max price)
 */
router.get('/filter', (req, res) => {
  try {
    const { category, search, maxPrice } = req.query;
    let filteredProducts = [...products];

    if (category) {
      filteredProducts = filteredProducts.filter(
        p => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredProducts = filteredProducts.filter(
        p => p.name.toLowerCase().includes(searchTerm) || 
             p.category.toLowerCase().includes(searchTerm)
      );
    }

    if (maxPrice) {
      const priceLimit = parseFloat(maxPrice);
      if (!isNaN(priceLimit)) {
        filteredProducts = filteredProducts.filter(p => p.price <= priceLimit);
      } else {
        return res.status(400).json({ error: 'Invalid maxPrice parameter supplied.' });
      }
    }

    res.status(200).json(filteredProducts);
  } catch (error) {
    console.error('Error filtering products:', error);
    res.status(500).json({ error: 'Internal server error while filtering products.' });
  }
});

module.exports = router;