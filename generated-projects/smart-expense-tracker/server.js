const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory mock database for products
const products = [
  { id: 1, name: 'Wireless Mechanical Keyboard', price: 89.99, description: 'RGB backlit gaming keyboard with tactile switches.', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=60' },
  { id: 2, name: 'Ergonomic Vertical Mouse', price: 49.99, description: 'Reduces wrist strain during long working hours.', image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=60' },
  { id: 3, name: 'Ultra-Wide 4K Monitor', price: 399.99, description: 'Stunning visual clarity and expansive screen real estate.', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=60' },
  { id: 4, name: 'Noise-Canceling Headphones', price: 199.99, description: 'Immersive sound with active noise cancellation.', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=60' }
];

// API Endpoints
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/checkout', (req, res) => {
  const { cart, customer } = req.body;
  
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty or invalid.' });
  }

  // Calculate total server-side for validation
  let total = 0;
  for (const item of cart) {
    const product = products.find(p => p.id === item.id);
    if (!product) {
      return res.status(400).json({ error: `Product with ID ${item.id} not found.` });
    }
    total += product.price * (item.quantity || 1);
  }

  const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  
  res.json({
    success: true,
    orderId,
    total: parseFloat(total.toFixed(2)),
    message: 'Order placed successfully!'
  });
});

// Fallback to index.html for SPA routing if needed
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export app for testing purposes
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}