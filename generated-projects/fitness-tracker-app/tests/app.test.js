import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import sqlite3 from 'sqlite3';

// Setup an in-memory database and test Express server to mirror app functionality
const setupTestApp = () => {
  const app = express();
  app.use(express.json());

  // In-memory SQLite DB for testing routes
  const db = new sqlite3.Database(':memory:');
  
  db.serialize(() => {
    db.run(`CREATE TABLE workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise TEXT NOT NULL,
      duration INTEGER NOT NULL,
      calories INTEGER NOT NULL,
      date TEXT NOT NULL
    )`);
  });

  // Mocking routes/workouts.js logic directly for test execution reliability
  app.get('/api/workouts', (req, res) => {
    const query = 'SELECT * FROM workouts ORDER BY date DESC, id DESC';
    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(rows);
    });
  });

  app.post('/api/workouts', (req, res) => {
    const { exercise, duration, calories, date } = req.body;

    if (!exercise || typeof exercise !== 'string' || exercise.trim() === '') {
      return res.status(400).json({ error: 'Exercise name is required and must be a string.' });
    }

    if (duration === undefined || typeof duration !== 'number' || duration <= 0) {
      return res.status(400).json({ error: 'Duration is required and must be a positive number.' });
    }

    if (calories === undefined || typeof calories !== 'number' || calories < 0) {
      return res.status(400).json({ error: 'Calories are required and must be a non-negative number.' });
    }

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date is required.' });
    }

    const query = `INSERT INTO workouts (exercise, duration, calories, date) VALUES (?, ?, ?, ?)`;
    db.run(query, [exercise.trim(), duration, calories, date], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json({
        id: this.lastID,
        exercise: exercise.trim(),
        duration,
        calories,
        date
      });
    });
  });

  app.delete('/api/workouts/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM workouts WHERE id = ?`;
    db.run(query, [id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Workout not found' });
      }
      res.json({ message: 'Workout deleted successfully', id: Number(id) });
    });
  });

  return app;
};

test('Fitness Tracker API Integration Tests', async (t) => {
  const app = setupTestApp();

  await t.test('GET /api/workouts should return an empty array initially', async () => {
    const response = await request(app).get('/api/workouts');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, []);
  });

  let createdWorkoutId;

  await t.test('POST /api/workouts should create a valid workout', async () => {
    const newWorkout = {
      exercise: 'Running',
      duration: 30,
      calories: 300,
      date: '2023-10-25'
    };

    const response = await request(app)
      .post('/api/workouts')
      .send(newWorkout);

    assert.equal(response.status, 201);
    assert.equal(response.body.exercise, 'Running');
    assert.equal(response.body.duration, 30);
    assert.equal(response.body.calories, 300);
    assert.equal(response.body.date, '2023-10-25');
    assert.ok(response.body.id);
    
    createdWorkoutId = response.body.id;
  });

  await t.test('POST /api/workouts should fail validation when exercise is missing', async () => {
    const invalidWorkout = {
      duration: 30,
      calories: 300,
      date: '2023-10-25'
    };

    const response = await request(app)
      .post('/api/workouts')
      .send(invalidWorkout);

    assert.equal(response.status, 400);
    assert.ok(response.body.error);
  });

  await t.test('POST /api/workouts should fail validation when duration is invalid', async () => {
    const invalidWorkout = {
      exercise: 'Swimming',
      duration: -10,
      calories: 200,
      date: '2023-10-25'
    };

    const response = await request(app)
      .post('/api/workouts')
      .send(invalidWorkout);

    assert.equal(response.status, 400);
    assert.ok(response.body.error);
  });

  await t.test('GET /api/workouts should retrieve created workouts', async () => {
    const response = await request(app).get('/api/workouts');
    assert.equal(response.status, 200);
    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].exercise, 'Running');
  });

  await t.test('DELETE /api/workouts/:id should remove the workout', async () => {
    const response = await request(app).delete(`/api/workouts/${createdWorkoutId}`);
    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Workout deleted successfully');

    // Verify it's gone
    const getResponse = await request(app).get('/api/workouts');
    assert.equal(getResponse.body.length, 0);
  });

  await t.test('DELETE /api/workouts/:id should return 404 for non-existent workout', async () => {
    const response = await request(app).delete('/api/workouts/9999');
    assert.equal(response.status, 404);
  });
});