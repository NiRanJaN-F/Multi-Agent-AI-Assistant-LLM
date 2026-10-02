// Import necessary modules and dependencies
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app and enable CORS
const app = express();
app.use(cors());

// Define routes and handlers
app.use((req, res, next) => {
  // Log request details for debugging purposes
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Import routes and handlers from other files
const apiRoutes = require('./routes/api');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');

// Configure middleware and route handlers
app.use(express.json());
app.use('/api', apiRoutes);
app.use('/cart', cartRoutes);
app.use('/order', orderRoutes);

// Export the Express app for server startup
module.exports = app;