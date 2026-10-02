/**
 * StoreApp - Principal Architecture & UI/UX Implementation
 * Component Tree: StoreApp -> [Navbar, ProductCatalog, ProductCard, CartDrawer, CheckoutModal]
 * Vanilla JS SPA consuming Express REST API with intelligent offline fallbacks and UI state management.
 */

(function () {
    'use strict';

    // --- MOCK DATA FALLBACK (In case API is unreachable or initializing) ---
    const MOCK_PRODUCTS = [
        {
            id: 1,
            name: "Apex Ergonomic Mechanical Keyboard",
            price: 149.99,
            category: "Electronics",
            rating: 4.9,
            reviewsCount: 128,
            image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800",
            description: "Precision-engineered mechanical keyboard with hot-swappable switches and per-key RGB backlighting."
        },
        {
            id: 2,
            name: "Nomad Horizon Canvas Backpack",
            price: 89.50,
            category: "Accessories",
            rating: 4.7,
            reviewsCount: 94,
            image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
            description: "Water-resistant waxed canvas backpack designed for urban commuters and weekend explorers."
        },
        {
            id: 3,
            name: "Aura Studio Wireless ANC Headphones",
            price: 249.00,
            category: "Electronics",
            rating: 4.8,
            reviewsCount: 215,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
            description: "Immersive active noise-canceling headphones with 40-hour battery life and studio-grade acoustics."
        },
        {
            id: 4,
            name: "Minimalist Ceramic Pour-Over Dripper",
            price: 34.00,
            category: "Home",
            rating: 4.6,
            reviewsCount: 78,
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
            description: "Hand-glazed ceramic coffee dripper engineered for optimal extraction and thermal stability."
        },
        {
            id: 5,
            name: "Titanium Dual-Wall Travel Tumbler",
            price: 45.00,
            category: "Home",
            rating: 4.9,
            reviewsCount: 142,
            image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800",
            description: "Ultralight aerospace-grade titanium tumbler keeps beverages ice cold or piping hot for hours."
        },
        {
            id: 6,
            name: "Solstice Gradient Polarized Sunglasses",
            price: 120.00,
            category: "Accessories",
            rating: 4.5,
            reviewsCount: 63,
            image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800",
            description: "Handcrafted Italian acetate frames fitted with UV400 anti-glare gradient lenses."
        },
        {
            id: 7,
            name: "Lumina Smart Desk Lamp Pro",
            price: 79.99,
            category: "Electronics",
            rating: 4.7,
            reviewsCount: 110,
            image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800",
            description: "Color-temperature adjustable LED task light with wireless smartphone charging base."
        },
        {
            id: 8,
            name: "Vortex Pro Fitness Smartwatch",
            price: 199.99,
            category: "Electronics",
            rating: 4.8,
            reviewsCount: 189,
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
            description: "Advanced biometric tracking, built-in GPS, and 5ATM water resistance in a sleek aluminum body."
        }
    ];

    // --- APPLICATION STATE ---
    const state = {
        products: [],
        cart: { items: [], total: 0 },
        searchQuery: '',
        selectedCategory: 'All',
        isCartOpen: false,
        isCheckoutOpen: false,
        isLoading: true,
        toastMessage: null,
        lastOrder: null
    };

    // --- API CLIENT WITH FALLBACK ---
    const api = {
        async getProducts() {
            try {
                const res = await fetch('/api/products');
                if (!res.ok) throw new Error('API fetch failed');
                const data = await res.json();
                return Array.isArray(data) && data.length > 0 ? data : MOCK_PRODUCTS;
            } catch (err) {
                console.warn('Backend API unavailable. Using embedded mock catalog.', err);
                return MOCK_PRODUCTS;
            }
        },

        async getCart() {
            try {
                const res = await fetch('/api/cart');
                if (!res.ok) throw new Error('API fetch failed');
                return await res.json();
            } catch (err) {
                // Fallback to local state calculation if offline
                return state.cart;
            }
        },

        async addToCart(productId, quantity = 1) {
            try {
                const res = await fetch('/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId, quantity })
                });
                if (!res.ok) throw new Error('Failed to add item');
                const data = await res.json();
                return data.cart || data;
            } catch (err) {
                // Client-side fallback computation
                const prod = state.products.find(p => p.id === productId);
                if (!prod) return state.cart;
                
                const existingIndex = state.cart.items.findIndex(item => item.productId === productId || item.id === productId);
                let newItems = [...state.cart.items];
                
                if (existingIndex > -1) {
                    newItems[existingIndex] = {
                        ...newItems[existingIndex],
                        quantity: newItems[existingIndex].quantity + quantity
                    };
                } else {
                    newItems.push({
                        productId: prod.id,
                        id: prod.id,
                        name: prod.name,
                        price: prod.price,
                        image: prod.image,
                        quantity: quantity
                    });
                }
                const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                return { items: newItems, total };
            }
        },

        async removeFromCart(productId) {
            try {
                const res = await fetch(`/api/cart/${productId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete item');
                const data = await res.json();
                return data.cart || data;
            } catch (err) {
                const newItems = state.cart.items.filter(item => (item.productId || item.id) !== productId);
                const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                return { items: newItems, total };
            }
        },

        async checkout(orderData) {
            try {
                const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                if (!res.ok) throw new Error('Checkout failed');
                return await res.json();
            } catch (err) {
                return {
                    success: true,
                    orderId: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
                    total: state.cart.total
                };
            }
        }
    };

    // --- UI UTILITIES & NOTIFICATIONS ---
    function showToast(message, type = 'success') {
        state.toastMessage = { message, type };
        renderToast();
        setTimeout(() => {
            if (state.toastMessage && state.toastMessage.message === message) {
                state.toastMessage = null;
                renderToast();
            }
        }, 3500);
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
    }

    // --- DOM RENDERING ENGINE ---
    function renderApp() {
        const root = document.getElementById('root') || document.body;
        
        // Construct main layout shell if not present
        if (!document.getElementById('app-container')) {
            root.innerHTML = `
                <div id="app-container" class="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-['Inter',sans-serif] selection:bg-indigo-500 selection:text-white">
                    <div id="navbar-mount"></div>
                    <main class="flex-grow">
                        <div id="hero-mount"></div>
                        <div id="catalog-mount"></div>
                    </main>
                    <div id="footer-mount"></div>
                    <div id="cart-drawer-mount"></div>
                    <div id="checkout-modal-mount"></div>
                    <div id="toast-mount" aria-live="polite" class="fixed bottom-6 right-6 z-50 pointer-events-none"></div>
                </div>
            `;
            bindGlobalEvents();
        }

        renderNavbar();
        renderHero();
        renderCatalog();
        renderFooter();
        renderCartDrawer();
        renderCheckoutModal();
        renderToast();

        // Refresh Lucide Icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // --- COMPONENT: Navbar ---
    function renderNavbar() {
        const mount = document.getElementById('navbar-mount');
        if (!mount) return;

        const totalItemsCount = state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

        mount.innerHTML = `
            <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all duration-200">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                    <!-- Brand Badge -->
                    <a href="#" class="flex items-center gap-3 group focus:outline-none">
                        <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                            <i data-lucide="layers" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <span class="text-lg font-bold tracking-tight text-slate-900 block leading-none">VELOCITY</span>
                            <span class="text-xs font-medium text-indigo-600 tracking-wider uppercase">Curated Store</span>
                        </div>
                    </a>

                    <!-- Search Input -->
                    <div class="flex-1 max-w-md hidden md:block">
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <i data-lucide="search" class="w-4 h-4"></i>
                            </span>
                            <input 
                                type="text" 
                                id="global-search-input"
                                value="${escapeHtml(state.searchQuery)}"
                                placeholder="Search premium gear, electronics, home..." 
                                class="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-500 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            />
                            ${state.searchQuery ? `
                                <button id="clear-search" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                                    <i data-lucide="x" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-3">
                        <button 
                            id="open-cart-btn"
                            class="relative inline-flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full shadow-md shadow-slate-900/10 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                        >
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                            <span class="hidden sm:inline">Cart</span>
                            <span id="cart-badge" class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-indigo-500 text-white rounded-full min-w-[20px] ${totalItemsCount === '0' ? '' : 'animate-pulse'}">
                                ${totalItemsCount}
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Mobile Search Bar -->
                <div class="md:hidden px-4 pb-3">
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <i data-lucide="search" class="w-4 h-4"></i>
                        </span>
                        <input 
                            type="text" 
                            id="mobile-search-input"
                            value="${escapeHtml(state.searchQuery)}"
                            placeholder="Search products..." 
                            class="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent focus:border-indigo-500 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                        />
                    </div>
                </div>
            </header>
        `;
    }

    // --- COMPONENT: Hero Header & Filters ---
    function renderHero() {
        const mount = document.getElementById('hero-mount');
        if (!mount) return;

        const categories = ['All', ...new Set(state.products.map(p => p.category))];

        mount.innerHTML = `
            <section class="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white py-20 px-4 sm:px-6 lg:px-8">
                <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                <div class="max-w-7xl mx-auto text-center relative z-10">
                    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-6 backdrop-blur-md">
                        <i data-lucide="sparkles" class="w-3.5 h-3.5 text-indigo-400"></i>
                        Next-Gen Design & Engineering
                    </div>
                    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                        Elevate Your Daily Rituals <br class="hidden sm:inline"/>
                        <span class="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">With Exceptional Gear</span>
                    </h1>
                    <p class="max-w-2xl mx-auto text-lg text-slate-300 mb-10">
                        Discover thoughtfully crafted objects designed for uncompromising quality, durability, and contemporary aesthetics.
                    </p>

                    <!-- Category Pills Filter Bar -->
                    <div class="flex flex-wrap items-center justify-center gap-2 mt-8">
                        ${categories.map(cat => `
                            <button 
                                data-category="${cat}"
                                class="category-filter-btn px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none ${
                                    state.selectedCategory === cat 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50' 
                                        : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
                                }"
                            >
                                ${cat}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    // --- COMPONENT: ProductCatalog & ProductCard ---
    function renderCatalog() {
        const mount = document.getElementById('catalog-mount');
        if (!mount) return;

        // Filter products based on search & category
        const filtered = state.products.filter(product => {
            const matchesCat = state.selectedCategory === 'All' || product.category === state.selectedCategory;
            const query = state.searchQuery.toLowerCase();
            const matchesSearch = product.name.toLowerCase().includes(query) || 
                                  product.description.toLowerCase().includes(query) ||
                                  product.category.toLowerCase().includes(query);
            return matchesCat && matchesSearch;
        });

        if (state.isLoading) {
            mount.innerHTML = `
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <div class="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p class="text-slate-500 font-medium">Curating your experience...</p>
                </div>
            `;
            return;
        }

        if (filtered.length === 0) {
            mount.innerHTML = `
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <i data-lucide="search-x" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-slate-800 mb-1">No products found</h3>
                    <p class="text-slate-500 text-sm max-w-sm mx-auto mb-6">We couldn't find anything matching your search or category filter. Try clearing your filters.</p>
                    <button id="reset-filters-btn" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow transition-all">
                        Reset Filters
                    </button>
                </div>
            `;
            return;
        }

        mount.innerHTML = `
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-xl font-bold text-slate-900">
                        ${state.selectedCategory} Catalog 
                        <span class="text-sm font-normal text-slate-500 ml-2">(${filtered.length} items)</span>
                    </h2>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${filtered.map(product => renderProductCard(product)).join('')}
                </div>
            </section>
        `;
    }

    function renderProductCard(product) {
        return `
            <div class="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col">
                <!-- Image Container -->
                <div class="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img 
                        src="${escapeHtml(product.image)}" 
                        alt="${escapeHtml(product.name)}"
                        class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                    <div class="absolute top-3 left-3">
                        <span class="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-800 font-semibold text-xs rounded-full shadow-sm">
                            ${escapeHtml(product.category)}
                        </span>
                    </div>
                    <div class="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm text-xs font-bold text-slate-800">
                        <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>
                        <span>${product.rating}</span>
                        <span class="text-slate-400 font-normal">(${product.reviewsCount})</span>
                    </div>
                </div>

                <!-- Content Area -->
                <div class="p-6 flex flex-col flex-grow">
                    <h3 class="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        ${escapeHtml(product.name)}
                    </h3>
                    <p class="text-slate-600 text-sm mb-6 line-clamp-2 leading-relaxed flex-grow">
                        ${escapeHtml(product.description)}
                    </p>

                    <!-- Price & Action -->
                    <div class="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                        <div>
                            <span class="text-xs text-slate-400 block font-medium">Price</span>
                            <span class="text-xl font-extrabold text-slate-900">${formatCurrency(product.price)}</span>
                        </div>
                        <button 
                            data-add-to-cart="${product.id}"
                            class="add-to-cart-btn inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <i data-lucide="plus" class="w-4 h-4"></i>
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // --- COMPONENT: CartDrawer ---
    function renderCartDrawer() {
        const mount = document.getElementById('cart-drawer-mount');
        if (!mount) return;

        const isOpen = state.isCartOpen;
        const items = state.cart.items || [];
        const total = state.cart.total || 0;

        mount.innerHTML = `
            <div id="cart-drawer" class="fixed inset-0 z-50 overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}">
                <!-- Backdrop -->
                <div 
                    id="cart-backdrop"
                    class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}"
                ></div>

                <div class="absolute inset-y-0 right-0 max-w-full flex pl-10">
                    <div class="w-screen max-w-md transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} bg-white shadow-2xl flex flex-col">
                        
                        <!-- Header -->
                        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                    <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h2 class="text-lg font-bold text-slate-900 leading-tight">Your Cart</h2>
                                    <p class="text-xs text-slate-500">${items.reduce((s, i) => s + i.quantity, 0)} items selected</p>
                                </div>
                            </div>
                            <button id="close-cart-btn" class="w-9 h-9 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <!-- Cart Items List -->
                        <div class="flex-1 overflow-y-auto p-6 space-y-4">
                            ${items.length === 0 ? `
                                <div class="text-center py-20">
                                    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <i data-lucide="shopping-cart" class="w-8 h-8"></i>
                                    </div>
                                    <p class="text-slate-800 font-semibold mb-1">Your cart is empty</p>
                                    <p class="text-slate-500 text-sm mb-6">Explore our catalog and add items to your cart.</p>
                                    <button id="cart-shop-now" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow transition-all">
                                        Start Shopping
                                    </button>
                                </div>
                            ` : items.map(item => `
                                <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group">
                                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="w-16 h-16 object-cover rounded-xl bg-white border border-slate-200 flex-shrink-0" />
                                    <div class="flex-1 min-w-0">
                                        <h4 class="text-sm font-bold text-slate-900 truncate mb-1">${escapeHtml(item.name)}</h4>
                                        <div class="text-xs font-semibold text-slate-500 mb-2">${formatCurrency(item.price)} each</div>
                                        <div class="flex items-center gap-3">
                                            <span class="text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                                                Qty: ${item.quantity}
                                            </span>
                                            <span class="text-sm font-extrabold text-slate-900">
                                                ${formatCurrency(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        data-remove-id="${item.productId || item.id}"
                                        class="remove-cart-item text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors"
                                        title="Remove item"
                                    >
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Footer / Checkout Action -->
                        ${items.length > 0 ? `
                            <div class="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                                <div class="space-y-2">
                                    <div class="flex items-center justify-between text-sm text-slate-500">
                                        <span>Subtotal</span>
                                        <span class="font-semibold text-slate-800">${formatCurrency(total)}</span>
                                    </div>
                                    <div class="flex items-center justify-between text-sm text-slate-500">
                                        <span>Estimated Shipping</span>
                                        <span class="font-semibold text-emerald-600">FREE</span>
                                    </div>
                                    <div class="flex items-center justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                                        <span>Total</span>
                                        <span>${formatCurrency(total)}</span>
                                    </div>
                                </div>
                                <button 
                                    id="proceed-checkout-btn"
                                    class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Proceed to Checkout</span>
                                    <i data-lucide="arrow-right" class="w-5 h-5"></i>
                                </button>
                            </div>
                        ` : ''}

                    </div>
                </div>
            </div>
        `;
    }

    // --- COMPONENT: CheckoutModal ---
    function renderCheckoutModal() {
        const mount = document.getElementById('checkout-modal-mount');
        if (!mount) return;

        const isOpen = state.isCheckoutOpen;
        const total = state.cart.total || 0;
        const lastOrder = state.lastOrder;

        mount.innerHTML = `
            <div id="checkout-modal" class="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} transition-opacity duration-300">
                <!-- Backdrop -->
                <div id="checkout-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

                <!-- Modal Dialog -->
                <div class="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 overflow-hidden z-10 transform transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}">
                    
                    ${lastOrder ? `
                        <!-- Success State -->
                        <div class="text-center py-6">
                            <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                                <i data-lucide="check" class="w-10 h-10"></i>
                            </div>
                            <h3 class="text-2xl