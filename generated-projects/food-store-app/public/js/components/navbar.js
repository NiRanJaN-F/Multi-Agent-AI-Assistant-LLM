/**
 * @file navbar.js
 * @description Sticky glassmorphic navigation bar component with live search and cart badge.
 */

import { store } from '../store.js';

export function renderNavbar() {
    const container = document.getElementById('navbar-container');
    if (!container) return;

    container.innerHTML = `
        <header class="sticky top-0 z-40 w-full backdrop-blur-xl bg-dark-900/80 border-b border-slate-800/80 transition-all duration-300">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                
                <!-- Brand Logo -->
                <div class="flex items-center gap-3 cursor-pointer group" id="logo-home-btn">
                    <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand to-brand-accent flex items-center justify-center shadow-lg shadow-brand/25 group-hover:scale-105 transition-transform">
                        <i data-lucide="terminal" class="w-6 h-6 text-white"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xl font-extrabold tracking-wider text-white flex items-center gap-1">
                            DEV<span class="text-brand">GEAR</span>
                            <span class="inline-block w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                        </span>
                        <span class="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Hardware & Code</span>
                    </div>
                </div>

                <!-- Search Bar -->
                <div class="flex-1 max-w-md hidden md:block">
                    <div class="relative group">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
                            <i data-lucide="search" class="w-4 h-4"></i>
                        </div>
                        <input 
                            type="text" 
                            id="navbar-search-input"
                            value="${store.getState().searchQuery}"
                            placeholder="Search keyboards, switches, macro pads..."
                            class="w-full pl-10 pr-4 py-2.5 bg-dark-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all shadow-inner"
                        />
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <kbd class="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-dark-900/80 border border-slate-700 rounded shadow-sm">⌘K</kbd>
                        </div>
                    </div>
                </div>

                <!-- Right Actions -->
                <div class="flex items-center gap-3">
                    
                    <!-- Mobile Search Toggle Button (optional small screens) -->
                    <button id="mobile-search-toggle" class="md:hidden p-2.5 text-slate-300 hover:text-white hover:bg-dark-800 rounded-xl transition-colors">
                        <i data-lucide="search" class="w-5 h-5"></i>
                    </button>

                    <!-- Github / Repo Link -->
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-dark-800/60 hover:bg-dark-800 hover:text-white border border-slate-700/60 rounded-xl transition-all">
                        <i data-lucide="github" class="w-4 h-4 text-brand"></i>
                        <span>v2.4.0</span>
                    </a>

                    <!-- Cart Trigger Button -->
                    <button 
                        id="cart-toggle-btn"
                        class="relative p-2.5 bg-dark-800/90 hover:bg-dark-700 border border-slate-700/80 rounded-xl text-slate-200 hover:text-white shadow-lg shadow-black/20 transition-all group flex items-center gap-2 px-3.5"
                        aria-label="Shopping Cart"
                    >
                        <i data-lucide="shopping-bag" class="w-5 h-5 text-brand group-hover:scale-110 transition-transform"></i>
                        <span class="hidden sm:inline text-sm font-medium">Cart</span>
                        
                        <!-- Live Cart Count Badge -->
                        <span id="cart-badge" class="absolute -top-2 -right-2 bg-gradient-to-r from-brand to-brand-accent text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-brand/40 animate-bounce">
                            0
                        </span>
                    </button>
                </div>
            </div>

            <!-- Mobile Search Bar Expander (hidden by default) -->
            <div id="mobile-search-container" class="hidden md:hidden px-4 pb-4 border-t border-slate-800 bg-dark-900/95">
                <div class="relative mt-3">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </div>
                    <input 
                        type="text" 
                        id="mobile-navbar-search-input"
                        value="${store.getState().searchQuery}"
                        placeholder="Search hardware..."
                        class="w-full pl-10 pr-4 py-2 bg-dark-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand"
                    />
                </div>
            </div>
        </header>
    `;

    // Initialize Lucide icons inside the navbar
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Attach Event Listeners
    setupNavbarEvents();
    updateCartBadge();
}

function setupNavbarEvents() {
    const searchInput = document.getElementById('navbar-search-input');
    const mobileSearchInput = document.getElementById('mobile-navbar-search-input');
    const cartToggleBtn = document.getElementById('cart-toggle-btn');
    const logoHomeBtn = document.getElementById('logo-home-btn');
    const mobileSearchToggle = document.getElementById('mobile-search-toggle');
    const mobileSearchContainer = document.getElementById('mobile-search-container');

    // Search Handler helper
    const handleSearch = (e) => {
        const query = e.target.value;
        store.setSearchQuery(query);
        // Sync both inputs
        if (searchInput && searchInput !== e.target) searchInput.value = query;
        if (mobileSearchInput && mobileSearchInput !== e.target) mobileSearchInput.value = query;
    };

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', handleSearch);
    }

    // Cart Drawer Toggle
    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', () => {
            store.toggleCart(true);
        });
    }

    // Logo click resets filters and search
    if (logoHomeBtn) {
        logoHomeBtn.addEventListener('click', () => {
            store.setCategory('All');
            store.setSearchQuery('');
            if (searchInput) searchInput.value = '';
            if (mobileSearchInput) mobileSearchInput.value = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Mobile search drawer toggle
    if (mobileSearchToggle && mobileSearchContainer) {
        mobileSearchToggle.addEventListener('click', () => {
            mobileSearchContainer.classList.toggle('hidden');
            if (!mobileSearchContainer.classList.contains('hidden') && mobileSearchInput) {
                mobileSearchInput.focus();
            }
        });
    }

    // Subscribe to store updates to keep badge in sync
    store.subscribe(() => {
        updateCartBadge();
    });
}

export function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    const count = store.getCartCount();
    badge.textContent = count;

    if (count > 0) {
        badge.classList.remove('scale-0');
        badge.classList.add('scale-100');
    } else {
        badge.classList.remove('scale-100');
    }
}