// routes/boards.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Board = require('../models/Board');
const Card = require('../models/Card');
const Workspace = require('../models/Workspace');

// Middleware to ensure user is authenticated
router.use(auth);

// Helper to validate ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

/**
 * GET /api/workspaces/:workspaceId/boards
 * List all boards in a workspace
 */
router.get('/workspaces/:workspaceId/boards', async (req, res) => {
  const { workspaceId } = req.params;
  if (!isValidObjectId(workspaceId)) {
    return res.status(400).json({ success: false, message: 'Invalid workspace ID' });
  }
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }
    // Optional: check membership
    if (!workspace.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const boards = await Board.find({ workspace: workspaceId }).select('id title');
    res.json({ boards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/workspaces/:workspaceId/boards
 * Create a new board in a workspace
 */
router.post('/workspaces/:workspaceId/boards', async (req, res) => {
  const { workspaceId } = req.params;
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  if (!isValidObjectId(workspaceId)) {
    return res.status(400).json({ success: false, message: 'Invalid workspace ID' });
  }
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }
    if (!workspace.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const board = new Board({
      title,
      workspace: workspaceId,
      columns: ['To Do', 'In Progress', 'Done'],
    });
    await board.save();
    res.json({ success: true, board: { id: board.id, title: board.title } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/boards/:boardId
 * Get board details with columns
 */
router.get('/boards/:boardId', async (req, res) => {
  const { boardId } = req.params;
  if (!isValidObjectId(boardId)) {
    return res.status(400).json({ success: false, message: 'Invalid board ID' });
  }
  try {
    const board = await Board.findById(boardId).select('id title columns');
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    // Optional: check workspace membership
    const workspace = await Workspace.findById(board.workspace);
    if (!workspace.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ board: { id: board.id, title: board.title, columns: board.columns } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/boards/:boardId
 * Update board title
 */
router.put('/boards/:boardId', async (req, res) => {
  const { boardId } = req.params;
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  if (!isValidObjectId(boardId)) {
    return res.status(400).json({ success: false, message: 'Invalid board ID' });
  }
  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    const workspace = await Workspace.findById(board.workspace);
    if (!workspace.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    board.title = title;
    await board.save();
    res.json({ success: true, board: { id: board.id, title: board.title } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/boards/:boardId
 * Delete a board and its cards
 */
router.delete('/boards/:boardId', async (req, res) => {
  const { boardId } = req.params;
  if (!isValidObjectId(boardId)) {
    return res.status(400).json({ success: false, message: 'Invalid board ID' });
  }
  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    const workspace = await Workspace.findById(board.workspace);
    if (!workspace.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await Card.deleteMany({ board: boardId });
    await board.remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/boards/:boardId/cards
 * List all cards in a board
 */
router.get('/boards/:boardId/cards', async (req, res) => {
  const { boardId } = req.params;
  if (!isValidObjectId(boardId)) {
    return res.status(400).json({ success: false, message: 'Invalid board ID' });
  }
  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    const workspace = await Workspace.findById(board.workspace);
    if (!workspace.members.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const