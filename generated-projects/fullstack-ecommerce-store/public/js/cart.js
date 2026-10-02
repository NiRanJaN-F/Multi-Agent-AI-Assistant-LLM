/**
 * public/js/cart.js
 * Principal Frontend Architecture - Shopping Cart & State Management Module
 * Handles reactive cart state, persistence, calculation engines, and UI bindings.
 */

class CartManager {
    constructor() {
        this.cart = [];
        this.storageKey = 'lumina_store_cart';
        this.isOpen = false;
        
        this.init();
    }

    init() {
        this.loadCart();
        this.setupEventListeners();
        this.updateBadge();
    }

    loadCart() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.cart = JSON.parse(stored);
            }
        } catch (err) {
            console.error('Failed to parse cart from storage:', err);
            this.cart = [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
            this.updateBadge();
            this.dispatchChangeEvent();
        } catch (err) {
            console.error('Failed to save cart to storage:', err);
        }
    }

    dispatchChangeEvent() {
        const event = new CustomEvent('cart:updated', { detail: { cart: this.cart } });
        window.dispatchEvent(event);
    }

    setupEventListeners() {
        // Toggle Cart Drawer
        const cartToggleBtn = document.getElementById('cart-toggle-btn');
        const cartCloseBtn = document.getElementById('cart-close-btn');
        const cartBackdrop = document.getElementById('cart-backdrop');

        if (cartToggleBtn) {
            cartToggleBtn.addEventListener('click', () => this.toggleCart(true));
        }
        if (cartCloseBtn) {
            cartCloseBtn.addEventListener('click', () => this.toggleCart(false));
        }
        if (cartBackdrop) {
            cartBackdrop.addEventListener('click', () => this.toggleCart(false));
        }

        // Global Listeners for Add to Cart emitted from catalog
        window.addEventListener('product:add-to-cart', (e) => {
            this.addItem(e.detail);
        });

        // Listen for checkout trigger
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.cart.length === 0) {
                    window.showToast('Your cart is empty', 'warning');
                    return;
                }
                this.toggleCart(false);
                // Dispatch event for checkout module to handle
                window.dispatchEvent(new CustomEvent('checkout:open', { detail: { cart: this.cart, totals: this.getTotals() } }));
            });
        }
    }

    toggleCart(open) {
        this.isOpen = open;
        const drawer = document.getElementById('cart-drawer');
        const backdrop = document.getElementById('cart-backdrop');

        if (!drawer || !backdrop) return;

        if (open) {
            backdrop.classList.remove('hidden');
            setTimeout(() => {
                backdrop.classList.add('opacity-100');
                drawer.classList.remove('translate-x-full');
            }, 10);
            this.renderCartItems();
        } else {
            backdrop.classList.remove('opacity-100');
            drawer.classList.add('translate-x-full');
            setTimeout(() => {
                backdrop.classList.add('hidden');
            }, 300);
        }
    }

    addItem(product) {
        const existingIndex = this.cart.findIndex(item => item.id === product.id);
        
        if (existingIndex > -1) {
            this.cart[existingIndex].quantity += 1;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category || 'General',
                quantity: 1
            });
        }

        this.saveCart();
        if (this.isOpen) {
            this.renderCartItems();
        }
        
        window.showToast(`Added ${product.name} to cart`, 'success');
        
        // Trigger bounce animation on cart badge
        const badge = document.getElementById('cart-badge');
        if (badge) {
            badge.classList.add('scale-125');
            setTimeout(() => badge.classList.remove('scale-125'), 200);
        }
    }

    removeItem(productId) {
        const itemIndex = this.cart.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            const removedName = this.cart[itemIndex].name;
            this.cart.splice(itemIndex, 1);
            this.saveCart();
            this.renderCartItems();
            window.showToast(`Removed ${removedName} from cart`, 'info');
        }
    }

    updateQuantity(productId, delta) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        item.quantity += delta;

        if (item.quantity <= 0) {
            this.removeItem(productId);
        } else {
            this.saveCart();
            this.renderCartItems();
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.renderCartItems();
    }

    getTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 100 || subtotal === 0 ? 0 : 15.00;
        const tax = subtotal * 0.08; // 8% estimated tax
        const total = subtotal + shipping + tax;

        return {
            subtotal: subtotal.toFixed(2),
            shipping: shipping === 0 ? 'FREE' : shipping.toFixed(2),
            shippingNum: shipping,
            tax: tax.toFixed(2),
            total: total.toFixed(2)
        };
    }

    updateBadge() {
        const badge = document.getElementById('cart-badge');
        if (!badge) return;

        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (totalItems > 0) {
            badge.textContent = totalItems > 99 ? '99+' : totalItems;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    renderCartItems() {
        const container = document.getElementById('cart-items-container');
        const emptyState = document.getElementById('cart-empty-state');
        const footerSummary = document.getElementById('cart-footer-summary');
        
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            if (footerSummary) footerSummary.classList.add('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        if (footerSummary) footerSummary.classList.remove('hidden');

        container.innerHTML = this.cart.map(item => `
            <div class="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg bg-slate-100 shrink-0">
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-semibold text-slate-800 truncate">${item.name}</h4>
                    <p class="text-xs text-slate-500 mb-2">$${Number(item.price).toFixed(2)}</p>
                    
                    <div class="flex items-center gap-2">
                        <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                            <button onclick="window.cartManager.updateQuantity(${item.id}, -1)" 
                                class="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 transition-colors">
                                -
                            </button>
                            <span class="px-3 text-xs font-medium text-slate-800">${item.quantity}</span>
                            <button onclick="window.cartManager.updateQuantity(${item.id}, 1)" 
                                class="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 transition-colors">
                                +
                            </button>
                        </div>
                        
                        <button onclick="window.cartManager.removeItem(${item.id})" 
                            class="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors ml-auto"
                            title="Remove item">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-sm font-bold text-slate-900">$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            </div>
        `).join('');

        // Update financial breakdowns in drawer footer
        const totals = this.getTotals();
        const subtotalEl = document.getElementById('cart-subtotal');
        const shippingEl = document.getElementById('cart-shipping');
        const taxEl = document.getElementById('cart-tax');
        const totalEl = document.getElementById('cart-total');

        if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal}`;
        if (shippingEl) shippingEl.textContent = totals.shipping === 'FREE' ? 'FREE' : `$${totals.shipping}`;
        if (taxEl) taxEl.textContent = `$${totals.tax}`;
        if (totalEl) totalEl.textContent = `$${totals.total}`;

        // Re-initialize Lucide icons inside the cart
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

// Instantiate globally so inline HTML handlers can reference window.cartManager
window.cartManager = new CartManager();