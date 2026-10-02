const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// Helper to get WebSocket broadcast function if attached to app
const getWss = (req) => req.app.get('wss');

const broadcastWorkspaceUpdate = (req, workspaceId, event, data) => {
    const wss = getWss(req);
    if (wss && wss.clients) {
        wss.clients.forEach(client => {
            if (client.workspaceId === parseInt(workspaceId) && client.readyState === 1) { // WebSocket.OPEN is 1
                client.send(JSON.stringify({ event, data }));
            }
        });
    }
};

// Helper middleware to verify workspace membership
const verifyWorkspaceAccess = (req, res, next) => {
    const workspaceId = req.params.id || req.body.workspace_id;
    if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID is required' });
    }

    db.get(
        `SELECT * FROM workspaces WHERE id = ? AND (owner_id = ? OR id IN (SELECT workspace_id FROM workspace_members WHERE user_id = ?))`,
        [workspaceId, req.user.id, req.user.id],
        (err, workspace) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!workspace) {
                return res.status(403).json({ error: 'Access denied to workspace' });
            }
            req.workspace = workspace;
            next();
        }
    );
};

// GET /api/workspaces/:id/tasks
router.get('/workspaces/:id/tasks', auth, verifyWorkspaceAccess, (req, res) => {
    const workspaceId = req.params.id;

    db.all(
        `SELECT * FROM tasks WHERE workspace_id = ? ORDER BY created_at DESC`,
        [workspaceId],
        (err, tasks) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch tasks' });
            }
            res.json(tasks);
        }
    );
});

// POST /api/workspaces/:id/tasks
router.post('/workspaces/:id/tasks', auth, verifyWorkspaceAccess, (req, res) => {
    const workspaceId = req.params.id;
    const { title, description, status } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Task title is required' });
    }

    const taskStatus = status || 'todo';
    const taskDesc = description || '';

    db.run(
        `INSERT INTO tasks (workspace_id, title, description, status) VALUES (?, ?, ?, ?)`,
        [workspaceId, title, taskDesc, taskStatus],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create task' });
            }

            const newTask = {
                id: this.lastID,
                workspace_id: parseInt(workspaceId),
                title,
                description: taskDesc,
                status: taskStatus
            };

            broadcastWorkspaceUpdate(req, workspaceId, 'TASK_CREATED', newTask);
            res.status(201).json(newTask);
        }
    );
});

// PUT /api/tasks/:id
router.put('/tasks/:id', auth, (req, res) => {
    const taskId = req.params.id;
    const { title, description, status } = req.body;

    // First fetch the task to find its workspace and verify membership
    db.get(`SELECT * FROM tasks WHERE id = ?`, [taskId], (err, task) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Verify user has access to task's workspace
        db.get(
            `SELECT * FROM workspaces WHERE id = ? AND (owner_id = ? OR id IN (SELECT workspace_id FROM workspace_members WHERE user_id = ?))`,
            [task.workspace_id, req.user.id, req.user.id],
            (err, workspace) => {
                if (err || !workspace) {
                    return res.status(403).json({ error: 'Access denied' });
                }

                const updatedTitle = title !== undefined ? title : task.title;
                const updatedDesc = description !== undefined ? description : task.description;
                const updatedStatus = status !== undefined ? status : task.status;

                db.run(
                    `UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?`,
                    [updatedTitle, updatedDesc, updatedStatus, taskId],
                    function (err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to update task' });
                        }

                        const updatedTask = {
                            id: parseInt(taskId),
                            workspace_id: task.workspace_id,
                            title: updatedTitle,
                            description: updatedDesc,
                            status: updatedStatus
                        };

                        broadcastWorkspaceUpdate(req, task.workspace_id, 'TASK_UPDATED', updatedTask);
                        res.json({ success: true, task: updatedTask });
                    }
                );
            }
        );
    });
});

// DELETE /api/tasks/:id
router.delete('/tasks/:id', auth, (req, res) => {
    const taskId = req.params.id;

    db.get(`SELECT * FROM tasks WHERE id = ?`, [taskId], (err, task) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        db.get(
            `SELECT * FROM workspaces WHERE id = ? AND (owner_id = ? OR id IN (SELECT workspace_id FROM workspace_members WHERE user_id = ?))`,
            [task.workspace_id, req.user.id, req.user.id],
            (err, workspace) => {
                if (err || !workspace) {
                    return res.status(403).json({ error: 'Access denied' });
                }

                db.run(`DELETE FROM tasks WHERE id = ?`, [taskId], function (err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to delete task' });
                    }

                    broadcastWorkspaceUpdate(req, task.workspace_id, 'TASK_DELETED', { id: parseInt(taskId) });
                    res.json({ success: true });
                });
            }
        );
    });
});

module.exports = router;