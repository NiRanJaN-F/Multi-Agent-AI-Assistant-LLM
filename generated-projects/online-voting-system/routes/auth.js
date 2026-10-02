const express = require('express');
const bcrypt = require('bcryptjs');
const { users } = require('../server');

const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
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
      return res.status(400).json({ 
        success: false, 
        message: 'Username cannot be empty and password must be at least 6 characters' 
      });
    }

    if (users.has(trimmedUsername)) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    users.set(trimmedUsername, {
      username: trimmedUsername,
      password: hashedPassword,
      hasVoted: false,
      votedFor: null
    });

    return res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    req.session.username = user.username;
    return res.json({ success: true, message: 'Logged in successfully' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Could not log out, please try again' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Session Check Route
router.get('/session', (req, res) => {
  if (!req.session || !req.session.username) {
    return res.json({ authenticated: false });
  }

  const user = users.get(req.session.username);
  if (!user) {
    req.session.destroy();
    return res.json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    username: user.username,
    hasVoted: user.hasVoted
  });
});

module.exports = router;