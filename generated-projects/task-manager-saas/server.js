/**
 * server.js
 * Main entry point for the SaaS task management backend.
 * Sets up Express, connects to the database, registers routes,
 * configures middleware, error handling and real‑time updates via Socket.IO.
 */

require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server: SocketIOServer } = require('socket.io');

// Import DB connection
const connectDB = require('./config/db');

// Import route modules
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const boardRoutes = require('./routes/boards');
const cardRoutes = require('./routes/cards');

// Import auth middleware (used for protecting socket connections)
const { verifyTokenSocket } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

/* -------------------------------------------------
   Database
------------------------------------------------- */
connectDB()
  .then(() => console.log('✅ Database connected'))
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });

/* -------------------------------------------------
   Global Middleware
------------------------------------------------- */
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/* -------------------------------------------------
   Static Files (frontend assets)
------------------------------------------------- */
app.use(express.static(path.join(__dirname, 'public')));

/* -------------------------------------------------
   Socket.IO – attach to request objects
------------------------------------------------- */
io.use((socket, next) => {
  // Expect token in query string: ?token=...
  const token = socket.handshake.query.token;
  if (!token) return next(new Error('Authentication error'));

  verifyTokenSocket(token)
    .then((payload) => {
      socket.user = payload; // attach decoded payload
      next();
    })
    .catch(() => next(new Error('Authentication error')));
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id} (user ${socket.user.id})`);

  // Join personal room for direct notifications
  socket.join(`user_${socket.user.id}`);

  socket.on('joinWorkspace', (workspaceId) => {
    socket.join(`workspace_${workspaceId}`);
  });

  socket.on('leaveWorkspace', (workspaceId) => {
    socket.leave(`workspace_${workspaceId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

/* -------------------------------------------------
   Make io accessible in request handlers
------------------------------------------------- */
app.use((req, res, next) => {
  req.io = io;
  next();
});

/* -------------------------------------------------
   Routes
------------------------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/cards', cardRoutes);

/* -------------------------------------------------
   Health Check
------------------------------------------------- */
app.get('/health', (req, res) => res.json({ status: 'ok' }));

/* -------------------------------------------------
   404 Handler
------------------------------------------------- */
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

/* -------------------------------------------------
   Global Error Handler
------------------------------------------------- */
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, message });
});

/* -------------------------------------------------
   Server Start
------------------------------------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});