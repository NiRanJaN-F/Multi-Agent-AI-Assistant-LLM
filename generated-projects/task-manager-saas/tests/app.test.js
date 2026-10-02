// test/task-manager-saas.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');

// deterministic JWT handling for tests
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

let mongoServer;

// Helper to reload a model after DB connection (clears require cache)
function loadModel(name) {
  const modelPath = path.resolve(__dirname, `../models/${name}`);
  delete require.cache[require.resolve(modelPath)];
  return require(modelPath);
}

/* ---------- Global Setup / Teardown ---------- */
test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();

  // Connect using the project's db helper
  const connectDB = require('../config/db');
  await connectDB();
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

/* ---------- Tests ---------- */
test('Database connection should be established', async (t) => {
  assert.strictEqual(mongoose.connection.readyState, 1, 'Mongoose should be connected');
});

test('User model validation and password hashing', async (t) => {
  const User = loadModel('User');

  // 1️⃣ Validation errors when required fields are missing
  const emptyUser = new User({});
  const validationErr = await emptyUser.validate().catch((e) => e);
  assert.ok(validationErr, 'Expected validation error');
  assert.ok(validationErr.errors.name, 'Missing name should trigger validation error');
  assert.ok(validationErr.errors.email, 'Missing email should trigger validation error');
  assert.ok(validationErr.errors.password, 'Missing password should trigger validation error');

  // 2️⃣ Successful creation with password hashing
  const plainPwd = 'SuperSecret123';
  const user = new User({
    name: 'Alice',
    email: 'alice@example.com',
    password: plainPwd,
  });
  await user.save();

  assert.notStrictEqual(user.password, plainPwd, 'Password must be hashed');
  assert.ok(
    user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'),
    'Hashed password should be a bcrypt hash'
  );

  // 3️⃣ Optional comparePassword method (if implemented)
  if (typeof user.comparePassword === 'function') {
    const match = await user.comparePassword(plainPwd);
    assert.ok(match, 'comparePassword should succeed with correct password');

    const noMatch = await user.comparePassword('wrong');
    assert.ok(!noMatch, 'comparePassword should fail with incorrect password');
  }
});

test('Workspace model requires owner and name', async (t) => {
  const Workspace = loadModel('Workspace');
  const User = loadModel('User');

  const owner = await User.findOne({ email: 'alice@example.com' });
  assert.ok(owner, 'Owner user must exist for workspace tests');

  // Valid workspace
  const ws = new Workspace({ name: 'Team Alpha', owner: owner._id });
  await ws.save();

  assert.ok(ws._id, 'Workspace should be persisted');
  assert.strictEqual(ws.name, 'Team Alpha');
  assert.strictEqual(ws.owner.toString(), owner._id.to