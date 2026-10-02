import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import transactionsRouter from './routes/transactions.js';
import savingsRouter from './routes/savings.js';
import checkoutRouter from './routes/checkout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/savings', savingsRouter);
app.use('/api/checkout', checkoutRouter);

// Fallback HTML route for single-page style interaction
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});