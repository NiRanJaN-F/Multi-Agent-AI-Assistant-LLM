const express = require('express');
const router = express.Router();
const tasks = [];

// Add a new task
router.post('/tasks', (req, res) => {
  const task = req.body;
  tasks.push(task);
  res.status(201).json(task);
});

// Get all tasks
router.get('/tasks', (req, res) => {
  res.json(tasks);
});

// Delete a task by ID
router.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(task => task.id === taskId);

  if (taskIndex !== -1) {
    tasks.splice(taskIndex, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

module.exports = router;