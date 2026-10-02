const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// In-memory data store with file persistence
const DATA_FILE = path.join(__dirname, '..', 'data', 'fitness-data.json');

function ensureDataDir() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadData() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading data:', err.message);
  }
  return { steps: [], calories: [], workouts: [] };
}

function saveData(data) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data:', err.message);
  }
}

let db = loadData();

// Middleware to parse JSON bodies
router.use(express.json());

// ==================== STEP ROUTES ====================

// GET /api/steps - Get all step entries, optionally filtered by date
router.get('/steps', (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let filtered = [...db.steps];

    if (date) {
      filtered = filtered.filter(entry => entry.date === date);
    } else if (startDate && endDate) {
      filtered = filtered.filter(entry => entry.date >= startDate && entry.date <= endDate);
    } else if (startDate) {
      filtered = filtered.filter(entry => entry.date >= startDate);
    } else if (endDate) {
      filtered = filtered.filter(entry => entry.date <= endDate);
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/steps/today - Get today's step count
router.get('/steps/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todaySteps = db.steps.filter(entry => entry.date === today);
    const totalSteps = todaySteps.reduce((sum, entry) => sum + entry.steps, 0);

    res.json({
      success: true,
      date: today,
      totalSteps,
      entries: todaySteps,
      goal: 10000,
      progress: Math.min((totalSteps / 10000) * 100, 100)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/steps/summary - Get step summary statistics
router.get('/steps/summary', (req, res) => {
  try {
    const { days = 7 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days) + 1);

    const dateRange = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d).toISOString().split('T')[0]);
    }

    const dailyTotals = dateRange.map(date => {
      const dayEntries = db.steps.filter(entry => entry.date === date);
      const total = dayEntries.reduce((sum, entry) => sum + entry.steps, 0);
      return { date, steps: total };
    });

    const totalSteps = dailyTotals.reduce((sum, day) => sum + day.steps, 0);
    const avgSteps = dailyTotals.length > 0 ? Math.round(totalSteps / dailyTotals.length) : 0;
    const maxSteps = dailyTotals.length > 0 ? Math.max(...dailyTotals.map(d => d.steps)) : 0;
    const daysWithGoal = dailyTotals.filter(d => d.steps >= 10000).length;

    res.json({
      success: true,
      period: { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0], days: parseInt(days) },
      totalSteps,
      avgSteps,
      maxSteps,
      daysWithGoal,
      dailyTotals
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/steps - Log new steps
router.post('/steps', (req, res) => {
  try {
    const { steps, date, notes } = req.body;

    if (!steps || isNaN(steps) || steps < 0) {
      return res.status(400).json({ success: false, error: 'Valid step count is required' });
    }

    const entryDate = date || new Date().toISOString().split('T')[0];
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      steps: parseInt(steps),
      date: entryDate,
      timestamp: new Date().toISOString(),
      notes: notes || ''
    };

    db.steps.push(entry);
    saveData(db);

    res.status(201).json({
      success: true,
      message: 'Steps logged successfully',
      data: entry
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/steps/:id - Update a step entry
router.put('/steps/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { steps, date, notes } = req.body;

    const index = db.steps.findIndex(entry => entry.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Step entry not found' });
    }

    if (steps !== undefined && (isNaN(steps) || steps < 0)) {
      return res.status(400).json({ success: false, error: 'Valid step count is required' });
    }

    if (steps !== undefined) db.steps[index].steps = parseInt(steps);
    if (date) db.steps[index].date = date;
    if (notes !== undefined) db.steps[index].notes = notes;
    db.steps[index].updatedAt = new Date().toISOString();

    saveData(db);

    res.json({
      success: true,
      message: 'Step entry updated',
      data: db.steps[index]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/steps/:id - Delete a step entry
router.delete('/steps/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.steps.findIndex(entry => entry.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Step entry not found' });
    }

    const deleted = db.steps.splice(index, 1)[0];
    saveData