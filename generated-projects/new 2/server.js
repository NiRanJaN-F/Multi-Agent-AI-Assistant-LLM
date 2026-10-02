const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Import routes and middlewares
const apiRoutes = require('./routes/api');
const authMiddleware = require('./middlewares/auth');

// Initialize database
const db = require('./db');

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Define routes and middlewares
app.use('/api', apiRoutes);
app.use('/auth', authMiddleware);

// Define error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ success: false, message: 'Internal server error' });
});