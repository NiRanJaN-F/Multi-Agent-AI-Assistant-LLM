/**
 * Ludo Royal - Dice Management Module
 * Handles 3D dice rendering, animations, audio synthesis/effects, and roll physics.
 */

class DiceManager {
    constructor() {
        this.currentValue = 1;
        this.isRolling = false;
        this.diceContainer = document.getElementById('diceContainer');
        this.diceBtn = document.getElementById('rollDiceBtn');
        
        // Pre-create AudioContext for immersive click/roll sounds
        this.audioCtx = null;
        this.initAudio();
    }

    initAudio() {
        // Lazy initialize audio context on first user interaction
        const unlockAudio = () => {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.audioCtx = new AudioContext();
                }
            }
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);
    }

    playRollSound() {
        if (!this.audioCtx) return;
        try {
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            
            // Generate rattle / clatter sound using white noise bursts
            const bufferSize = this.audioCtx.sampleRate * 0.4; // 400ms
            const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.audioCtx.createBufferSource();
            noise.buffer = buffer;

            // Bandpass filter to make it sound woody/plastic like a dice cup
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 800;
            filter.Q.value = 3;

            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioCtx.destination);

            noise.start();
        } catch (e) {
            console.warn('Audio play failed:', e);
        }
    }

    playSuccessSound() {
        if (!this.audioCtx) return;
        try {
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, this.audioCtx.currentTime); // A4
            osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.15); // A5

            gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.2);
        } catch (e) {
            console.warn('Success sound failed:', e);
        }
    }

    /**
     * Rolls the dice with a 3D tumbling animation and returns the value.
     * @param {number} forcedValue - Optional server-forced value
     * @returns {Promise<number>}
     */
    async roll(forcedValue = null) {
        if (this.isRolling) return this.currentValue;
        this.isRolling = true;

        if (this.diceBtn) {
            this.diceBtn.disabled = true;
            this.diceBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }

        this.playRollSound();

        // Add intense tumble animation class
        if (this.diceContainer) {
            this.diceContainer.classList.add('animate-dice-tumble');
        }

        // Simulate random face fluttering during roll
        const rollDuration = 600; // ms
        const startTime = Date.now();

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const tempVal = Math.floor(Math.random() * 6) + 1;
                this.renderDiceFace(tempVal, true);
            }, 80);

            setTimeout(() => {
                clearInterval(interval);
                this.isRolling = false;
                
                if (this.diceContainer) {
                    this.diceContainer.classList.remove('animate-dice-tumble');
                }

                const finalVal = (forcedValue && forcedValue >= 1 && forcedValue <= 6) 
                    ? forcedValue 
                    : Math.floor(Math.random() * 6) + 1;

                this.currentValue = finalVal;
                this.renderDiceFace(finalVal, false);
                this.playSuccessSound();

                if (this.diceBtn) {
                    this.diceBtn.disabled = false;
                    this.diceBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }

                // Fire custom event for game engine listeners
                window.dispatchEvent(new CustomEvent('diceRolled', { detail: { value: finalVal } }));

                resolve(finalVal);
            }, rollDuration);
        });
    }

    /**
     * Renders the 6 face dots layout inside the dice container element
     * @param {number} value - Dice value 1 to 6
     * @param {boolean} isBlurry - Whether to add motion blur styling during roll
     */
    renderDiceFace(value, isBlurry = false) {
        if (!this.diceContainer) return;

        this.currentValue = value;
        this.diceContainer.innerHTML = '';
        this.diceContainer.className = `relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-2xl shadow-xl border-2 border-slate-300 flex items-center justify-center p-3 transition-all duration-300 ${isBlurry ? 'filter blur-[0.5px] scale-105' : 'hover:scale-105 shadow-indigo-500/20'}`;

        // Dot configurations for 1-6 using CSS grid areas or absolute positioning
        const dotPositions = {
            1: ['center'],
            2: ['top-left', 'bottom-right'],
            3: ['top-left', 'center', 'bottom-right'],
            4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
            5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
            6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
        };

        const positions = dotPositions[value] || dotPositions[1];

        // Grid layout container (3x3)
        const grid = document.createElement('div');
        grid.className = 'w-full h-full grid grid-cols-3 grid-rows-3 gap-1 relative';

        // Map position names to grid coordinates [row, col]
        const coords = {
            'top-left': [0, 0],
            'top-right': [0, 2],
            'middle-left': [1, 0],
            'center': [1, 1],
            'middle-right': [1, 2],
            'bottom-left': [2, 0],
            'bottom-right': [2, 2]
        };

        // Create 9 grid slots for clean alignment
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const cell = document.createElement('div');
                cell.className = 'flex items-center justify-center';
                
                // Check if current position should have a dot
                const hasDot = positions.some(pos => {
                    const [pr, pc] = coords[pos];
                    return pr === r && pc === c;
                });

                if (hasDot) {
                    const dot = document.createElement('div');
                    dot.className = value === 6 
                        ? 'w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-900 shadow-inner' 
                        : 'w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-slate-900 shadow-inner ring-1 ring-slate-700/10';
                    cell.appendChild(dot);
                }

                grid.appendChild(cell);
            }
        }

        this.diceContainer.appendChild(grid);
    }

    /**
     * Sets the active player color theme for the dice container border / glow
     * @param {string} color - 'red', 'green', 'yellow', 'blue'
     */
    setPlayerTheme(color) {
        if (!this.diceContainer) return;
        
        const glowMap = {
            red: 'ring-4 ring-rose-500/50 border-rose-400',
            green: 'ring-4 ring-emerald-500/50 border-emerald-400',
            yellow: 'ring-4 ring-amber-500/50 border-amber-400',
            blue: 'ring-4 ring-cyan-500/50 border-cyan-400'
        };

        // Remove old rings
        this.diceContainer.classList.remove(
            'ring-4', 'ring-rose-500/50', 'border-rose-400',
            'ring-4', 'ring-emerald-500/50', 'border-emerald-400',
            'ring-4', 'ring-amber-500/50', 'border-amber-400',
            'ring-4', 'ring-cyan-500/50', 'border-cyan-400'
        );

        if (glowMap[color]) {
            this.diceContainer.className += ` ${glowMap[color]}`;
        }
    }

    /**
     * Enables or disables the dice rolling interaction
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        if (!this.diceBtn) return;
        this.diceBtn.disabled = !enabled;
        if (enabled) {
            this.diceBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
            this.diceBtn.classList.add('hover:scale-105', 'cursor-pointer', 'animate-pulse');
        } else {
            this.diceBtn.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
            this.diceBtn.classList.remove('hover:scale-105', 'animate-pulse');
        }
    }
}

// Export / Attach global instance
window.diceManager = new DiceManager();