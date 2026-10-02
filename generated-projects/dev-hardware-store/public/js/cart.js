/**
 * public/js/cart.js
 * Principal Frontend Architecture & Senior UI/UX Designer Implementation
 * Manages Cart Drawer state, API sync, UI rendering, Checkout flow & Toast notifications.
 */

class CartManager {
    constructor() {
        this.cart = { items: [], total: 0 };
        this.isOpen = false;
        this.isCheckingOut = false;
        
        // DOM Elements
        this.drawerEl = document.getElementById('cart-drawer');
        this.backdropEl = document.getElementById('cart-backdrop');
        this.itemsContainer = document.getElementById('cart-items-container');
        this.cartCountBadge = document.getElementById('cart-count');
        this.cartSubtotalEl = document.getElementById('cart-subtotal');
        this.cartTotalEl = document.getElementById('cart-total');
        this.checkoutBtn = document.getElementById('checkout-btn');
        this.checkoutModal = document.getElementById('checkout-modal');
        this.checkoutForm = document.getElementById('checkout-form');
        this.orderSuccessModal = document.getElementById('order-success-modal');
        this.orderIdEl = document.getElementById('order-id-display');

        this.initEventListeners();
        this.fetchCart();
    }

    initEventListeners() {
        // Toggle Cart Drawer
        const cartToggle = document.getElementById('cart-toggle');
        const closeDrawer = document.getElementById('close-drawer');
        
        if (cartToggle) cartToggle.addEventListener('click', () => this.toggleDrawer(true));
        if (closeDrawer) closeDrawer.addEventListener('click', () => this.toggleDrawer(false));
        if (this.backdropEl) this.backdropEl.addEventListener('click', () => this.toggleDrawer(false));

        // Checkout Trigger
        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', () => {
                if (this.cart.items.length === 0) {
                    this.showToast('Your cart is empty', 'warning');
                    return;
                }
                this.toggleDrawer(false);
                this.openCheckoutModal();
            });
        }

        // Close Checkout Modal
        const closeCheckout = document.getElementById('close-checkout');
        if (closeCheckout) {
            closeCheckout.addEventListener('click', () => this.closeCheckoutModal());
        }

        // Handle Checkout Form Submission
        if (this.checkoutForm) {
            this.checkoutForm.addEventListener('submit', (e) => this.handleCheckoutSubmit(e));
        }

        // Close Success Modal & Reset
        const closeSuccess = document.getElementById('close-success');
        if (closeSuccess) {
            closeSuccess.addEventListener('click', () => {
                this.orderSuccessModal.classList.add('hidden');
                window.location.reload();
            });
        }
    }

    toggleDrawer(open) {
        this.isOpen = open;
        if (!this.drawerEl || !this.backdropEl) return;

        if (open) {
            this.drawerEl.classList.remove('translate-x-full');
            this.backdropEl.classList.remove('opacity-0', 'pointer-events-none');
            this.backdropEl.classList.add('opacity-100');
            document.body.style.overflow = 'hidden';
        } else {
            this.drawerEl.classList.add('translate-x-full');
            this.backdropEl.classList.remove('opacity-100');
            this.backdropEl.classList.add('opacity-0', 'pointer-events-none');
            document.body.style.overflow = 'auto';
        }
    }

    async fetchCart() {
        try {
            const data = await window.api.getCart();
            if (data && data.items) {
                this.cart = data;
                this.renderCart();
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
            this.showToast('Could not sync cart with server', 'error');
        }
    }

    async addItem(productId, quantity = 1) {
        try {
            // Find existing item or construct payload
            const response = await window.api.addToCart(productId, quantity);
            if (response && response.success) {
                this.cart = response.cart;
                this.renderCart();
                this.showToast('Item added to cart successfully', 'success');
                
                // Animate Cart Badge Pulse
                if (this.cartCountBadge) {
                    this.cartCountBadge.classList.add('scale-125', 'bg-indigo-600');
                    setTimeout(() => {
                        this.cartCountBadge.classList.remove('scale-125', 'bg-indigo-600');
                    }, 300);
                }
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showToast('Failed to add item to cart', 'error');
        }
    }

    async removeItem(productId) {
        try {
            const response = await window.api.removeFromCart(productId);
            if (response && response.success) {
                this.cart = response.cart;
                this.renderCart();
                this.showToast('Item removed from cart', 'info');
            }
        } catch (error) {
            console.error('Remove from cart error:', error);
            this.showToast('Failed to remove item', 'error');
        }
    }

    renderCart() {
        if (!this.itemsContainer) return;

        // Calculate total count
        const totalCount = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        if (this.cartCountBadge) {
            this.cartCountBadge.textContent = totalCount;
            this.cartCountBadge.style.display = totalCount > 0 ? 'inline-flex' : 'none';
        }

        // Render Subtotal & Total
        const formattedTotal = `$${Number(this.cart.total || 0).toFixed(2)}`;
        if (this.cartSubtotalEl) this.cartSubtotalEl.textContent = formattedTotal;
        if (this.cartTotalEl) this.cartTotalEl.textContent = formattedTotal;

        // Render Items List
        if (this.cart.items.length === 0) {
            this.itemsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center py-12 px-4 text-slate-400">
                    <i data-lucide="shopping-bag" class="w-16 h-16 mb-4 stroke-1"></i>
                    <p class="text-lg font-medium text-slate-700">Your cart is empty</p>
                    <p class="text-sm text-slate-500 mt-1">Discover our top-tier catalog and add items to begin.</p>
                </div>
            `;
            if (this.checkoutBtn) {
                this.checkoutBtn.disabled = true;
                this.checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        } else {
            if (this.checkoutBtn) {
                this.checkoutBtn.disabled = false;
                this.checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }

            this.itemsContainer.innerHTML = this.cart.items.map(item => {
                // Ensure product details exist (fallback safely if populated via backend)
                const product = item.product || {
                    name: `Product #${item.productId}`,
                    price: 0,
                    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'
                };

                return `
                    <div class="flex items-center gap-4 py-4 border-b border-slate-100 last:border-0 group">
                        <img src="${product.image}" alt="${product.name}" class="w-20 h-20 object-cover rounded-xl bg-slate-100 flex-shrink-0 border border-slate-200/60" />
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-semibold text-slate-800 truncate">${product.name}</h4>
                            <p class="text-xs text-slate-500 mt-0.5">Qty: ${item.quantity}</p>
                            <p class="text-sm font-bold text-indigo-600 mt-1">$${(product.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <button onclick="window.cartManager.removeItem(${item.productId})" 
                                class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove item">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                `;
            }).join('');
        }

        // Re-initialize Lucide icons for newly rendered dynamic elements
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    openCheckoutModal() {
        if (this.checkoutModal) {
            this.checkoutModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCheckoutModal() {
        if (this.checkoutModal) {
            this.checkoutModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    async handleCheckoutSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.checkoutForm);
        const customerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            address: formData.get('address'),
            city: formData.get('city'),
            zip: formData.get('zip')
        };

        try {
            const submitBtn = this.checkoutForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto"></i>`;
            if (window.lucide) window.lucide.createIcons();

            const response = await window.api.checkout(customerData);

            if (response && response.success) {
                this.closeCheckoutModal();
                this.checkoutForm.reset();

                // Display Success Modal
                if (this.orderSuccessModal) {
                    if (this.orderIdEl) this.orderIdEl.textContent = response.orderId || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
                    this.orderSuccessModal.classList.remove('hidden');
                }
                
                this.showToast('Order placed successfully!', 'success');
            } else {
                throw new Error('Checkout failed on server');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            this.showToast('Checkout failed. Please try again.', 'error');
        } finally {
            const submitBtn = this.checkoutForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `Complete Order ($${Number(this.cart.total || 0).toFixed(2)})`;
            }
        }
    }

    showToast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all transform translate-y-5 opacity-0 duration-300`;

        let iconName = 'check-circle';
        if (type === 'error') {
            toast.classList.add('bg-rose-600');
            iconName = 'alert-circle';
        } else if (type === 'warning') {
            toast.classList.add('bg-amber-500');
            iconName = 'alert-triangle';
        } else if (type === 'info') {
            toast.classList.add('bg-blue-600');
            iconName = 'info';
        } else {
            toast.classList.add('bg-slate-900');
        }

        toast.innerHTML = `
            <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        // Trigger entrance transition
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-5', 'opacity-0');
        });

        // Remove after 3.5 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-5', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
}

// Initialize Cart Manager globally upon DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
});