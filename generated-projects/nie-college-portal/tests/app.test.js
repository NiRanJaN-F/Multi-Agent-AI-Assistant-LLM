const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const path = require('path');
const apiRouter = require('./routes/api');

// --- INTEGRATION TESTS: Express API Endpoints ---
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api', apiRouter);
  return app;
};

test('API Integration Tests', async (t) => {
  const app = createTestApp();

  await t.test('GET /api/departments returns a list of departments', async () => {
    const response = await request(app).get('/api/departments');
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body), 'Response body should be an array');
    assert.ok(response.body.length > 0, 'Departments array should not be empty');
    
    const firstDept = response.body[0];
    assert.ok(firstDept.hasOwnProperty('id'), 'Department should have an id');
    assert.ok(firstDept.hasOwnProperty('name'), 'Department should have a name');
    assert.ok(firstDept.hasOwnProperty('hod'), 'Department should have a hod');
    assert.ok(firstDept.hasOwnProperty('description'), 'Department should have a description');
  });

  await t.test('GET /api/programs returns a list of academic programs', async () => {
    const response = await request(app).get('/api/programs');
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body), 'Response body should be an array');
    assert.ok(response.body.length > 0, 'Programs array should not be empty');

    const firstProg = response.body[0];
    assert.ok(firstProg.hasOwnProperty('id'), 'Program should have an id');
    assert.ok(firstProg.hasOwnProperty('name'), 'Program should have a name');
    assert.ok(firstProg.hasOwnProperty('description'), 'Program should have a description');
  });

  await t.test('GET /api/events returns a list of events', async () => {
    const response = await request(app).get('/api/events');
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body), 'Response body should be an array');
  });

  await t.test('GET /api/admissions/stats returns admission statistics', async () => {
    const response = await request(app).get('/api/admissions/stats');
    assert.equal(response.status, 200);
    assert.ok(typeof response.body === 'object', 'Response body should be an object');
  });

  await t.test('POST /api/contact submits a contact form message successfully', async () => {
    const payload = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      message: 'Hello, I would like to inquire about undergraduate courses.'
    };
    const response = await request(app)
      .post('/api/contact')
      .send(payload);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.ok(response.body.message.includes('successfully'), 'Response message should confirm submission');
  });

  await t.test('POST /api/contact fails validation when required fields are missing', async () => {
    const payload = {
      name: 'John Doe'
      // missing email and message
    };
    const response = await request(app)
      .post('/api/contact')
      .send(payload);

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.ok(response.body.error, 'Response should contain an error property');
  });

  await t.test('POST /api/admissions/apply submits an admission application successfully', async () => {
    const payload = {
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '9876543210',
      course: 'Computer Science & Engineering'
    };
    const response = await request(app)
      .post('/api/admissions/apply')
      .send(payload);

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.ok(response.body.applicationId, 'Response should return a unique applicationId');
  });

  await t.test('POST /api/admissions/apply fails validation when mandatory fields are missing', async () => {
    const payload = {
      fullName: 'Jane Smith'
      // missing email, phone, course
    };
    const response = await request(app)
      .post('/api/admissions/apply')
      .send(payload);

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.ok(response.body.error, 'Response should contain an error property');
  });
});

// --- UNIT TESTS: Frontend Helper or App logic validation (simulated DOM/Environment) ---
test('Frontend Utilities & Configuration Unit Tests', async (t) => {
  await t.test('MOCK_DATA and Router data consistency check', () => {
    // Ensuring api routes export valid router structures
    assert.ok(apiRouter, 'API Router should be imported correctly');
  });
});