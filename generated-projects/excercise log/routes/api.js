// Import necessary modules and dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Define API routes
app.use('/api', require('./api_routes'));

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});