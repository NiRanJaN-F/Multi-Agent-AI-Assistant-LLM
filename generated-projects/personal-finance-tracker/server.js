import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import transactionsRouter from './routes/transactions.js';
import budgetsRouter from './routes/budgets.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database (in-memory or persistent file, using file for consistency)
const db = new sqlite3.Database('./finance.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create tables if they do not exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT UNIQUE NOT NULL,
      limit_amount REAL NOT NULL
    )
  `);
});

// Make db accessible to routers via app.locals
app.locals.db = db;

// Summary endpoint
app.get('/api/summary', (req, res) => {
  const summaryQuery = `
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
    FROM transactions
  `;

  const breakdownQuery = `
    SELECT category, SUM(amount) AS total
    FROM transactions
    WHERE type = 'expense'
    GROUP BY category
  `;

  db.get(summaryQuery, [], (err, summaryRow) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error while fetching summary' });
    }

    db.all(breakdownQuery, [], (err, breakdownRows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error while fetching category breakdown' });
      }

      const total_income = summaryRow?.total_income || 0;
      const total_expense = summaryRow?.total_expense || 0;
      const balance = total_income - total_expense;

      const category_breakdown = {};
      breakdownRows.forEach((row) => {
        category_breakdown[row.category] = row.total;
      });

      res.json({
        total_income,
        total_expense,
        balance,
        category_breakdown
      });
    });
  });
});

// Mount modular routers
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;