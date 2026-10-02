const express = require('express');
const router = express.Router();

// In-memory data structures shared with auth.js via app locals or global references.
// To keep things robust, we access them via req.app.locals which are initialized in server.js.

// Middleware to ensure user is authenticated
function requireAuth(req, res, next) {
    if (!req.session || !req.session.username) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
    next();
}

// GET /api/candidates - Retrieve candidate listings
router.get('/candidates', requireAuth, (req, res) => {
    const candidates = req.app.locals.candidates || [];
    res.json(candidates);
});

// POST /api/vote - Submit a vote for a candidate
router.post('/vote', requireAuth, (req, res) => {
    const { candidateId } = req.body;
    const username = req.session.username;

    if (!candidateId) {
        return res.status(400).json({ success: false, message: 'Candidate ID is required.' });
    }

    const users = req.app.locals.users;
    const candidates = req.app.locals.candidates;
    const votes = req.app.locals.votes;

    // Validate user exists and hasn't voted yet
    const user = users.get(username);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.hasVoted) {
        return res.status(400).json({ success: false, message: 'You have already cast your vote.' });
    }

    // Validate candidate exists
    const candidateExists = candidates.some(c => c.id === candidateId);
    if (!candidateExists) {
        return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    // Record the vote
    user.hasVoted = true;
    votes.set(candidateId, (votes.get(candidateId) || 0) + 1);

    // Update session state
    req.session.hasVoted = true;

    return res.json({ success: true, message: 'Vote recorded successfully' });
});

// GET /api/results - Retrieve live results dashboard data
router.get('/results', requireAuth, (req, res) => {
    const candidates = req.app.locals.candidates || [];
    const votes = req.app.locals.votes || new Map();

    const results = candidates.map(candidate => ({
        candidateId: candidate.id,
        name: candidate.name,
        votes: votes.get(candidate.id) || 0
    }));

    res.json(results);
});

module.exports = router;