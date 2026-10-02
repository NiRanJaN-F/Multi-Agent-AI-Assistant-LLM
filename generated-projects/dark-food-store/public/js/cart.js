/**
 * public/js/cart.js
 * Principal Frontend Architecture & Senior UI/UX Design
 * Handles Cart Drawer State, Item Modifications, Pricing Calculations, and Checkout triggers.
 */

class CartManager {
    constructor() {
        this.items = [];
        this.isOpen = false;
        this.taxRate = 0.08;
        this.deliveryFee = 3.99;
        
        // DOM Elements
        this.drawer = document.getElementById('cart-drawer');
        this.overlay = document.getElementById('cart-overlay');
        this.itemsContainer = document.getElementById('cart-items-container');
        this.cartCountBadge = document.getElementById('cart-count');
        this.cartSubtotalEl = document.getElementById('cart-subtotal');
        this.cartTaxEl = document.getElementById('cart-tax');
        this.cartDeliveryEl = document.getElementById('cart-delivery');
        this.cartTotalEl = document.getElementById('cart-total');
        this.checkoutBtn = document.getElementById('checkout-btn');
        this.emptyStateEl = document.getElementById('cart-empty-state');
        this.footerStateEl = document.getElementById('cart-footer-state');

        this.initListeners();
        this.loadLocalCart();
    }

    initListeners() {
        // Toggle Cart Drawer
        const cartToggleBtn = document.getElementById('cart-toggle-btn');
        const closeCartBtn = document.getElementById('close-cart-btn');

        if (cartToggleBtn) cartToggleBtn.addEventListener('click', () => this.toggleCart(true));
        if (closeCartBtn) closeCartBtn.addEventListener('click', () => this.toggleCart(false));
        if (this.overlay) this.overlay.addEventListener('click', () => this.toggleCart(false));

        // Checkout Trigger
        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', () => {
                if (this.items.length === 0) return;
                this.toggleCart(false);
                if (window.checkoutModal) {
                    window.checkoutModal.open(this.getTotals(), this.items);
                }
            });
        }

        // Listen for ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.toggleCart(false);
            }
        });
    }

    loadLocalCart() {
        try {
            const saved = localStorage.getItem('crave_cart');
            if (saved) {
                this.items = JSON.parse(saved);
                this.render();
            }
        } catch (e) {
            console.error('Failed to load cart from localStorage', e);
            this.items = [];
        }
    }

    saveLocalCart() {
        try {
            localStorage.setItem('crave_cart', JSON.stringify(this.items));
        } catch (e) {
            console.error('Failed to save cart to localStorage', e);
        }
    }

    togglecart(open) {
        this.isOpen = open;
        if (!this.drawer || !this.overlay) return;

        if (open) {
            this.drawer.classList.remove('translate-x-full');
            this.overlay.classList.remove('hidden');
            setTimeout(() => this.overlay.classList.remove('opacity-0'), 10);
            document.body.style.overflow = 'hidden';
        } else {
            this.drawer.classList.add('translate-x-full');
            this.overlay.classList.add('opacity-0');
            setTimeout(() => this.overlay.classList.add('hidden'), 300);
            document.body.style.overflow = '';
        }
    }

    addItem(product) {
        const existingIndex = this.items.findIndex(item => item.id === product.id);

        if (existingIndex > -1) {
            this.items[existingIndex].quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image,
                category: product.category,
                quantity: 1
            });
        }

        this.saveLocalCart();
        this.render();
        this.showToast(`Added ${product.name} to cart`);
        
        // Subtle pulse animation on cart badge
        if (this.cartCountBadge) {
            this.cartCountBadge.classList.add('scale-125', 'bg-orange-600');
            setTimeout(() => {
                this.cartCountBadge.classList.remove('scale-125', 'bg-orange-600');
            }, 300);
        }
    }

    updateQuantity(id, change) {
        const index = this.items.findIndex(item => item.id === id);
        if (index === -1) return;

        this.items[index].quantity += change;

        if (this.items[index].quantity <= 0) {
            this.items.splice(index, 1);
        }

        this.saveLocalCart();
        this.render();
    }

    removeItem(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index > -1) {
            const removedName = this.items[index].name;
            this.items.splice(index, 1);
            this.saveLocalCart();
            this.render();
            this.showToast(`Removed ${removedName} from cart`, 'info');
        }
    }

    clearCart() {
        this.items = [];
        this.saveLocalCart();
        this.render();
    }

    getTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * this.taxRate;
        const delivery = subtotal > 0 ? this.deliveryFee : 0;
        const total = subtotal + tax + delivery;

        return {
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            delivery: delivery.toFixed(2),
            total: total.toFixed(2),
            itemCount: this.items.reduce((sum, item) => sum + item.quantity, 0)
        };
    }

    render() {
        const totals = this.getTotals();

        // Update badge count
        if (this.cartCountBadge) {
            this.cartCountBadge.textContent = totals.itemCount;
            if (totals.itemCount > 0) {
                this.cartCountBadge.classList.remove('hidden');
            } else {
                this.cartCountBadge.classList.add('hidden');
            }
        }

        // Toggle Empty vs Filled State
        if (this.items.length === 0) {
            if (this.emptyStateEl) this.emptyStateEl.classList.remove('hidden');
            if (this.itemsContainer) this.itemsContainer.classList.add('hidden');
            if (this.footerStateEl) this.footerStateEl.classList.add('hidden');
            return;
        }

        if (this.emptyStateEl) this.emptyStateEl.classList.add('hidden');
        if (this.itemsContainer) this.itemsContainer.classList.remove('hidden');
        if (this.footerStateEl) this.footerStateEl.classList.remove('hidden');

        // Render Cart Items
        if (this.itemsContainer) {
            this.itemsContainer.innerHTML = this.items.map(item => `
                <div class="flex items-center gap-4 p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl transition-all hover:border-zinc-700 group">
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-xl bg-zinc-800 flex-shrink-0">
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-semibold text-zinc-100 truncate">${item.name}</h4>
                        <p class="text-xs text-orange-400 font-medium mt-0.5">$${item.price.toFixed(2)}</p>
                        
                        <div class="flex items-center gap-3 mt-2">
                            <div class="flex items-center border border-zinc-700 bg-zinc-950 rounded-lg overflow-hidden">
                                <button onclick="window.cartManager.updateQuantity(${item.id}, -1)" 
                                    class="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                                    <i data-lucide="minus" class="w-3 h-3"></i>
                                </button>
                                <span class="px-2.5 text-xs font-semibold text-zinc-200">${item.quantity}</span>
                                <button onclick="window.cartManager.updateQuantity(${item.id}, 1)" 
                                    class="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                                    <i data-lucide="plus" class="w-3 h-3"></i>
                                </button>
                            </div>
                            <button onclick="window.cartManager.removeItem(${item.id})" 
                                class="text-zinc-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-sm font-bold text-zinc-100">$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                </div>
            `).join('');
        }

        // Update Totals
        if (this.cartSubtotalEl) this.cartSubtotalEl.textContent = `$${totals.subtotal}`;
        if (this.cartTaxEl) this.cartTaxEl.textContent = `$${totals.tax}`;
        if (this.cartDeliveryEl) this.cartDeliveryEl.textContent = `$${totals.delivery}`;
        if (this.cartTotalEl) this.cartTotalEl.textContent = `$${totals.total}`;

        // Re-initialize Lucide icons inside the drawer
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-zinc-900 border-orange-500/50 text-zinc-100' : 'bg-zinc-900 border-zinc-700 text-zinc-300';
        const iconName = type === 'success' ? 'check-circle' : 'info';
        const iconColor = type === 'success' ? 'text-orange-500' : 'text-zinc-400';

        toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto ${bgColor}`;
        toast.innerHTML = `
            <i data-lucide="${iconName}" class="w-5 h-5 ${iconColor} flex-shrink-0"></i>
            <span class="text-sm font-medium">${message}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        // Animate In
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        });

        // Remove after 3s
        setTimeout(() => {
            toast.classList.add('translate-y-4', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
});