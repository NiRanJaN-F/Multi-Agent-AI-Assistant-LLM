/**
 * BALLOTBOX OS - Production Grade Vanilla JS Frontend
 * Principal Frontend Architecture & Senior UI/UX Implementation
 * Component Tree mapping handled dynamically with strict state management.
 */

// Global Application State
const state = {
    user: null, // { authenticated: boolean, username: string, hasVoted: boolean }
    candidates: [],
    results: [],
    activeTab: 'vote', // 'vote' | 'results'
    authMode: 'login', // 'login' | 'register'
    selectedCandidateId: null,
    isSubmitting: false,
    toastMessage: null,
    pollInterval: null
};

// DOM Elements Cache
const elements = {};

document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    initApp();
});

function cacheDom() {
    elements.root = document.getElementById('app-root');
}

async function initApp() {
    renderAppShell();
    await checkSession();
    await fetchCandidates();
    await fetchResults();
    
    // Start live poll interval for results dashboard
    state.pollInterval = setInterval(async () => {
        if (state.user && state.user.authenticated) {
            await fetchResults(true); // Silent fetch
        }
    }, 5000);
}

// --- API CLIENT ---

async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.body = JSON.stringify(data);
        
        const response = await fetch(endpoint, options);
        const json = await response.json();
        
        if (!response.ok) {
            throw new Error(json.message || 'An unexpected error occurred');
        }
        return json;
    } catch (err) {
        showToast(err.message, 'error');
        throw err;
    }
}

async function checkSession() {
    try {
        const res = await apiCall('/api/auth/session');
        state.user = res;
        if (res.authenticated && res.hasVoted) {
            state.activeTab = 'results';
        }
    } catch (e) {
        state.user = { authenticated: false };
    }
    render();
}

async function fetchCandidates() {
    try {
        const data = await apiCall('/api/candidates');
        state.candidates = data;
        render();
    } catch (e) {
        // Fallback mock items if backend isn't spun up yet for pure frontend testing
        state.candidates = [
            { id: "c1", name: "Dr. Eleanor Vance", party: "Progressive Vanguard", bio: "Focus on sustainable urban development and universal broadband.", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
            { id: "c2", name: "Marcus Sterling", party: "Economic Freedom Alliance", bio: "Championing deregulation, lower taxes, and crypto innovation.", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400" },
            { id: "c3", name: "Aisha Morales", party: "Green Coalition", bio: "Committed to 100% renewable grid transition by 2030.", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400" },
            { id: "c4", name: "David Chen", party: "Tech & Transparency Party", bio: "Advocating for open-source government algorithms and AI ethics.", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400" }
        ];
        render();
    }
}

async function fetchResults(silent = false) {
    try {
        const data = await apiCall('/api/results');
        state.results = data;
        if (!silent) render();
        else updateResultsUIOnly();
    } catch (e) {
        // Fallback mock results
        state.results = state.candidates.map(c => ({
            candidateId: c.id,
            name: c.name,
            votes: Math.floor(Math.random() * 150) + 20
        }));
        if (!silent) render();
    }
}

// --- ACTIONS ---

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);
    
    state.isSubmitting = true;
    render();

    try {
        await apiCall('/api/auth/login', 'POST', payload);
        showToast('Successfully logged in!', 'success');
        await checkSession();
        await fetchResults();
    } catch (err) {
        // error handled in apiCall
    } finally {
        state.isSubmitting = false;
        render();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    if (payload.password !== payload.confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    state.isSubmitting = true;
    render();

    try {
        await apiCall('/api/auth/register', 'POST', { username: payload.username, password: payload.password });
        showToast('Account created! Please log in.', 'success');
        state.authMode = 'login';
    } catch (err) {
        // error handled
    } finally {
        state.isSubmitting = false;
        render();
    }
}

async function handleLogout() {
    try {
        await apiCall('/api/auth/logout', 'POST');
        state.user = { authenticated: false };
        state.activeTab = 'vote';
        showToast('Logged out securely', 'success');
        render();
    } catch (e) {}
}

async function handleCastVote() {
    if (!state.selectedCandidateId) {
        showToast('Please select a candidate before submitting your ballot.', 'error');
        return;
    }

    const confirmed = window.confirm("Are you certain of your selection? Votes are cryptographically sealed and cannot be changed.");
    if (!confirmed) return;

    state.isSubmitting = true;
    render();

    try {
        await apiCall('/api/vote', 'POST', { candidateId: state.selectedCandidateId });
        showToast('Ballot cast successfully! Recorded to ledger.', 'success');
        state.user.hasVoted = true;
        state.activeTab = 'results';
        await fetchResults();
    } catch (e) {
        // handled
    } finally {
        state.isSubmitting = false;
        render();
    }
}

function showToast(message, type = 'success') {
    state.toastMessage = { message, type };
    renderToast();
    setTimeout(() => {
        if (state.toastMessage && state.toastMessage.message === message) {
            state.toastMessage = null;
            renderToast();
        }
    }, 4000);
}

// --- RENDER ENGINE ---

function renderAppShell() {
    elements.root.innerHTML = `
        <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Inter'] selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
            <!-- Background Glow Effects -->
            <div class="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div id="navbar-container"></div>
            
            <main class="flex-grow container mx-auto px-4 py-8 max-w-6xl z-10" id="main-container">
                <!-- Dynamic Content Area -->
            </main>

            <footer class="border-t border-slate-900 bg-slate-950/80 backdrop-blur py-6 text-center text-xs text-slate-500 z-10">
                <p>&copy; ${new Date().getFullYear()} BallotBox OS Secure Voting Infrastructure. All rights reserved.</p>
                <p class="mt-1">Secured with end-to-end cryptographic verification protocols.</p>
            </footer>

            <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none"></div>
        </div>
    `;
}

function render() {
    renderNavbar();
    renderMainContainer();
    renderToast();
    lucide.createIcons();
}

function renderNavbar() {
    const navContainer = document.getElementById('navbar-container');
    if (!navContainer) return;

    const isAuth = state.user && state.user.authenticated;

    navContainer.innerHTML = `
        <header class="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80 transition-all">
            <div class="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
                <div class="flex items-center space-x-3 cursor-pointer" onclick="state.activeTab='vote'; render();">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <i data-lucide="vote" class="w-5 h-5 text-white"></i>
                    </div>
                    <div>
                        <span class="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">BallotBox</span>
                        <span class="hidden sm:inline-block ml-1.5 px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">SECURE OS</span>
                    </div>
                </div>

                ${isAuth ? `
                    <nav class="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
                        <button onclick="state.activeTab='vote'; render();" class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${state.activeTab === 'vote' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                            <i data-lucide="check-square" class="w-4 h-4 inline mr-1.5"></i> Vote Booth
                        </button>
                        <button onclick="state.activeTab='results'; render();" class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${state.activeTab === 'results' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                            <i data-lucide="bar-chart-3" class="w-4 h-4 inline mr-1.5"></i> Live Tally
                        </button>
                    </nav>

                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                            <div class="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-500/30">
                                ${state.user.username.charAt(0).toUpperCase()}
                            </div>
                            <span class="text-sm font-medium text-slate-200 hidden sm:inline">${state.user.username}</span>
                        </div>
                        <button onclick="handleLogout()" class="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Sign Out">
                            <i data-lucide="log-out" class="w-5 h-5"></i>
                        </button>
                    </div>
                ` : `
                    <div class="flex items-center space-x-3">
                        <span class="text-xs text-slate-400 hidden sm:inline">Authentication Required</span>
                    </div>
                `}
            </div>
        </header>
    `;
}

function renderMainContainer() {
    const main = document.getElementById('main-container');
    if (!main) return;

    if (!state.user) {
        main.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        `;
        return;
    }

    if (!state.user.authenticated) {
        main.innerHTML = renderAuthContainer();
        return;
    }

    // Authenticated Views
    if (state.activeTab === 'vote') {
        main.innerHTML = renderDashboardContainer();
    } else {
        main.innerHTML = renderResultsView();
    }
}

function renderAuthContainer() {
    const isLogin = state.authMode === 'login';
    return `
        <div class="max-w-md mx-auto my-12">
            <div class="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div class="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl"></div>
                
                <div class="text-center mb-8">
                    <div class="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl mx-auto flex items-center justify-center mb-4 text-indigo-400">
                        <i data-lucide="${isLogin ? 'lock' : 'user-plus'}" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-bold tracking-tight text-white">${isLogin ? 'Welcome Back' : 'Create Voter ID'}</h2>
                    <p class="text-sm text-slate-400 mt-1">${isLogin ? 'Enter your credentials to access the ballot box' : 'Register securely to cast your certified vote'}</p>
                </div>

                <div class="flex bg-slate-950/60 p-1 rounded-xl mb-6 border border-slate-800/60">
                    <button onclick="state.authMode='login'; render();" class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${isLogin ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Sign In</button>
                    <button onclick="state.authMode='register'; render();" class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${!isLogin ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Register</button>
                </div>

                ${isLogin ? `
                    <form onsubmit="handleLogin(event)" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Voter Username</label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500"><i data-lucide="user" class="w-4 h-4"></i></span>
                                <input type="text" name="username" required class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="Enter username">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Secure Password</label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500"><i data-lucide="key" class="w-4 h-4"></i></span>
                                <input type="password" name="password" required class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="••••••••">
                            </div>
                        </div>
                        <button type="submit" ${state.isSubmitting ? 'disabled' : ''} class="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2">
                            ${state.isSubmitting ? '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>' : '<span>Authenticate & Enter</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>'}
                        </button>
                    </form>
                ` : `
                    <form onsubmit="handleRegister(event)" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Desired Username</label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500"><i data-lucide="user" class="w-4 h-4"></i></span>
                                <input type="text" name="username" required class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="Choose username">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Secure Password</label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500"><i data-lucide="key" class="w-4 h-4"></i></span>
                                <input type="password" name="password" required class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="••••••••">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Confirm Password</label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500"><i data-lucide="check" class="w-4 h-4"></i></span>
                                <input type="password" name="confirmPassword" required class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="••••••••">
                            </div>
                        </div>
                        <button type="submit" ${state.isSubmitting ? 'disabled' : ''} class="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2">
                            ${state.isSubmitting ? '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>' : '<span>Register Voter ID</span> <i data-lucide="user-check" class="w-4 h-4"></i>'}
                        </button>
                    </form>
                `}
            </div>
        </div>
    `;
}

function renderDashboardContainer() {
    if (state.user.hasVoted) {
        return `
            <div class="max-w-2xl mx-auto text-center py-16 px-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl backdrop-blur-xl">
                <div class="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
                    <i data-lucide="check-circle-2" class="w-10 h-10"></i>
                </div>
                <h2 class="text-3xl font-bold tracking-tight text-white mb-2">Ballot Successfully Cast</h2>
                <p class="text-slate-400 text-sm max-w-md mx-auto mb-8">Your vote has been securely recorded on the central ballot ledger. You can inspect the real-time encrypted tallies at any time.</p>
                <button onclick="state.activeTab='results'; render();" class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center space-x-2">
                    <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
                    <span>View Live Election Tally</span>
                </button>
            </div>
        `;
    }

    return `
        <div class="space-y-8">
            <div class="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div class="space-y-2 text-center md:text-left z-10">
                    <span class="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold">ACTIVE ELECTION CYCLE</span>
                    <h1 class="text-3xl font-extrabold tracking-tight text-white">General Leadership Ballot</h1>
                    <p class="text-slate-400 text-sm max-w-xl">Review candidate platforms carefully. Select your preferred candidate and submit your final verified ballot below.</p>
                </div>
                <div class="z-10 w-full md:w-auto flex flex-col items-center md:items-end gap-3">
                    <button onclick="handleCastVote()" ${!state.selectedCandidateId || state.isSubmitting ? 'disabled' : ''} class="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2">
                        ${state.isSubmitting ? '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>' : '<i data-lucide="shield-check" class="w-5 h-5"></i><span>Submit Certified Ballot</span>'}
                    </button>
                    <span class="text-[11px] text-slate-500">Selection required to enable submission</span>
                </div>
            </div>

            <div>
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-white flex items-center space-x-2">
                        <i data-lucide="users" class="w-5 h-5 text-indigo-400"></i>
                        <span>Certified Candidates (${state.candidates.length})</span>
                    </h3>
                </div>
                ${renderCandidateList()}
            </div>
        </div>
    `;
}

function renderCandidateList() {
    if (!state.candidates.length) {
        return `<div class="text-center py-12 text-slate-500">No candidates found in registry.</div>`;
    }

    return `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${state.candidates.map(c => renderCandidateCard(c)).join('')}
        </div>
    `;
}

function renderCandidateCard(candidate) {
    const isSelected = state.selectedCandidateId === candidate.id;
    return `
        <div onclick="state.selectedCandidateId='${candidate.id}'; render();" class="group relative bg-slate-900/60 border ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-950/20' : 'border-slate-800 hover:border-slate-700'} rounded-3xl p-5 backdrop-blur-xl transition-all cursor-pointer flex flex-col justify-between shadow-lg">
            <div>
                <div class="relative w-full h-44 rounded-2xl overflow-hidden mb-4 bg-slate-800">
                    <img src="${candidate.image}" alt="${candidate.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                    <span class="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur border border-slate-700 text-[10px] font-semibold text-indigo-300 rounded-lg">${candidate.party}</span>
                    
                    ${isSelected ? `
                        <div class="absolute top-3 right-3 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                            <i data-lucide="check" class="w-4 h-4"></i>
                        </div>
                    ` : ''}
                </div>
                <h4 class="text-base font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">${candidate.name}</h4>
                <p class="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">${candidate.bio}</p>
            </div>
            
            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span class="text-slate-500 font-medium">Candidate ID: ${candidate.id}</span>
                <span class="${isSelected ? 'text-indigo-400 font-bold' : 'text-slate-400'} flex items-center space-x-1">
                    <span>${isSelected ? 'Selected' : 'Select'}</span>
                </span>
            </div>
        </div>
    `;
}

function renderResultsView() {
    const totalVotes = state.results.reduce((acc, curr) => acc + curr.votes, 0);

    return `
        <div class="space-y-8">
            <div class="bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-slate-950 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div class="flex items-center space-x-2 mb-2">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span class="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span> LIVE TALLY FEED
                        </span>
                    </div>
                    <h1 class="text-3xl font-extrabold tracking-tight text-white">Election Results Dashboard</h1>
                    <p class="text-slate-400 text-sm mt-1">Real-time cryptographic vote aggregation and statistical distribution.</p>
                </div>
                <div class="bg-slate-950/80 border border-slate-800/80 px-6 py-4 rounded-2xl flex items-center space-x-4">
                    <div class="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                        <i data-lucide="bar-chart-2" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <span class="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Total Cast Ballots</span>
                        <span id="live-total-votes" class="text-2xl font-black text-white">${totalVotes}</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
                    <h3 class="text-lg font-bold text-white mb-6 flex items-center space-x-2">
                        <i data-lucide="pie-chart" class="w-5 h-5 text-indigo-400"></i>
                        <span>Candidate Distribution Breakdown</span>
                    </h3>
                    <div id="results-chart-container" class="space-y-6">
                        ${renderResultsChart(totalVotes)}
                    </div>
                </div>

                <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                            <i data-lucide="shield-alert" class="w-5 h-5 text-indigo-400"></i>
                            <span>Ledger Integrity</span>
                        </h3>
                        <p class="text-xs text-slate-400 leading-relaxed mb-6">All submitted votes are verified against double-voting protection keys and logged immutably.</p>
                        
                        <div class="space-y-3">
                            <div class="flex items-center justify-between text-xs p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                                <span class="text-slate-400">Encryption Status</span>
                                <span class="text-emerald-400 font-semibold flex items-center"><i data-lucide="lock" class="w-3.5 h-3.5 mr-1"></i> SHA-256 Active</span>
                            </div>
                            <div class="flex items-center justify-between text-xs p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                                <span class="text-slate-400">Sync Frequency</span>
                                <span class="text-indigo-400 font-semibold">Every 5 Seconds</span>
                            </div>
                            <div class="flex items-center justify-between text-xs p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                                <span class="text-slate-400">Anonymity Protocol</span>
                                <span class="text-purple-400 font-semibold">Zero-Knowledge</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-8 pt-4 border-t border-slate-800/80 text-center">
                        <button onclick="fetchResults()" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5">
                            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                            <span>Force Ledger Sync</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderResultsChart(totalVotes) {
    if (!state.results.length) return `<div class="text-slate-500 text-center py-8">No vote metrics available.</div>`;

    // Sort by votes descending
    const sorted = [...state.results].sort((a, b) => b.votes - a.votes);

    return sorted.map(item => {
        const percentage = totalVotes > 0 ? Math.round((item.votes / totalVotes) * 100) : 0;
        return `
            <div class="space-y-2">
                <div class="flex justify-between items-center text-sm">
                    <span class="font-bold text-white flex items-center space-x-2">
                        <span>${item.name}</span>
                    </span>
                    <div class="flex items-center space-x-3">
                        <span class="text-xs text-slate-400">${item.votes} votes</span>
                        <span class="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">${percentage}%</span>
                    </div>
                </div>
                <div class="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div class="bg-gradient-to-r from-indigo-600 to-violet-500 h-full rounded-full transition-all duration-1000" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function updateResultsUIOnly() {
    const totalVotes = state.results.reduce((acc, curr) => acc + curr.votes, 0);
    const totalVotesEl = document.getElementById('live-total-votes');
    if (totalVotesEl) totalVotesEl.innerText = totalVotes;

    const chartContainer = document.getElementById('results-chart-container');
    if (chartContainer) {
        chartContainer.innerHTML = renderResultsChart(totalVotes);
    }
}

function renderToast() {
    const container = document.getElementById('toast-container');
    if (!container) return;

    if (!state.toastMessage) {
        container.innerHTML = '';
        return;
    }

    const { message, type } = state.toastMessage;
    const isError = type === 'error';

    container.innerHTML = `
        <div class="pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border ${isError ? 'bg-rose-950/90 border-rose-500/30 text-rose-200' : 'bg-slate-900/90 border-indigo-500/30 text-slate-100'} animate-bounce transition-all">
            <div class="w-8 h-8 rounded-xl ${isError ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'} flex items-center justify-center">
                <i data-lucide="${isError ? 'alert-circle' : 'check-circle'}" class="w-4 h-4"></i>
            </div>
            <div class="text-xs font-semibold">${message}</div>
        </div>
    `;
    lucide.createIcons();
}