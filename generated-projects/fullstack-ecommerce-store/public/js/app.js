/**
 * LUMIN - Premium E-Commerce Architecture
 * public/js/app.js - Main Application Controller, Store State, and UI Renderer
 * 
 * Principal Architect & UI/UX Design System Implementation
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Core Application
    StoreApp.init();
});

/**
 * Global Store Application Controller
 */
const StoreApp = {
    state: {
        products: [],
        filteredProducts: [],
        cart: [],
        wishlist: [],
        activeCategory: 'All',
        searchQuery: '',
        isLoading: true,
        currentModalProduct: null
    },

    // Fallback Mock Data in case API is offline
    fallbackProducts: [
        {
            id: 1,
            name: "Architectural Ceramic Vase",
            price: 85.00,
            category: "Home Decor",
            rating: 4.9,
            reviewsCount: 128,
            image: "https://images.unsplash.com/photo-1612196808214-b8e1e6145a5c?auto=format&fit=crop&q=80&w=800",
            description: "Handcrafted matte ceramic vessel designed for modern minimalist interiors. Each piece features subtle variations in texture, ensuring absolute uniqueness."
        },
        {
            id: 2,
            name: "Minimalist Brass Desk Lamp",
            price: 140.00,
            category: "Lighting",
            rating: 4.8,
            reviewsCount: 94,
            image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800",
            description: "Solid brushed brass task light with adjustable arm and warm ambient LED glow. Engineered for the refined workspace."
        },
        {
            id: 3,
            name: "Organic Linen Throw Blanket",
            price: 115.00,
            category: "Textiles",
            rating: 4.7,
            reviewsCount: 210,
            image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800",
            description: "Woven from 100% Belgian flax linen. Pre-washed for exceptional softness and designed to breathe effortlessly across all seasons."
        },
        {
            id: 4,
            name: "Scandi Lounge Chair",
            price: 490.00,
            category: "Furniture",
            rating: 5.0,
            reviewsCount: 45,
            image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800",
            description: "Elegantly curved ash wood frame paired with high-density natural wool upholstery. A masterclass in organic modernism."
        },
        {
            id: 5,
            name: "Aromatherapeutic Sandalwood Candle",
            price: 42.00,
            category: "Fragrance",
            rating: 4.6,
            reviewsCount: 312,
            image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=800",
            description: "Poured in small batches using soy wax, infused with Australian sandalwood, cedar, and subtle amber notes. 60-hour burn time."
        },
        {
            id: 6,
            name: "Walnut Acoustic Headphones",
            price: 299.00,
            category: "Electronics",
            rating: 4.8,
            reviewsCount: 88,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
            description: "Precision-milled black walnut earcups housing custom 40mm neodymium drivers. Exceptional acoustic fidelity meets timeless materiality."
        },
        {
            id: 7,
            name: "Hand-Thrown Stoneware Mug",
            price: 28.00,
            category: "Kitchen",
            rating: 4.9,
            reviewsCount: 176,
            image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800",
            description: "Ergonomically balanced handle and speckled raw clay base. Microwave and dishwasher safe."
        },
        {
            id: 8,
            name: "Nomad Leather Weekender",
            price: 380.00,
            category: "Accessories",
            rating: 4.9,
            reviewsCount: 64,
            image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800",
            description: "Full-grain vegetable-tanned leather that develops a stunning patina over time. Brass hardware and reinforced canvas lining."
        }
    ],

    async init() {
        this.loadCartFromStorage();
        this.renderShell();
        this.bindEvents();
        await this.fetchProducts();
        this.updateCartUI();
    },

    /**
     * Render Root App Structure if elements are missing
     */
    renderShell() {
        // Ensure Toast container exists
        if (!document.getElementById('toast-container')) {
            const toastDiv = document.createElement('div');
            toastDiv.id = 'toast-container';
            toastDiv.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(toastDiv);
        }
    },

    /**
     * Fetch products from API with fallback simulation
     */
    async fetchProducts() {
        this.setLoading(true);
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('API server error');
            const data = await response.json();
            this.state.products = data && data.length > 0 ? data : this.fallbackProducts;
        } catch (err) {
            console.warn('Backend API unavailable. Utilizing high-fidelity fallback catalog.', err);
            this.state.products = this.fallbackProducts;
        } finally {
            this.state.isLoading = false;
            this.filterProducts();
        }
    },

    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        if (isLoading) {
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-24">
                    <div class="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-4"></div>
                    <p class="text-stone-500 font-medium tracking-wide text-sm">CURATING COLLECTION...</p>
                </div>
            `;
        }
    },

    /**
     * Filter and Search logic
     */
    filterProducts() {
        const { products, activeCategory, searchQuery } = this.state;
        
        this.state.filteredProducts = products.filter(product => {
            const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });

        this.renderCatalog();
    },

    /**
     * Render Product Catalog Grid
     */
    renderCatalog() {
        const grid = document.getElementById('product-grid');
        const countEl = document.getElementById('product-count');
        if (!grid) return;

        if (countEl) {
            countEl.textContent = `${this.state.filteredProducts.length} pieces available`;
        }

        if (this.state.filteredProducts.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-center bg-stone-50 rounded-2xl border border-stone-200/60">
                    <i data-lucide="search-x" class="w-12 h-12 text-stone-400 mb-3 stroke-[1.5]"></i>
                    <h3 class="text-lg font-medium text-stone-800">No matching items found</h3>
                    <p class="text-sm text-stone-500 mt-1 max-w-sm">We couldn't find anything matching your search criteria. Try adjusting your filters.</p>
                    <button onclick="StoreApp.resetFilters()" class="mt-5 px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-stone-800 transition shadow-sm">
                        Reset Filters
                    </button>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        grid.innerHTML = this.state.filteredProducts.map(product => `
            <div class="group relative flex flex-col bg-white rounded-2xl border border-stone-200/80 overflow-hidden hover:shadow-xl hover:border-stone-300 transition-all duration-300">
                <!-- Image Container -->
                <div class="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden cursor-pointer" onclick="StoreApp.openProductModal(${product.id})">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700">
                    <div class="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/5 transition-colors"></div>
                    
                    <!-- Category Tag -->
                    <span class="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md text-stone-800 text-[11px] font-semibold tracking-wider uppercase rounded-full shadow-sm">
                        ${product.category}
                    </span>

                    <!-- Quick View / Wishlist Action -->
                    <button onclick="event.stopPropagation(); StoreApp.toggleWishlist(${product.id})" class="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-700 hover:text-red-500 shadow-sm transition">
                        <i data-lucide="heart" class="w-4 h-4 ${this.state.wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : ''}"></i>
                    </button>
                </div>

                <!-- Content Area -->
                <div class="p-5 flex flex-col flex-grow justify-between">
                    <div>
                        <div class="flex items-center justify-between gap-2 mb-1.5">
                            <h3 class="font-medium text-stone-900 text-base tracking-tight truncate cursor-pointer hover:text-stone-600 transition" onclick="StoreApp.openProductModal(${product.id})">
                                ${product.name}
                            </h3>
                        </div>
                        <div class="flex items-center gap-1.5 mb-3 text-amber-500 text-xs">
                            <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
                            <span class="font-medium text-stone-700">${product.rating}</span>
                            <span class="text-stone-400">(${product.reviewsCount || 42})</span>
                        </div>
                        <p class="text-stone-500 text-xs line-clamp-2 leading-relaxed mb-4">
                            ${product.description || 'Exquisitely crafted for modern living spaces.'}
                        </p>
                    </div>

                    <div class="flex items-center justify-between pt-4 border-t border-stone-100">
                        <div>
                            <span class="text-xs text-stone-400 block font-medium uppercase tracking-wider">Price</span>
                            <span class="text-lg font-semibold text-stone-900">$${product.price.toFixed(2)}</span>
                        </div>
                        <button onclick="StoreApp.addToCart(${product.id})" class="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition shadow-sm active:scale-95">
                            <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
                            <span>Add</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    },

    resetFilters() {
        this.state.activeCategory = 'All';
        this.state.searchQuery = '';
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            if (btn.dataset.category === 'All') {
                btn.className = "category-btn px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition bg-stone-900 text-white shadow-sm";
            } else {
                btn.className = "category-btn px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80";
            }
        });

        this.filterProducts();
    },

    /**
     * Event Listeners Binding
     */
    bindEvents() {
        // Search Input Event
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value.trim();
                this.filterProducts();
            });
        }

        // Category Buttons Delegation
        const categoryContainer = document.getElementById('category-filters');
        if (categoryContainer) {
            categoryContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.category-btn');
                if (!btn) return;

                document.querySelectorAll('.category-btn').forEach(b => {
                    b.className = "category-btn px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80";
                });
                btn.className = "category-btn px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition bg-stone-900 text-white shadow-sm";

                this.state.activeCategory = btn.dataset.category;
                this.filterProducts();
            });
        }

        // Cart Drawer Toggles
        const cartToggle = document.getElementById('cart-toggle-btn');
        const closeCart = document.getElementById('close-cart-btn');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (cartToggle) cartToggle.addEventListener('click', () => this.toggleCartDrawer(true));
        if (closeCart) closeCart.addEventListener('click', () => this.toggleCartDrawer(false));
        if (cartOverlay) cartOverlay.addEventListener('click', () => this.toggleCartDrawer(false));

        // Checkout Modal Triggers
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) checkoutBtn.addEventListener('click', () => this.openCheckoutModal());

        const closeCheckout = document.getElementById('close-checkout-btn');
        const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');
        if (closeCheckout) closeCheckout.addEventListener('click', () => this.toggleCheckoutModal(false));
        if (checkoutModalOverlay) checkoutModalOverlay.addEventListener('click', () => this.toggleCheckoutModal(false));

        // Checkout Form Submit
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => this.handleCheckoutSubmit(e));
        }

        // Product Detail Modal Close
        const closeProductModal = document.getElementById('close-product-modal');
        const productModalOverlay = document.getElementById('product-modal-overlay');
        if (closeProductModal) closeProductModal.addEventListener('click', () => this.toggleProductModal(false));
        if (productModalOverlay) productModalOverlay.addEventListener('click', () => this.toggleProductModal(false));
    },

    /**
     * Shopping Cart State & Logic
     */
    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('lumin_cart');
            if (savedCart) this.state.cart = JSON.parse(savedCart);
        } catch (e) {
            console.error('Failed to load cart from storage', e);
        }
    },

    saveCartToStorage() {
        try {
            localStorage.setItem('lumin_cart', JSON.stringify(this.state.cart));
        } catch (e) {
            console.error('Failed to save cart to storage', e);
        }
    },

    addToCart(productId, quantity = 1) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.state.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.state.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: quantity
            });
        }

        this.saveCartToStorage();
        this.updateCartUI();
        this.showToast(`Added ${product.name} to your cart`, 'success');
    },

    updateCartQuantity(productId, delta) {
        const item = this.state.cart.find(i => i.id === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            this.state.cart = this.state.cart.filter(i => i.id !== productId);
        }

        this.saveCartToStorage();
        this.updateCartUI();
    },

    removeFromCart(productId) {
        const item = this.state.cart.find(i => i.id === productId);
        this.state.cart = this.state.cart.filter(i => i.id !== productId);
        this.saveCartToStorage();
        this.updateCartUI();
        if (item) this.showToast(`Removed ${item.name} from cart`, 'info');
    },

    updateCartUI() {
        const badge = document.getElementById('cart-badge');
        const cartItemsContainer = document.getElementById('cart-items-container');
        const cartSubtotalEl = document.getElementById('cart-subtotal');
        const cartTotalEl = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');

        const totalItemsCount = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 150 ? 0 : (subtotal > 0 ? 15.00 : 0);
        const grandTotal = subtotal + shipping;

        // Badge update
        if (badge) {
            if (totalItemsCount > 0) {
                badge.textContent = totalItemsCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        // Subtotal & Total
        if (cartSubtotalEl) cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (cartTotalEl) cartTotalEl.textContent = `$${grandTotal.toFixed(2)}`;

        // Checkout Button state
        if (checkoutBtn) {
            if (this.state.cart.length === 0) {
                checkoutBtn.disabled = true;
                checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }

        // Cart items rendering
        if (!cartItemsContainer) return;

        if (this.state.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                    <div class="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
                        <i data-