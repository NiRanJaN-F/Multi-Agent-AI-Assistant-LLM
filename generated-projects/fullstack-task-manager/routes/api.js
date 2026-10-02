// routes/api.js
const express = require('express');
const router = express.Router();

// In-memory data store (replace with a DB in production)
let tasks = [];
let nextId = 1;

/**
 * Validate task payload.
 * Returns an array of error messages (empty if valid).
 */
function validateTask(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Payload must be an object.');
    return errors;
  }

  const { title, description, completed } = payload;

  if (typeof title !== 'string' || title.trim() === '') {
    errors.push('Title is required and must be a non‑empty string.');
  }

  if (description !== undefined && typeof description !== 'string') {
    errors.push('Description, if provided, must be a string.');
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    errors.push('Completed, if provided, must be a boolean.');
  }

  return errors;
}

/**
 * GET /tasks
 * Return all tasks.
 */
router.get('/tasks', (req, res) => {
  res.json(tasks);
});

/**
 * GET /tasks/:id
 * Return a single task by id.
 */
router.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task with id ${id} not found.` });
  }

  res.json(task);
});

/**
 * POST /tasks
 * Create a new task.
 */
router.post('/tasks', (req, res) => {
  const errors = validateTask(req.body);
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const { title, description = '', completed = false } = req.body;
  const newTask = {
    id: nextId++,
    title: title.trim(),
    description: description.trim(),
    completed,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

/**
 * PUT /tasks/:id
 * Update an existing task.
 */
router.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task with id ${id} not found.` });
  }

  const errors = validateTask(req.body);
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const { title, description = '', completed = false } = req.body;
  const updatedTask = {
    ...tasks[taskIndex],
    title: title.trim(),
    description: description.trim(),
    completed,
    updatedAt: new Date().toISOString(),
  };

  tasks[taskIndex] = updatedTask;
  res.json(updatedTask);
});

/**
 * DELETE /tasks/:id
 * Remove a task.
 */
router.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task with id ${id} not found.` });
  }

  const [deletedTask] = tasks.splice(taskIndex, 1);
  res.json({ message: `Task ${id} deleted.`, task: deletedTask });
});

/**
 * Global error handler for unexpected errors.
 */
router.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = router;