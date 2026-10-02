const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for SPA routing if needed
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` 🎮 Arcade Snake Game Server is running!           `);
  console.log(` 🚀 Local: http://localhost:${PORT}                `);
  console.log(`==================================================`);
});