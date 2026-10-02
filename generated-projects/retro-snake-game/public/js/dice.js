/**
 * public/js/dice.js
 * Royal Ludo - 2 Player Edition
 * Dice Rolling Engine with 3D Physics Simulation, Audio Synthesizer, and Visual FX
 */

class DiceEngine {
    constructor() {
        this.currentValue = 1;
        this.isRolling = false;
        this.container = document.getElementById('diceContainer');
        this.rollBtn = document.getElementById('rollDiceBtn');
        this.diceValueDisplay = document.getElementById('diceValueDisplay');

        // Dot configurations for standard 6-sided die faces (1-6)
        this.faceLayouts = {
            1: [[50, 50]],
            2: [[25, 25], [75, 75]],
            3: [[25, 25], [50, 50], [75, 75]],
            4: [[25, 25], [25, 75], [75, 25], [75, 75]],
            5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
            6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]]
        };
    }

    /**
     * Initializes the dice component UI and interaction bindings
     */
    init() {
        if (!this.container) return;
        this.renderFace(1);
        
        if (this.rollBtn) {
            this.rollBtn.addEventListener('click', () => {
                // Event handled externally by gameEngine, but we expose roll trigger
            });
        }
    }

    /**
     * Renders a static die face with proper dot placement
     * @param {number} value - Die value (1-6)
     */
    renderFace(value) {
        if (!this.container) return;
        this.currentValue = value;
        this.container.innerHTML = '';

        // Add 3D container wrapper if not present
        const faceInner = document.createElement('div');
        faceInner.className = 'w-full h-full relative bg-gradient-to-br from-slate-100 via-white to-slate-200 rounded-2xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-4px_8px_rgba(0,0,0,0.15),0_10px_25px_rgba(0,0,0,0.3)] border border-slate-300/80 flex items-center justify-center p-3 select-none transition-all duration-300';

        const layout = this.faceLayouts[value] || this.faceLayouts[1];
        
        layout.forEach(([x, y]) => {
            const dot = document.createElement('div');
            dot.className = 'absolute w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gradient-to-br from-slate-800 to-slate-950 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.4)] transform -translate-x-1/2 -translate-y-1/2';
            dot.style.left = `${x}%`;
            dot.style.top = `${y}%`;
            faceInner.appendChild(dot);
        });

        this.container.appendChild(faceInner);

        if (this.diceValueDisplay) {
            this.diceValueDisplay.textContent = value;
        }
    }

    /**
     * Triggers an animated dice roll with 3D rotation, rattling, and sound synthesis
     * @param {number} targetValue - The final determined value from gameEngine
     * @param {function} onComplete - Callback executed once animation finishes
     */
    roll(targetValue, onComplete) {
        if (this.isRolling) return;
        this.isRolling = true;

        if (this.rollBtn) {
            this.rollBtn.disabled = true;
            this.rollBtn.classList.add('opacity-50', 'cursor-not-allowed', 'scale-95');
        }

        // Play audio rattle effect if available
        this.playDiceAudio();

        let elapsed = 0;
        const duration = 800; // ms
        const intervalTime = 65; // ms per frame switch

        // Add rolling classes for CSS 3D tumble
        this.container.classList.add('dice-rolling-animation');

        const rollInterval = setInterval(() => {
            elapsed += intervalTime;
            // Random interim face for visual suspense
            const randomFace = Math.floor(Math.random() * 6) + 1;
            this.renderFace(randomFace);

            // Add dynamic tilt & jitter
            const randomXRot = (Math.random() - 0.5) * 60;
            const randomYRot = (Math.random() - 0.5) * 60;
            const randomZRot = (Math.random() - 0.5) * 30;
            this.container.style.transform = `rotateX(${randomXRot}deg) rotateY(${randomYRot}deg) rotateZ(${randomZRot}deg) scale(1.1)';`

            if (elapsed >= duration) {
                clearInterval(rollInterval);
                
                // Land on exact target value
                this.renderFace(targetValue);
                this.container.classList.remove('dice-rolling-animation');
                this.container.style.transform = 'rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)';

                // Play landing thud sound
                this.playLandAudio();

                // Trigger success pop effect
                this.container.classList.add('scale-110');
                setTimeout(() => {
                    this.container.classList.remove('scale-110');
                }, 200);

                this.isRolling = false;
                if (this.rollBtn) {
                    this.rollBtn.disabled = false;
                    this.rollBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'scale-95');
                }

                if (typeof onComplete === 'function') {
                    onComplete(targetValue);
                }
            }
        }, intervalTime);
    }

    /**
     * Web Audio API Synthesizer for realistic dice rattling sound
     */
    playDiceAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            // Create noise buffer for rattle
            const bufferSize = ctx.sampleRate * 0.6;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, ctx.currentTime);
            filter.Q.setValueAtTime(3, ctx.currentTime);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noise.start();
        } catch (e) {
            // Audio context blocked or unsupported without user gesture
        }
    }

    /**
     * Web Audio API Synthesizer for final die land thud
     */
    playLandAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
            // Audio context fallback
        }
    }
}

// Export global dice engine instance
window.diceEngine = new DiceEngine();
document.addEventListener('DOMContentLoaded', () => {
    window.diceEngine.init();
});