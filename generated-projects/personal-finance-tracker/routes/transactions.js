import express from 'express';
import db from '../server.js';

const router = express.Router();

// GET /api/transactions - Retrieve all transactions
router.get('/', (req, res) => {
  const query = 'SELECT id, type, amount, category, date, description FROM transactions ORDER BY date DESC, id DESC';
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching transactions:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows);
  });
});

// POST /api/transactions - Create a new transaction
router.post('/', (req, res) => {
  const { type, amount, category, date, description } = req.body;

  // Validate required fields
  if (!type || amount === undefined || !category || !date) {
    return res.status(400).json({ error: 'Missing required fields: type, amount, category, and date are required.' });
  }

  // Validate type
  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: "Invalid type. Must be either 'income' or 'expense'." });
  }

  // Validate amount
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  const query = `
    INSERT INTO transactions (type, amount, category, date, description)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const params = [type, parsedAmount, category, date, description || ''];

  db.run(query, params, function (err) {
    if (err) {
      console.error('Error inserting transaction:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ id: this.lastID, success: true });
  });
});

// DELETE /api/transactions/:id - Delete a transaction by ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM transactions WHERE id = ?';
  db.run(query, [id], function (err) {
    if (err) {
      console.error('Error deleting transaction:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true });
  });
});

export default router;