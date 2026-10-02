const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, existingUser) => {
            if (err) {
                return res.status(500).json({ error: 'Database error during user lookup' });
            }

            if (existingUser) {
                return res.status(400).json({ error: 'Username is already taken' });
            }

            try {
                const hashedPassword = await bcrypt.hash(password, 10);

                db.run(
                    'INSERT INTO users (username, password) VALUES (?, ?)',
                    [username, hashedPassword],
                    function (insertErr) {
                        if (insertErr) {
                            return res.status(500).json({ error: 'Failed to create user' });
                        }

                        const userId = this.lastID;
                        const user = { id: userId, username };
                        const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });

                        // Automatically create a default personal workspace for the new user
                        db.run(
                            'INSERT INTO workspaces (name, owner_id) VALUES (?, ?)',
                            [`${username}'s Workspace`, userId],
                            (wsErr) => {
                                if (wsErr) {
                                    console.error('Failed to create default workspace:', wsErr.message);
                                }
                            }
                        );

                        return res.status(201).json({ token, user });
                    }
                );
            } catch (hashError) {
                return res.status(500).json({ error: 'Error processing password securely' });
            }
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error during login' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const tokenPayload = { id: user.id, username: user.username };
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

            return res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username
                }
            });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;