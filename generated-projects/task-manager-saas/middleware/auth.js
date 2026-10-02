const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required. No token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token.' 
      });
    }

    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found.' 
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication failed.' 
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return next();
    }

    const user = await User.findById(decoded.userId);
    
    if (user) {
      req.user = user;
      req.userId = user.id;
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};

const authorizeWorkspace = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.params.id;
    
    if (!workspaceId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Workspace ID required.' 
      });
    }

    const Workspace = require('../models/Workspace');
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ 
        success: false, 
        error: 'Workspace not found.' 
      });
    }

    const isMember = workspace.members.some(
      member => member.userId.toString() === req.userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Not a member of this workspace.' 
      });
    }

    req.workspace = workspace;
    next();
  } catch (error) {
    console.error('Workspace authorization error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authorization failed.' 
    });
  }
};

const authorizeBoard = async (req, res, next) => {
  try {
    const boardId = req.params.boardId || req.params.id;
    
    if (!boardId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Board ID required.' 
      });
    }

    const Board = require('../models/Board');
    const board = await Board.findById(boardId).populate('workspaceId');
    
    if (!board) {
      return res.status(404).json({ 
        success: false, 
        error: 'Board not found.' 
      });
    }

    const Workspace = require('../models/Workspace');
    const workspace = await Workspace.findById(board.workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ 
        success: false, 
        error: 'Associated workspace not found.' 
      });
    }

    const isMember = workspace.members.some(
      member => member.userId.toString() === req.userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Not a member of this workspace.' 
      });
    }

    req.board = board;
    req.workspace = workspace;
    next();
  } catch (error) {
    console.error('Board authorization error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authorization failed.' 
    });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  authorizeWorkspace,
  authorizeBoard,
  JWT_SECRET,
  JWT_EXPIRES_IN
};