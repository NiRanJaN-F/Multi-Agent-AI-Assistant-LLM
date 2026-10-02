/**
 * CyberSnake 2077 // Neon Arcade
 * public/js/game.js
 * Principal Software Engineer & Senior UI/UX Designer Implementation
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // DOM Elements
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  const currentScoreEl = document.getElementById('currentScore');
  const highScoreEl = document.getElementById('highScore');
  const levelEl = document.getElementById('level');
  const speedEl = document.getElementById('speed');

  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');

  // Overlays & Modals
  const startOverlay = document.getElementById('startOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const bigStartBtn = document.getElementById('bigStartBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const retryBtn = document.getElementById('retryBtn');

  const finalScoreEl = document.getElementById('finalScore');
  const finalHighScoreEl = document.getElementById('finalHighScore');
  const finalStatsEl = document.getElementById('finalStats');

  // Control Buttons (Mobile / Touch)
  const btnUp = document.getElementById('btnUp');
  const btnDown = document.getElementById('btnDown');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');

  // Header Toggles
  const soundToggle = document.getElementById('soundToggle');
  const themeToggle = document.getElementById('themeToggle');
  const helpBtn = document.getElementById('helpBtn');

  // Help Modal
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');

  // Game Settings & Constants
  const GRID_SIZE = 20; // 20x20 grid on a 600x600 canvas (each tile 30px)
  const TILE_SIZE = canvas.width / GRID_SIZE;

  // Themes
  const themes = [
    { name: 'Neon Emerald', head: '#10b981', body: '#059669', glow: '#34d399', food: '#f43f5e', special: '#fbbf24', poison: '#8b5cf6', grid: 'rgba(30, 41, 59, 0.3)' },
    { name: 'Cyberpunk Cyan', head: '#06b6d4', body: '#0284c7', glow: '#22d3ee', food: '#ec4899', special: '#facc15', poison: '#a855f7', grid: 'rgba(15, 23, 42, 0.4)' },
    { name: 'Matrix Amber', head: '#f59e0b', body: '#d97706', glow: '#fbbf24', food: '#10b981', special: '#3b82f6', poison: '#ef4444', grid: 'rgba(41, 37, 36, 0.3)' }
  ];
  let currentThemeIndex = 0;

  // Sound Engine (Web Audio API Synth FX)
  let soundEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
  }

  function playTone(freq, type, duration, vol = 0.1) {
    if (!soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Ignore audio context restrictions before user interaction
    }
  }

  const sounds = {
    eat: () => playTone(587.33, 'triangle', 0.12, 0.15), // D5
    eatSpecial: () => {
      playTone(880, 'sine', 0.1, 0.2);
      setTimeout(() => playTone(1174.66, 'sine', 0.15, 0.2), 80);
    },
    eatPoison: () => playTone(150, 'sawtooth', 0.25, 0.2),
    move: () => playTone(120, 'sine', 0.03, 0.02),
    gameOver: () => {
      playTone(200, 'sawtooth', 0.3, 0.25);
      setTimeout(() => playTone(130, 'sawtooth', 0.5, 0.25), 250);
    },
    click: () => playTone(440, 'sine', 0.05, 0.05)
  };

  // Game State Variables
  let snake = [];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let food = { x: 0, y: 0, type: 'normal' }; // types: normal, bonus, poison
  let specialFoodTimer = null;
  let specialFoodCountdown = 0;
  let obstacles = [];
  let score = 0;
  let highScore = localStorage.getItem('cybersnake_highscore') || 0;
  let level = 1;
  let speed = 120; // ms per frame
  let gameInterval = null;
  let gameStatus = 'START'; // START, RUNNING, PAUSED, GAMEOVER
  let foodsEaten = 0;
  let particles = [];

  // Initialize High Score Display
  if (highScoreEl) highScoreEl.textContent = highScore;

  // Particle Class for visual flair
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = Math.random() * 6 + 2;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.alpha = 1;
      this.decay = Math.random() * 0.03 + 0.02;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }
    draw(context) {
      context.save();
      context.globalAlpha = Math.max(0, this.alpha);
      context.fillStyle = this.color;
      context.beginPath();
      context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
  }

  function spawnParticles(gridX, gridY, color) {
    const px = gridX * TILE_SIZE + TILE_SIZE / 2;
    const py = gridY * TILE_SIZE + TILE_SIZE / 2;
    for (let i = 0; i < 12; i++) {
      particles.push(new Particle(px, py, color));
    }
  }

  // Reset Game State
  function resetGame() {
    snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    level = 1;
    speed = 120;
    foodsEaten = 0;
    particles = [];
    obstacles = [];

    updateScoreBoard();
    spawnFood();
  }

  function updateScoreBoard() {
    if (currentScoreEl) currentScoreEl.textContent = score;
    if (highScoreEl) highScoreEl.textContent = highScore;
    if (levelEl) levelEl.textContent = level;
    if (speedEl) speedEl.textContent = `${Math.round(1000 / speed)}t/s`;
  }

  // Food Generation
  function spawnFood() {
    let valid = false;
    let newX, newY, type = 'normal';

    // 15% chance for special bonus food if none present, 10% chance for poison at level 3+
    const rand = Math.random();
    if (rand < 0.15) {
      type = 'bonus';
    } else if (level >= 3 && rand < 0.25) {
      type = 'poison';
    }

    while (!valid) {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);

      valid = true;
      // Check collision with snake
      for (let part of snake) {
        if (part.x === newX && part.y === newY) {
          valid = false;
          break;
        }
      }
      // Check collision with obstacles
      for (let obs of obstacles) {
        if (obs.x === newX && obs.y === newY) {
          valid = false;
          break;
        }
      }
    }

    food = { x: newX, y: newY, type: type };

    // If bonus food, set timer to vanish after 7 seconds
    if (type === 'bonus') {
      if (specialFoodTimer) clearTimeout(specialFoodTimer);
      specialFoodTimer = setTimeout(() => {
        if (food.type === 'bonus' && gameStatus === 'RUNNING') {
          spawnFood(); // replace bonus food if ignored
        }
      }, 7000);
    }
  }

  // Level & Obstacle Progression
  function checkLevelProgression() {
    if (foodsEaten >= level * 5) {
      level++;
      speed = Math.max(50, speed - 12); // increase speed

      // Add obstacles based on level
      if (level >= 2) {
        generateObstacles();
      }

      updateScoreBoard();
    }
  }

  function generateObstacles() {
    obstacles = [];
    let count = (level - 1) * 3;
    for (let i = 0; i < count; i++) {
      let ox, oy, valid = false;
      while (!valid) {
        ox = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
        oy = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2;
        valid = true;

        // Do not spawn on snake or food or near snake head
        for (let part of snake) {
          if (Math.abs(part.x - ox) <= 2 && Math.abs(part.y - oy) <= 2) {
            valid = false;
            break;
          }
        }
        if (food.x === ox && food.y === oy) valid = false;
      }
      obstacles.push({ x: ox, y: oy });
    }
  }

  // Game Loop
  function gameLoop() {
    update();
    draw();
  }

  function update() {
    if (gameStatus !== 'RUNNING') return;

    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Wall Collision (Wrap around or Die? Let's make walls lethal for arcade challenge!)
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      triggerGameOver();
      return;
    }

    // Self Collision
    for (let part of snake) {
      if (head.x === part.x && head.y === part.y) {
        triggerGameOver();
        return;
      }
    }

    // Obstacle Collision
    for (let obs of obstacles) {
      if (head.x === obs.x && head.y === obs.y) {
        triggerGameOver();
        return;
      }
    }

    // Check Food Collision
    let ateFood = false;
    const currentTheme = themes[currentThemeIndex];

    if (head.x === food.x && head.y === food.y) {
      ateFood = true;
      foodsEaten++;

      if (food.type === 'normal') {
        score += 10 * level;
        sounds.eat();
        spawnParticles(food.x, food.y, currentTheme.food);
      } else if (food.type === 'bonus') {
        score += 50 * level;
        sounds.eatSpecial();
        spawnParticles(food.x, food.y, currentTheme.special);
      } else if (food.type === 'poison') {
        score = Math.max(0, score - 30);
        sounds.eatPoison();
        spawnParticles(food.x, food.y, currentTheme.poison);
        // Shrink snake penalty if possible
        if (snake.length > 3) {
          snake.pop();
          snake.pop();
        }
      }

      if (score > highScore) {
        highScore = score;
        localStorage.setItem('cybersnake_highscore', highScore);
      }

      checkLevelProgression();
      spawnFood();
      updateScoreBoard();
    }

    // Move snake
    snake.unshift(head);
    if (!ateFood) {
      snake.pop();
    } else {
      sounds.move();
    }
  }

  function draw() {
    if (!ctx) return;
    const currentTheme = themes[currentThemeIndex];

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Lines
    ctx.strokeStyle = currentTheme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * TILE_SIZE, 0);
      ctx.lineTo(i * TILE_SIZE, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * TILE_SIZE);
      ctx.lineTo(canvas.width, i * TILE_SIZE);
      ctx.stroke();
    }

    // Draw Obstacles
    ctx.fillStyle = '#334155';
    ctx.shadowColor = '#475569';
    ctx.shadowBlur = 8;
    for (let obs of obstacles) {
      ctx.fillRect(obs.x * TILE_SIZE + 2, obs.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    }
    ctx.shadowBlur = 0;

    // Draw Food
    let foodColor = currentTheme.food;
    if (food.type === 'bonus') foodColor = currentTheme.special;
    if (food.type === 'poison') foodColor = currentTheme.poison;

    ctx.save();
    ctx.shadowColor = foodColor;
    ctx.shadowBlur = 15;
    ctx.fillStyle = foodColor;
    ctx.beginPath();
    const fx = food.x * TILE_SIZE + TILE_SIZE / 2;
    const fy = food.y * TILE_SIZE + TILE_SIZE / 2;
    ctx.arc(fx, fy, TILE_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Snake
    snake.forEach((part, index) => {
      ctx.save();
      const isHead = index === 0;
      ctx.fillStyle = isHead ? currentTheme.head : currentTheme.body;
      ctx.shadowColor = currentTheme.glow;
      ctx.shadowBlur = isHead ? 15 : 6;

      const px = part.x * TILE_SIZE + 2;
      const py = part.y * TILE_SIZE + 2;
      const size = TILE_SIZE - 4;

      // Rounded corners for snake segments
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(px, py, size, size, isHead ? 8 : 4);
      } else {
        ctx.rect(px, py, size, size);
      }
      ctx.fill();

      // Eyes on head
      if (isHead) {
        ctx.fillStyle = '#ffffff';
        let eye1X = px + 8, eye1Y = py + 8;
        let eye2X = px + 18, eye2Y = py + 8;

        if (direction.x === 1) { eye1X = px + 20; eye1Y = py + 8; eye2X = px + 20; eye2Y = py + 20; }
        else if (direction.x === -1) { eye1X = px + 8; eye1Y = py + 8; eye2X = px + 8; eye2Y = py + 20; }
        else if (direction.y === 1) { eye1X = px + 8; eye1Y = py + 20; eye2X = px + 20; eye2Y = py + 20; }

        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, 3, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // Update and Draw Particles
    particles.forEach((p, index) => {
      p.update();
      p.draw(ctx);
      if (p.alpha <= 0) {
        particles.splice(index, 1);
      }
    });

    // Loop game interval if running
    if (gameStatus === 'RUNNING') {
      if (gameInterval) clearTimeout(gameInterval);
      gameInterval = setTimeout(gameLoop, speed);
    }
  }

  // Game Control Functions
  function startGame() {
    initAudio();
    if (startOverlay) startOverlay.classList.add('hidden');
    if (pauseOverlay) aussiHide(pauseOverlay);
    if (gameOverOverlay) gameOverOverlay.classList.add('hidden');

    resetGame();
    gameStatus = 'RUNNING';
    if (gameInterval) clearTimeout(gameInterval);
    gameLoop();
  }

  function pauseGame() {
    if (gameStatus === 'RUNNING') {
      gameStatus = 'PAUSED';
      if (pauseOverlay) pauseOverlay.classList.remove('hidden');
      if (gameInterval) clearTimeout(gameInterval);
      draw(); // redraw paused state
    }
  }

  function resumeGame() {
    if (gameStatus === 'PAUSED') {
      gameStatus = 'RUNNING';
      if (pauseOverlay) pauseOverlay.classList.add('hidden');
      gameLoop();
    }
  }

  function triggerGameOver() {
    gameStatus = 'GAMEOVER';
    sounds.gameOver();
    if (gameInterval) clearTimeout(gameInterval);

    if (finalScoreEl) finalScoreEl.textContent = score;
    if (finalHighScoreEl) finalHighScoreEl.textContent = highScore;
    if (finalStatsEl) finalStatsEl.textContent = `Level: ${level} | Foods: ${foodsEaten}`;

    if (gameOverOverlay) gameOverOverlay.classList.remove('hidden');
  }

  function aussiHide(el) {
    if (el) el.classList.add('hidden');
  }

  // Event Listeners for Controls
  if (startBtn) startBtn.addEventListener('click', () => { sounds.click(); startGame(); });
  if (bigStartBtn) bigStartBtn.addEventListener('click', () => { sounds.click(); startGame(); });
  if (pauseBtn) pauseBtn.addEventListener('click', () => {
    sounds.click();
    if (gameStatus === 'RUNNING') pauseGame();
    else if (gameStatus === 'PAUSED') resumeGame();
  });
  if (resumeBtn) resumeBtn.addEventListener('click', () => { sounds.click(); resumeGame(); });
  if (retryBtn) retryBtn.addEventListener('click', () => { sounds.click(); startGame(); });
  if (restartBtn) restartBtn.addEventListener('click', () => { sounds.click(); startGame(); });

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    // Prevent arrow keys and space from scrolling the page
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
      if (gameStatus === 'RUNNING') pauseGame();
      else if (gameStatus === 'PAUSED') resumeGame();
      return;
    }

    if (gameStatus !== 'RUNNING') return;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (direction.y === 0) nextDirection = { x: 0, y: -1 };
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (direction.y === 0) nextDirection = { x: 0, y: 1 };
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (direction.x === 0) nextDirection = { x: -1, y: 0 };
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (direction.x === 0) nextDirection = { x: 1, y: 0 };
        break;
    }
  });

  // Touch / On-screen D-Pad controls
  if (btnUp) btnUp.addEventListener('click', () => { if (direction.y === 0) nextDirection = { x: 0, y: -1 }; });
  if (btnDown) btnDown.addEventListener('click', () => { if (direction.y === 0) nextDirection = { x: 0, y: 1 }; });
  if (btnLeft) btnLeft.addEventListener('click', () => { if (direction.x === 0) nextDirection = { x: -1, y: 0 }; });
  if (btnRight) btnRight.addEventListener('click', () => { if (direction.x === 0) nextDirection = { x: 1, y: 0 }; });

  // Header Utility Toggles
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundToggle.classList.toggle('text-emerald-400', soundEnabled);
      soundToggle.classList.toggle('text-slate-500', !soundEnabled);
      sounds.click();
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentThemeIndex = (currentThemeIndex + 1) % themes.length;
      sounds.click();
      if (gameStatus !== 'RUNNING') draw();
    });
  }

  if (helpBtn && helpModal) {
    helpBtn.addEventListener('click', () => {
      sounds.click();
      helpModal.classList.remove('hidden');
    });
  }

  if (closeHelpBtn && helpModal) {
    closeHelpBtn.addEventListener('click', () => {
      sounds.click();
      helpModal.classList.add('hidden');
    });
  }

  // Initial draw of empty board on startup
  resetGame();
  draw();
});