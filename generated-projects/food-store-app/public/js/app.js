/**
 * @file app.js
 * @description Main application controller for DEVGEAR e-commerce storefront.
 * Orchestrates state management, UI components initialization, search, filtering,
 * and cart event bindings.
 */

import { store } from './store.js';
import { renderNavbar } from './components/navbar.js';
import { renderHero } from './components/hero.js';
import { renderFilters } from './components/filters.js';
import { renderProductGrid } from './components/product-grid.js';
import { renderCartDrawer } from './components/cart-drawer.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide icons if available globally
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // 2. Set current year in footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 3. Mount UI Components into their respective containers
    const navbarContainer = document.getElementById('navbar-container');
    const heroContainer = document.getElementById('hero-container');
    const filtersContainer = document.getElementById('filters-container');
    const productGridContainer = document.getElementById('product-grid-container');
    const cartDrawerContainer = document.getElementById('cart-drawer-container');

    if (navbarContainer) renderNavbar(navbarContainer);
    if (heroContainer) renderHero(heroContainer);
    if (filtersContainer) renderFilters(filtersContainer);
    if (productGridContainer) renderProductGrid(productGridContainer);
    if (cartDrawerContainer) renderCartDrawer(cartDrawerContainer);

    // 4. Register Store Event Listeners to keep UI reactive
    
    // Listen for cart changes (update badges & cart drawer content)
    window.addEventListener('cart:updated', (event) => {
        const { cart } = event.detail;
        
        // Update badge counts across navbar
        const badgeEls = document.querySelectorAll('.cart-count-badge');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        badgeEls.forEach(badge => {
            badge.textContent = totalItems;
            if (totalItems > 0) {
                badge.classList.remove('hidden');
                badge.classList.add('flex');
            } else {
                badge.classList.add('hidden');
                badge.classList.remove('flex');
            }
        });

        // Re-render cart drawer if present
        if (typeof window.updateCartDrawerUI === 'function') {
            window.updateCartDrawerUI(cart);
        }
    });

    // Listen for category filtering or search queries
    window.addEventListener('store:filter-changed', () => {
        if (typeof window.refreshProductGrid === 'function') {
            window.refreshProductGrid();
        }
    });

    // Initial trigger to sync badge state on load
    const initialCart = store.getCart();
    const initialBadgeEls = document.querySelectorAll('.cart-count-badge');
    const initialTotal = initialCart.reduce((sum, item) => sum + item.quantity, 0);
    
    initialBadgeEls.forEach(badge => {
        badge.textContent = initialTotal;
        if (initialTotal > 0) {
            badge.classList.remove('hidden');
            badge.classList.add('flex');
        } else {
            badge.classList.add('hidden');
            badge.classList.remove('flex');
        }
    });

    // Global keyboard shortcut listeners (e.g., ESC to close cart drawer, CMD+K for search)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close cart drawer if open
            const cartDrawer = document.getElementById('cart-drawer');
            const cartOverlay = document.getElementById('cart-overlay');
            if (cartDrawer && !cartDrawer.classList.contains('translate-x-full')) {
                cartDrawer.classList.add('translate-x-full');
                if (cartOverlay) {
                    cartOverlay.classList.add('opacity-0', 'pointer-events-none');
                    cartOverlay.classList.remove('opacity-100');
                }
            }
        }

        // Quick search focus with '/' or 'Cmd+K' / 'Ctrl+K'
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });

    console.log('%c DEVGEAR %c Storefront initialized successfully.', 'background: #0f172a; color: #38bdf8; padding: 4px 8px; border-radius: 4px 4px 0 0; font-weight: bold;', 'background: #06b6d4; color: #000; padding: 4px 8px; border-radius: 0 4px 4px 0; font-weight: bold;');
});