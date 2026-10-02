/**
 * public/js/cart.js
 * Manages cart state, persistent storage in localStorage, drawer UI, item quantities, and subtotal calculation.
 */

class CartManager {
    constructor() {
        this.cartKey = 'devcore_cart_items';
        this.items = this.loadCart();
        this.shippingThreshold = 100;
        this.shippingCost = 15;
        this.initElements();
        this.initListeners();
        this.render();
    }

    initElements() {
        this.cartDrawer = document.getElementById('cart-drawer');
        this.cartBackdrop = document.getElementById('cart-backdrop');
        this.cartBtn = document.getElementById('cart-btn');
        this.closeCartBtn = document.getElementById('close-cart-btn');
        this.cartItemsContainer = document.getElementById('cart-items-container');
        this.cartCountBadge = document.getElementById('cart-count-badge');
        this.cartSubtotal = document.getElementById('cart-subtotal');
        this.cartTotal = document.getElementById('cart-total');
        this.cartCountTitle = document.getElementById('cart-count-title');
        this.checkoutBtn = document.getElementById('checkout-btn');
        this.emptyCartState = document.getElementById('empty-cart-state');
        this.shippingProgress = document.getElementById('shipping-progress');
        this.shippingText = document.getElementById('shipping-text');
    }

    initListeners() {
        if (this.cartBtn) {
            this.cartBtn.addEventListener('click', () => this.openCart());
        }
        if (this.closeCartBtn) {
            this.closeCartBtn.addEventListener('click', () => this.closeCart());
        }
        if (this.cartBackdrop) {
            this.cartBackdrop.addEventListener('click', () => this.closeCart());
        }

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.cartDrawer && !this.cartDrawer.classList.contains('translate-x-full')) {
                this.closeCart();
            }
        });

        // Checkout action simulation
        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', () => {
                if (this.items.length === 0) return;
                alert('Secure checkout simulation successful! Thank you for purchasing from DevCore™.');
                this.clearCart();
                this.closeCart();
            });
        }
    }

    loadCart() {
        try {
            const stored = localStorage.getItem(this.cartKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to parse cart from localStorage:', e);
            return [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem(this.cartKey, JSON.stringify(this.items));
        } catch (e) {
            console.error('Failed to save cart to localStorage:', e);
        }
        this.render();
    }

    addItem(pItem, quantity = 1) { const product = typeof pItem === "string" ? ((window.PRODUCTS || []).find(p => p.id === pItem) || { id: pItem, name: "Item", price: 0 }) : pItem;
        const existingIndex = this.items.findIndex(item => item.id === product.id);
        if (existingIndex > -1) {
            this.items[existingIndex].quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: quantity
            });
        }
        this.saveCart();
        this.openCart();
        
        // Dispatch custom event for UI feedback / toast
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { action: 'add', product } }));
    }

    updateQuantity(productId, delta) {
        const index = this.items.findIndex(item => item.id === productId);
        if (index > -1) {
            this.items[index].quantity += delta;
            if (this.items[index].quantity <= 0) {
                this.items.splice(index, 1);
            }
            this.saveCart();
        }
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
    }

    clearCart() {
        this.items = [];
        this.saveCart();
    }

    openCart() {
        if (!this.cartDrawer || !this.cartBackdrop) return;
        this.cartDrawer.classList.remove('translate-x-full');
        this.cartBackdrop.classList.remove('opacity-0', 'pointer-events-none');
        document.body.style.overflow = 'hidden';
    }

    closeCart() {
        if (!this.cartDrawer || !this.cartBackdrop) return;
        this.cartDrawer.classList.add('translate-x-full');
        this.cartBackdrop.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
    }

    getTotalCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getSubtotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    render() {
        const count = this.getTotalCount();
        const subtotal = this.getSubtotal();

        // Update badge
        if (this.cartCountBadge) {
            this.cartCountBadge.textContent = count;
            if (count > 0) {
                this.cartCountBadge.classList.remove('scale-0');
            } else {
                this.cartCountBadge.classList.add('scale-0');
            }
        }

        if (this.cartCountTitle) {
            this.cartCountTitle.textContent = `${count} ${count === 1 ? 'Item' : 'Items'}`;
        }

        // Render items or empty state
        if (this.cartItemsContainer) {
            if (this.items.length === 0) {
                this.cartItemsContainer.innerHTML = '';
                if (this.emptyCartState) this.emptyCartState.classList.remove('hidden');
                if (this.checkoutBtn) {
                    this.checkoutBtn.disabled = true;
                    this.checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
                }
            } else {
                if (this.emptyCartState) this.emptyCartState.classList.add('hidden');
                if (this.checkoutBtn) {
                    this.checkoutBtn.disabled = false;
                    this.checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }

                this.cartItemsContainer.innerHTML = this.items.map(item => `
                    <div class="flex gap-4 p-3 rounded-2xl bg-dark-800/60 border border-slate-700/50 items-center transition-all duration-200 hover:border-slate-600">
                        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-xl bg-dark-900 border border-slate-700/60 flex-shrink-0">
                        <div class="flex-1 min-w-0">
                            <span class="text-[10px] uppercase tracking-wider font-semibold text-accent-400 block mb-0.5">${item.category}</span>
                            <h4 class="text-sm font-medium text-slate-200 truncate">${item.name}</h4>
                            <div class="text-sm font-bold text-white mt-1">$${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                        <div class="flex flex-col items-end justify-between h-full gap-3">
                            <button onclick="cartManager.removeItem(${item.id})" aria-label="Remove item" class="text-slate-500 hover:text-rose-400 transition-colors">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                            <div class="flex items-center gap-1.5 bg-dark-900/90 border border-slate-700/80 rounded-lg p-1">
                                <button onclick="cartManager.updateQuantity(${item.id}, -1)" aria-label="Decrease quantity" class="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors">
                                    <i data-lucide="minus" class="w-3 h-3"></i>
                                </button>
                                <span class="text-xs font-semibold text-white px-1.5 min-w-[20px] text-center">${item.quantity}</span>
                                <button onclick="cartManager.updateQuantity(${item.id}, 1)" aria-label="Increase quantity" class="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors">
                                    <i data-lucide="plus" class="w-3 h-3"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Calculate totals & shipping progress
        const shipping = subtotal >= this.shippingThreshold || subtotal === 0 ? 0 : this.shippingCost;
        const total = subtotal + shipping;

        if (this.cartSubtotal) this.cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        if (this.cartTotal) this.cartTotal.textContent = `$${total.toFixed(2)}`;

        // Shipping progress bar update
        if (this.shippingProgress && this.shippingText) {
            const progressPercent = Math.min(100, (subtotal / this.shippingThreshold) * 100);
            this.shippingProgress.style.width = `${progressPercent}%`;

            if (subtotal >= this.shippingThreshold) {
                this.shippingText.innerHTML = `<span class="text-emerald-400 font-medium flex items-center gap-1"><i data-lucide="check-circle" class="w-3.5 h-3.5 inline"></i> You qualify for Free Shipping!</span>`;
            } else {
                const diff = (this.shippingThreshold - subtotal).toFixed(2);
                this.shippingText.innerHTML = `Add <span class="text-accent-400 font-semibold">$${diff}</span> more for Free Shipping`;
            }
        }

        // Re-initialize Lucide icons for newly rendered dynamic nodes
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }
}

// Instantiate global cart manager
const cartManager = window.Cart = window.cartManager = new CartManager();