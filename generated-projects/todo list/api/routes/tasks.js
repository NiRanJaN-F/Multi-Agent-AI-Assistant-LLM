const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks');

// GET all tasks
router.get('/', tasksController.getAllTasks);

// POST a new task
router.post('/', tasksController.createTask);

// PUT a task by ID
router.put('/:id', tasksController.updateTask);

// DELETE a task by ID
router.delete('/:id', tasksController.deleteTask);

module.exports = router;