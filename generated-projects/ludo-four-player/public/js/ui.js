/**
 * ui.js — Senior UI/UX Rendering & Interaction Manager
 * Responsible for DOM rendering, card templates, animations, toast alerts, modal control,
 * and seamless Lucide icon synchronization.
 */

import { getCandidates, addCandidate, deleteCandidate, voteForCandidate, getVoterStatus, verifyVoterCredentials, resetSystem, getStorageStats } from './storage.js';

/**
 * Initializes all UI event listeners, renders initial views, and sets up DOM bindings.
 */
export function initUI() {
    seedPredefinedCandidatesIfNeeded();
    renderCandidates();
    updateLiveTallyBadge();
    bindGlobalEventListeners();
}

/**
 * Ensures there are pre-defined candidates to vote for if the list is empty.
 */
function seedPredefinedCandidatesIfNeeded() {
    const candidates = getCandidates();
    if (candidates.length === 0) {
        const predefined = [
            {
                name: "Dr. Elena Vance",
                party: "Tech & Progress Party",
                manifesto: "Advancing open-source infrastructure, digital literacy, and sustainable green data centers for all citizens.",
                image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
                tags: ["Tech", "Sustainability", "Education"]
            },
            {
                name: "Marcus Sterling",
                party: "Economic Freedom Coalition",
                manifesto: "Fostering small business innovation, decentralized economic resilience, and transparent fiscal policies.",
                image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80",
                tags: ["Economy", "Innovation", "Transparency"]
            },
            {
                name: "Aria Chen",
                party: "Green Horizon Alliance",
                manifesto: "Committed to 100% renewable energy grids, urban forestry initiatives, and public transit modernization.",
                image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80",
                tags: ["Environment", "Transit", "Energy"]
            }
        ];

        predefined.forEach(c => addCandidate(c));
    }
}

/**
 * Renders the candidate grid based on optional filter/search criteria.
 * @param {string} filterQuery 
 */
export function renderCandidates(filterQuery = '') {
    const gridContainer = document.getElementById('candidatesGrid');
    if (!gridContainer) return;

    let candidates = getCandidates();

    if (filterQuery.trim() !== '') {
        const query = filterQuery.toLowerCase();
        candidates = candidates.filter(c => 
            c.name.toLowerCase().includes(query) ||
            c.party.toLowerCase().includes(query) ||
            c.manifesto.toLowerCase().includes(query) ||
            c.tags.some(t => t.toLowerCase().includes(query))
        );
    }

    if (candidates.length === 0) {
        gridContainer.innerHTML = `
            <div class="col-span-full py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <i data-lucide="search-x" class="w-8 h-8"></i>
                </div>
                <h3 class="text-lg font-semibold text-slate-200">No candidates found</h3>
                <p class="text-sm text-slate-400 mt-1">Try searching with different keywords or manifesto terms.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    const voter = getVoterStatus();
    const hasVoted = voter.hasVoted;

    gridContainer.innerHTML = candidates.map((candidate, index) => {
        const isUserChoice = voter.votedCandidateId === candidate.id;
        const tagsHtml = candidate.tags.map(tag => 
            `<span class="px-2.5 py-1 text-[11px] font-medium bg-slate-800/80 text-indigo-300 rounded-lg border border-slate-700/50">${tag}</span>`
        ).join('');

        return `
            <div class="group relative bg-slate-900/80 border ${isUserChoice ? 'border-emerald-500/80 shadow-emerald-500/10' : 'border-slate-800/80 hover:border-slate-700'} rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between" style="animation: fadeIn 0.4s ease-out ${index * 0.05}s">
                ${isUserChoice ? `
                    <div class="absolute top-3 right-3 z-20 bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-full text-xs flex items-center space-x-1 shadow-lg shadow-emerald-500/20">
                        <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                        <span>Your Vote</span>
                    </div>
                ` : ''}

                <div>
                    <!-- Header Image & Badge -->
                    <div class="relative h-48 overflow-hidden bg-slate-950">
                        <img src="${candidate.image}" alt="${candidate.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90">
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40"></div>
                        
                        <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <span class="px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700/50 text-xs font-semibold text-slate-200">
                                ${candidate.party}
                            </span>
                        </div>
                    </div>

                    <!-- Body Content -->
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-white tracking-tight mb-1">${candidate.name}</h3>
                        <p class="text-sm text-slate-400 line-clamp-3 mb-4 leading-relaxed">${candidate.manifesto}</p>
                        
                        <div class="flex flex-wrap gap-1.5 mb-6">
                            ${tagsHtml}
                        </div>
                    </div>
                </div>

                <!-- Footer & Actions -->
                <div class="px-6 pb-6 pt-0 flex items-center justify-between border-t border-slate-800/60 mt-auto pt-4">
                    <div class="flex flex-col">
                        <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Votes</span>
                        <span class="text-lg font-black text-indigo-400">${candidate.votes || 0}</span>
                    </div>

                    <div class="flex items-center space-x-2">
                        <button onclick="window.handleVoteClick('${candidate.id}')" 
                                class="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                                    isUserChoice 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default' 
                                    : hasVoted 
                                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50'
                                }"
                                ${hasVoted ? 'disabled' : ''}>
                            <i data-lucide="${isUserChoice ? 'check' : 'vote'}" class="w-4 h-4"></i>
                            <span>${isUserChoice ? 'Voted' : 'Vote'}</span>
                        </button>
                        
                        <button onclick="window.handleDeleteCandidate('${candidate.id}')" class="p-2.5 rounded-xl bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/50 hover:border-rose-500/30 transition-colors" title="Delete Candidate">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
}

/**
 * Updates live tally badge stats.
 */
export function updateLiveTallyBadge() {
    const stats = getStorageStats();
    const badge = document.getElementById('liveTallyBadge');
    if (badge) {
        badge.textContent = `${stats.totalVotesCast} Votes Cast`;
    }
}

/**
 * Binds global event listeners for search inputs, modals, buttons, etc.
 */
export function bindGlobalEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderCandidates(e.target.value);
        });
    }

    const addCandidateForm = document.getElementById('addCandidateForm');
    if (addCandidateForm) {
        addCandidateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('candidateName').value;
            const party = document.getElementById('candidateParty').value;
            const manifesto = document.getElementById('candidateManifesto').value;
            const image = document.getElementById('candidateImage').value || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80';
            const tagsInput = document.getElementById('candidateTags').value;
            const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : ['General'];

            addCandidate({ name, party, manifesto, image, tags });
            renderCandidates();
            updateLiveTallyBadge();
            showToast('Candidate added successfully!', 'success');
            addCandidateForm.reset();
            closeModal('addCandidateModal');
        });
    }

    const voterVerifyForm = document.getElementById('voterVerifyForm');
    if (voterVerifyForm) {
        voterVerifyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const voterId = document.getElementById('voterIdInput').value;
            const isValid = verifyVoterCredentials(voterId);
            if (isValid) {
                showToast('Voter verified successfully!', 'success');
                closeModal('voterModal');
                renderCandidates();
            } else {
                showToast('Invalid or already used Voter ID.', 'error');
            }
        });
    }

    const resetSystemBtn = document.getElementById('resetSystemBtn');
    if (resetSystemBtn) {
        resetSystemBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the system? All votes and custom candidates will be cleared.')) {
                resetSystem();
                seedPredefinedCandidatesIfNeeded();
                renderCandidates();
                updateLiveTallyBadge();
                showToast('System has been reset.', 'info');
            }
        });
    }

    // Attach global handlers for inline onclick references
    window.handleVoteClick = (candidateId) => {
        const voter = getVoterStatus();
        if (voter.hasVoted) {
            showToast('You have already cast your vote!', 'warning');
            return;
        }

        const success = voteForCandidate(candidateId);
        if (success) {
            showToast('Vote successfully cast!', 'success');
            renderCandidates();
            updateLiveTallyBadge();
        } else {
            showToast('Unable to cast vote. Please verify your voter status.', 'error');
        }
    };

    window.handleDeleteCandidate = (candidateId) => {
        if (confirm('Are you sure you want to delete this candidate?')) {
            deleteCandidate(candidateId);
            renderCandidates();
            updateLiveTallyBadge();
            showToast('Candidate removed.', 'info');
        }
    };

    // Modal triggers
    const openAddModalBtn = document.getElementById('openAddCandidateModal');
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', () => {
            openModal('addCandidateModal');
        });
    }

    const openVoterModalBtn = document.getElementById('openVoterModal');
    if (openVoterModalBtn) {
        openVoterModalBtn.addEventListener('click', () => {
            openModal('voterModal');
        });
    }

    // Close buttons for modals
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close-modal');
            closeModal(modalId);
        });
    });
}

/**
 * Opens a designated modal by ID.
 * @param {string} modalId 
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * Closes a designated modal by ID.
 * @param {string} modalId 
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
}

/**
 * Displays a floating toast notification.
 * @param {string} message 
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    const bgColors = {
        success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
        error: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
        warning: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
        info: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
    };

    const icons = {
        success: 'check-circle-2',
        error: 'alert-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    toast.className = `flex items-center space-x-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-xl transition-all duration-300 transform translate-y-2 opacity-0 ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
        <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5 shrink-0"></i>
        <span class="text-sm font-medium">${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    // Trigger enter animation
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    // Remove after 3.5 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none';
    document.body.appendChild(container);
    return container;
}