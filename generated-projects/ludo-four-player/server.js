const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Ludo Game State Management
const rooms = {};

/*
  Room State Structure:
  {
    roomId: {
      players: [
        { id: socket.id, name: 'Player 1', color: 'red', index: 0 },
        ...
      ],
      boardState: { ... },
      currentTurn: 0, // index in players array
      diceValue: null,
      diceRolled: false,
      gameStarted: false,
      status: 'waiting' // waiting, playing, finished
    }
  }
*/

const COLORS = ['red', 'green', 'yellow', 'blue'];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create or Join Room
  socket.on('join-room', ({ roomId, playerName }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        roomId,
        players: [],
        currentTurn: 0,
        diceValue: null,
        diceRolled: false,
        gameStarted: false,
        status: 'waiting',
        tokens: {
          red: [ {id: 0, step: -1}, {id: 1, step: -1}, {id: 2, step: -1}, {id: 3, step: -1} ],
          green: [ {id: 0, step: -1}, {id: 1, step: -1}, {id: 2, step: -1}, {id: 3, step: -1} ],
          yellow: [ {id: 0, step: -1}, {id: 1, step: -1}, {id: 2, step: -1}, {id: 3, step: -1} ],
          blue: [ {id: 0, step: -1}, {id: 1, step: -1}, {id: 2, step: -1}, {id: 3, step: -1} ]
        },
        rankings: []
      };
    }

    const room = rooms[roomId];

    // Check if player already in room
    let player = room.players.find(p => p.id === socket.id);
    if (!player && room.players.length < 4 && !room.gameStarted) {
      const assignedColor = COLORS[room.players.length];
      player = {
        id: socket.id,
        name: playerName || `Player ${room.players.length + 1}`,
        color: assignedColor,
        index: room.players.length
      };
      room.players.push(player);
    }

    // Broadcast room update
    io.to(roomId).emit('room-update', room);
  });

  // Start Game
  socket.on('start-game', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.players.length >= 2) {
      room.gameStarted = true;
      room.status = 'playing';
      io.to(roomId).emit('game-started', room);
    }
  });

  // Roll Dice
  socket.on('roll-dice', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    const currentPlayer = room.players[room.currentTurn];
    if (currentPlayer.id !== socket.id) return; // Not your turn
    if (room.diceRolled) return; // Already rolled this turn

    const diceVal = Math.floor(Math.random() * 6) + 1;
    room.diceValue = diceVal;
    room.diceRolled = true;

    // Check if player has any valid moves
    const validMoves = getValidMoves(room, currentPlayer.color, diceVal);

    io.to(roomId).emit('dice-rolled', {
      diceValue: diceVal,
      color: currentPlayer.color,
      validMoves
    });

    // If no valid moves, auto pass turn after short delay
    if (validMoves.length === 0) {
      setTimeout(() => {
        nextTurn(roomId);
      }, 1500);
    }
  });

  // Move Token
  socket.on('move-token', ({ roomId, color, tokenId, step }) => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    const currentPlayer = room.players[room.currentTurn];
    if (currentPlayer.color !== color) return;

    const token = room.tokens[color].find(t => t.id === tokenId);
    if (!token) return;

    // Update token position logic
    const oldStep = token.step;
    let newStep;

    if (oldStep === -1) {
      // Must roll 6 to get out of base
      if (room.diceValue === 6) {
        newStep = 0; // Starting index on main track
      } else {
        return; // Invalid move
      }
    } else {
      newStep = oldStep + room.diceValue;
      if (newStep > 56) {
        newStep = oldStep; // Can't overshoot home stretch exactly without precise roll if implemented, simplified here
      }
    }

    token.step = newStep;

    // Check captures, home arrivals, etc.
    handleCollisionsAndWin(room, color, tokenId, newStep);

    // Check if player rolled a 6, get another turn. Otherwise next turn.
    let extraTurn = false;
    if (room.diceValue === 6) {
      extraTurn = true;
    }

    room.diceRolled = false;
    room.diceValue = null;

    if (!extraTurn) {
      room.currentTurn = (room.currentTurn + 1) % room.players.length;
    }

    io.to(roomId).emit('board-updated', room);
  });

  // Chat message
  socket.on('send-chat', ({ roomId, playerName, message, color }) => {
    io.to(roomId).emit('receive-chat', { playerName, message, color });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('room-update', room);
        }
        break;
      }
    }
  });
});

// Helper: Get Valid Moves
function getValidMoves(room, color, diceVal) {
  const tokens = room.tokens[color];
  const valid = [];

  tokens.forEach(token => {
    if (token.step === -1) {
      if (diceVal === 6) {
        valid.push(token.id);
      }
    } else if (token.step < 57) {
      if (token.step + diceVal <= 56) {
        valid.push(token.id);
      }
    }
  });

  return valid;
}

// Helper: Handle Collisions & Win Condition
function handleCollisionsAndWin(room, color, tokenId, newStep) {
  // Simplified placeholder for collision detection and sending back to base
  // Full board coordinate mapping handled on client side layout renderer
  const tokens = room.tokens[color];
  const finishedCount = tokens.filter(t => t.step === 56).length;
  if (finishedCount === 4 && !room.rankings.includes(color)) {
    room.rankings.push(color);
  }
}

// Helper: Next Turn
function nextTurn(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  room.diceRolled = false;
  room.diceValue = null;
  room.currentTurn = (room.currentTurn + 1) % room.players.length;
  io.to(roomId).emit('board-updated', room);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Ludo Royal Server running on http://localhost:${PORT}`);
});