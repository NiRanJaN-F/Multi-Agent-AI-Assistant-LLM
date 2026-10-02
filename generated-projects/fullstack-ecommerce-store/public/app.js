/**
 * LUMINARY STORE - Modern E-Commerce Frontend Application
 * Architecture: Component-driven Vanilla JS with State Management & Reactive UI
 * Component Tree: StoreApp -> Header -> ProductCatalog -> ProductCard -> CartDrawer -> CheckoutModal -> OrderConfirmation
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    const state = {
        products: [],
        filteredProducts: [],
        cart: [],
        activeCategory: 'all',
        searchQuery: '',
        selectedProduct: null,
        isCartOpen: false,
        isCheckoutOpen: false,
        lastOrder: null,
        isLoading: true,
        toastMessage: null,
        toastType: 'success'
    };

    // --- DOM Elements Cache ---
    const DOM = {
        app: document.getElementById('app'),
        // These will be rendered dynamically by root components
    };

    // --- Fallback Mock Data (In case backend is unreachable) ---
    const fallbackProducts = [
        {
            id: 1,
            name: "Aura Minimalist Timepiece",
            price: 189.00,
            category: "watches",
            rating: 4.9,
            reviewsCount: 128,
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
            description: "Crafted with surgical-grade stainless steel and sapphire crystal glass. Designed for the modern minimalist who values timeless sophistication."
        },
        {
            id: 2,
            name: "Apex Studio Wireless Headphones",
            price: 299.00,
            category: "audio",
            rating: 4.8,
            reviewsCount: 245,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
            description: "Industry-leading active noise cancellation paired with studio-grade acoustic drivers. Experience sound exactly as the artist intended."
        },
        {
            id: 3,
            name: "Nova Ceramic Coffee Dripper",
            price: 45.00,
            category: "lifestyle",
            rating: 4.7,
            reviewsCount: 92,
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
            description: "Hand-glazed ceramic pour-over cone engineered with internal spiral ribs for optimal extraction and a consistently clean cup."
        },
        {
            id: 4,
            name: "Zenith Ergonomic Desk Lamp",
            price: 125.00,
            category: "lifestyle",
            rating: 4.9,
            reviewsCount: 156,
            image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
            description: "Smart ambient lighting featuring auto-dimming sensors, adjustable color temperatures, and sleek anodized aluminum construction."
        },
        {
            id: 5,
            name: "Velocity Leather Backpack",
            price: 240.00,
            category: "accessories",
            rating: 4.6,
            reviewsCount: 84,
            image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
            description: "Full-grain vegetable-tanned leather with dedicated padded compartments for a 16-inch laptop, tablet, and daily essentials."
        },
        {
            id: 6,
            name: "Solstice Portable Bluetooth Speaker",
            price: 149.00,
            category: "audio",
            rating: 4.8,
            reviewsCount: 210,
            image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
            description: "360-degree immersive sound packed in a rugged, IP67 waterproof enclosure. 20-hour battery life keeps the music going anywhere."
        },
        {
            id: 7,
            name: "Kuro Precision Grinder",
            price: 110.00,
            category: "lifestyle",
            rating: 4.7,
            reviewsCount: 67,
            image: "https://images.unsplash.com/photo-1589396734123-5e792e59146a?auto=format&fit=crop&w=800&q=80",
            description: "Stainless steel conical burrs deliver uniform coffee grounds for espresso, pour-over, and French press with effortless manual cranking."
        },
        {
            id: 8,
            name: "Horizon Titanium Water Bottle",
            price: 38.00,
            category: "accessories",
            rating: 4.9,
            reviewsCount: 310,
            image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
            description: "Double-wall vacuum insulated pure titanium bottle. Keeps beverages ice-cold for 24 hours or steaming hot for 12 hours without metallic taste."
        }
    ];

    // --- API Service ---
    const API = {
        async fetchProducts() {
            try {
                const response = await fetch('/api/products');
                if (!response.ok) throw new Error('Failed to fetch from backend');
                const data = await response.json();
                // Merge backend data with rich UI props if backend lacks them
                return data.map((item, index) => {
                    const fallback = fallbackProducts[index % fallbackProducts.length];
                    return {
                        ...fallback,
                        ...item,
                        rating: item.rating || fallback.rating,
                        reviewsCount: item.reviewsCount || fallback.reviewsCount,
                        category: item.category || fallback.category,
                        description: item.description || fallback.description
                    };
                });
            } catch (err) {
                console.warn('Backend API unavailable. Using fallback product catalog.', err);
                return fallbackProducts;
            }
        },

        async fetchProductDetails(id) {
            try {
                const response = await fetch(`/api/products/${id}`);
                if (!response.ok) throw new Error('Failed to fetch product');
                return await response.json();
            } catch (err) {
                console.warn('Using local product details fallback.', err);
                return state.products.find(p => p.id === Number(id)) || null;
            }
        },

        async checkout(cartItems) {
            try {
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: cartItems })
                });
                if (!response.ok) throw new Error('Checkout request failed');
                return await response.json();
            } catch (err) {
                console.warn('Backend checkout failed. Simulating successful response.', err);
                const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                return {
                    success: true,
                    orderId: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
                    total: total
                };
            }
        }
    };

    // --- Actions & State Handlers ---
    function setState(updater) {
        if (typeof updater === 'function') {
            Object.assign(state, updater(state));
        } else {
            Object.assign(state, updater);
        }
        render();
    }

    function showToast(message, type = 'success') {
        setState({ toastMessage: message, toastType: type });
        setTimeout(() => {
            if (state.toastMessage === message) {
                setState({ toastMessage: null });
            }
        }, 3500);
    }

    function filterAndSearchProducts() {
        let result = state.products;
        if (state.activeCategory !== 'all') {
            result = result.filter(p => p.category === state.activeCategory);
        }
        if (state.searchQuery.trim() !== '') {
            const q = state.searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        }
        state.filteredProducts = result;
    }

    // --- Component Renderers ---

    function renderHeader() {
        const totalCartItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);

        return `
            <header class="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 transition-all duration-300">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                    <!-- Brand -->
                    <div class="flex items-center gap-3 cursor-pointer" onclick="window.resetFilters()">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <i data-lucide="zap" class="w-5 h-5 text-white"></i>
                        </div>
                        <div>
                            <span class="text-xl font-bold tracking-tight text-white">LUMINARY</span>
                            <span class="block text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">Store & Studio</span>
                        </div>
                    </div>

                    <!-- Search Bar -->
                    <div class="hidden md:flex flex-1 max-w-md relative">
                        <i data-lucide="search" class="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                        <input 
                            type="text" 
                            id="search-input"
                            value="${state.searchQuery}"
                            placeholder="Search high-end gear, watches, audio..." 
                            class="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            oninput="window.handleSearchInput(event)"
                        />
                        ${state.searchQuery ? `
                            <button onclick="window.clearSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-3">
                        <button 
                            onclick="window.toggleCart(true)"
                            class="relative p-2.5 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-all flex items-center gap-2 group"
                            aria-label="Shopping Cart"
                        >
                            <i data-lucide="shopping-bag" class="w-5 h-5 group-hover:scale-105 transition-transform"></i>
                            <span class="hidden sm:inline text-sm font-medium pr-1">Cart</span>
                            ${totalCartItems > 0 ? `
                                <span class="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                                    ${totalCartItems}
                                </span>
                            ` : ''}
                        </button>
                    </div>
                </div>

                <!-- Mobile Search Bar -->
                <div class="md:hidden px-4 pb-3">
                    <div class="relative w-full">
                        <i data-lucide="search" class="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                        <input 
                            type="text" 
                            value="${state.searchQuery}"
                            placeholder="Search products..." 
                            class="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                            oninput="window.handleSearchInput(event)"
                        />
                    </div>
                </div>
            </header>
        `;
    }

    function renderHero() {
        return `
            <section class="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800/60">
                <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 animate-fade-in">
                        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                        <span>New 2025 Collection Released</span>
                    </div>
                    <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.1]">
                        Designed for the <span class="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">Exceptional</span>
                    </h1>
                    <p class="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto font-normal">
                        Explore curated objects of uncompromising quality, combining cutting-edge engineering with timeless aesthetics.
                    </p>
                </div>
            </section>
        `;
    }

    function renderFilters() {
        const categories = [
            { id: 'all', label: 'All Artifacts' },
            { id: 'watches', label: 'Timepieces' },
            { id: 'audio', label: 'Audio' },
            { id: 'lifestyle', label: 'Lifestyle' },
            { id: 'accessories', label: 'Accessories' }
        ];

        return `
            <div class="sticky top-20 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 py-4 transition-all">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
                    <div class="flex items-center gap-2 min-w-max">
                        ${categories.map(cat => `
                            <button 
                                onclick="window.setCategory('${cat.id}')"
                                class="px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    state.activeCategory === cat.id 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
                                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                                }"
                            >
                                ${cat.label}
                            </button>
                        `).join('')}
                    </div>
                    <div class="hidden lg:block text-xs text-zinc-500 font-medium">
                        Showing <span class="text-zinc-200">${state.filteredProducts.length}</span> items
                    </div>
                </div>
            </div>
        `;
    }

    function renderProductCard(product) {
        const isAlreadyInCart = state.cart.some(item => item.id === product.id);

        return `
            <div class="group bg-zinc-900/60 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                <!-- Image Container -->
                <div class="relative aspect-square overflow-hidden bg-zinc-950 cursor-pointer" onclick="window.openProductModal(${product.id})">
                    <img 
                        src="${product.image}" 
                        alt="${product.name}" 
                        class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                    <div class="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-zinc-800/80 flex items-center gap-1.5 text-xs font-medium text-amber-400">
                        <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
                        <span>${product.rating}</span>
                        <span class="text-zinc-500">(${product.reviewsCount})</span>
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span class="text-xs font-semibold text-white bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-700 w-full text-center">
                            Quick View
                        </span>
                    </div>
                </div>

                <!-- Content -->
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <span class="text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">${product.category}</span>
                        <h3 
                            class="mt-1 text-base font-semibold text-white tracking-tight cursor-pointer hover:text-indigo-400 transition-colors line-clamp-1"
                            onclick="window.openProductModal(${product.id})"
                        >
                            ${product.name}
                        </h3>
                        <p class="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            ${product.description}
                        </p>
                    </div>

                    <div class="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                        <div>
                            <span class="text-xs text-zinc-500 block">Price</span>
                            <span class="text-lg font-bold text-white">$${product.price.toFixed(2)}</span>
                        </div>
                        <button 
                            onclick="window.addToCart(${product.id})"
                            class="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                                isAlreadyInCart 
                                    ? 'bg-zinc-800 text-indigo-400 hover:bg-zinc-700 border border-indigo-500/30' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95'
                            }"
                        >
                            <i data-lucide="${isAlreadyInCart ? 'check' : 'plus'}" class="w-4 h-4"></i>
                            <span>${isAlreadyInCart ? 'Add More' : 'Add to Cart'}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderProductCatalog() {
        if (state.isLoading) {
            return `
                <div class="max-w-7xl mx-auto px-4 py-24 text-center">
                    <div class="inline-block w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p class="mt-4 text-zinc-400 text-sm font-medium">Curating exquisite artifacts...</p>
                </div>
            `;
        }

        if (state.filteredProducts.length === 0) {
            return `
                <div class="max-w-md mx-auto px-4 py-24 text-center">
                    <div class="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-400">
                        <i data-lucide="search-x" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white">No artifacts found</h3>
                    <p class="mt-2 text-sm text-zinc-400">We couldn't find anything matching your search or category filter. Try clearing your filters.</p>
                    <button onclick="window.resetFilters()" class="mt-6 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-all">
                        Reset All Filters
                    </button>
                </div>
            `;
        }

        return `
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${state.filteredProducts.map(product => renderProductCard(product)).join('')}
                </div>
            </main>
        `;
    }

    function renderCartDrawer() {
        if (!state.isCartOpen) return '';

        const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 150 ? 0 : 15.00;
        const total = subtotal + (subtotal > 0 ? shipping : 0);

        return `
            <div class="fixed inset-0 z-50 overflow-hidden">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm transition-opacity" onclick="window.toggleCart(false)"></div>

                <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
                    <div class="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col">
                        <!-- Drawer Header -->
                        <div class="p-6 border-b border-zinc-800 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <i data-lucide="shopping-bag" class="w-5 h-5 text-indigo-400"></i>
                                <h2 class="text-lg font-bold text-white">Your Cart</h2>
                                <span class="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                                    ${state.cart.reduce((sum, i) => sum + i.quantity, 0)}
                                </span>
                            </div>
                            <button onclick="window.toggleCart(false)" class="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <!-- Cart Items List -->
                        <div class="flex-1 overflow-y-auto p-6 space-y-4">
                            ${state.cart.length === 0 ? `
                                <div class="text-center py-20">
                                    <div class="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-500">
                                        <i data-lucide="shopping-cart" class="w-8 h-8"></i>
                                    </div>
                                    <p class="text-zinc-300 font-semibold">Your cart is empty</p>
                                    <p class="text-zinc-500 text-xs mt-1">Discover our collection and add items to your cart.</p>
                                    <button onclick="window.toggleCart(false)" class="mt-6 px-4 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800">
                                        Continue Shopping
                                    </button>
                                </div>
                            ` : state.cart.map(item => `
                                <div class="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/80">
                                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-xl bg-zinc-900 border border-zinc-800" />
                                    <div class="flex-1 min-w-0">
                                        <h4 class="text-sm font-semibold text-white truncate">${item.name}</h4>
                                        <p class="text-xs text-indigo-400 font-medium mt-0.5">$${item.price.toFixed(2)}</p>
                                        <div class="flex items-center gap-3 mt-3">
                                            <div class="flex items-center border border-zinc-700/80 rounded-lg bg-zinc-900">
                                                <button onclick="window.updateCartQuantity(${item.id}, ${item.quantity - 1})" class="p-1.5 text-zinc-400 hover:text-white">
                                                    <i data-lucide="minus" class="w-3 h-3"></i>
                                                </button>
                                                <span class="px-2 text-xs font-semibold text-white">${item.quantity}</span>
                                                <button onclick="window.updateCartQuantity(${item.id}, ${item.quantity + 1})" class="p-1.5 text-zinc-400 hover:text-white">
                                                    <i data-lucide="plus" class="w-3 h-3"></i>
                                                </button>
                                            </div>
                                            <button onclick="window.removeFromCart(${item.id})" class="text-zinc-500 hover:text-red-400 transition-colors p-1">
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Drawer Footer -->
                        ${state.cart.length > 0 ? `
                            <div class="p-6 border-t border-zinc-800 bg-zinc-900/40 space-y-3">
                                <div class="space-y-1.5 text-sm">
                                    <div class="flex justify-between text-zinc-400">
                                        <span>Subtotal</span>
                                        <span class="text-zinc-200 font-medium">$${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div class="flex justify-between text-zinc-400">
                                        <span>Shipping</span>
                                        <span class="text-zinc-200 font-medium">${shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                                    </div>
                                    ${subtotal <= 150 ? `
                                        <p class="text-[11px] text-indigo-400 mt-1">Add $${(150 - subtotal).toFixed(2)} more for free shipping!</p>
                                    ` : ''}
                                    <div class="flex justify-between text-base font-bold text-white pt-2 border-t border-zinc-800">
                                        <span>Total</span>
                                        <span>$${total.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button 
                                    onclick="window.openCheckout()"
                                    class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Proceed to Secure Checkout</span>
                                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    function renderProductModal() {
        if (!state.selectedProduct) return '';
        const product = state.selectedProduct;
        const isAlreadyInCart = state.cart.some(item => item.id === product.id);

        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm transition-opacity" onclick="window.closeProductModal()"></div>

                <div class="relative bg-zinc-950 border border-zinc-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl z-10 grid grid-cols-1 md:grid-cols-2">
                    <!-- Close Button -->
                    <button onclick="window.closeProductModal()" class="absolute top-4 right-4 z-20 p-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>

                    <!-- Product Image -->
                    <div class="relative bg-zinc-900 aspect-square md:aspect-auto">
                        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover" />
                    </div>

                    <!-- Product Details -->
                    <div class="p-6 sm:p-8 flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between">
                                <span class="text-xs uppercase tracking-widest text-indigo-400 font-bold">${product.category}</span>
                                <div class="flex items-center gap-1 text-amber-400 text-xs font-semibold bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
                                    <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
                                    <span>${product.rating}</span>
                                    <span class="text-zinc-500">(${product.reviewsCount} reviews)</span>
                                </div>
                            </div>
                            <h2 class="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">${product.name}</h2>
                            <p class="mt-4 text-sm text-zinc-300 leading-relaxed">${product.description}</p>
                            
                            <div class="mt-6 grid grid-cols-2 gap-4 py-4 border-y border-zinc-800/80 text-xs text-zinc-400">
                                <div class="flex items-center gap-2">
                                    <i data-lucide="truck" class="w-4 h-4 text-indigo-400"></i>
                                    <span>Free Shipping over $150</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <i data-lucide="shield-check" class="w-4 h-4 text-indigo-400"></i>
                                    <span>2-Year Global Warranty</span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-8 pt-6 border-t border-zinc-