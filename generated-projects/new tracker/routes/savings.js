const express = require('express');
const router = express.Router();

// In-memory data store for savings goals (consistent with the rest of the app)
let savingsGoals = [
  { id: 's1', goal: 'Vacation', target: 1000, current: 250 }
];

// GET /api/savings
router.get('/', (req, res) => {
  try {
    res.json(savingsGoals);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving savings goals' });
  }
});

// POST /api/savings
router.post('/', (req, res) => {
  try {
    const { goal, target, current } = req.body;

    if (!goal || target === undefined) {
      return res.status(400).json({ success: false, message: 'Goal title and target amount are required' });
    }

    const newGoal = {
      id: Date.now().toString(),
      goal: goal.trim(),
      target: parseFloat(target),
      current: current !== undefined ? parseFloat(current) : 0
    };

    savingsGoals.push(newGoal);
    res.status(201).json({ success: true, saving: newGoal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating savings goal' });
  }
});

module.exports = router;