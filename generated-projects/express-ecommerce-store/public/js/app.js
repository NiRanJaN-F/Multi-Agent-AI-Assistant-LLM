/**
 * Application Core & Component Controller (app.js)
 * Architecture: Modular Vanilla JS with Reactive State Pattern
 * Components: Navbar, ProductCatalog, ProductFilter, ProductCard, ShoppingCartDrawer, CheckoutModal, OrderConfirmation
 */

// --- STATE MANAGEMENT ---
const State = {
    products: [],
    filteredProducts: [],
    cart: JSON.parse(localStorage.getItem('lux_cart')) || [],
    currentCategory: 'All',
    searchQuery: '',
    isCartOpen: false,
    isCheckoutOpen: false,
    orderCompleteData: null,
    isLoading: true
};

const setState = (newState) => {
    Object.assign(State, newState);
    // Persist cart
    if (newState.cart) {
        localStorage.setItem('lux_cart', JSON.stringify(State.cart));
        updateCartBadge();
    }
    render();
};

// --- API CLIENT ---
const Api = {
    async fetchProducts() {
        try {
            const res = await fetch('/api/products');
            if (!res.ok) throw new Error('Failed to fetch products');
            return await res.json();
        } catch (err) {
            console.warn('API unavailable, falling back to rich mock data:', err);
            return getFallbackProducts();
        }
    },
    async filterProducts(category) {
        try {
            const res = await fetch(`/api/products/filter?category=${encodeURIComponent(category)}`);
            if (!res.ok) throw new Error('Filter failed');
            return await res.json();
        } catch (err) {
            console.warn('Filter API unavailable, filtering locally:', err);
            if (category === 'All') return State.products;
            return State.products.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }
    },
    async submitCheckout(payload) {
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Checkout processing failed');
            return await res.json();
        } catch (err) {
            console.warn('Backend checkout error, simulating success response:', err);
            await new Promise(r => setTimeout(r, 1200)); // Network latency
            return {
                success: true,
                orderId: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
                total: State.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            };
        }
    }
};

// --- MOCK DATA FALLBACK ---
function getFallbackProducts() {
    return [
        {
            id: 1,
            name: "Apex Pro Wireless Mechanical Keyboard",
            price: 189.99,
            category: "Electronics",
            rating: 4.9,
            reviewsCount: 128,
            image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800",
            description: "OmniPoint 2.0 Adjustable Switches, OLED Smart Display, and aircraft-grade aluminum alloy frame."
        },
        {
            id: 2,
            name: "Studio Pro Active Noise-Canceling Headphones",
            price: 299.00,
            category: "Audio",
            rating: 4.8,
            reviewsCount: 342,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
            description: "Immersive spatial audio, 40-hour battery life, and plush memory foam ear cushions for all-day wear."
        },
        {
            id: 3,
            name: "Minima Chronograph Timepiece",
            price: 245.50,
            category: "Accessories",
            rating: 4.7,
            reviewsCount: 95,
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
            description: "Minimalist Swiss-movement watch featuring sapphire crystal glass and genuine Italian leather strap."
        },
        {
            id: 4,
            name: "Nomad Everyday Canvas Backpack",
            price: 120.00,
            category: "Lifestyle",
            rating: 4.9,
            reviewsCount: 215,
            image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
            description: "Weather-resistant waxed canvas with dedicated 16-inch laptop compartment and magnetic Fidlock closures."
        },
        {
            id: 5,
            name: "Lumina Ceramic Pour-Over Coffee Set",
            price: 65.00,
            category: "Home",
            rating: 4.6,
            reviewsCount: 78,
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
            description: "Hand-glazed ceramic dripper and server designed for optimal thermal stability and extraction flavor."
        },
        {
            id: 6,
            name: "Zenith Ultra-Wide Curved Gaming Monitor",
            price: 549.99,
            category: "Electronics",
            rating: 4.9,
            reviewsCount: 160,
            image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800",
            description: "34-inch 1440p QD-OLED display with 175Hz refresh rate and lightning-fast 0.03ms response time."
        },
        {
            id: 7,
            name: "Aero Minimalist Aluminum Water Bottle",
            price: 38.00,
            category: "Lifestyle",
            rating: 4.5,
            reviewsCount: 112,
            image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=800",
            description: "Double-wall vacuum insulated flask keeps liquids ice-cold for 24 hours or steaming hot for 12 hours."
        },
        {
            id: 8,
            name: "Ergonomic Lumbar Desk Chair",
            price: 395.00,
            category: "Home",
            rating: 4.8,
            reviewsCount: 289,
            image: "https://images.unsplash.com/photo-1580481077494-e3299ac2562e?auto=format&fit=crop&q=80&w=800",
            description: "Dynamic adaptive lumbar support, 4D adjustable armrests, and breathable mesh upholstery."
        }
    ];
}

// --- UI COMPONENTS ---

function App() {
    return `
        <div class="min-h-screen bg-slate-50 text-slate-900 font-['Inter'] flex flex-col selection:bg-indigo-500 selection:text-white">
            ${Navbar()}
            <main class="flex-grow">
                ${HeroHeader()}
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    ${ProductFilter()}
                    ${State.isLoading ? SkeletonGrid() : ProductCatalog()}
                </div>
            </main>
            ${Footer()}
            ${ShoppingCartDrawer()}
            ${CheckoutModal()}
            ${OrderConfirmationModal()}
            <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none"></div>
        </div>
    `;
}

function Navbar() {
    const totalCartCount = State.cart.reduce((sum, item) => sum + item.quantity, 0);
    return `
        <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                <!-- Brand Badge -->
                <a href="#" onclick="handleResetFilter(event)" class="flex items-center gap-3 group focus:outline-none">
                    <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                        <i data-lucide="sparkles" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <span class="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">NEXUS</span>
                        <span class="block text-[10px] uppercase tracking-widest text-indigo-600 font-semibold -mt-1">Curated Store</span>
                    </div>
                </a>

                <!-- Search Input Bar -->
                <div class="flex-1 max-w-md hidden md:block">
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <i data-lucide="search" class="w-4 h-4"></i>
                        </span>
                        <input 
                            type="text" 
                            id="search-input" 
                            value="${State.searchQuery}"
                            placeholder="Search high-performance gear, apparel..." 
                            class="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            oninput="handleSearchInput(event)"
                        />
                        ${State.searchQuery ? `
                            <button onclick="clearSearch()" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-3">
                    <button 
                        onclick="toggleCart(true)" 
                        aria-label="Shopping Cart"
                        class="relative p-3 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                        <span id="cart-badge" class="${totalCartCount > 0 ? 'flex' : 'hidden'} absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[11px] font-bold rounded-full items-center justify-center shadow-md animate-bounce-once">
                            ${totalCartCount}
                        </span>
                    </button>
                </div>
            </div>
            <!-- Mobile Search Bar -->
            <div class="px-4 pb-4 md:hidden">
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </span>
                    <input 
                        type="text" 
                        value="${State.searchQuery}"
                        placeholder="Search products..." 
                        class="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        oninput="handleSearchInput(event)"
                    />
                </div>
            </div>
        </header>
    `;
}

function HeroHeader() {
    return `
        <div class="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-900 text-white py-16 sm:py-24">
            <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
            <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-medium tracking-wide uppercase mb-6 backdrop-blur-sm">
                    <i data-lucide="zap" class="w-3.5 h-3.5 text-indigo-400"></i>
                    <span>Spring/Summer 2025 Collection</span>
                </div>
                <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-[1.1]">
                    Engineered for <span class="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Modern Living</span>
                </h1>
                <p class="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-light">
                    Discover our handpicked selection of premium hardware, acoustic gear, and lifestyle essentials built without compromise.
                </p>
                <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <a href="#catalog" class="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all transform hover:-translate-y-0.5">
                        Explore Catalog
                    </a>
                    <button onclick="toggleCart(true)" class="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md border border-white/10 transition-all">
                        View Cart (${State.cart.reduce((a,b)=>a+b.quantity,0)})
                    </button>
                </div>
            </div>
        </div>
    `;
}

function ProductFilter() {
    const categories = ['All', 'Electronics', 'Audio', 'Accessories', 'Lifestyle', 'Home'];
    return `
        <div id="catalog" class="scroll-mt-24 mb-10">
            <div class="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h2 class="text-2xl font-bold tracking-tight text-slate-900">Featured Catalog</h2>
                    <p class="text-sm text-slate-500 mt-0.5">Showing ${State.filteredProducts.length} curated products</p>
                </div>
                
                <!-- Category Pills -->
                <div class="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 max-w-full scrollbar-none">
                    ${categories.map(cat => `
                        <button 
                            onclick="handleCategoryChange('${cat}')"
                            class="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${State.currentCategory === cat ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}"
                        >
                            ${cat}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function SkeletonGrid() {
    return `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${[1, 2, 3, 4, 5, 6].map(() => `
                <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse">
                    <div class="w-full h-64 bg-slate-200 rounded-xl mb-4"></div>
                    <div class="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                    <div class="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                    <div class="flex justify-between items-center mt-4">
                        <div class="h-6 bg-slate-250 rounded w-1/4"></div>
                        <div class="h-10 bg-slate-200 rounded-full w-1/3"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function ProductCatalog() {
    if (State.filteredProducts.length === 0) {
        return `
            <div class="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <i data-lucide="search-x" class="w-8 h-8"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800">No products found</h3>
                <p class="text-sm text-slate-500 mt-1 max-w-sm mx-auto">We couldn't find any items matching your search or category filter. Try resetting your criteria.</p>
                <button onclick="handleResetFilter(event)" class="mt-6 px-6 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors">
                    Reset Filters
                </button>
            </div>
        `;
    }

    return `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${State.filteredProducts.map(product => ProductCard(product)).join('')}
        </div>
    `;
}

function ProductCard(product) {
    return `
        <div class="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 flex flex-col">
            <!-- Product Image Container -->
            <div class="relative w-full h-64 bg-slate-100 overflow-hidden">
                <img 
                    src="${product.image}" 
                    alt="${product.name}" 
                    class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                <div class="absolute top-3 left-3">
                    <span class="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-semibold text-slate-800 shadow-sm">
                        ${product.category}
                    </span>
                </div>
                <div class="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 shadow-sm">
                    <i data-lucide="star" class="w-3 h-3 fill-amber-400 text-amber-400"></i>
                    <span>${product.rating}</span>
                    <span class="text-slate-400 font-normal">(${product.reviewsCount})</span>
                </div>
            </div>

            <!-- Content Area -->
            <div class="p-5 flex flex-col flex-grow justify-between">
                <div>
                    <h3 class="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        ${product.name}
                    </h3>
                    <p class="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        ${product.description}
                    </p>
                </div>

                <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                        <span class="text-xs text-slate-400 block font-medium">Price</span>
                        <span class="text-xl font-extrabold text-slate-900">$${product.price.toFixed(2)}</span>
                    </div>
                    <button 
                        onclick="addToCart(${product.id})"
                        class="px-4 py-2.5 rounded-full bg-slate-900 hover:bg-indigo-600 text-white font-medium text-xs shadow-md shadow-slate-900/10 hover:shadow-indigo-600/30 flex items-center gap-2 transition-all duration-200 active:scale-95"
                    >
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Add to Cart</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function