/**
 * public/js/cart.js
 * Principal Frontend Architecture & UI/UX Implementation
 * Component: ShoppingCart, CartItem, Cart State Manager & Drawer Controller
 */

class CartManager {
    constructor() {
        this.items = [];
        this.isOpen = false;
        this.shippingFee = 5.99;
        this.taxRate = 0.08;
        
        // DOM Elements
        this.cartDrawer = null;
        this.cartOverlay = null;
        this.cartItemsContainer = null;
        this.cartCountBadges = [];
        this.subtotalEl = null;
        this.shippingEl = null;
        this.taxEl = null;
        this.totalEl = null;
        this.checkoutBtn = null;
        
        this.init();
    }

    init() {
        // Load cart from localStorage if available
        const savedCart = localStorage.getItem('nexus_cart');
        if (savedCart) {
            try {
                this.items = JSON.parse(savedCart);
            } catch (e) {
                console.error('Failed to parse saved cart', e);
                this.items = [];
            }
        }

        // Wait for DOM to mount elements
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupDOM());
        } else {
            this.setupDOM();
        }
    }

    setupDOM() {
        this.cartDrawer = document.getElementById('cart-drawer');
        this.cartOverlay = document.getElementById('cart-overlay');
        this.cartItemsContainer = document.getElementById('cart-items-container');
        this.cartCountBadges = document.querySelectorAll('.cart-count-badge');
        this.subtotalEl = document.getElementById('cart-subtotal');
        this.shippingEl = document.getElementById('cart-shipping');
        this.taxEl = document.getElementById('cart-tax');
        this.totalEl = document.getElementById('cart-total');
        this.checkoutBtn = document.getElementById('cart-checkout-btn');

        // Global Event Listeners for Cart Trigger
        document.querySelectorAll('.cart-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleCart();
            });
        });

        if (this.cartOverlay) {
            this.cartOverlay.addEventListener('click', () => this.closeCart());
        }

        const closeBtn = document.getElementById('cart-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCart());
        }

        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', () => {
                if (this.items.length === 0) return;
                this.closeCart();
                if (window.checkoutManager) {
                    window.checkoutManager.openCheckout();
                } else {
                    console.warn('CheckoutManager not initialized yet.');
                }
            });
        }

        // Initial UI Render
        this.updateUI();
    }

    toggleCart() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.openCart();
        } else {
            this.closeCart();
        }
    }

    openCart() {
        this.isOpen = true;
        if (this.cartDrawer && this.cartOverlay) {
            this.cartOverlay.classList.remove('hidden');
            // Allow display block first, then transition transform
            setTimeout(() => {
                this.cartOverlay.classList.remove('opacity-0');
                this.cartDrawer.classList.remove('translate-x-full');
            }, 10);
            document.body.style.overflow = 'hidden';
        }
        this.renderCartItems();
    }

    closeCart() {
        this.isOpen = false;
        if (this.cartDrawer && this.cartOverlay) {
            this.cartDrawer.classList.add('translate-x-full');
            this.cartOverlay.classList.add('opacity-0');
            setTimeout(() => {
                this.cartOverlay.classList.add('hidden');
                document.body.style.overflow = '';
            }, 300);
        }
    }

    addItem(product, quantity = 1) {
        const existingIndex = this.items.findIndex(item => item.id === product.id);
        
        if (existingIndex > -1) {
            this.items[existingIndex].quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image || product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
                quantity: quantity
            });
        }

        this.saveAndRefresh();
        this.openCart();
        this.showToast(`Added ${product.name} to cart!`, 'success');
    }

    removeItem(productId) {
        const index = this.items.findIndex(item => item.id === productId);
        if (index > -1) {
            const removed = this.items.splice(index, 1)[0];
            this.saveAndRefresh();
            this.showToast(`Removed ${removed.name} from cart`, 'info');
        }
    }

    updateQuantity(productId, newQty) {
        const item = this.items.find(i => i.id === productId);
        if (item) {
            if (newQty <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = parseInt(newQty, 10);
                this.saveAndRefresh();
            }
        }
    }

    clearCart() {
        this.items = [];
        this.saveAndRefresh();
    }

    saveAndRefresh() {
        // Save to localStorage
        localStorage.setItem('nexus_cart', JSON.stringify(this.items));
        this.updateUI();
    }

    getTotalItemsCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getSubtotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getGrandTotal() {
        const sub = this.getSubtotal();
        if (sub === 0) return 0;
        const shipping = this.shippingFee;
        const tax = sub * this.taxRate;
        return sub + shipping + tax;
    }

    updateUI() {
        // Update all badge counts across navbar / triggers
        const totalCount = this.getTotalItemsCount();
        this.cartCountBadges.forEach(badge => {
            badge.textContent = totalCount;
            if (totalCount > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        });

        // Render drawer items if open or to keep DOM fresh
        if (this.isOpen) {
            this.renderCartItems();
        }

        // Update financial summaries
        const sub = this.getSubtotal();
        const shipping = sub > 0 ? this.shippingFee : 0;
        const tax = sub * this.taxRate;
        const grandTotal = sub > 0 ? sub + shipping + tax : 0;

        if (this.subtotalEl) this.subtotalEl.textContent = `$${sub.toFixed(2)}`;
        if (this.shippingEl) this.shippingEl.textContent = sub > 0 ? `$${shipping.toFixed(2)}` : '$0.00';
        if (this.taxEl) this.taxEl.textContent = `$${tax.toFixed(2)}`;
        if (this.totalEl) this.totalEl.textContent = `$${grandTotal.toFixed(2)}`;

        // Enable/Disable Checkout button
        if (this.checkoutBtn) {
            if (this.items.length === 0) {
                this.checkoutBtn.disabled = true;
                this.checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                this.checkoutBtn.disabled = false;
                this.checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    renderCartItems() {
        if (!this.cartItemsContainer) return;

        if (this.items.length === 0) {
            this.cartItemsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                    <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <i data-lucide="shopping-bag" class="w-10 h-10"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-slate-800 mb-1">Your cart is empty</h3>
                    <p class="text-sm text-slate-500 max-w-xs mb-6">Looks like you haven't added anything to your cart yet.</p>
                    <button onclick="window.cartManager.closeCart()" class="px-6 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl hover:bg-indigo-700 transition shadow-sm">
                        Start Shopping
                    </button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        let html = '<div class="divide-y divide-slate-100">';
        this.items.forEach(item => {
            html += `
                <div class="py-4 flex items-center gap-4 group">
                    <div class="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200/60 relative">
                        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-semibold text-slate-800 truncate mb-1">${item.name}</h4>
                        <p class="text-sm font-bold text-indigo-600 mb-2">$${item.price.toFixed(2)}</p>
                        
                        <div class="flex items-center justify-between">
                            <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                <button onclick="window.cartManager.updateQuantity(${item.id}, ${item.quantity - 1})" class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition">
                                    <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                                </button>
                                <span class="w-8 text-center text-xs font-semibold text-slate-800">${item.quantity}</span>
                                <button onclick="window.cartManager.updateQuantity(${item.id}, ${item.quantity + 1})" class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition">
                                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                            
                            <button onclick="window.cartManager.removeItem(${item.id})" class="text-slate-400 hover:text-rose-600 p-1.5 transition rounded-lg hover:bg-rose-50" title="Remove item">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        this.cartItemsContainer.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    }

    showToast(message, type = 'success') {
        // Create custom UI toast notification
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const bgColors = type === 'success' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-200';
        const iconName = type === 'success' ? 'check-circle-2' : 'info';
        const iconColor = type === 'success' ? 'text-emerald-400' : 'text-indigo-600';

        toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${bgColors} transform translate-y-4 opacity-0 transition-all duration-300 max-w-sm`;
        toast.innerHTML = `
            <i data-lucide="${iconName}" class="w-5 h-5 ${iconColor} flex-shrink-0"></i>
            <span class="text-sm font-medium">${message}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        // Trigger transition
        setTimeout(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        }, 10);

        // Remove after 3.5 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-4', 'opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    }
}

// Instantiate global cart controller
window.cartManager = new CartManager();