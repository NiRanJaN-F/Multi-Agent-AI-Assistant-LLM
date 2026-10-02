const express = require('express');
const router = express.Router();

const products = [
  {
    id: 1,
    name: "Dark Truffle Burger",
    price: 14.99,
    category: "Burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    name: "Obsidian Ramen",
    price: 16.50,
    category: "Noodles",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    name: "Midnight Charcoal Pizza",
    price: 18.00,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 4,
    name: "Void Velvet Cake",
    price: 8.99,
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 5,
    name: "Shadow Elixir Cocktail",
    price: 10.00,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 6,
    name: "Eclipse Wagyu Steak",
    price: 28.50,
    category: "Mains",
    image: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80"
  }
];

router.get('/products', (req, res) => {
  try {
    res.json(products);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

router.post('/orders', (req, res) => {
  try {
    const { items, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty or invalid' });
    }

    if (!customer || !customer.name || !customer.address) {
      return res.status(400).json({ success: false, message: 'Customer name and address are required' });
    }

    let calculatedTotal = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product with ID ${item.id} not found` });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: `Invalid quantity for product ID ${item.id}` });
      }
      calculatedTotal += product.price * item.quantity;
    }

    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    res.status(201).json({
      success: true,
      orderId: orderId,
      total: Number(calculatedTotal.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error processing order' });
  }
});

module.exports = router;