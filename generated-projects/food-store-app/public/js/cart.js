/**
 * public/js/cart.js
 * Principal Frontend Architecture - Cart & State Management Module
 * Handles shopping cart state, DOM rendering for CartModal, CartItem components,
 * localStorage persistence, and event delegation.
 */

class CartManager {
    constructor() {
        this.items = [];
        this.isOpen = false;
        this.storageKey = 'fresh_market_cart_v1';
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.updateBadge();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.items = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load cart from storage:', e);
            this.items = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        } catch (e) {
            console.error('Failed to save cart to storage:', e);
        }
    }

    bindEvents() {
        // Toggle Cart Modal triggers
        const cartToggleBtn = document.getElementById('cart-toggle-btn');
        const closeCartBtn = document.getElementById('close-cart-btn');
        const cartBackdrop = document.getElementById('cart-backdrop');
        const cartModal = document.getElementById('cart-modal');

        if (cartToggleBtn) {
            cartToggleBtn.addEventListener('click', () => this.toggleCart(true));
        }
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => this.toggleCart(false));
        }
        if (cartBackdrop) {
            cartBackdrop.addEventListener('click', () => this.toggleCart(false));
        }

        // Event delegation for cart items (quantity changes, removal)
        const cartItemsContainer = document.getElementById('cart-items-container');
        if (cartItemsContainer) {
            cartItemsContainer.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;

                // Support both numeric IDs and string/custom IDs (e.g. newly added foods)
                let id = target.dataset.id;
                const numericId = parseInt(id, 10);
                if (!isNaN(numericId) && id.trim() !== '' && !isNaN(id)) {
                    id = numericId;
                }

                if (target.classList.contains('increase-qty')) {
                    this.updateQuantity(id, 1);
                } else if (target.classList.contains('decrease-qty')) {
                    this.updateQuantity(id, -1);
                } else if (target.classList.contains('remove-item')) {
                    this.removeItem(id);
                }
            });
        }

        // Proceed to Checkout button
        const checkoutBtn = document.getElementById('proceed-checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.items.length === 0) return;
                this.toggleCart(false);
                // Trigger checkout modal if globally available
                if (window.CheckoutManager && typeof window.CheckoutManager.open === 'function') {
                    window.CheckoutManager.open(this.items, this.getTotal());
                } else {
                    console.warn('CheckoutManager not initialized.');
                }
            });
        }
    }

    toggleCart(open) {
        this.isOpen = open;
        const modal = document.getElementById('cart-modal');
        const backdrop = document.getElementById('cart-backdrop');
        const panel = document.getElementById('cart-panel');

        if (!modal || !backdrop || !panel) return;

        if (open) {
            modal.classList.remove('hidden');
            // Trigger reflow
            void modal.offsetWidth;
            backdrop.classList.add('opacity-100');
            backdrop.classList.remove('opacity-0');
            panel.classList.add('translate-x-0');
            panel.classList.remove('translate-x-full');
            this.renderCartItems();
        } else {
            backdrop.classList.remove('opacity-100');
            backdrop.classList.add('opacity-0');
            panel.classList.remove('translate-x-0');
            panel.classList.add('translate-x-full');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id == product.id);
        if (existingItem) {
            existingItem.quantity += (product.quantity || 1);
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price) || 0,
                image: product.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400',
                unit: product.unit || 'item',
                category: product.category || 'general',
                quantity: product.quantity || 1
            });
        }
        this.saveToStorage();
        this.updateBadge();
        if (this.isOpen) {
            this.renderCartItems();
        }
    }

    removeItem(id) {
        this.items = this.items.filter(item => item.id != id);
        this.saveToStorage();
        this.updateBadge();
        this.renderCartItems();
    }

    updateQuantity(id, delta) {
        const item = this.items.find(item => item.id == id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeItem(id);
            } else {
                this.saveToStorage();
                this.updateBadge();
                this.renderCartItems();
            }
        }
    }

    clearCart() {
        this.items = [];
        this.saveToStorage();
        this.updateBadge();
        if (this.isOpen) {
            this.renderCartItems();
        }
    }

    getTotalItems() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    updateBadge() {
        const badge = document.getElementById('cart-count-badge');
        if (!badge) return;

        const totalItems = this.getTotalItems();
        badge.textContent = totalItems;
        if (totalItems > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    renderCartItems() {
        const container = document.getElementById('cart-items-container');
        const emptyState = document.getElementById('cart-empty-state');
        const footer = document.getElementById('cart-footer');
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');

        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            if (footer) footer.classList.add('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        if (footer) footer.classList.remove('hidden');

        container.innerHTML = this.items.map(item => `
            <div class="flex items-center justify-between gap-4 py-4 border-b border-gray-100">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg bg-gray-50">
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 truncate">${item.name}</h4>
                    <p class="text-sm text-emerald-600 font-medium">$${item.price.toFixed(2)} / ${item.unit || 'unit'}</p>
                    <div class="flex items-center gap-2 mt-2">
                        <button type="button" data-id="${item.id}" class="decrease-qty w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">-</button>
                        <span class="text-sm font-medium text-gray-800 w-6 text-center">${item.quantity}</span>
                        <button type="button" data-id="${item.id}" class="increase-qty w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">+</button>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-gray-900">$${(item.price * item.quantity).toFixed(2)}</p>
                    <button type="button" data-id="${item.id}" class="remove-item text-xs text-red-500 hover:text-red-700 mt-2 transition-colors">Remove</button>
                </div>
            </div>
        `).join('');

        const total = this.getTotal();
        if (subtotalEl) subtotalEl.textContent = `$${total.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }
}

// Instantiate globally
window.CartManager = new CartManager();