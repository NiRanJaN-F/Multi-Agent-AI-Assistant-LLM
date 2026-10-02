// routes/workspaces.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const auth = require('../middleware/auth');
const Workspace = require('../models/Workspace');
const Board = require('../models/Board');
const User = require('../models/User');

// Utility: send error response
const handleError = (res, err) => {
  console.error(err);
  return res.status(500).json({ success: false, message: 'Server error' });
};

/**
 * GET /api/workspaces
 * Return workspaces the authenticated user belongs to
 */
router.get('/', auth, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ members: req.user.id })
      .select('_id name')
      .lean();

    res.json({ workspaces: workspaces.map(w => ({ id: w._id, name: w.name })) });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /api/workspaces
 * Create a new workspace; creator becomes first member
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Workspace name is required' });
    }

    const workspace = new Workspace({
      name: name.trim(),
      members: [req.user.id],
    });

    await workspace.save();

    res.status(201).json({
      success: true,
      workspace: { id: workspace._id, name: workspace.name },
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/workspaces/:id
 * Get workspace details including members
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid workspace id' });
    }

    const workspace = await Workspace.findById(id)
      .populate('members', 'name email')
      .lean();

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Ensure the requester is a member
    if (!workspace.members.some(m => m._id.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      workspace: {
        id: workspace._id,
        name: workspace.name,
        members: workspace.members.map(m => ({
          id: m._id,
          name: m.name,
          email: m.email,
        })),
      },
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * PUT /api/workspaces/:id
 * Update workspace name (only members can edit)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid workspace id' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Workspace name is required' });
    }

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Authorization check
    if (!workspace.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    workspace.name = name.trim();
    await workspace.save();

    res.json({
      success: true,
      workspace: { id: workspace._id, name: workspace.name },
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * DELETE /api/workspaces/:id
 * Delete a workspace (only members can delete)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid workspace id' });
    }

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Authorization check
    if (!workspace.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Cascade delete boards belonging to this workspace
    await Board.deleteMany({ workspace: workspace._id });

    await workspace.remove();

    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /api/workspaces/:workspaceId/boards
 * List boards for a workspace
 */
router.get('/:workspaceId/boards', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({ success: false, message: 'Invalid workspace id' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Authorization check
    if (!workspace.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const boards = await Board.find({ workspace: workspaceId })
      .select('_id title')
      .lean();

    res.json({
      boards: boards.map(b => ({ id: b._id, title: b.title })),
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /api/workspaces/:workspaceId/boards
 * Create a new board inside a workspace
 */
router.post('/:workspaceId/boards', auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title } = req.body;

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({ success: false, message: 'Invalid workspace id' });
    }
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Board title is required' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Authorization check
    if (!workspace.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const board = new Board({
      title: title.trim(),
      workspace: workspaceId,
      // Assuming default columns are set in Board schema pre-save hook or similar
    });

    await board.save();

    res.status(201).json({
      success: true,
      board: { id: board._id, title: board.title },
    });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;