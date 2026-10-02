import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import sqlite3 from 'sqlite3';
import request from 'supertest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Setup Mock SQLite In-Memory Database for API Integration Tests
const setupTestApp = () => {
  const app = express();
  app.use(express.json());

  const db = new sqlite3.Database(':memory:');

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
        category TEXT PRIMARY KEY,
        limit_amount REAL NOT NULL
      )
    `);
  });

  // Inject mock db into request context or create inline routers for testing
  app.get('/api/transactions', (req, res) => {
    db.all('SELECT * FROM transactions ORDER BY date DESC, id DESC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/transactions', (req, res) => {
    const { type, amount, category, date, description } = req.body;
    if (!type || amount === undefined || !category || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    db.run(
      'INSERT INTO transactions (type, amount, category, date, description) VALUES (?, ?, ?, ?, ?)',
      [type, amount, category, date, description],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, type, amount, category, date, description });
      }
    );
  });

  app.get('/api/budgets', (req, res) => {
    db.all('SELECT category, limit_amount FROM budgets', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/budgets', (req, res) => {
    const { category, limit_amount } = req.body;
    if (!category || limit_amount === undefined) {
      return res.status(400).json({ error: 'Valid category and limit_amount are required' });
    }
    db.run(
      'INSERT OR REPLACE INTO budgets (category, limit_amount) VALUES (?, ?)',
      [category, limit_amount],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ category, limit_amount });
      }
    );
  });

  return app;
};

// --- API Integration Tests ---
test('Integration: Transactions API workflow', async () => {
  const app = setupTestApp();

  // 1. Get initial empty transactions
  const resEmpty = await request(app).get('/api/transactions');
  assert.equal(resEmpty.status, 200);
  assert.deepEqual(resEmpty.body, []);

  // 2. Post a new transaction
  const newTx = {
    type: 'expense',
    amount: 45.50,
    category: 'Food',
    date: '2023-10-01',
    description: 'Groceries'
  };
  const resPost = await request(app).post('/api/transactions').send(newTx);
  assert.equal(resPost.status, 201);
  assert.equal(resPost.body.category, 'Food');
  assert.equal(resPost.body.amount, 45.50);

  // 3. Verify transaction list retrieval
  const resList = await request(app).get('/api/transactions');
  assert.equal(resList.status, 200);
  assert.equal(resList.body.length, 1);
  assert.equal(resList.body[0].description, 'Groceries');
});

test('Integration: Transactions API validation failure', async () => {
  const app = setupTestApp();
  const invalidTx = { type: 'income', amount: 100 }; // Missing category and date
  const res = await request(app).post('/api/transactions').send(invalidTx);
  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('Integration: Budgets API create and retrieve workflow', async () => {
  const app = setupTestApp();

  // Set budget
  const budgetPayload = { category: 'Entertainment', limit_amount: 200 };
  const resPost = await request(app).post('/api/budgets').send(budgetPayload);
  assert.equal(resPost.status, 200);
  assert.equal(resPost.body.category, 'Entertainment');
  assert.equal(resPost.body.limit_amount, 200);

  // Retrieve budgets
  const resGet = await request(app).get('/api/budgets');
  assert.equal(resGet.status, 200);
  assert.equal(resGet.body.length, 1);
  assert.equal(resGet.body[0].limit_amount, 200);
});

// --- Component Unit Tests ---
import CategoryChart from './src/components/CategoryChart.jsx';

test('Unit: CategoryChart component renders category breakdown properly', () => {
  const breakdown = {
    Food: 150,
    Utilities: 75
  };

  // Mocking container or checking pure render output structure
  const { container } = render(<CategoryChart categoryBreakdown={breakdown} />);
  
  assert.ok(container.textContent.includes('Food'));
  assert.ok(container.textContent.includes('Utilities'));
});