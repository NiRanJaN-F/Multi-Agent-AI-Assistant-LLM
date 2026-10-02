// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./routes/api.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for local development
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', apiRoutes);

// Fallback route for SPA: serve index.html for any unmatched GET request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Food Delivery app server running on port ${PORT}`);
});