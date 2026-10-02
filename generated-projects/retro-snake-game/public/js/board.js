/**
 * public/js/board.js
 * Responsible for rendering the Ludo board, generating tiles, home yards,
 * center star, and placing/moving player tokens accurately on the 15x15 grid.
 */

import { BOARD_SIZE, COLORS, TRACK_COORDINATES, SAFE_SQUARES } from './constants.js';

export class Board {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.boardElement = null;
        this.tilesMap = new Map(); // Key: "x,y", Value: DOM element
    }

    /**
     * Renders the complete 15x15 Ludo Board structure
     */
    init() {
        if (!this.container) return;
        this.container.innerHTML = '';

        // Create main board wrapper
        const boardWrapper = document.createElement('div');
        boardWrapper.id = 'ludoBoard';
        boardWrapper.className = 'relative w-full max-w-[650px] aspect-square bg-slate-900 border-4 border-slate-700/80 rounded-2xl shadow-2xl grid grid-cols-15 grid-rows-15 overflow-hidden select-none';

        // Generate 15x15 grid cells
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.className = 'relative flex items-center justify-center border-[0.5px] border-slate-800/60 box-border text-[9px] font-mono text-slate-700';
                
                // Identify cell zones and styling
                this.styleCell(cell, r, c);

                boardWrapper.appendChild(cell);
                this.tilesMap.set(`${c},${r}`, cell);
            }
        }

        // Overlay Yard Bases (Red & Green for 2-Player mode)
        this.renderYardBases(boardWrapper);

        // Overlay Center Home Triangle
        this.renderCenterHome(boardWrapper);

        this.container.appendChild(boardWrapper);
        this.boardElement = boardWrapper;
    }

    /**
     * Applies precise Tailwind styling to each board cell based on Ludo layout
     */
    styleCell(cell, r, c) {
        // Red Home Base Area (Top-Left: rows 0-5, cols 0-5)
        if (r < 6 && c < 6) {
            cell.classList.add('bg-rose-950/30');
        }
        // Green Home Base Area (Bottom-Right: rows 9-14, cols 9-14)
        else if (r >= 9 && c >= 9) {
            cell.classList.add('bg-emerald-950/30');
        }
        // Red Home Stretch (Column 1, rows 1 to 5)
        else if (c === 1 && r >= 1 && r <= 5) {
            cell.style.backgroundColor = COLORS.red;
            cell.classList.add('opacity-90', 'shadow-inner');
        }
        // Green Home Stretch (Column 13, rows 9 to 13)
        else if (c === 13 && r >= 9 && r <= 13) {
            cell.style.backgroundColor = COLORS.green;
            cell.classList.add('opacity-90', 'shadow-inner');
        }
        // Check for common track or other zones
        else {
            // Check if it's part of the main track
            const isTrack = TRACK_COORDINATES.some(coord => coord.x === c && coord.y === r);
            if (isTrack) {
                cell.classList.add('bg-slate-800/40');
            }
        }

        // Mark Safe Squares with Star icon or subtle glow
        const isSafe = SAFE_SQUARES.some(sq => sq.x === c && sq.y === r);
        if (isSafe) {
            cell.classList.add('bg-slate-700/50');
            const star = document.createElement('div');
            star.className = 'absolute inset-0 flex items-center justify-center text-amber-400/70 pointer-events-none';
            star.innerHTML = '<i data-lucide="star" class="w-3 h-3 fill-amber-400/40"></i>';
            cell.appendChild(star);
        }
    }

    /**
     * Renders Red and Green base yards with circular slots for tokens
     */
    renderYardBases(wrapper) {
        // Red Yard (Top Left: x: 1 to 4, y: 1 to 4)
        const redYard = document.createElement('div');
        redYard.className = 'absolute left-[5%] top-[5%] w-[35%] h-[35%] bg-rose-900/20 border-2 border-rose-500/40 rounded-2xl p-4 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-rose-950/50';
        redYard.innerHTML = `
            <div class="grid grid-cols-2 gap-4 w-full h-full bg-rose-950/60 rounded-xl p-3 border border-rose-500/30">
                <div class="red-slot rounded-full bg-rose-600/30 border-2 border-rose-500 flex items-center justify-center shadow-inner" data-yard="red" data-index="0"></div>
                <div class="red-slot rounded-full bg-rose-600/30 border-2 border-rose-500 flex items-center justify-center shadow-inner" data-yard="red" data-index="1"></div>
                <div class="red-slot rounded-full bg-rose-600/30 border-2 border-rose-500 flex items-center justify-center shadow-inner" data-yard="red" data-index="2"></div>
                <div class="red-slot rounded-full bg-rose-600/30 border-2 border-rose-500 flex items-center justify-center shadow-inner" data-yard="red" data-index="3"></div>
            </div>
        `;
        wrapper.appendChild(redYard);

        // Green Yard (Bottom Right: x: 9 to 12, y: 9 to 12)
        const greenYard = document.createElement('div');
        greenYard.className = 'absolute right-[5%] bottom-[5%] w-[35%] h-[35%] bg-emerald-900/20 border-2 border-emerald-500/40 rounded-2xl p-4 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-emerald-950/50';
        greenYard.innerHTML = `
            <div class="grid grid-cols-2 gap-4 w-full h-full bg-emerald-950/60 rounded-xl p-3 border border-emerald-500/30">
                <div class="green-slot rounded-full bg-emerald-600/30 border-2 border-emerald-500 flex items-center justify-center shadow-inner" data-yard="green" data-index="0"></div>
                <div class="green-slot rounded-full bg-emerald-600/30 border-2 border-emerald-500 flex items-center justify-center shadow-inner" data-yard="green" data-index="1"></div>
                <div class="green-slot rounded-full bg-emerald-600/30 border-2 border-emerald-500 flex items-center justify-center shadow-inner" data-yard="green" data-index="2"></div>
                <div class="green-slot rounded-full bg-emerald-600/30 border-2 border-emerald-500 flex items-center justify-center shadow-inner" data-yard="green" data-index="3"></div>
            </div>
        `;
        wrapper.appendChild(greenYard);
    }

    /**
     * Renders the center home winning destination box
     */
    renderCenterHome(wrapper) {
        const centerHome = document.createElement('div');
        centerHome.className = 'absolute left-[40%] top-[40%] w-[20%] h-[20%] bg-gradient-to-br from-rose-950/80 via-slate-900 to-emerald-950/80 border-2 border-amber-500/50 rounded-2xl shadow-2xl flex items-center justify-center z-10 backdrop-blur-md';
        centerHome.innerHTML = `
            <div class="relative w-full h-full flex items-center justify-center">
                <div class="absolute inset-0 bg-amber-500/10 animate-pulse rounded-xl"></div>
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/50 border border-white/40">
                    <i data-lucide="crown" class="w-4 h-4 text-slate-950 fill-slate-950"></i>
                </div>
            </div>
        `;
        wrapper.appendChild(centerHome);
    }

    /**
     * Places player tokens onto the board based on game state
     */
    renderTokens(gameState, onTokenClick) {
        // Clear all existing tokens from DOM
        document.querySelectorAll('.ludo-token').forEach(el => el.remove());

        // Render Red Tokens
        gameState.players.red.tokens.forEach((tokenState, index) => {
            const tokenEl = this.createTokenElement('red', index, tokenState, onTokenClick);
            this.placeTokenOnBoard('red', index, tokenState, tokenEl);
        });

        // Render Green Tokens
        gameState.players.green.tokens.forEach((tokenState, index) => {
            const tokenEl = this.createTokenElement('green', index, tokenState, onTokenClick);
            this.placeTokenOnBoard('green', index, tokenState, tokenEl);
        });

        // Initialize Lucide icons inside tokens if any
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Creates an interactive token DOM element
     */
    createTokenElement(color, index, tokenState, onClick) {
        const token = document.createElement('div');
        token.className = `ludo-token absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-125 z-30 ${
            color === 'red' ? 'bg-rose-500 border-2 border-white shadow-rose-500/50' : 'bg-emerald-500 border-2 border-white shadow-emerald-500/50'
        }`;
        token.dataset.color = color;
        token.dataset.index = index;
        token.innerHTML = `<span class="drop-shadow">${index + 1}</span>`;

        if (tokenState.isMovable) {
            token.classList.add('ring-4', 'ring-amber-400', 'animate-bounce');
        }

        if (onClick) {
            token.addEventListener('click', (e) => {
                e.stopPropagation();
                onClick(color, index);
            });
        }

        return token;
    }

    /**
     * Determines exact pixel or grid placement for a token
     */
    placeTokenOnBoard(color, index, tokenState, tokenEl) {
        if (tokenState.status === 'home') {
            // Place in Yard Slot
            const yardContainer = this.boardElement.querySelector(
                color === 'red' 
                    ? `.red-slot[data-index="${index}"]` 
                    : `.green-slot[data-index="${index}"]`
            );
            if (yardContainer) {
                yardContainer.appendChild(tokenEl);
                // Reset absolute positioning inside yard container flex
                tokenEl.style.position = 'relative';
                tokenEl.style.top = 'auto';
                tokenEl.style.left = 'auto';
            }
        } else if (tokenState.status === 'finished') {
            // Place in Center Home Area
            const centerHome = this.boardElement.querySelector('.absolute.left-\\[40\\%\\]');
            if (centerHome) {
                centerHome.appendChild(tokenEl);
                tokenEl.style.position = 'relative';
                tokenEl.style.top = 'auto';
                tokenEl.style.left = 'auto';
                tokenEl.classList.add('scale-90');
            }
        } else if (tokenState.status === 'active' || tokenState.position !== undefined) {
            // Place on Track Coordinate
            const posCoord = TRACK_COORDINATES[tokenState.position];
            if (posCoord) {
                const tile = this.tilesMap.get(`${posCoord.x},${posCoord.y}`);
                if (tile) {
                    tile.appendChild(tokenEl);
                    tokenEl.style.position = 'absolute';
                }
            }
        }
    }
}