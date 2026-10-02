const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback route for SPA (Single Page Application) behavior
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🎮 Retro Snake Arcade Server is running!`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`==================================================`);
});