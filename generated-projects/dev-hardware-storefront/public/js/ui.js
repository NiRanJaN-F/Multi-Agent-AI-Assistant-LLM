// public/js/ui.js - UI Rendering & DOM Manipulation Engine

class UIEngine {
    constructor() {
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.selectedRating = 0;
        
        // Cache DOM elements safely
        this.productGrid = document.getElementById('product-grid');
        this.categoryTabsContainer = document.getElementById('category-tabs');
        this.searchInput = document.getElementById('search-input');
        this.mobileSearchInput = document.getElementById('mobile-search-input');
        this.cartCountBadge = document.getElementById('cart-count-badge');
        this.cartDrawer = document.getElementById('cart-drawer');
        this.cartBackdrop = document.getElementById('cart-backdrop');
        this.cartBtn = document.getElementById('cart-btn');
        this.closeCartBtn = document.getElementById('close-cart-btn');
        this.cartItemsContainer = document.getElementById('cart-items');
        this.cartSubtotalEl = document.getElementById('cart-subtotal');
        this.cartTaxEl = document.getElementById('cart-tax');
        this.cartTotalEl = document.getElementById('cart-total');
        this.emptyCartState = document.getElementById('empty-cart-state');
        this.cartFooter = document.getElementById('cart-footer');
        this.checkoutBtn = document.getElementById('checkout-btn');
        this.clearCartBtn = document.getElementById('clear-cart-btn');
        this.quickViewModal = document.getElementById('quick-view-modal');
        this.quickViewContent = document.getElementById('quick-view-content');
        this.closeModalBtn = document.getElementById('close-modal');
        this.modalBackdrop = document.getElementById('modal-backdrop');
        this.toastContainer = document.getElementById('toast-container');
        this.noResultsEl = document.getElementById('no-results');
        this.resetSearchBtn = document.getElementById('reset-search');
        this.productCountEl = document.getElementById('product-count');
        this.newsletterForm = document.getElementById('newsletter-form');
        this.newsletterInput = document.getElementById('newsletter-input');
    }

    init(products, cart) {
        this.products = products;
        this.cart = cart;

        this.renderCategories();
        this.renderProducts(products.getAll());
        this.setupEventListeners();
        this.updateCartUI();

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderCategories() {
        if (!this.categoryTabsContainer) return;

        const categories = [
            { id: 'all', name: 'All Gear', icon: 'grid' },
            { id: 'keyboards', name: 'Keyboards', icon: 'keyboard' },
            { id: 'audio', name: 'Audio', icon: 'headphones' },
            { id: 'desks', name: 'Desks & Stands', icon: 'monitor' },
            { id: 'accessories', name: 'Accessories', icon: 'cpu' }
        ];

        this.categoryTabsContainer.innerHTML = categories.map(cat => {
            const isActive = this.currentCategory === cat.id;
            return `
                <button data-category="${cat.id}" class="category-tab group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    isActive 
                        ? 'bg-accent-600/15 border-accent-500/50 text-accent-400 shadow-lg shadow-accent-500/10' 
                        : 'bg-dark-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-dark-800 hover:border-slate-600'
                }">
                    <i data-lucide="${cat.icon}" class="w-4 h-4 ${isActive ? 'text-accent-400' : 'text-slate-500 group-hover:text-slate-300'}"></i>
                    <span>${cat.name}</span>
                </button>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderProducts(items) {
        if (!this.productGrid) return;

        if (this.productCountEl) {
            this.productCountEl.textContent = `${items.length} product${items.length === 1 ? '' : 's'}`;
        }

        if (items.length === 0) {
            this.productGrid.innerHTML = '';
            if (this.noResultsEl) this.noResultsEl.classList.remove('hidden');
            return;
        }

        if (this.noResultsEl) this.noResultsEl.classList.add('hidden');

        this.productGrid.innerHTML = items.map(product => {
            const isWishlisted = false; // Placeholder for wishlist if implemented
            return `
                <div class="product-card group bg-dark-800/50 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all duration-300 flex flex-col overflow-hidden shadow-xl" data-id="${product.id}">
                    <div class="relative aspect-[4/3] bg-dark-900 overflow-hidden cursor-pointer quick-view-trigger" data-id="${product.id}">
                        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <span class="w-full py-2.5 px-4 bg-dark-900/90 backdrop-blur-md text-slate-200 text-sm font-medium rounded-xl border border-slate-700/60 text-center hover:bg-accent-600 hover:text-white hover:border-accent-500 transition-colors shadow-lg">
                                Quick View
                            </span>
                        </div>
                        ${product.badge ? `<span class="absolute top-3 left-3 px-3 py-1 bg-accent-600/90 text-white text-xs font-semibold rounded-lg backdrop-blur-md shadow-md">${product.badge}</span>` : ''}
                    </div>
                    <div class="p-5 flex flex-col flex-grow">
                        <div class="text-xs font-semibold text-accent-400 uppercase tracking-wider mb-1.5">${product.category}</div>
                        <h3 class="text-base font-semibold text-slate-100 mb-2 line-clamp-1 group-hover:text-accent-400 transition-colors cursor-pointer quick-view-trigger" data-id="${product.id}">${product.name}</h3>
                        <p class="text-sm text-slate-400 mb-4 line-clamp-2 flex-grow">${product.description}</p>
                        
                        <div class="flex items-center justify-between pt-4 border-t border-slate-800/60 mt-auto">
                            <div class="flex flex-col">
                                <span class="text-xs text-slate-500 uppercase tracking-wider">Price</span>
                                <span class="text-lg font-bold text-slate-100">$${product.price.toFixed(2)}</span>
                            </div>
                            <button class="add-to-cart-btn px-4 py-2.5 bg-accent-600 hover:bg-accent-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-accent-600/20 flex items-center gap-2 active:scale-95" data-id="${product.id}">
                                <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                <span>Add to Cart</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    filterAndRender() {
        let items = this.currentCategory === 'all' 
            ? this.products.getAll() 
            : this.products.getByCategory(this.currentCategory);

        if (this.searchQuery.trim() !== '') {
            const query = this.searchQuery.toLowerCase().trim();
            items = items.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.description.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
        }

        if (this.selectedRating > 0) {
            items = items.filter(p => (p.rating || 5) >= this.selectedRating);
        }

        this.renderProducts(items);
    }

    setupEventListeners() {
        if (this.categoryTabsContainer) {
            this.categoryTabsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.category-tab');
                if (!btn) return;
                
                this.currentCategory = btn.dataset.category;
                this.renderCategories();
                this.filterAndRender();
            });
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                if (this.mobileSearchInput) this.mobileSearchInput.value = this.searchQuery;
                this.filterAndRender();
            });
        }

        if (this.mobileSearchInput) {
            this.mobileSearchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                if (this.searchInput) this.searchInput.value = this.searchQuery;
                this.filterAndRender();
            });
        }

        if (this.productGrid) {
            this.productGrid.addEventListener('click', (e) => {
                const addToCartBtn = e.target.closest('.add-to-cart-btn');
                if (addToCartBtn) {
                    const productId = parseInt(addToCartBtn.dataset.id, 10);
                    const product = this.products.getById(productId);
                    if (product) {
                        this.cart.addItem(product);
                        this.updateCartUI();
                        this.showToast(`Added ${product.name} to cart`);
                    }
                    return;
                }

                const quickViewTrigger = e.target.closest('.quick-view-trigger');
                if (quickViewTrigger) {
                    const productId = parseInt(quickViewTrigger.dataset.id, 10);
                    this.openQuickView(productId);
                }
            });
        }

        if (this.cartBtn) {
            this.cartBtn.addEventListener('click', () => this.toggleCart(true));
        }

        if (this.closeCartBtn || this.cartBackdrop) {
            [this.closeCartBtn, this.cartBackdrop].forEach(el => {
                if (el) el.addEventListener('click', () => this.toggleCart(false));
            });
        }

        if (this.clearCartBtn) {
            this.clearCartBtn.addEventListener('click', () => {
                this.cart.clear();
                this.updateCartUI();
                this.showToast('Cart cleared');
            });
        }

        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', () => {
                if (this.cart.getItems().length === 0) return;
                this.showToast('Proceeding to checkout...');
                setTimeout(() => {
                    this.cart.clear();
                    this.updateCartUI();
                    this.toggleCart(false);
                    this.showToast('Order placed successfully! Thank you.');
                }, 1500);
            });
        }

        if (this.cartItemsContainer) {
            this.cartItemsContainer.addEventListener('click', (e) => {
                const increaseBtn = e.target.closest('.increase-qty');
                const decreaseBtn = e.target.closest('.decrease-qty');
                const removeBtn = e.target.closest('.remove-item');

                if (increaseBtn) {
                    const id = parseInt(increaseBtn.dataset.id, 10);
                    const item = this.cart.getItems().find(i => i.id === id);
                    if (item) {
                        this.cart.updateQuantity(id, item.quantity + 1);
                        this.updateCartUI();
                    }
                } else if (decreaseBtn) {
                    const id = parseInt(decreaseBtn.dataset.id, 10);
                    const item = this.cart.getItems().find(i => i.id === id);
                    if (item) {
                        this.cart.updateQuantity(id, item.quantity - 1);
                        this.updateCartUI();
                    }
                } else if (removeBtn) {
                    const id = parseInt(removeBtn.dataset.id, 10);
                    this.cart.removeItem(id);
                    this.updateCartUI();
                    this.showToast('Item removed from cart');
                }
            });
        }

        if (this.closeModalBtn || this.modalBackdrop) {
            [this.closeModalBtn, this.modalBackdrop].forEach(el => {
                if (el) el.addEventListener('click', () => this.closeQuickView());
            });
        }

        if (this.quickViewModal) {
            this.quickViewModal.addEventListener('click', (e) => {
                const modalAddToCart = e.target.closest('.modal-add-to-cart');
                if (modalAddToCart) {
                    const productId = parseInt(modalAddToCart.dataset.id, 10);
                    const product = this.products.getById(productId);
                    if (product) {
                        this.cart.addItem(product);
                        this.updateCartUI();
                        this.showToast(`Added ${product.name} to cart`);
                        this.closeQuickView();
                    }
                }
            });
        }

        if (this.resetSearchBtn) {
            this.resetSearchBtn.addEventListener('click', () => {
                this.searchQuery = '';
                if (this.searchInput) this.searchInput.value = '';
                if (this.mobileSearchInput) this.mobileSearchInput.value = '';
                this.currentCategory = 'all';
                this.selectedRating = 0;
                this.renderCategories();
                this.filterAndRender();
            });
        }

        if (this.newsletterForm) {
            this.newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.newsletterInput && this.newsletterInput.value.trim()) {
                    this.showToast('Successfully subscribed to newsletter!');
                    this.newsletterInput.value = '';
                }
            });
        }
    }

    toggleCart(open) {
        if (!this.cartDrawer || !this.cartBackdrop) return;
        if (open) {
            this.cartDrawer.classList.remove('translate-x-full');
            this.cartBackdrop.classList.remove('opacity-0', 'pointer-events-none');
            document.body.style.overflow = 'hidden';
        } else {
            this.cartDrawer.classList.add('translate-x-full');
            this.cartBackdrop.classList.add('opacity-0', 'pointer-events-none');
            document.body.style.overflow = '';
        }
    }

    updateCartUI() {
        const items = this.cart.getItems();
        const count = this.cart.getTotalCount();

        if (this.cartCountBadge) {
            this.cartCountBadge.textContent = count;
            if (count > 0) {
                this.cartCountBadge.classList.remove('hidden');
            } else {
                this.cartCountBadge.classList.add('hidden');
            }
        }

        if (!this.cartItemsContainer) return;

        if (items.length === 0) {
            this.cartItemsContainer.innerHTML = '';
            if (this.emptyCartState) this.emptyCartState.classList.remove('hidden');
            if (this.cartFooter) this.cartFooter.classList.add('hidden');
            return;
        }

        if (this.emptyCartState) this.emptyCartState.classList.add('hidden');
        if (this.cartFooter) this.cartFooter.classList.remove('hidden');

        this.cartItemsContainer.innerHTML = items.map(item => `
            <div class="flex gap-4 p-4 bg-dark-900/50 rounded-xl border border-slate-800/80 items-center">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg bg-dark-800 flex-shrink-0">
                <div class="flex-grow min-w-0">
                    <h4 class="text-sm font-medium text-slate-200 truncate">${item.name}</h4>
                    <div class="text-sm font-bold text-accent-400 mt-0.5">$${item.price.toFixed(2)}</div>
                    <div class="flex items-center gap-3 mt-2">
                        <div class="flex items-center border border-slate-700/60 rounded-lg bg-dark-800 overflow-hidden">
                            <button class="decrease-qty px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors" data-id="${item.id}">-</button>
                            <span class="px-2.5 text-xs font-semibold text-slate-200">${item.quantity}</span>
                            <button class="increase-qty px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-item text-slate-500 hover:text-red-400 transition-colors text-xs flex items-center gap-1" data-id="${item.id}">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            <span>Remove</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        const subtotal = this.cart.getSubtotal();
        const tax = this.cart.getTax();
        const total = this.cart.getTotal();

        if (this.cartSubtotalEl) this.cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (this.cartTaxEl) this.cartTaxEl.textContent = `$${tax.toFixed(2)}`;
        if (this.cartTotalEl) this.cartTotalEl.textContent = `$${total.toFixed(2)}`;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    openQuickView(productId) {
        const product = this.products.getById(productId);
        if (!product || !this.quickViewModal || !this.quickViewContent) return;

        this.quickViewContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div class="aspect-[4/3] bg-dark-900 rounded-2xl overflow-hidden border border-slate-800">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
                </div>
                <div class="flex flex-col">
                    <div class="text-xs font-semibold text-accent-400 uppercase tracking-wider mb-2">${product.category}</div>
                    <h2 class="text-2xl font-bold text-slate-100 mb-3">${product.name}</h2>
                    <div class="text-2xl font-bold text-slate-100 mb-4">$${product.price.toFixed(2)}</div>
                    <p class="text-sm text-slate-300 mb-6 leading-relaxed">${product.description}</p>
                    
                    <div class="space-y-4 pt-4 border-t border-slate-800/80">
                        <div class="flex items-center gap-2 text-sm text-slate-400">
                            <i data-lucide="check-circle-2" class="w-4 h-4 text-accent-400"></i>
                            <span>In stock & ready to ship</span>
                        </div>
                        <button class="modal-add-to-cart w-full py-3.5 px-6 bg-accent-600 hover:bg-accent-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-accent-600/20 flex items-center justify-center gap-2.5" data-id="${product.id}">
                            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.quickViewModal.classList.remove('opacity-0', 'pointer-events-none');
        document.body.style.overflow = 'hidden';

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    closeQuickView() {
        if (!this.quickViewModal) return;
        this.quickViewModal.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
    }

    showToast(message) {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'flex items-center gap-3 px-4 py-3 bg-dark-800 border border-slate-700/80 text-slate-100 rounded-xl shadow-2xl backdrop-blur-md transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto';
        toast.innerHTML = `
            <div class="w-2 h-2 rounded-full bg-accent-400"></div>
            <span class="text-sm font-medium">${message}</span>
        `;

        this.toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        });

        setTimeout(() => {
            toast.classList.add('translate-y-4', 'opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}window.UI = window.uiEngine = new UIEngine();
