const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');

// Setup Express app for integration testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRoutes);

test('API Integration Tests - Bookstore/College Portal Fullstack', async (t) => {

  await t.test('GET /api/departments should return a list of departments', async () => {
    const response = await request(app).get('/api/departments');
    assert.equal(response.status, 200);
    assert.equal(Array.isArray(response.body), true);
    assert.ok(response.body.length > 0);
    assert.equal(typeof response.body[0].name, 'string');
    assert.equal(typeof response.body[0].hod, 'string');
  });

  await t.test('GET /api/courses should return a list of courses', async () => {
    const response = await request(app).get('/api/courses');
    assert.equal(response.status, 200);
    assert.equal(Array.isArray(response.body), true);
    assert.ok(response.body.length > 0);
    assert.equal(typeof response.body[0].code, 'string');
    assert.equal(typeof response.body[0].name, 'string');
    assert.equal(typeof response.body[0].credits, 'number');
  });

  await t.test('GET /api/academics should return academic details', async () => {
    const response = await request(app).get('/api/academics');
    assert.equal(response.status, 200);
    assert.equal(typeof response.body, 'object');
    assert.ok(response.body !== null);
  });

  await t.test('GET /api/placements should return placement stats', async () => {
    const response = await request(app).get('/api/placements');
    assert.equal(response.status, 200);
    assert.equal(typeof response.body, 'object');
    assert.ok(response.body !== null);
  });

  await t.test('GET /api/nonexistent should return 404', async () => {
    const response = await request(app).get('/api/nonexistent');
    assert.equal(response.status, 404);
  });

});