import express from 'express';
import db from '../server.js';

const router = express.Router();

// GET /api/budgets - Retrieve all budget limits
router.get('/', (req, res) => {
  const query = `SELECT category, limit_amount FROM budgets`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching budgets:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows);
  });
});

// POST /api/budgets - Create or update a budget limit for a category
router.post('/', (req, res) => {
  const { category, limit_amount } = req.body;

  // Validation
  if (!category || typeof category !== 'string' || category.trim() === '') {
    return res.status(400).json({ error: 'Valid category is required' });
  }

  if (limit_amount === undefined || typeof limit_amount !== 'number' || limit_amount < 0) {
    return res.status(400).json({ error: 'Valid positive limit_amount is required' });
  }

  const trimmedCategory = category.trim();

  // Upsert query using SQLite INSERT OR REPLACE (assuming category is the UNIQUE/PRIMARY KEY)
  const query = `
    INSERT INTO budgets (category, limit_amount) 
    VALUES (?, ?)
    ON CONFLICT(category) 
    DO UPDATE SET limit_amount = excluded.limit_amount
  `;

  db.run(query, [trimmedCategory, limit_amount], function (err) {
    if (err) {
      console.error('Error saving budget:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ success: true });
  });
});

export default router;