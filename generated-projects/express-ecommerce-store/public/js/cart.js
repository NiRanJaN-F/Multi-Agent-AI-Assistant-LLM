* Component: ShoppingCartDrawer & State Management
 */

class CartManager {
    constructor() {
        this.items = [];
        this.isOpen = false;
        this.shippingFee = 5.99;
        this.taxRate = 0.08;
        
        // DOM Element cache
        this.drawerEl = null;
        this.overlayEl = null;
        this.badgeEls = [];
        this.itemsContainerEl = null;
        this.subtotalEl = null;
        this.taxEl = null;
        this.shippingEl = null;
        this.totalEl = null;
        this.checkoutBtnEl = null;

        this.init();
    }

    init() {
        // Load initial state from sessionStorage if available
        try {
            const savedCart = sessionStorage.getItem('lumina_cart');
            if (savedCart) {
                this.items = JSON.parse(savedCart);
            }
        } catch (e) {
            console.error('Failed to parse cart from session storage', e);
            this.items = [];
        }

        // Wait for DOM to wire up references
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupDOM());
        } else {
            this.setupDOM();
        }
    }

    setupDOM() {
        this.drawerEl = document.getElementById('cart-drawer');
        this.overlayEl = document.getElementById('cart-overlay');
        this.badgeEls = document.querySelectorAll('.cart-badge');
        this.itemsContainerEl = document.getElementById('cart-items-container');
        this.subtotalEl = document.getElementById('cart-subtotal');
        this.taxEl = document.getElementById('cart-tax');
        this.shippingEl = document.getElementById('cart-shipping');
        this.totalEl = document.getElementById('cart-total');
        this.checkoutBtnEl = document.getElementById('proceed-to-checkout-btn');

        // Global Event Listeners for Cart Triggers
        document.querySelectorAll('.cart-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleCart(true);
            });
        });

        if (this.overlayEl) {
            this.overlayEl.addEventListener('click', () => this.toggleCart(false));
        }

        const closeBtn = document.getElementById('close-cart-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggleCart(false));
        }

        // Keyboard accessibility: Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.toggleCart(false);
            }
        });

        if (this.checkoutBtnEl) {
            this.checkoutBtnEl.addEventListener('click', () => {
                if (this.items.length === 0) return;
                this.toggleCart(false);
                // Dispatch event for CheckoutModal to handle
                window.dispatchEvent(new CustomEvent('lumina:open-checkout', { 
                    detail: { cart: this.items, totals: this.calculateTotals() } 
                }));
            });
        }

        // Initial render update
        this.updateUI();
    }

    toggleCart(open) {
        this.isOpen = open;
        if (!this.drawerEl || !this.overlayEl) return;

        if (open) {
            this.drawerEl.classList.remove('translate-x-full');
            this.overlayEl.classList.remove('opacity-0', 'pointer-events-none');
            this.overlayEl.classList.add('opacity-100');
            document.body.style.overflow = 'hidden';
        } else {
            this.drawerEl.classList.add('translate-x-full');
            this.overlayEl.classList.add('opacity-0', 'pointer-events-none');
            this.overlayEl.classList.remove('opacity-100');
            document.body.style.overflow = '';
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
                image: product.image,
                category: product.category,
                quantity: quantity
            });
        }

        this.syncState();
        this.updateUI();
        this.toggleCart(true);
        this.showToast(`Added ${product.name} to cart`, 'success');
    }

    removeItem(productId) {
        const index = this.items.findIndex(item => item.id === productId);
        if (index > -1) {
            const removedItem = this.items[index];
            this.items.splice(index, 1);
            this.syncState();
            this.updateUI();
            this.showToast(`Removed ${removedItem.name} from cart`, 'info');
        }
    }

    updateQuantity(productId, delta) {
        const item = this.items.find(i => i.id === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            this.removeItem(productId);
        } else {
            this.syncState();
            this.updateUI();
        }
    }

    setQuantity(productId, quantity) {
        const item = this.items.find(i => i.id === productId);
        if (!item) return;

        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty <= 0) {
            this.removeItem(productId);
        } else {
            item.quantity = qty;
            this.syncState();
            this.updateUI();
        }
    }

    clearCart() {
        this.items = [];
        this.syncState();
        this.updateUI();
    }

    syncState() {
        try {
            sessionStorage.setItem('lumina_cart', JSON.stringify(this.items));
        } catch (e) {
            console.error('Failed to write cart to session storage', e);
        }
    }

    calculateTotals() {
        const subtotal = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const tax = subtotal * this.taxRate;
        const shipping = subtotal > 0 ? this.shippingFee : 0;
        const total = subtotal + tax + shipping;

        return {
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            shipping: shipping.toFixed(2),
            total: total.toFixed(2),
            itemCount: this.items.reduce((acc, item) => acc + item.quantity, 0)
        };
    }

    updateUI() {
        const totals = this.calculateTotals();

        // 1. Update Badges
        this.badgeEls.forEach(badge => {
            if (totals.itemCount > 0) {
                badge.textContent = totals.itemCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        });

        // 2. Update Summary Elements
        if (this.subtotalEl) this.subtotalEl.textContent = `$${totals.subtotal}`;
        if (this.taxEl) this.taxEl.textContent = `$${totals.tax}`;
        if (this.shippingEl) this.shippingEl.textContent = totals.shipping === '0.00' ? 'FREE' : `$${totals.shipping}`;
        if (this.totalEl) this.totalEl.textContent = `$${totals.total}`;

        if (this.checkoutBtnEl) {
            if (this.items.length === 0) {
                this.checkoutBtnEl.setAttribute('disabled', 'true');
                this.checkoutBtnEl.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                this.checkoutBtnEl.removeAttribute('disabled');
                this.checkoutBtnEl.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }

        // 3. Render Cart Items List
        if (!this.itemsContainerEl) return;

        if (this.items.length === 0) {
            this.itemsContainerEl.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                    <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <i data-lucide="shopping-bag" class="w-10 h-10"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-700 mb-1">Your cart is empty</h3>
                    <p class="text-sm text-gray-500 max-w-xs mb-6">Discover our curated selection and add items to your cart to begin your order.</p>
                    <button onclick="window.cartManager.toggleCart(false)" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition shadow-sm hover:shadow">
                        Start Shopping
                    </button>
                </div>
            `;
        } else {
            this.itemsContainerEl.innerHTML = this.items.map(item => `
                <div class="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-gray-200 transition items-center group">
                    <div class="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="text-xs font-medium text-indigo-600 uppercase tracking-wider">${item.category}</span>
                        <h4 class="text-sm font-semibold text-gray-900 truncate mb-1">${item.name}</h4>
                        <div class="text-sm font-bold text-gray-900 mb-2">$${(item.price * item.quantity).toFixed(2)}</div>
                        
                        <div class="flex items-center gap-2">
                            <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                <button onclick="window.cartManager.updateQuantity(${item.id}, -1)" class="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
                                    <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                                </button>
                                <input type="number" min="1" value="${item.quantity}" 
                                    onchange="window.cartManager.setQuantity(${item.id}, this.value)"
                                    class="w-10 text-center text-xs font-semibold bg-transparent border-0 focus:outline-none p-0 text-gray-900">
                                <button onclick="window.cartManager.updateQuantity(${item.id}, 1)" class="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
                                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button onclick="window.cartManager.removeItem(${item.id})" class="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition self-start" title="Remove item">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `).join('');
        }

        // Re-initialize Lucide icons for dynamically added elements
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    showToast(message, type = 'success') {
        // Look for existing toast container or create one
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const bgColors = type === 'success' ? 'bg-gray-900 text-white' : 'bg-indigo-600 text-white';
        const iconName = type === 'success' ? 'check-circle' : 'info';

        toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${bgColors} text-sm font-medium transform translate-y-5 opacity-0 transition-all duration-300 max-w-sm`;
        toast.innerHTML = `
            <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0 text-emerald-400"></i>
            <span class="flex-1">${message}</span>
        `;

        container.appendChild(toast);
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-5', 'opacity-0');
        });

        // Remove after 3.5s
        setTimeout(() => {
            toast.classList.add('translate-y-5', 'opacity-0');
            setTimeout(() => {
                toast.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, 3500);
    }
}

// Instantiate globally so inline handlers can talk to it seamlessly
window.cartManager = new CartManager();
```