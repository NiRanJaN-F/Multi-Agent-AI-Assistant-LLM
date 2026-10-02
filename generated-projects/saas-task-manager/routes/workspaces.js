const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// GET /api/workspaces - Get all workspaces for the authenticated user
router.get('/', auth, (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch workspaces owned by user or where user is a member
        const query = `
            SELECT DISTINCT w.* FROM workspaces w
            LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
            WHERE w.owner_id = ? OR wm.user_id = ?
        `;
        
        db.all(query, [userId, userId], (err, workspaces) => {
            if (err) {
                console.error('Database error fetching workspaces:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json(workspaces || []);
        });
    } catch (error) {
        console.error('Error in GET /api/workspaces:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/workspaces - Create a new workspace
router.post('/', auth, (req, res) => {
    try {
        const { name } = req.body;
        const ownerId = req.user.id;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Workspace name is required' });
        }

        const trimmedName = name.trim();

        db.run(
            'INSERT INTO workspaces (name, owner_id) VALUES (?, ?)',
            [trimmedName, ownerId],
            function (err) {
                if (err) {
                    console.error('Database error creating workspace:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                const newWorkspaceId = this.lastID;

                // Also add the owner as a member in workspace_members for good measure
                db.run(
                    'INSERT OR IGNORE INTO workspace_members (workspace_id, user_id) VALUES (?, ?)',
                    [newWorkspaceId, ownerId],
                    (memberErr) => {
                        if (memberErr) {
                            console.error('Error adding owner to workspace_members:', memberErr);
                        }

                        res.status(201).json({
                            id: newWorkspaceId,
                            name: trimmedName,
                            owner_id: ownerId
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error in POST /api/workspaces:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;