/**
 * SecureVote - Main Application Logic (app.js)
 * Coordinates storage, UI rendering, candidate management, voting actions, and admin controls.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize application storage and default candidates
    Storage.init();
    Candidates.init();

    // Initial render
    renderApp();
    setupEventListeners();
    
    // Initialize Lucide icons if available
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
});

/**
 * Renders the entire dynamic UI state
 */
function renderApp() {
    const candidates = Candidates.getAll();
    const category = UI.getCurrentCategory();
    const searchQuery = UI.getSearchQuery();

    // Filter candidates based on active tab category and search query
    const filteredCandidates = candidates.filter(c => {
        const matchesCategory = category === 'all' || c.category === category;
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              c.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              c.manifesto.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Render candidate grid
    UI.renderCandidates(filteredCandidates);

    // Render live tally / results modal if open or update metrics
    UI.renderLiveTally();

    // Update global badge counts
    UI.updateBadges();

    // Re-initialize Lucide icons for dynamically added elements
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

/**
 * Setup all interactive event listeners across the application
 */
function setupEventListeners() {
    // 1. Search Bar Input
    const searchInput = document.getElementById('candidateSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            UI.setSearchQuery(e.target.value);
            renderApp();
        });
    }

    // 2. Category Filter Tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const category = e.currentTarget.getAttribute('data-category');
            categoryTabs.forEach(t => {
                t.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-600/30', 'border-indigo-500');
                t.classList.add('bg-slate-900', 'text-slate-400', 'border-slate-800');
            });
            e.currentTarget.classList.remove('bg-slate-900', 'text-slate-400', 'border-slate-800');
            e.currentTarget.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-600/30', 'border-indigo-500');
            
            UI.setCurrentCategory(category);
            renderApp();
        });
    });

    // 3. Live Tally / Results Modal Toggles
    const viewResultsBtn = document.getElementById('viewResultsBtn');
    const closeResultsModal = document.getElementById('closeResultsModal');
    const resultsModal = document.getElementById('resultsModal');

    if (viewResultsBtn) {
        viewResultsBtn.addEventListener('click', () => {
            UI.openModal('resultsModal');
            UI.renderLiveTally();
        });
    }

    if (closeResultsModal) {
        closeResultsModal.addEventListener('click', () => {
            UI.closeModal('resultsModal');
        });
    }

    if (resultsModal) {
        resultsModal.addEventListener('click', (e) => {
            if (e.target === resultsModal) UI.closeModal('resultsModal');
        });
    }

    // 4. Admin Portal Modal Toggles
    const openAdminModalBtn = document.getElementById('openAdminModalBtn');
    const closeAdminModal = document.getElementById('closeAdminModal');
    const adminModal = document.getElementById('adminModal');

    if (openAdminModalBtn) {
        openAdminModalBtn.addEventListener('click', () => {
            UI.openModal('adminModal');
            if (typeof UI.renderAdminCandidates === 'function') {
                UI.renderAdminCandidates();
            }
        });
    }

    if (closeAdminModal) {
        closeAdminModal.addEventListener('click', () => {
            UI.closeModal('adminModal');
        });
    }

    if (adminModal) {
        adminModal.addEventListener('click', (e) => {
            if (e.target === adminModal) UI.closeModal('adminModal');
        });
    }

    // 5. Add Candidate Form Submission (Admin)
    const addCandidateForm = document.getElementById('addCandidateForm');
    if (addCandidateForm) {
        addCandidateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('candidateNameInput');
            const partyInput = document.getElementById('candidatePartyInput');
            const categoryInput = document.getElementById('candidateCategoryInput');
            const manifestoInput = document.getElementById('candidateManifestoInput');
            const imageInput = document.getElementById('candidateImageInput');

            if (nameInput && partyInput && categoryInput && manifestoInput) {
                const newCandidate = {
                    name: nameInput.value.trim(),
                    party: partyInput.value.trim(),
                    category: categoryInput.value,
                    manifesto: manifestoInput.value.trim(),
                    image: imageInput && imageInput.value.trim() ? imageInput.value.trim() : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
                    votes: 0
                };

                Candidates.add(newCandidate);
                addCandidateForm.reset();
                renderApp();
                if (typeof UI.showToast === 'function') {
                    UI.showToast('Candidate added successfully!', 'success');
                }
            }
        });
    }

    // 6. Reset Election / Clear Storage Button
    const resetElectionBtn = document.getElementById('resetElectionBtn');
    if (resetElectionBtn) {
        resetElectionBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all votes and data? This action cannot be undone.')) {
                Storage.clear();
                Candidates.init();
                renderApp();
                if (typeof UI.showToast === 'function') {
                    UI.showToast('Election data has been reset.', 'info');
                }
            }
        });
    }
}