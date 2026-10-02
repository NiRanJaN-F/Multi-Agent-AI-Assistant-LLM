class BoardManager {
    constructor() {
        this.colors = ['red', 'green', 'yellow', 'blue'];
        
        // Define path coordinates and types for the standard Ludo board (15x15 grid layout)
        // Each color has its home yard, start cell, home stretch, and winning destination.
        this.boardConfig = {
            gridSize: 15,
            homeYards: {
                red: { startRow: 0, startCol: 0, endRow: 5, endCol: 5 },
                green: { startRow: 0, startCol: 9, endRow: 5, endCol: 14 },
                yellow: { startRow: 9, startCol: 9, endRow: 14, endCol: 14 },
                blue: { startRow: 9, startCol: 0, endRow: 14, endCol: 5 }
            },
            // Safe spots on the main track where pieces cannot be captured
            safeCells: [
                { r: 6, c: 1 },   // Red start approach
                { r: 2, c: 6 },   // Green start approach
                { r: 8, c: 13 },  // Yellow start approach
                { r: 12, c: 8 },  // Blue start approach
                { r: 6, c: 2 },   // Star safe spots
                { r: 2, c: 8 },
                { r: 8, c: 12 },
                { r: 12, c: 6 }
            ]
        };

        // Complete ordered path definitions for each color (0 to 56 steps)
        // Main board track indices + home stretches + center home cell
        this.paths = {
            red: [
                {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5},
                {r: 5, c: 6}, {r: 4, c: 6}, {r: 3, c: 6}, {r: 2, c: 6}, {r: 1, c: 6}, {r: 0, c: 6},
                {r: 0, c: 7},
                {r: 0, c: 8}, {r: 1, c: 8}, {r: 2, c: 8}, {r: 3, c: 8}, {r: 4, c: 8}, {r: 5, c: 8},
                {r: 6, c: 9}, {r: 6, c: 10}, {r: 6, c: 11}, {r: 6, c: 12}, {r: 6, c: 13}, {r: 6, c: 14},
                {r: 7, c: 14},
                {r: 8, c: 14}, {r: 8, c: 13}, {r: 8, c: 12}, {r: 8, c: 11}, {r: 8, c: 10}, {r: 8, c: 9},
                {r: 9, c: 8}, {r: 10, c: 8}, {r: 11, c: 8}, {r: 12, c: 8}, {r: 13, c: 8}, {r: 14, c: 8},
                {r: 14, c: 7},
                {r: 14, c: 6}, {r: 13, c: 6}, {r: 12, c: 6}, {r: 11, c: 6}, {r: 10, c: 6}, {r: 9, c: 6},
                {r: 8, c: 5}, {r: 8, c: 4}, {r: 8, c: 3}, {r: 8, c: 2}, {r: 8, c: 1}, {r: 8, c: 0},
                {r: 7, c: 0},
                // Home stretch
                {r: 7, c: 1}, {r: 7, c: 2}, {r: 7, c: 3}, {r: 7, c: 4}, {r: 7, c: 5}, {r: 7, c: 6}
            ],
            green: [
                {r: 1, c: 8}, {r: 2, c: 8}, {r: 3, c: 8}, {r: 4, c: 8}, {r: 5, c: 8},
                {r: 6, c: 9}, {r: 6, c: 10}, {r: 6, c: 11}, {r: 6, c: 12}, {r: 6, c: 13}, {r: 6, c: 14},
                {r: 7, c: 14},
                {r: 8, c: 14}, {r: 8, c: 13}, {r: 8, c: 12}, {r: 8, c: 11}, {r: 8, c: 10}, {r: 8, c: 9},
                {r: 9, c: 8}, {r: 10, c: 8}, {r: 11, c: 8}, {r: 12, c: 8}, {r: 13, c: 8}, {r: 14, c: 8},
                {r: 14, c: 7},
                {r: 14, c: 6}, {r: 13, c: 6}, {r: 12, c: 6}, {r: 11, c: 6}, {r: 10, c: 6}, {r: 9, c: 6},
                {r: 8, c: 5}, {r: 8, c: 4}, {r: 8, c: 3}, {r: 8, c: 2}, {r: 8, c: 1}, {r: 8, c: 0},
                {r: 7, c: 0},
                {r: 6, c: 0}, {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5},
                {r: 5, c: 6}, {r: 4, c: 6}, {r: 3, c: 6}, {r: 2, c: 6}, {r: 1, c: 6}, {r: 0, c: 6},
                {r: 0, c: 7},
                // Home stretch
                {r: 1, c: 7}, {r: 2, c: 7}, {r: 3, c: 7}, {r: 4, c: 7}, {r: 5, c: 7}, {r: 6, c: 7}
            ],
            yellow: [
                {r: 8, c: 13}, {r: 8, c: 12}, {r: 8, c: 11}, {r: 8, c: 10}, {r: 8, c: 9},
                {r: 9, c: 8}, {r: 10, c: 8}, {r: 11, c: 8}, {r: 12, c: 8}, {r: 13, c: 8}, {r: 14, c: 8},
                {r: 14, c: 7},
                {r: 14, c: 6}, {r: 13, c: 6}, {r: 12, c: 6}, {r: 11, c: 6}, {r: 10, c: 6}, {r: 9, c: 6},
                {r: 8, c: 5}, {r: 8, c: 4}, {r: 8, c: 3}, {r: 8, c: 2}, {r: 8, c: 1}, {r: 8, c: 0},
                {r: 7, c: 0},
                {r: 6, c: 0}, {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5},
                {r: 5, c: 6}, {r: 4, c: 6}, {r: 3, c: 6}, {r: 2, c: 6}, {r: 1, c: 6}, {r: 0, c: 6},
                {r: 0, c: 7},
                {r: 0, c: 8}, {r: 1, c: 8}, {r: 2, c: 8}, {r: 3, c: 8}, {r: 4, c: 8}, {r: 5, c: 8},
                {r: 6, c: 9}, {r: 6, c: 10}, {r: 6, c: 11}, {r: 6, c: 12}, {r: 6, c: 13}, {r: 6, c: 14},
                {r: 7, c: 14},
                // Home stretch
                {r: 7, c: 13}, {r: 7, c: 12}, {r: 7, c: 11}, {r: 7, c: 10}, {r: 7, c: 9}, {r: 7, c: 8}
            ],
            blue: [
                {r: 13, c: 6}, {r: 12, c: 6}, {r: 11, c: 6}, {r: 10, c: 6}, {r: 9, c: 6},
                {r: 8, c: 5}, {r: 8, c: 4}, {r: 8, c: 3}, {r: 8, c: 2}, {r: 8, c: 1}, {r: 8, c: 0},
                {r: 7, c: 0},
                {r: 6, c: 0}, {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5},
                {r: 5, c: 6}, {r: 4, c: 6}, {r: 3, c: 6}, {r: 2, c: 6}, {r: 1, c: 6}, {r: 0, c: 6},
                {r: 0, c: 7},
                {r: 0, c: 8}, {r: 1, c: 8}, {r: 2, c: 8}, {r: 3, c: 8}, {r: 4, c: 8}, {r: 5, c: 8},
                {r: 6, c: 9}, {r: 6, c: 10}, {r: 6, c: 11}, {r: 6, c: 12}, {r: 6, c: 13}, {r: 6, c: 14},
                {r: 7, c: 14},
                {r: 8, c: 14}, {r: 8, c: 13}, {r: 8, c: 12}, {r: 8, c: 11}, {r: 8, c: 10}, {r: 8, c: 9},
                {r: 9, c: 8}, {r: 10, c: 8}, {r: 11, c: 8}, {r: 12, c: 8}, {r: 13, c: 8}, {r: 14, c: 8},
                {r: 14, c: 7},
                // Home stretch
                {r: 13, c: 7}, {r: 12, c: 7}, {r: 11, c: 7}, {r: 10, c: 7}, {r: 9, c: 7}, {r: 8, c: 7}
            ]
        };

        // Yard base slot coordinates for each of the 4 tokens per color
        this.yardSlots = {
            red: [
                { r: 1.5, c: 1.5 }, { r: 1.5, c: 3.5 },
                { r: 3.5, c: 1.5 }, { r: 3.5, c: 3.5 }
            ],
            green: [
                { r: 1.5, c: 10.5 }, { r: 1.5, c: 12.5 },
                { r: 3.5, c: 10.5 }, { r: 3.5, c: 12.5 }
            ],
            yellow: [
                { r: 10.5, c: 10.5 }, { r: 10.5, c: 12.5 },
                { r: 12.5, c: 10.5 }, { r: 12.5, c: 12.5 }
            ],
            blue: [
                { r: 10.5, c: 1.5 }, { r: 10.5, c: 3.5 },
                { r: 12.5, c: 1.5 }, { r: 12.5, c: 3.5 }
            ]
        };
    }

    /**
     * Initializes and renders the complete Ludo board into the DOM.
     * Creates the 15x15 grid, home bases, colored tracks, safe stars, and center home triangle.
     */
    initBoard(containerId = 'ludoBoard') {
        const boardElement = document.getElementById(containerId);
        if (!boardElement) return;

        boardElement.innerHTML = '';
        boardElement.className = "relative w-full aspect-square max-w-[650px] mx-auto bg-slate-900 rounded-3xl p-3 shadow-2xl shadow-indigo-500/10 border border-slate-800/80 grid grid-cols-15 grid-rows-15 gap-[2px] overflow-hidden select-none backdrop-blur-md";

        // Generate 15x15 cells
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const cell = document.createElement('div');
                cell.id = `cell_${r}__${c}`;
                cell.className = this.determineCellClass(r, c);
                
                // Add star icon to safe spots on main track
                if (this.isSafeCell(r, c)) {
                    cell.innerHTML = `<i data-lucide="star" class="w-3.5 h-3.5 text-amber-400/70 animate-pulse"></i>`;
                }

                boardElement.appendChild(cell);
            }
        }

        // Render Base Yards overlays (Red, Green, Yellow, Blue)
        this.renderYardOverlays(boardElement);

        // Render Center Home Triangle finish zone
        this.renderCenterHome(boardElement);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Determines the appropriate styling class for each board coordinate.
     */
    determineCellClass(r, c) {
        let base = "flex items-center justify-center rounded-[4px] transition-colors duration-200 relative ";

        // Red Home Yard (top-left 6x6)
        if (r < 6 && c < 6) return base + "bg-rose-950/40 border border-rose-900/30";
        // Green Home Yard (top-right 6x6)
        if (r < 6 && c > 8) return base + "bg-emerald-950/40 border border-emerald-900/30";
        // Yellow Home Yard (bottom-right 6x6)
        if (r > 8 && c > 8) return base + "bg-amber-950/40 border border-amber-900/30";
        // Blue Home Yard (bottom-left 6x6)
        if (r > 8 && c < 6) return base + "bg-blue-950/40 border border-blue-900/30";

        // Center Home Finish Zone (3x3 center)
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
            return base + "bg-slate-900/90";
        }

        // Home stretches
        // Red home stretch (row 7, cols 1-5)
        if (r === 7 && c >= 1 && c <= 5) return base + "bg-rose-600/80 shadow-inner shadow-rose-900/50";
        // Green home stretch (col 7, rows 1-5)
        if (c === 7 && r >= 1 && r <= 5) return base + "bg-emerald-600/80 shadow-inner shadow-emerald-900/50";
        // Yellow home stretch (row 7, cols 9-13)
        if (r === 7 && c >= 9 && c <= 13) return base + "bg-amber-500/80 shadow-inner shadow-amber-900/50";
        // Blue home stretch (col 7, rows 9-13)
        if (c === 7 && r >= 9 && r <= 13) return base + "bg-blue-600/80 shadow-inner shadow-blue-900/50";

        // Standard Main Track Paths
        return base + "bg-slate-800/60 hover:bg-slate-800 border border-slate-700/30";
    }

    isSafeCell(r, c) {
        return this.boardConfig.safeCells.some(cell => cell.r === r && cell.c === c);
    }

    /**
     * Renders the 4 colored home yard boxes with white inner circles for tokens.
     */
    renderYardOverlays(boardElement) {
        const yards = [
            { color: 'red', top: '0', left: '0', bg: 'bg-rose-900/20', border: 'border-rose-500/30', circleBg: 'bg-rose-500/20 border-rose-500/40' },
            { color: 'green', top: '0', right: '0', bg: 'bg-emerald-900/20', border: 'border-emerald-500/30', circleBg: 'bg-emerald-500/20 border-emerald-500/40' },
            { color: 'yellow', bottom: '0', right: '0', bg: 'bg-amber-900/20', border: 'border-amber-500/30', circleBg: 'bg-amber-500/20 border-amber-500/40' },
            { color: 'blue', bottom: '0', left: '0', bg: 'bg-blue-900/20', border: 'border-blue-500/30', circleBg: 'bg-blue-500/20 border-blue-500/40' }
        ];

        yards.forEach(y => {
            const yardDiv = document.createElement('div');
            yardDiv.className = `absolute w-[38%] h-[38%] ${y.bg} border-2 ${y.border} rounded-2xl p-4 flex items-center justify-center shadow-inner backdrop-blur-sm`;
            
            if (y.top !== undefined) yardDiv.style.top = '3%';
            if (y.bottom !== undefined) yardDiv.style.bottom = '3%';
            if (y.left !== undefined) yardDiv.style.left = '3%';
            if (y.right !== undefined) yardDiv.style.right = '3%';

            // Inner white/colored container box
            const innerBox = document.createElement('div');
            innerBox.className = `w-full h-full bg-slate-900/80 rounded-xl grid grid-cols-2 grid-rows-2 gap-3 p-3 border border-slate-700/50`;

            for (let i = 0; i < 4; i++) {
                const slot = document.createElement('div');
                slot.className = `w-full h-full rounded-full border-2 ${y.circleBg} flex items-center justify-center shadow-inner`;
                slot.dataset.yardSlot = `${y.color}-${i}`;
                innerBox.appendChild(slot);
            }

            yardDiv.appendChild(innerBox);
            boardElement.appendChild(yardDiv);
        });
    }

    /**
     * Renders the stunning center home finish triangles.
     */
    renderCenterHome(boardElement) {
        const centerDiv = document.createElement('div');
        centerDiv.className = "absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-indigo-500/30 rounded-2xl shadow-2xl flex items-center justify-center z-10 overflow-hidden backdrop-blur-md";
        centerDiv.innerHTML = `
            <div class="relative w-full h-full flex items-center justify-center">
                <div class="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 animate-pulse"></div>
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20">
                    <i data-lucide="crown" class="w-4 h-4 text-white"></i>
                </div>
            </div>
        `;
        boardElement.appendChild(centerDiv);
    }

    /**
     * Renders all player tokens onto the board based on current game state positions.
     * Handles stacking multiple tokens on the same cell with visual offsets and badge counters.
     */
    renderTokens(playersState, activePlayerColor, validMoves = []) {
        // Clear previous token elements from the DOM
        document.querySelectorAll('.ludo-token').forEach(el => el.remove());

        const boardElement = document.getElementById('ludoBoard');
        if (!boardElement) return;

        // Group tokens by coordinates to handle stacking
        const positionMap = {};

        playersState.forEach(player => {
            player.tokens.forEach((token) => {
                let coords = null;

                if (token.position === -1) {
                    // In yard
                    coords = this.yardSlots[player.color][token.id];
                } else if (token.position >= 0 && token.position <= 56) {
                    // On path
                    coords = this.paths[player.color][token.position];
                }

                if (coords) {
                    const key = `${coords.r},${coords.c}`;
                    if (!positionMap[key]) {
                        positionMap[key] = [];
                    }
                    positionMap[key].push({
                        playerColor: player.color,
                        tokenId: token.id,
                        position: token.position,
                        isComplete: token.isComplete,
                        isValidMove: validMoves.some(m => m.color === player.color && m.tokenId === token.id)
                    });
                }
            });
        });

        // Render tokens onto board with stacking offsets
        for (const [key, tokensAtCell] of Object.entries(positionMap)) {
            const [r, c] = key.split(',').map(Number);
            const cellId = `cell_${r}__${c}`;
            let targetContainer = document.getElementById(cellId);

            // If on path cell
            if (targetContainer) {
                tokensAtCell.forEach((tokenInfo, index) => {
                    const tokenEl = this.createTokenElement(tokenInfo, index, tokensAtCell.length);
                    targetContainer.appendChild(tokenEl);
                });
            } else {
                // If in yard slot (yard slots are absolute elements positioned in yard containers)
                tokensAtCell.forEach((tokenInfo) => {
                    const slotEl = document.querySelector(`[data-yard-slot="${tokenInfo.playerColor}-${tokenInfo.tokenId}"]`);
                    if (slotEl) {
                        slotEl.innerHTML = '';
                        const tokenEl = this.createTokenElement(tokenInfo, 0, 1);
                        slotEl.appendChild(tokenEl);
                    }
                });
            }
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Creates an individual token DOM element with gorgeous gradients, shadows, and interactive glow states.
     */
    createTokenElement(tokenInfo, index, totalAtCell) {
        const tokenDiv = document.createElement('div');
        tokenDiv.className = `ludo-token absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-125 z-20 shadow-lg `;
        
        // Color themes
        const colorStyles = {
            red: 'bg-gradient-to-tr from-rose-600 to-rose-400 border-2 border-white/80 shadow-rose-500/50',
            green: 'bg-gradient-to-tr from-emerald-600 to-emerald-400 border-2 border-white/80 shadow-emerald-500/50',
            yellow: 'bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-white/80 shadow-amber-500/50',
            blue: 'bg-gradient-to-tr from-blue-600 to-blue-400 border-2 border-white/80 shadow-blue-500/50'
        };

        tokenDiv.className += colorStyles[tokenInfo.playerColor] || 'bg-slate-700';

        // If this token is a valid playable move, add pulsing highlight ring
        if (tokenInfo.isValidMove) {
            tokenDiv.className += ' ring-4 ring-white ring-offset-2 ring-offset-slate-950 animate-bounce cursor-pointer shadow-2xl shadow-indigo-500/80';
            tokenDiv.dataset.clickable = 'true';
        }

        // Stacking visual offsets if multiple tokens share the exact same cell
        if (totalAtCell > 1) {
            const offsets = [
                { x: -3, y: -3 },
                { x: 3, y: -3 },
                { x: -3, y: 3 },
                { x: 3, y: 3 }
            ];
            const off = offsets[index % 4];
            tokenDiv.style.transform = `translate(${off.x}px, ${off.y}px) scale(0.85)`;
            
            // Add miniature stack count badge if 3+ tokens
            if (totalAtCell > 2 && index === 0) {
                const badge = document.createElement('span');
                badge.className = 'absolute -top-1 -right-1 w-4 h-4 bg-slate-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white/50';
                badge.textContent = totalAtCell;
                tokenDiv.appendChild(badge);
            }
        }

        tokenDiv.dataset.color = tokenInfo.playerColor;
        tokenDiv.dataset.tokenId = tokenInfo.tokenId;

        // Inner core icon / dot
        const innerDot = document.createElement('div');
        innerDot.className = 'w-2.5 h-2.5 rounded-full bg-white/90 shadow-inner';
        tokenDiv.appendChild(innerDot);

        return tokenDiv;
    }
}

// Export BoardManager for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoardManager;
} else {
    window.BoardManager = BoardManager;
}