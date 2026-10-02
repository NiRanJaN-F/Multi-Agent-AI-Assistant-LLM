/**
 * LUMINIQUE E-COMMERCE - CART MODULE (public/js/cart.js)
 * Architecture: Vanilla JS Modular State Management & DOM Renderer
 * Implements CartDrawer, CartItem, State synchronization, and LocalStorage persistence.
 */

window.CartModule = (function () {
    'use strict';

    // Private State
    let cart = [];
    const STORAGE_KEY = 'luminique_cart_v1';

    // DOM Elements Cache (populated on init)
    let elements = {};

    function init() {
        loadFromStorage();
        cacheElements();
        bindEvents();
        renderCart();
    }

    function cacheElements() {
        elements = {
            cartDrawer: document.getElementById('cart-drawer'),
            cartOverlay: document.getElementById('cart-overlay'),
            cartToggleBtn: document.getElementById('cart-toggle-btn'),
            closeCartBtn: document.getElementById('close-cart-btn'),
            cartItemsContainer: document.getElementById('cart-items-container'),
            cartSubtotal: document.getElementById('cart-subtotal'),
            cartTax: document.getElementById('cart-tax'),
            cartTotal: document.getElementById('cart-total'),
            cartCountBadge: document.getElementById('cart-count-badge'),
            checkoutBtn: document.getElementById('checkout-btn'),
            emptyCartState: document.getElementById('empty-cart-state'),
            cartFooter: document.getElementById('cart-footer')
        };
    }

    function bindEvents() {
        if (elements.cartToggleBtn) {
            elements.cartToggleBtn.addEventListener('click', toggleCartDrawer);
        }
        if (elements.closeCartBtn) {
            elements.closeCartBtn.addEventListener('click', closeCartDrawer);
        }
        if (elements.cartOverlay) {
            elements.cartOverlay.addEventListener('click', closeCartDrawer);
        }

        // Delegate quantity changes & item deletions inside cart container
        if (elements.cartItemsContainer) {
            elements.cartItemsContainer.addEventListener('click', handleCartItemAction);
        }

        // Checkout Trigger
        if (elements.checkoutBtn) {
            elements.checkoutBtn.addEventListener('click', () => {
                if (cart.length === 0) return;
                closeCartDrawer();
                if (window.CheckoutModule && typeof window.CheckoutModule.openCheckout === 'function') {
                    window.CheckoutModule.openCheckout(cart, getCartTotals());
                } else {
                    console.error('CheckoutModule not loaded.');
                }
            });
        }

        // ESC key closes drawer
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeCartDrawer();
        });
    }

    function loadFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                cart = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load cart from storage:', e);
            cart = [];
        }
    }

    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        } catch (e) {
            console.error('Failed to save cart to storage:', e);
        }
    }

    function toggleCartDrawer() {
        if (!elements.cartDrawer || !elements.cartOverlay) return;
        const isOpen = !elements.cartDrawer.classList.contains('translate-x-full');
        if (isOpen) {
            closeCartDrawer();
        } else {
            openCartDrawer();
        }
    }

    function openCartDrawer() {
        if (!elements.cartDrawer || !elements.cartOverlay) return;
        elements.cartDrawer.classList.remove('translate-x-full');
        elements.cartOverlay.classList.remove('hidden');
        // Force reflow for transition
        setTimeout(() => {
            elements.cartOverlay.classList.add('opacity-100');
        }, 10);
        document.body.style.overflow = 'hidden';
    }

    function closeCartDrawer() {
        if (!elements.cartDrawer || !elements.cartOverlay) return;
        elements.cartDrawer.classList.add('translate-x-full');
        elements.cartOverlay.classList.remove('opacity-100');
        setTimeout(() => {
            elements.cartOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }

    function addToCart(product, quantity = 1) {
        const existingIndex = cart.findIndex(item => item.id === product.id);
        
        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                image: product.image,
                category: product.category || 'General',
                quantity: quantity
            });
        }

        saveToStorage();
        renderCart();
        triggerCartFeedback(product.name);
        
        // Optionally auto-open drawer on add
        openCartDrawer();
    }

    function updateQuantity(productId, delta) {
        const index = cart.findIndex(item => item.id === productId);
        if (index === -1) return;

        cart[index].quantity += delta;

        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }

        saveToStorage();
        renderCart();
    }

    function removeItem(productId) {
        cart = cart.filter(item => item.id !== productId);
        saveToStorage();
        renderCart();
    }

    function clearCart() {
        cart = [];
        saveToStorage();
        renderCart();
    }

    function getCartTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08; // 8% estimated tax
        const shipping = subtotal > 100 || subtotal === 0 ? 0 : 15.00;
        const total = subtotal + tax + shipping;

        return {
            subtotal: Number(subtotal.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            shipping: Number(shipping.toFixed(2)),
            total: Number(total.toFixed(2)),
            itemCount: cart.reduce((count, item) => count + item.quantity, 0)
        };
    }

    function handleCartItemAction(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.getAttribute('data-action');
        const productId = Number(target.getAttribute('data-id'));

        if (!productId) return;

        if (action === 'increase') {
            updateQuantity(productId, 1);
        } else if (action === 'decrease') {
            updateQuantity(productId, -1);
        } else if (action === 'remove') {
            removeItem(productId);
        }
    }

    function renderCart() {
        if (!elements.cartItemsContainer) return;

        const totals = getCartTotals();

        // Update Counter Badges globally
        updateBadges(totals.itemCount);

        // Render Empty State vs Items
        if (cart.length === 0) {
            elements.cartItemsContainer.innerHTML = '';
            if (elements.emptyCartState) elements.emptyCartState.classList.remove('hidden');
            if (elements.cartFooter) elements.cartFooter.classList.add('hidden');
            return;
        }

        if (elements.emptyCartState) elements.emptyCartState.classList.add('hidden');
        if (elements.cartFooter) elements.cartFooter.classList.remove('hidden');

        // Render Cart Items (CartItem Component)
        elements.cartItemsContainer.innerHTML = cart.map(item => `
            <div class="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-800 animate-fadeIn">
                <div class="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200/60 dark:border-gray-700/60">
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover object-center" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'">
                </div>
                <div class="flex-1 min-w-0">
                    <span class="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">${escapeHtml(item.category)}</span>
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">${escapeHtml(item.name)}</h4>
                    <div class="text-sm font-bold text-gray-900 dark:text-white mt-0.5">$${(item.price * item.quantity).toFixed(2)}</div>
                    
                    <div class="flex items-center justify-between mt-2">
                        <div class="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <button data-action="decrease" data-id="${item.id}" class="w-7 h-7 flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <i data-lucide="minus" class="w-3 h-3"></i>
                            </button>
                            <span class="w-8 text-center text-xs font-semibold text-gray-900 dark:text-white">${item.quantity}</span>
                            <button data-action="increase" data-id="${item.id}" class="w-7 h-7 flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <i data-lucide="plus" class="w-3 h-3"></i>
                            </button>
                        </div>
                        <button data-action="remove" data-id="${item.id}" class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 transition-colors" title="Remove item">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Update Totals UI
        if (elements.cartSubtotal) elements.cartSubtotal.textContent = `$${totals.subtotal.toFixed(2)}`;
        if (elements.cartTax) elements.cartTax.textContent = `$${totals.tax.toFixed(2)}`;
        if (elements.cartTotal) elements.cartTotal.textContent = `$${totals.total.toFixed(2)}`;

        // Reinitialize Lucide Icons inside Drawer
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function updateBadges(count) {
        if (!elements.cartCountBadge) return;
        if (count > 0) {
            elements.cartCountBadge.textContent = count > 99 ? '99+' : count;
            elements.cartCountBadge.classList.remove('hidden');
        } else {
            elements.cartCountBadge.classList.add('hidden');
        }
    }

    function triggerCartFeedback(productName) {
        // Simple toast notification dispatch
        if (window.AppModule && typeof window.AppModule.showToast === 'function') {
            window.AppModule.showToast(`Added ${productName} to your cart.`, 'success');
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API exposed to window.CartModule
    return {
        init,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        getCart,
        getCartTotals,
        openCartDrawer,
        closeCartDrawer
    };

    function getCart() {
        return cart;
    }
})();