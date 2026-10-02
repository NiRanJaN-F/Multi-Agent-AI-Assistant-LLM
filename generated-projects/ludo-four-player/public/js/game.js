/**
 * LUDO ROYAL - Client Game Controller (game.js)
 * Manages socket connections, UI transitions, lobby management, chat, 
 * audio feedback, dice rolling, and board rendering synchronization.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Socket initialization
    const socket = io();

    // App State
    let currentUser = {
        name: localStorage.getItem('ludo_username') || `Player_${Math.floor(Math.random() * 9000 + 1000)}`,
        avatar: localStorage.getItem('ludo_avatar') || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
    };
    
    let currentRoomId = null;
    let myPlayerColor = null;
    let isMyTurn = false;
    let roomData = null;
    let audioEnabled = true;

    // DOM Elements Mapping
    const views = {
        lobby: document.getElementById('lobbyView'),
        room: document.getElementById('roomView'),
        game: document.getElementById('gameView')
    };

    const modals = {
        rules: document.getElementById('rulesModal'),
        avatar: document.getElementById('avatarModal'),
        chat: document.getElementById('chatDrawer')
    };

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Set initial username inputs
    const usernameInput = document.getElementById('usernameInput');
    const profileNameInput = document.getElementById('profileNameInput');
    const playerAvatarImg = document.getElementById('playerAvatarImg');
    const navAvatarImg = document.getElementById('navAvatarImg');

    if (usernameInput) usernameInput.value = currentUser.name;
    if (profileNameInput) profileNameInput.value = currentUser.name;
    if (playerAvatarImg) playerAvatarImg.src = currentUser.avatar;
    if (navAvatarImg) navAvatarImg.src = currentUser.avatar;

    // Save username event
    const saveUsernameBtn = document.getElementById('saveUsernameBtn');
    if (saveUsernameBtn) {
        saveUsernameBtn.addEventListener('click', () => {
            const val = profileNameInput.value.trim();
            if (val) {
                currentUser.name = val;
                localStorage.setItem('ludo_username', val);
                if (navAvatarImg) navAvatarImg.src = currentUser.avatar;
                showToast('Username updated successfully!', 'success');
                closeAllModals();
            }
        });
    }

    // Navigation & View Controller
    function switchView(viewName) {
        Object.keys(views).forEach(key => {
            if (views[key]) {
                if (key === viewName) {
                    views[key].classList.remove('hidden');
                    views[key].classList.add('flex');
                } else {
                    views[key].classList.add('hidden');
                    views[key].classList.remove('flex');
                }
            }
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Toast Notifications System
    window.showToast = function(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        let bgClass = 'bg-slate-900 border-slate-700 text-slate-100';
        let iconName = 'info';

        if (type === 'success') {
            bgClass = 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200';
            iconName = 'check-circle-2';
        } else if (type === 'error') {
            bgClass = 'bg-rose-950/90 border-rose-500/50 text-rose-200';
            iconName = 'alert-circle';
        } else if (type === 'warning') {
            bgClass = 'bg-amber-950/90 border-amber-500/50 text-amber-200';
            iconName = 'alert-triangle';
        }

        toast.className = `flex items-center space-x-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md transform transition-all duration-300 translate-y-4 opacity-0 ${bgClass}`;
        toast.innerHTML = `
            <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
            <span class="text-sm font-medium">${message}</span>
        `;

        container.appendChild(toast);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-4', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    function closeAllModals() {
        Object.values(modals).forEach(modal => {
            if (modal) modal.classList.add('hidden');
        });
    }

    // Modal Triggers
    const rulesBtn = document.getElementById('rulesBtn');
    const closeRulesModal = document.getElementById('closeRulesModal');
    if (rulesBtn) rulesBtn.addEventListener('click', () => modals.rules.classList.remove('hidden'));
    if (closeRulesModal) closeRulesModal.addEventListener('click', () => modals.rules.classList.add('hidden'));

    const profileBtn = document.getElementById('profileBtn');
    const closeAvatarModal = document.getElementById('closeAvatarModal');
    if (profileBtn) profileBtn.addEventListener('click', () => modals.avatar.classList.remove('hidden'));
    if (closeAvatarModal) closeAvatarModal.addEventListener('click', () => modals.avatar.classList.add('hidden'));

    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const closeChatDrawer = document.getElementById('closeChatDrawer');
    if (chatToggleBtn) chatToggleBtn.addEventListener('click', () => modals.chat.classList.toggle('translate-x-full'));
    if (closeChatDrawer) closeChatDrawer.addEventListener('click', () => modals.chat.classList.add('translate-x-full'));

    // Audio Mute Toggle
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', () => {
            audioEnabled = !audioEnabled;
            soundToggleBtn.innerHTML = audioEnabled ? '<i data-lucide="volume-2" class="w-5 h-5"></i>' : '<i data-lucide="volume-x" class="w-5 h-5"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            showToast(audioEnabled ? 'Audio enabled' : 'Audio muted', 'info');
        });
    }

    // Quick Play / Create Room Buttons
    const quickPlayBtn = document.getElementById('quickPlayBtn');
    if (quickPlayBtn) {
        quickPlayBtn.addEventListener('click', () => {
            socket.emit('quick_match', { name: currentUser.name, avatar: currentUser.avatar });
            showToast('Searching for a quick match...', 'info');
        });
    }

    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            socket.emit('create_room', { name: currentUser.name, avatar: currentUser.avatar });
            showToast('Creating private room...', 'info');
        });
    }

    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const roomCodeInput = document.getElementById('roomCodeInput');
    if (joinRoomBtn && roomCodeInput) {
        joinRoomBtn.addEventListener('click', () => {
            const code = roomCodeInput.value.trim().toUpperCase();
            if (code) {
                socket.emit('join_room', { roomId: code, name: currentUser.name, avatar: currentUser.avatar });
                showToast(`Joining room ${code}...`, 'info');
            } else {
                showToast('Please enter a valid room code', 'error');
            }
        });
    }

    // Game Actions & Dice Roll Handler
    const rollDiceBtn = document.getElementById('rollDiceBtn');
    if (rollDiceBtn) {
        rollDiceBtn.addEventListener('click', () => {
            // Generate local random number (1-6) immediately for responsive feedback
            const rolledValue = Math.floor(Math.random() * 6) + 1;
            showToast(`Rolled a ${rolledValue}!`, 'success');

            if (window.rollDiceAnimation && typeof window.rollDiceAnimation === 'function') {
                window.rollDiceAnimation(rolledValue);
            }

            // Sync with server if in room
            if (currentRoomId) {
                socket.emit('roll_dice', { roomId: currentRoomId, value: rolledValue });
            }
        });
    }

    // Socket Event Listeners
    socket.on('room_joined', (data) => {
        currentRoomId = data.roomId;
        roomData = data.room;
        switchView('room');

        const displayRoomCode = document.getElementById('displayRoomCode');
        if (displayRoomCode) displayRoomCode.innerText = currentRoomId;

        updateRoomPlayersList(roomData.players);
        showToast(`Successfully joined room: ${currentRoomId}`, 'success');
    });

    socket.on('player_joined', (data) => {
        roomData = data.room;
        updateRoomPlayersList(roomData.players);
        showToast('A new player joined the room', 'info');
    });

    socket.on('game_started', (data) => {
        roomData = data.room;
        switchView('game');
        showToast('Game has started! Good luck!', 'success');

        // Initialize Ludo Board UI
        if (window.initLudoBoard && typeof window.initLudoBoard === 'function') {
            window.initLudoBoard(roomData);
        }
    });

    socket.on('dice_rolled', (data) => {
        showToast(`${data.playerName} rolled a ${data.value}`, 'info');
        if (window.rollDiceAnimation && typeof window.rollDiceAnimation === 'function') {
            window.rollDiceAnimation(data.value);
        }
    });

    socket.on('error', (message) => {
        showToast(message, 'error');
    });

    function updateRoomPlayersList(players) {
        const container = document.getElementById('roomPlayersList');
        if (!container) return;

        container.innerHTML = '';
        players.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'flex items-center justify-between p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl';
            card.innerHTML = `
                <div class="flex items-center space-x-3">
                    <img src="${p.avatar}" class="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500" />
                    <div>
                        <h4 class="font-bold text-slate-100">${p.name}</h4>
                        <span class="text-xs text-slate-400">Player ${idx + 1}</span>
                    </div>
                </div>
                <span class="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-full">Ready</span>
            `;
            container.appendChild(card);
        });
    }

    // Initialize Board on startup if present
    if (window.initLudoBoard && typeof window.initLudoBoard === 'function') {
        window.initLudoBoard();
    }
});