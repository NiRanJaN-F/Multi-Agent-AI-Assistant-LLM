// ==========================================
// RETRO SNAKE ARCADE - GAME ENGINE
// ==========================================

class SoundFX {
    constructor() {
        this.enabled = true;
        this.audioCtx = null;
    }

    init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playTone(frequency, duration, type = 'square', vol = 0.1) {
        if (!this.enabled) return;
        try {
            this.init();
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
            
            gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            
            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('Audio play failed', e);
        }
    }

    eat() {
        this.playTone(587.33, 0.08, 'square', 0.15); // D5
        setTimeout(() => this.playTone(880, 0.12, 'square', 0.15), 60); // A5
    }

    powerup() {
        this.playTone(440, 0.1, 'triangle', 0.2);
        setTimeout(() => this.playTone(554.37, 0.1, 'triangle', 0.2), 80);
        setTimeout(() => this.playTone(659.25, 0.15, 'triangle', 0.2), 160);
    }

    gameOver() {
        this.playTone(150, 0.2, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(120, 0.3, 'sawtooth', 0.2), 150);
        setTimeout(() => this.playTone(80, 0.5, 'sawtooth', 0.3), 300);
    }

    move() {
        this.playTone(120, 0.03, 'sine', 0.03);
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    spawn(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                decay: Math.random() * 0.03 + 0.02,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        for (let p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.restore();
    }
}

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas') || document.getElementById('game-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // Grid setup
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;

        // Sound & FX
        this.sound = new SoundFX();
        this.particles = new ParticleSystem();

        // Game state
        this.snake = [];
        this.dx = 1;
        this.dy = 0;
        this.nextDx = 1;
        this.nextDy = 0;
        this.food = { x: 0, y: 0, type: 'normal', color: '#10b981' };
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snake_high_score') || '0', 10);
        this.speed = 4;
        this.isPlaying = false;
        this.isPaused = false;
        this.gameInterval = null;
        this.lastTime = 0;

        this.initDOM();
        this.initListeners();
        this.renderStartScreen();
    }

    initDOM() {
        this.scoreEl = document.getElementById('current-score');
        this.highScoreEl = document.getElementById('high-score');
        this.startBtn = document.getElementById('start-game-btn') || document.getElementById('start-btn');
        this.overlay = document.getElementById('game-overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlaySubtitle = document.getElementById('overlay-subtitle');
        this.statusBadge = document.getElementById('game-status-badge');
        this.soundToggleBtn = document.getElementById('sound-toggle');

        const infoBtn = document.getElementById('info-btn');
        const infoModal = document.getElementById('info-modal');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const modalGotIt = document.getElementById('modal-got-it');

        if (infoBtn && infoModal) {
            infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
        }
        if (closeModalBtn && infoModal) {
            closeModalBtn.addEventListener('click', () => infoModal.classList.add('hidden'));
        }
        if (modalGotIt && infoModal) {
            modalGotIt.addEventListener('click', () => infoModal.classList.add('hidden'));
        }

        if (this.highScoreEl) this.highScoreEl.textContent = this.highScore.toString().padStart(6, '0');
        if (this.scoreEl) this.scoreEl.textContent = '000000';
    }

    initListeners() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startGame();
            });
        }
        if (this.canvas) {
            this.canvas.addEventListener('click', () => {
                if (!this.isPlaying) this.startGame();
            });
        }
        if (this.soundToggleBtn) {
            this.soundToggleBtn.addEventListener('click', () => {
                this.sound.enabled = !this.sound.enabled;
                this.soundToggleBtn.classList.toggle('text-emerald-400', this.sound.enabled);
                this.soundToggleBtn.classList.toggle('text-slate-500', !this.sound.enabled);
            });
        }

        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.dy === 0) { this.nextDx = 0; this.nextDy = -1; }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.dy === 0) { this.nextDx = 0; this.nextDy = 1; }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.dx === 0) { this.nextDx = -1; this.nextDy = 0; }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.dx === 0) { this.nextDx = 1; this.nextDy = 0; }
                    break;
                case ' ':
                    if (this.isPlaying) this.togglePause();
                    else this.startGame();
                    break;
            }
        });
    }

    startGame() {
        this.sound.init();
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.dx = 1;
        this.dy = 0;
        this.nextDx = 1;
        this.nextDy = 0;
        this.score = 0;
        this.updateScoreDisplay();
        this.spawnFood();
        this.isPlaying = true;
        this.isPaused = false;
        if (this.overlay) this.overlay.classList.add('hidden');
        if (this.statusBadge) {
            this.statusBadge.textContent = 'PLAYING (SPEED 1X)';
            this.statusBadge.className = 'px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs';
        }
        this.restartLoop();
    }

    restartLoop() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        const intervalTime = Math.max(50, 200 - (this.speed * 25));
        this.gameInterval = setInterval(() => this.gameLoop(), intervalTime);
    }

    togglePause() {
        if (!this.isPlaying) return;
        this.isPaused = !this.isPaused;
        if (this.pauseBtn) this.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
    }

    spawnFood() {
        let valid = false;
        while (!valid) {
            this.food.x = Math.floor(Math.random() * this.tileCount);
            this.food.y = Math.floor(Math.random() * this.tileCount);
            valid = !this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
        }
        
        // Random food types
        const rand = Math.random();
        if (rand < 0.15) {
            this.food.type = 'golden';
            this.food.color = '#f59e0b';
        } else if (rand < 0.3) {
            this.food.type = 'speed';
            this.food.color = '#3b82f6';
        } else {
            this.food.type = 'normal';
            this.food.color = '#10b981';
        }
    }

    gameLoop() {
        if (!this.isPlaying || this.isPaused) return;

        this.dx = this.nextDx;
        this.dy = this.nextDy;

        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        // Wall collision check
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Self collision check
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            let points = 10;
            if (this.food.type === 'golden') {
                points = 30;
                this.sound.powerup();
            } else if (this.food.type === 'speed') {
                points = 20;
                this.sound.powerup();
            } else {
                this.sound.eat();
            }

            this.score += points;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                storage.setHighScore(this.highScore);
            }
            this.updateScoreDisplay();

            this.particles.spawn(
                this.food.x * this.gridSize + this.gridSize / 2,
                this.food.y * this.gridSize + this.gridSize / 2,
                this.food.color,
                15
            );

            this.spawnFood();
        } else {
            this.snake.pop();
            this.sound.move();
        }

        this.particles.update();
        this.draw();
    }

    gameOver() {
        this.isPlaying = false;
        clearInterval(this.gameInterval);
        this.sound.gameOver();

        if (this.overlay) {
            this.overlay.classList.remove('hidden');
            if (this.overlayTitle) this.overlayTitle.textContent = 'GAME OVER';
            if (this.overlaySubtitle) this.overlaySubtitle.textContent = `Score: ${this.score} | Best: ${this.highScore}`;
            if (this.startBtn) {
                const btnSpan = this.startBtn.querySelector('span');
                if (btnSpan) btnSpan.textContent = 'PLAY AGAIN';
            }
        }

        if (this.statusBadge) {
            this.statusBadge.textContent = 'GAME OVER - PRESS START';
            this.statusBadge.className = 'px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs';
        }
    }

    updateScoreDisplay() {
        if (this.scoreEl) {
            this.scoreEl.textContent = this.score.toString().padStart(6, '0');
        }
        if (this.highScoreEl) {
            this.highScoreEl.textContent = this.highScore.toString().padStart(6, '0');
        }
    }

    renderStartScreen() {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#10b981';
        this.ctx.font = 'bold 28px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SNAKE ARCADE', this.canvas.width / 2, this.canvas.height / 2 - 20);

        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '14px monospace';
        this.ctx.fillText('Press START or Space to Play', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    draw() {
        // Clear background
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid lines subtly
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i < this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        // Draw food
        this.ctx.fillStyle = this.food.color;
        this.ctx.shadowColor = this.food.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(
            this.food.x * this.gridSize + 2,
            this.food.y * this.gridSize + 2,
            this.gridSize - 4,
            this.gridSize - 4
        );
        this.ctx.shadowBlur = 0;

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#34d399' : '#10b981';
            this.ctx.shadowColor = '#10b981';
            this.ctx.shadowBlur = index === 0 ? 8 : 2;
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
        this.ctx.shadowBlur = 0;

        // Draw particles
        this.particles.draw(this.ctx);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.snakeGame = new SnakeGame();
});

export { SnakeGame, SoundFX, ParticleSystem };