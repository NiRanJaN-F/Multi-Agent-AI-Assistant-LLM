// Import necessary modules and dependencies
const express = require('express');
const cors = require('cors');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Define API routes
app.get('/api/products', productController.getProducts);
app.get('/api/products/:id', productController.getProduct);
app.post('/api/cart', cartController.addToCart);
app.post('/api/cart/update', cartController.updateCart);
app.post('/api/cart/remove', cartController.removeFromCart);
app.post('/api/checkout', orderController.placeOrder);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});