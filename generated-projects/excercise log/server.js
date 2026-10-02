// server.js

// Import required modules and packages
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Create Express app instance
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all requests
app.use(cors());

// Parse JSON requests
app.use(bodyParser.json());

// Define API routes
app.use('/api', require('./routes/api'));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});