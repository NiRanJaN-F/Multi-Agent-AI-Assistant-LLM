/**
 * gameEngine.js - Core Turn & State Machine for Royal Ludo 2-Player Edition
 * Handles turns, dice rolls, token movement validation, capture mechanics, and win conditions.
 */

import { PLAYERS, PATHS, HOME_STRETCHES, WINNING_POSITIONS, START_POSITIONS } from './constants.js';
import { renderBoard, updateTokenDOM, highlightValidTokens, clearHighlights, showMoveFeedback } from './board.js';
import { triggerDiceRoll } from './dice.js';

export class GameEngine {
    constructor(gameState, socket = null, isOnline = false) {
        this.state = gameState; // { players: { red: {...}, blue: {...} }, turn: 'red', diceVal: null, hasRolled: false, gameEnded: false, ... }
        this.socket = socket;
        this.isOnline = isOnline;
        this.moveTimeout = null;
    }

    /**
     * Initialize or reset the game state
     */
    initGame(player1Name = 'Player 1', player2Name = 'Player 2') {
        this.state = {
            players: {
                red: {
                    id: 'red',
                    name: player1Name,
                    color: '#f43f5e', // rose-500
                    tokens: [
                        { id: 0, position: -1, state: 'base' }, // -1 means in base
                        { id: 1, position: -1, state: 'base' },
                        { id: 2, position: -1, state: 'base' },
                        { id: 3, position: -1, state: 'base' }
                    ],
                    homeCount: 0
                },
                blue: {
                    id: 'blue',
                    name: player2Name,
                    color: '#3b82f6', // blue-500
                    tokens: [
                        { id: 0, position: -1, state: 'base' },
                        { id: 1, position: -1, state: 'base' },
                        { id: 2, position: -1, state: 'base' },
                        { id: 3, position: -1, state: 'base' }
                    ],
                    homeCount: 0
                }
            },
            turn: 'red', // Red starts
            diceVal: null,
            hasRolled: false,
            consecutiveSixes: 0,
            gameEnded: false,
            winner: null
        };

        renderBoard();
        this.updateUIState();
        this.logMessage(`${this.state.players.red.name} (Red) starts the game! Roll the dice.`);
    }

    /**
     * Handle Dice Roll Action
     */
    async rollDice(forcedVal = null) {
        if (this.state.gameEnded || this.state.hasRolled) return;

        // If online and not our turn, ignore
        if (this.isOnline && this.state.myColor !== this.state.turn) {
            showMoveFeedback("Not your turn!");
            return;
        }

        // Disable dice button during roll
        const diceBtn = document.getElementById('diceBtn');
        if (diceBtn) diceBtn.disabled = true;

        const val = forcedVal !== null ? forcedVal : await triggerDiceRoll();
        this.state.diceVal = val;
        this.state.hasRolled = true;

        if (diceBtn) diceBtn.disabled = false;

        this.logMessage(`${this.state.players[this.state.turn].name} rolled a 🎲 ${val}`);

        // Check if player has any valid moves
        const validTokens = this.getValidTokens(this.state.turn, val);

        if (validTokens.length === 0) {
            this.logMessage(`No valid moves for ${this.state.players[this.state.turn].name}. Turn skipped.`);
            showMoveFeedback("No moves available!");
            
            // Handle consecutive sixes reset on no move
            if (val === 6) {
                this.state.consecutiveSixes = 0;
            }

            setTimeout(() => {
                this.nextTurn(val === 6); // If 6 and no moves, rule usually gives another roll or passes. Standard Ludo: pass if no move.
            }, 1500);
        } else {
            // Highlight valid tokens for current player
            highlightValidTokens(this.state.turn, validTokens);
        }

        this.updateUIState();
    }

    /**
     * Determine which tokens can legally move with the given dice value
     */
    getValidTokens(color, diceVal) {
        const player = this.state.players[color];
        const validTokenIds = [];

        player.tokens.forEach(token => {
            if (token.state === 'home') return; // Finished tokens cannot move

            if (token.state === 'base') {
                // Can only leave base on a 6
                if (diceVal === 6) {
                    validTokenIds.push(token.id);
                }
            } else if (token.state === 'path' || token.state === 'stretch') {
                // Check if move exceeds home or fits inside track
                if (this.canMoveToken(color, token, diceVal)) {
                    validTokenIds.push(token.id);
                }
            }
        });

        return validTokenIds;
    }

    /**
     * Test if a specific token can make the move
     */
    canMoveToken(color, token, diceVal) {
        if (token.state === 'base') return diceVal === 6;

        let currentPos = token.position;
        
        if (token.state === 'path') {
            const pathArray = PATHS[color];
            const currentIndex = pathArray.indexOf(currentPos);
            const targetIndex = currentIndex + diceVal;

            // If targetIndex is within main path
            if (targetIndex < pathArray.length) {
                return true;
            } else {
                // Entering home stretch or finishing
                const stretchStepsTaken = targetIndex - pathArray.length;
                const stretchArray = HOME_STRETCHES[color];
                if (stretchStepsTaken <= stretchArray.length) {
                    return true;
                }
                return false;
            }
        } else if (token.state === 'stretch') {
            const stretchArray = HOME_STRETCHES[color];
            const currentIndex = stretchArray.indexOf(currentPos);
            const targetIndex = currentIndex + diceVal;

            if (targetIndex < stretchArray.length) {
                return true;
            } else if (targetIndex === stretchArray.length) {
                return true; // Exact landing on home!
            }
            return false; // Overshoot home
        }

        return false;
    }

    /**
     * Execute token selection and movement
     */
    async selectToken(color, tokenId) {
        if (this.state.gameEnded) return;
        if (!this.state.hasRolled) {
            showMoveFeedback("Roll the dice first!");
            return;
        }
        if (this.state.turn !== color) return;

        const player = this.state.players[color];
        const token = player.tokens.find(t => t.id === tokenId);
        const diceVal = this.state.diceVal;

        const validTokens = this.getValidTokens(color, diceVal);
        if (!validTokens.includes(tokenId)) {
            showMoveFeedback("Invalid move for this token!");
            return;
        }

        clearHighlights();
        this.state.hasRolled = false; // lock rolling until next turn

        // Perform movement animation step by step or direct
        await this.moveTokenStepByStep(color, token, diceVal);

        // Check Win Condition
        if (this.checkWinCondition(color)) {
            this.handleWin(color);
            return;
        }

        // Extra turn rules: rolling a 6 grants another turn (max 3 consecutive sixes)
        let grantExtraTurn = false;
        if (diceVal === 6) {
            this.state.consecutiveSixes++;
            if (this.state.consecutiveSixes >= 3) {
                this.logMessage(`${player.name} rolled three 6s in a row! Turn forfeited.`);
                showMoveFeedback("Three 6s! Turn forfeited.");
                this.state.consecutiveSixes = 0;
                grantExtraTurn = false;
            } else {
                this.logMessage(`${player.name} rolled a 6 and gets another turn! 🎲`);
                showMoveFeedback("Bonus Turn (Rolled 6)!");
                grantExtraTurn = true;
            }
        } else {
            this.state.consecutiveSixes = 0;
        }

        this.nextTurn(grantExtraTurn);
    }

    /**
     * Animate token movement along the path
     */
    async moveTokenStepByStep(color, token, diceVal) {
        if (token.state === 'base' && diceVal === 6) {
            // Move from base to start position
            token.state = 'path';
            token.position = START_POSITIONS[color];
            updateTokenDOM(color, token.id, token.position, token.state);
            this.checkCapture(color, token.position);
            return;
        }

        // Traverse step by step for visual smoothness
        for (let i = 0; i < diceVal; i++) {
            let nextPosInfo = this.getNextPosition(color, token);
            token.state = nextPosInfo.state;
            token.position = nextPosInfo.position;

            updateTokenDOM(color, token.id, token.position, token.state);
            await new Promise(resolve => setTimeout(resolve, 120)); // animation tick delay
        }

        // After final step, check for capture if on main path
        if (token.state === 'path') {
            this.checkCapture(color, token.position);
        }
    }

    /**
     * Calculate next position for a token given current state & position
     */
    getNextPosition(color, token) {
        const pathArray = PATHS[color];
        const stretchArray = HOME_STRETCHES[color];

        if (token.state === 'path') {
            const currentIndex = pathArray.indexOf(token.position);
            if (currentIndex < pathArray.length - 1) {
                return { state: 'path', position: pathArray[currentIndex + 1] };
            } else {
                // Transition to home stretch first step
                return { state: 'stretch', position: stretchArray[0] };
            }
        } else if (token.state === 'stretch') {
            const currentIndex = stretchArray.indexOf(token.position);
            if (currentIndex < stretchArray.length - 1) {
                return { state: 'stretch', position: stretchArray[currentIndex + 1] };
            } else if (currentIndex === stretchArray.length - 1) {
                return { state: 'home', position: WINNING_POSITIONS[color] };
            }
        }

        return { state: token.state, position: token.position };
    }

    /**
     * Check if landing on an opponent's token captures it back to base
     */
    checkCapture(moverColor, position) {
        // Safe spots in Ludo (standard start positions or star spots)
        const safeSpots = [0, 8, 13, 21, 26, 34, 39, 47]; // universal board index reference if applicable
        // For simplicity in our 2-player grid, let's check opposing tokens on the exact board coordinate
        const opponentColor = moverColor === 'red' ? 'blue' : 'red';
        const opponent = this.state.players[opponentColor];

        opponent.tokens.forEach(opToken => {
            if (opToken.state === 'path' && opToken.position === position) {
                // Capture! Send back to base
                opToken.state = 'base';
                opToken.position = -1;
                updateTokenDOM(opponentColor, opToken.id, -1, 'base');
                
                this.logMessage(`⚡ ${this.state.players[moverColor].name} captured ${opponent.name}'s token!`);
                showMoveFeedback("CAPTURE! ⚡");
            }
        });
    }

    /**
     * Check if player has all 4 tokens home
     */
    checkWinCondition(color) {
        const player = this.state.players[color];
        const allHome = player.tokens.every(t => t.state === 'home');
        return allHome;
    }

    /**
     * Handle Win Event
     */
    handleWin(color) {
        this.state.gameEnded = true;
        this.state.winner = color;
        const winnerName = this.state.players[color].name;

        this.logMessage(`🏆 ${winnerName} has won the Royal Ludo match! Congratulations!`);
        
        // Trigger UI Victory Modal
        const victoryModal = document.getElementById('victoryModal');
        const winnerText = document.getElementById('winnerText');
        if (victoryModal && winnerText) {
            winnerText.textContent = `${winnerName} Wins the Match! 🎉`;
            victoryModal.classList.remove('hidden');
        }
    }

    /**
     * Advance turn to the other player
     */
    nextTurn(extraTurn = false) {
        if (this.state.gameEnded) return;

        if (!extraTurn) {
            this.state.turn = this.state.turn === 'red' ? 'blue' : 'red';
            this.logMessage(`Turn passed to ${this.state.players[this.state.turn].name}.`);
        }

        this.state.diceVal = null;
        this.state.hasRolled = false;
        clearHighlights();
        this.updateUIState();
    }

    /**
     * Update UI indicators (turn banners, status text, timers)
     */
    updateUIState() {
        const turnIndicatorRed = document.getElementById('turnIndicatorRed');
        const turnIndicatorBlue = document.getElementById('turnIndicatorBlue');
        const diceBtn = document.getElementById('diceBtn');
        const currentPlayerText = document.getElementById('currentPlayerText');

        if (currentPlayerText) {
            currentPlayerText.textContent = `${this.state.players[this.state.turn].name}'s Turn`;
            currentPlayerText.style.color = this.state.players[this.state.turn].color;
        }

        if (turnIndicatorRed && turnIndicatorBlue) {
            if (this.state.turn === 'red') {
                turnIndicatorRed.classList.remove('opacity-40', 'scale-95');
                turnIndicatorRed.classList.add('ring-4', 'ring-rose-500/50', 'scale-105');
                turnIndicatorBlue.classList.add('opacity-40', 'scale-95');
                turnIndicatorBlue.classList.remove('ring-4', 'ring-blue-500/50', 'scale-105');
            } else {
                turnIndicatorBlue.classList.remove('opacity-40', 'scale-95');
                turnIndicatorBlue.classList.add('ring-4', 'ring-blue-500/50', 'scale-105');
                turnIndicatorRed.classList.add('opacity-40', 'scale-95');
                turnIndicatorRed.classList.remove('ring-4', 'ring-rose-500/50', 'scale-105');
            }
        }

        if (diceBtn) {
            diceBtn.style.borderColor = this.state.players[this.state.turn].color;
        }
    }

    /**
     * Append to game activity log
     */
    logMessage(msg) {
        const logContainer = document.getElementById('gameLog');
        if (!logContainer) return;

        const p = document.createElement('div');
        p.className = 'text-xs text-slate-300 py-1 border-b border-slate-800/50 animate-fade-in flex items-center space-x-2';
        p.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span><span>${msg}</span>`;
        logContainer.prepend(p);

        // Keep last 30 logs max
        if (logContainer.children.length > 30) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }
}