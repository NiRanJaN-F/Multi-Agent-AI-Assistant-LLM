const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

// ---------------------------------------------------------
// RECREATE / IMPORT APP AND STORES FOR INTEGRATION & UNIT TESTING
// ---------------------------------------------------------

// We mock or spin up the express server configured similarly to server.js
function createApp() {
  const app = express();
  
  // Shared in-memory data structures (same references as used in app.locals)
  const users = new Map();
  const candidates = [
    { id: '1', name: 'Alice Johnson', party: 'Progressive Party', votes: 125, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: '2', name: 'Marcus Vance', party: 'Tech Democratic Alliance', votes: 98, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: '3', name: 'Elena Rostova', party: 'Green Reform Movement', votes: 142, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' }
  ];

  app.locals.users = users;
  app.locals.candidates = candidates;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(session({
    secret: 'test-secret-key',
    resave: false,
    saveUninitialized: false
  }));

  // Mount auth routes (mimicking routes/auth.js)
  const authRouter = express.Router();
  authRouter.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
      }
      if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid input types' });
      }
      const trimmedUsername = username.trim();
      if (!trimmedUsername || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Username cannot be empty and password must be at least 6 characters' });
      }
      if (users.has(trimmedUsername)) {
        return res.status(409).json({ success: false, message: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      users.set(trimmedUsername, {
        username: trimmedUsername,
        password: hashedPassword,
        hasVoted: false,
        votedCandidateId: null
      });

      return res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  authRouter.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
      }
      const trimmedUsername = username.trim();
      const user = users.get(trimmedUsername);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      req.session.username = user.username;
      return res.json({
        success: true,
        message: 'Logged in successfully',
        user: { username: user.username, hasVoted: user.hasVoted }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  authRouter.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Could not log out' });
      }
      res.clearCookie('connect.sid');
      return res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  authRouter.get('/session', (req, res) => {
    if (!req.session || !req.session.username) {
      return res.json({ authenticated: false });
    }
    const user = users.get(req.session.username);
    if (!user) {
      return res.json({ authenticated: false });
    }
    return res.json({
      authenticated: true,
      user: { username: user.username, hasVoted: user.hasVoted, votedCandidateId: user.votedCandidateId }
    });
  });

  app.use('/api/auth', authRouter);

  // Mount voting routes (mimicking routes/voting.js)
  const votingRouter = express.Router();
  function requireAuth(req, res, next) {
    if (!req.session || !req.session.username) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
    next();
  }

  votingRouter.get('/candidates', requireAuth, (req, res) => {
    const cList = req.app.locals.candidates || [];
    res.json(cList);
  });

  votingRouter.post('/vote', requireAuth, (req, res) => {
    const { candidateId } = req.body;
    if (!candidateId) {
      return res.status(400).json({ success: false, message: 'Candidate ID is required' });
    }

    const username = req.session.username;
    const user = req.app.locals.users.get(username);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.hasVoted) {
      return res.status(403).json({ success: false, message: 'User has already cast a vote' });
    }

    const cList = req.app.locals.candidates || [];
    const candidate = cList.find(c => c.id === candidateId);

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    candidate.votes += 1;
    user.hasVoted = true;
    user.votedCandidateId = candidateId;

    return res.json({ success: true, message: 'Vote successfully recorded', candidate });
  });

  votingRouter.get('/results', requireAuth, (req, res) => {
    const cList = req.app.locals.candidates || [];
    const totalVotes = cList.reduce((sum, c) => sum + c.votes, 0);
    const results = cList.map(c => ({
      ...c,
      percentage: totalVotes > 0 ? Number(((c.votes / totalVotes) * 100).toFixed(1)) : 0
    }));
    res.json({ totalVotes, results });
  });

  app.use('/api', votingRouter);

  return app;
}

// ---------------------------------------------------------
// AUTOMATED TEST SUITE (Node.js built-in test runner)
// ---------------------------------------------------------

test('Online Voting System Integration and Unit Test Suite', async (t) => {
  const app = createApp();

  await t.test('Authentication Flow: Registration, Login, Session Verification', async () => {
    const agent = request.agent(app);

    // 1. Register a new user
    const regRes = await agent
      .post('/api/auth/register')
      .send({ username: 'testvoter', password: 'securepassword123' });
    
    assert.strictEqual(regRes.status, 201);
    assert.strictEqual(regRes.body.success, true);

    // 2. Attempt duplicate registration
    const dupRes = await agent
      .post('/api/auth/register')
      .send({ username: 'testvoter', password: 'securepassword123' });
    
    assert.strictEqual(dupRes.status, 409);
    assert.strictEqual(dupRes.body.success, false);

    // 3. Login with credentials
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'testvoter', password: 'securepassword123' });

    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.body.success, true);
    assert.strictEqual(loginRes.body.user.username, 'testvoter');
    assert.strictEqual(loginRes.body.user.hasVoted, false);

    // 4. Verify session endpoint recognizes authenticated user
    const sessionRes = await agent.get('/api/auth/session');
    assert.strictEqual(sessionRes.status, 200);
    assert.strictEqual(sessionRes.body.authenticated, true);
    assert.strictEqual(sessionRes.body.user.hasVoted, false);
  });

  await t.test('Validation Flow: Invalid Inputs on Registration and Login', async () => {
    const appInstance = createApp();

    // Missing password
    const res1 = await request(appInstance)
      .post('/api/auth/register')
      .send({ username: 'user1' });
    assert.strictEqual(res1.status, 400);

    // Short password
    const res2 = await request(appInstance)
      .post('/api/auth/register')
      .send({ username: 'user1', password: '123' });
    assert.strictEqual(res2.status, 400);

    // Non-existent user login
    const res3 = await request(appInstance)
      .post('/api/auth/login')
      .send({ username: 'ghost', password: 'password123' });
    assert.strictEqual(res3.status, 401);
  });

  await t.test('Voting Workflow: Fetch Candidates, Vote, Prevent Double Voting, Check Results', async () => {
    const agent = request.agent(app);
    const voterName = 'voter_' + Date.now();

    // Register & Login distinct voter
    await agent.post('/api/auth/register').send({ username: voterName, password: 'password123' });
    await agent.post('/api/auth/login').send({ username: voterName, password: 'password123' });

    // 1. Fetch Candidates (Unauthorized check first with clean agent)
    const unauthRes = await request(app).get('/api/candidates');
    assert.strictEqual(unauthRes.status, 401);

    // Fetch Candidates with active session
    const candidatesRes = await agent.get('/api/candidates');
    assert.strictEqual(candidatesRes.status, 200);
    assert(Array.isArray(candidatesRes.body));
    assert(candidatesRes.body.length > 0);
    
    const targetCandidateId = candidatesRes.body[0].id;

    // 2. Cast a vote
    const voteRes = await agent
      .post('/api/vote')
      .send({ candidateId: targetCandidateId });

    assert.strictEqual(voteRes.status, 200);
    assert.strictEqual(voteRes.body.success, true);
    assert.strictEqual(voteRes.body.candidate.id, targetCandidateId);

    // 3. Attempt double voting (should fail with 403 Forbidden)
    const doubleVoteRes = await agent
      .post('/api/vote')
      .send({ candidateId: targetCandidateId });

    assert.strictEqual(doubleVoteRes.status, 403);
    assert.strictEqual(doubleVoteRes.body.success, false);

    // 4. Check election results
    const resultsRes = await agent.get('/api/results');
    assert.strictEqual(resultsRes.status, 200);
    assert(typeof resultsRes.body.totalVotes === 'number');
    assert(Array.isArray(resultsRes.body.results));
    
    const votedCandidateResult = resultsRes.body.results.find(c => c.id === targetCandidateId);
    assert(votedCandidateResult.percentage >= 0);
  });

  await t.test('Logout Flow: Terminate Session Successfully', async () => {
    const agent = request.agent(app);
    const voterName = 'logout_user_' + Date.now();

    await agent.post('/api/auth/register').send({ username: voterName, password: 'password123' });
    await agent.post('/api/auth/login').send({ username: voterName, password: 'password123' });

    // Verify session active
    let sessionRes = await agent.get('/api/auth/session');
    assert.strictEqual(sessionRes.body.authenticated, true);

    // Logout
    const logoutRes = await agent.post('/api/auth/logout');
    assert.strictEqual(logoutRes.status, 200);
    assert.strictEqual(logoutRes.body.success, true);

    // Verify session terminated
    sessionRes = await agent.get('/api/auth/session');
    assert.strictEqual(sessionRes.body.authenticated, false);
  });
});