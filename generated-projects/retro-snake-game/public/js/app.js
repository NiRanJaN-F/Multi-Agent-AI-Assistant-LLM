/**
 * public/js/app.js
 * Principal Software Engineer & Senior UI/UX Designer
 * Main frontend application controller handling view state, UI bindings, audio, chat, and socket coordination.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // DOM Elements Cache
    const setupScreen = document.getElementById('setupScreen');
    const waitingScreen = document.getElementById('waitingScreen');
    const gameScreen = document.getElementById('gameScreen');
    const connectionStatus = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');

    // Setup Options
    const localModeBtn = document.getElementById('localModeBtn');
    const onlineModeBtn = document.getElementById('onlineModeBtn');
    const localSetupPanel = document.getElementById('localSetupPanel');
    const onlineSetupPanel = document.getElementById('onlineSetupPanel');
    const startLocalGameBtn = document.getElementById('startLocalGameBtn');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const roomCodeInput = document.getElementById('roomCodeInput');
    const displayRoomCode = document.getElementById('displayRoomCode');
    const copyRoomCodeBtn = document.getElementById('copyRoomCodeBtn');

    // Player Names & Avatars
    const p1NameInput = document.getElementById('p1NameInput');
    const p2NameInput = document.getElementById('p2NameInput');
    const p1AvatarSelect = document.getElementById('p1AvatarSelect');
    const p2AvatarSelect = document.getElementById('p2AvatarSelect');

    // Game HUD Elements
    const player1Card = document.getElementById('player1Card');
    const player2Card = document.getElementById('player2Card');
    const p1NameDisplay = document.getElementById('p1NameDisplay');
    const p2NameDisplay = document.getElementById('p2NameDisplay');
    const p1AvatarDisplay = document.getElementById('p1AvatarDisplay');
    const p2AvatarDisplay = document.getElementById('p2AvatarDisplay');
    const p1Score = document.getElementById('p1Score');
    const p2Score = document.getElementById('p2Score');
    const p1Timer = document.getElementById('p1Timer');
    const p2Timer = document.getElementById('p2Timer');

    // Action Panel
    const rollDiceBtn = document.getElementById('rollDiceBtn');
    const diceContainer = document.getElementById('diceContainer');
    const actionMessage = document.getElementById('actionMessage');
    const passTurnBtn = document.getElementById('passTurnBtn');

    // Modals
    const rulesModal = document.getElementById('rulesModal');
    const rulesBtn = document.getElementById('rulesBtn');
    const closeRulesModal = document.getElementById('closeRulesModal');
    const gameOverModal = document.getElementById('gameOverModal');
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerName = document.getElementById('winnerName');
    const winnerStats = document.getElementById('winnerStats');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const exitToMenuBtn = document.getElementById('exitToMenuBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const soundToggle = document.getElementById('soundToggle');

    // Chat
    const chatToggle = document.getElementById('chatToggle');
    const chatContainer = document.getElementById('chatContainer');
    const closeChat = document.getElementById('closeChat');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const chatBadge = document.getElementById('chatBadge');

    // State Variables
    let socket = null;
    let isOnline = false;
    let roomCode = null;
    let myPlayerId = 'red'; // 'red' or 'green'
    let unreadChatCount = 0;

    // Initialize Socket.io connection safely
    try {
        if (typeof io !== 'undefined') {
            socket = io();
            setupSocketListeners();
        } else {
            console.warn('Socket.io not loaded. Online mode will be disabled.');
            connectionStatus.classList.remove('bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');
            connectionStatus.classList.add('bg-amber-500/10', 'border-amber-500/20', 'text-amber-400');
            statusText.textContent = 'Offline Mode';
        }
    } catch (e) {
        console.error('Failed to initialize socket:', e);
    }

    // UI Mode Switching
    localModeBtn.addEventListener('click', () => {
        localModeBtn.classList.add('border-indigo-500', 'bg-slate-800/80', 'shadow-lg');
        localModeBtn.classList.remove('border-slate-800', 'bg-slate-900/40');
        onlineModeBtn.classList.remove('border-indigo-500', 'bg-slate-800/80', 'shadow-lg');
        onlineModeBtn.classList.add('border-slate-800', 'bg-slate-900/40');

        localSetupPanel.classList.remove('hidden');
        onlineSetupPanel.classList.add('hidden');
        isOnline = false;
    });

    onlineModeBtn.addEventListener('click', () => {
        onlineModeBtn.classList.add('border-indigo-500', 'bg-slate-800/80', 'shadow-lg');
        onlineModeBtn.classList.remove('border-slate-800', 'bg-slate-900/40');
        localModeBtn.classList.remove('border-indigo-500', 'bg-slate-800/80', 'shadow-lg');
        localModeBtn.classList.add('border-slate-800', 'bg-slate-900/40');

        onlineSetupPanel.classList.remove('hidden');
        localSetupPanel.classList.add('hidden');
        isOnline = true;
    });

    // Start Local Game
    startLocalGameBtn.addEventListener('click', () => {
        const p1Name = p1NameInput.value.trim() || 'Player 1 (Red)';
        const p2Name = p2NameInput.value.trim() || 'Player 2 (Green)';
        const p1Avatar = p1AvatarSelect.value;
        const p2Avatar = p2AvatarSelect.value;

        // Initialize Game Engine
        GameEngine.initLocalGame({
            players: {
                red: { name: p1Name, avatar: p1Avatar },
                green: { name: p2Name, avatar: p2Avatar }
            }
        });

        transitionToGameScreen(p1Name, p2Name, p1Avatar, p2Avatar);
    });

    // Online Room Actions
    createRoomBtn.addEventListener('click', () => {
        if (!socket) {
            alert('Cannot connect to server for online play.');
            return;
        }
        const pName = p1NameInput.value.trim() || 'Host Player';
        const pAvatar = p1AvatarSelect.value;

        socket.emit('create-room', { playerName: pName, avatar: pAvatar });
    });

    joinRoomBtn.addEventListener('click', () => {
        if (!socket) {
            alert('Cannot connect to server for online play.');
            return;
        }
        const code = roomCodeInput.value.trim().toUpperCase();
        if (!code) {
            alert('Please enter a valid room code.');
            return;
        }
        const pName = p2NameInput.value.trim() || 'Guest Player';
        const pAvatar = p2AvatarSelect.value;

        socket.emit('join-room', { roomCode: code, playerName: pName, avatar: pAvatar });
    });

    copyRoomCodeBtn.addEventListener('click', () => {
        if (roomCode) {
            navigator.clipboard.writeText(roomCode);
            copyRoomCodeBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>`;
            lucide.createIcons();
            setTimeout(() => {
                copyRoomCodeBtn.innerHTML = `<i data-lucide="copy" class="w-4 h-4"></i>`;
                lucide.createIcons();
            }, 2000);
        }
    });

    // Dice Roll Event
    rollDiceBtn.addEventListener('click', () => {
        if (isOnline && GameEngine.getCurrentTurn() !== myPlayerId) {
            showToast("Not your turn!", "warning");
            return;
        }

        if (GameEngine.isWaitingForRoll()) {
            Dice.rollDice((rolledValue) => {
                if (isOnline) {
                    socket.emit('roll-dice', { roomCode, value: rolledValue });
                } else {
                    GameEngine.handleDiceRoll(rolledValue);
                }
            });
        }
    });

    // Pass Turn Event
    passTurnBtn.addEventListener('click', () => {
        if (isOnline && GameEngine.getCurrentTurn() !== myPlayerId) return;
        
        if (isOnline) {
            socket.emit('pass-turn', { roomCode });
        } else {
            GameEngine.passTurn();
        }
    });

    // Modal Control Handlers
    rulesBtn.addEventListener('click', () => rulesModal.classList.remove('hidden'));
    closeRulesModal.addEventListener('click', () => rulesModal.classList.add('hidden'));

    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsModal.addEventListener('click', () => settingsModal.classList.add('hidden'));

    soundToggle.addEventListener('change', (e) => {
        if (typeof SoundFX !== 'undefined') {
            SoundFX.setMuted(!e.target.checked);
        }
    });

    playAgainBtn.addEventListener('click', () => {
        gameOverModal.classList.add('hidden');
        if (isOnline) {
            socket.emit('restart-game', { roomCode });
        } else {
            GameEngine.restartGame();
        }
    });

    exitToMenuBtn.addEventListener('click', () => {
        gameOverModal.classList.add('hidden');
        gameScreen.classList.add('hidden');
        waitingScreen.classList.add('hidden');
        setupScreen.classList.remove('hidden');
        if (isOnline && socket) {
            socket.disconnect();
            socket.connect();
        }
    });

    // Chat Panel Toggles
    chatToggle.addEventListener('click', () => {
        chatContainer.classList.toggle('hidden');
        if (!chatContainer.classList.contains('hidden')) {
            unreadChatCount = 0;
            chatBadge.classList.add('hidden');
            chatInput.focus();
        }
    });

    closeChat.addEventListener('click', () => {
        chatContainer.classList.add('hidden');
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg) return;

        const senderName = isOnline ? (myPlayerId === 'red' ? p1NameInput.value : p2NameInput.value) : GameEngine.getCurrentPlayerName();
        
        if (isOnline && socket) {
            socket.emit('chat-message', { roomCode, sender: senderName, message: msg });
        } else {
            appendChatMessage(senderName, msg, true);
        }

        chatInput.value = '';
    });

    // Socket Event Listeners for Online Mode
    function setupSocketListeners() {
        socket.on('connect', () => {
            connectionStatus.classList.remove('bg-amber-500/10', 'border-amber-500/20', 'text-amber-400');
            connectionStatus.classList.add('bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');
            statusText.textContent = 'Connected Online';
        });

        socket.on('disconnect', () => {
            connectionStatus.classList.remove('bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');
            connectionStatus.classList.add('bg-amber-500/10', 'border-amber-500/20', 'text-amber-400');
            statusText.textContent = 'Disconnected';
        });

        socket.on('room-created', (data) => {
            roomCode = data.roomCode;
            displayRoomCode.textContent = roomCode;
            setupScreen.classList.add('hidden');
            waitingScreen.classList.remove('hidden');
            myPlayerId = 'red';
        });

        socket.on('room-joined', (data) => {
            roomCode = data.roomCode;
            myPlayerId = 'green';
        });

        socket.on('start-game', (gameState) => {
            setupScreen.classList.add('hidden');
            waitingScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');

            const p1 = gameState.players.red;
            const p2 = gameState.players.green;
            transitionToGameScreen(p1.name, p2.name, p1.avatar, p2.avatar);
            GameEngine.syncGameState(gameState);
        });

        socket.on('game-state-updated', (gameState) => {
            GameEngine.syncGameState(gameState);
        });

        socket.on('dice-rolled', (data) => {
            Dice.animateSpecificRoll(data.value, () => {
                GameEngine.handleRemoteDiceRoll(data.value, data.turn);
            });
        });

        socket.on('chat-message', (data) => {
            const isMe = data.senderId === socket.id;
            appendChatMessage(data.sender, data.message, isMe);
            if (chatContainer.classList.contains('hidden')) {
                unreadChatCount++;
                chatBadge.textContent = unreadChatCount;
                chatBadge.classList.remove('hidden');
            }
        });
    }

    function transitionToGameScreen(p1Name, p2Name, p1Avatar, p2Avatar) {
        setupScreen.classList.add('hidden');
        waitingScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        p1NameDisplay.textContent = p1Name;
        p2NameDisplay.textContent = p2Name;
        p1AvatarDisplay.textContent = p1Avatar;
        p2AvatarDisplay.textContent = p2Avatar;

        // Initialize Board UI
        Board.initBoard();
        GameEngine.startGameLoop({
            onStateChange: updateHUD,
            onGameOver: handleGameOver,
            onMessage: showToast
        });

        lucide.createIcons();
    }

    function updateHUD(state) {
        const currentTurn = state.turn;

        // Highlight Active Player Card
        if (currentTurn === 'red') {
            player1Card.classList.add('ring-4', 'ring-rose-500/50', 'scale-105', 'bg-slate-800/90');
            player1Card.classList.remove('opacity-60');
            player2Card.classList.remove('ring-4', 'ring-emerald-500/50', 'scale-105', 'bg-slate-800/90');
            player2Card.classList.add('opacity-60');
        } else {
            player2Card.classList.add('ring-4', 'ring-emerald-500/50', 'scale-105', 'bg-slate-800/90');
            player2Card.classList.remove('opacity-60');
            player1Card.classList.remove('ring-4', 'ring-rose-500/50', 'scale-105', 'bg-slate-800/90');
            player1Card.classList.add('opacity-60');
        }

        // Scores
        p1Score.textContent = `${state.scores.red}/4 Home`;
        p2Score.textContent = `${state.scores.green}/4 Home`;

        // Action Message
        if (isOnline && currentTurn !== myPlayerId) {
            actionMessage.textContent = `Waiting for ${state.players[currentTurn].name}...`;
            rollDiceBtn.disabled = true;
            rollDiceBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            if (state.diceRolled) {
                actionMessage.textContent = state.validMovesExist ? "Select a token to move!" : "No valid moves. Pass turn.";
                rollDiceBtn.disabled = true;
                rollDiceBtn.classList.add('opacity-50', 'cursor-not-allowed');
                if (!state.validMovesExist) {
                    passTurnBtn.classList.remove('hidden');
                } else {
                    passTurnBtn.classList.add('hidden');
                }
            } else {
                actionMessage.textContent = `${state.players[currentTurn].name}'s Turn - Roll Dice!`;
                rollDiceBtn.disabled = false;
                rollDiceBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                passTurnBtn.classList.add('hidden');
            }
        }
    }

    function handleGameOver(winnerColor, winnerData) {
        winnerAvatar.textContent = winnerData.avatar;
        winnerName.textContent = `${winnerData.name} Wins!`;
        winnerStats.textContent = `Successfully brought all 4 tokens home in a glorious victory!`;
        gameOverModal.classList.remove('hidden');
        if (typeof SoundFX !== 'undefined') {
            SoundFX.playVictory();
        }
    }

    function appendChatMessage(sender, message, isMe) {
        const div = document.createElement('div');
        div.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'}`;
        div.innerHTML = `
            <span class="text-[10px] text-slate-400 mb-0.5 px-1">${escapeHTML(sender)}</span>
            <div class="px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}">
                ${escapeHTML(message)}
            </div>
        `;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        let bgClass = 'bg-slate-900 border-slate-700 text-slate-100';
        if (type === 'success') bgClass = 'bg-emerald-950 border-emerald-500/50 text-emerald-200';
        if (type === 'warning') bgClass = 'bg-amber-950 border-amber-500/50 text-amber-200';
        if (type === 'error') bgClass = 'bg-rose-950 border-rose-500/50 text-rose-200';

        toast.className = `fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center space-x-3 transition-all duration-300 transform translate-y-10 opacity-0 ${bgClass}`;
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-triangle' : 'info'}" class="w-5 h-5"></i>
            <span class="text-sm font-medium">${escapeHTML(message)}</span>
        `;
        document.body.appendChild(toast);
        lucide.createIcons();

        setTimeout(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        }, 10);

        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
});