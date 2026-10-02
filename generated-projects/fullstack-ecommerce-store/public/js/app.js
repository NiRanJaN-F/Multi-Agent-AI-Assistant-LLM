/**
 * AURA E-COMMERCE - FRONTEND APPLICATION SCRIPT
 * Responsibilities:
 * - Application State Management & Orchestration
 * - API Communication with /api/products & fallback/mock handling
 * - UI Component Rendering & DOM Updates
 * - Global Event Delegation & Inter-module coordination (Cart, Checkout)
 * - Toast Notification System & Lucide Icons lifecycle
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        products: [],
        filteredProducts: [],
        categories: ['All', 'Audio', 'Wearables', 'Lifestyle', 'Accessories', 'Workspace'],
        currentCategory: 'All',
        searchQuery: '',
        isLoading: true,
        error: null,
        activeModal: null // 'cart' | 'checkout' | 'product-detail' | null
    };

    // --- Rich Fallback Mock Data (Ensures zero-latency UI if backend is offline) ---
    const FALLBACK_PRODUCTS = [
        {
            id: 1,
            name: "Aura Pro Wireless Headphones",
            price: 299.00,
            category: "Audio",
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
            description: "Immersive active noise-canceling headphones with 40-hour battery life and custom acoustic drivers.",
            rating: 4.9,
            reviewsCount: 128
        },
        {
            id: 2,
            name: "Apex Kinetic Smartwatch",
            price: 249.50,
            category: "Wearables",
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
            description: "Aerospace-grade titanium chassis with advanced biometric sensors, ECG, and always-on Retina display.",
            rating: 4.7,
            reviewsCount: 94
        },
        {
            id: 3,
            name: "Minimalist Leather Backpack",
            price: 185.00,
            category: "Accessories",
            image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800",
            description: "Handcrafted full-grain vegetable-tanned leather designed for modern professionals and urban commuters.",
            rating: 4.8,
            reviewsCount: 215
        },
        {
            id: 4,
            name: "Chronos Obsidian Desk Clock",
            price: 120.00,
            category: "Lifestyle",
            image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&q=80&w=800",
            description: "Solid matte black aluminum desk clock featuring an ambient light sensor and silent sweep movement.",
            rating: 4.6,
            reviewsCount: 62
        },
        {
            id: 5,
            name: "Nova Gradient Glass Tumbler",
            price: 45.00,
            category: "Lifestyle",
            image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800",
            description: "Double-walled borosilicate thermal glassware designed to maintain beverage temperatures effortlessly.",
            rating: 4.9,
            reviewsCount: 183
        },
        {
            id: 6,
            name: "Zenith Mechanical Keyboard",
            price: 210.00,
            category: "Workspace",
            image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800",
            description: "Hot-swappable custom tactile mechanical keyboard with CNC aluminum frame and PBT keycaps.",
            rating: 4.9,
            reviewsCount: 310
        },
        {
            id: 7,
            name: "Horizon Portable Bluetooth Speaker",
            price: 149.00,
            category: "Audio",
            image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=800",
            description: "IP67 waterproof rugged wireless speaker delivering 360-degree spatial sound and deep resonant bass.",
            rating: 4.5,
            reviewsCount: 78
        },
        {
            id: 8,
            name: "Orbit Ergonomic Desk Mat",
            price: 65.00,
            category: "Workspace",
            image: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&q=80&w=800",
            description: "Premium vegan leather desk pad providing smooth mouse tracking and organized workspace elegance.",
            rating: 4.7,
            reviewsCount: 142
        },
        {
            id: 9,
            name: "Lumina Studio Desk Lamp",
            price: 175.00,
            category: "Workspace",
            image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800",
            description: "Adjustable color temperature LED desk lamp with wireless smartphone charging base and sleek alloy finish.",
            rating: 4.8,
            reviewsCount: 112
        },
        {
            id: 10,
            name: "Solstice Ceramic Coffee Dripper",
            price: 38.00,
            category: "Lifestyle",
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
            description: "Hand-glazed matte ceramic pour-over cone engineered for optimal extraction and balanced morning brews.",
            rating: 4.9,
            reviewsCount: 204
        },
        {
            id: 11,
            name: "Vortex ANC Gaming Headset",
            price: 229.00,
            category: "Audio",
            image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800",
            description: "High-fidelity spatial audio headset with retractable studio microphone and ultra-soft memory foam cushions.",
            rating: 4.6,
            reviewsCount: 89
        },
        {
            id: 12,
            name: "Strata Titanium Water Bottle",
            price: 52.00,
            category: "Lifestyle",
            image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=800",
            description: "Featherweight vacuum-insulated double-wall titanium vessel keeps liquids ice-cold for 24 hours.",
            rating: 4.8,
            reviewsCount: 167
        }
    ];

    // --- DOM Cache ---
    const elements = {
        app: document.getElementById('app'),
        productGrid: document.getElementById('product-grid'),
        searchInput: document.getElementById('search-input'),
        categoryFilters: document.getElementById('category-filters'),
        cartCountBadges: document.querySelectorAll('.cart-count'),
        toastContainer: document.createElement('div')
    };

    // --- Initialization ---
    async function init() {
        setupToastContainer();
        renderSkeletonLoaders();
        bindGlobalEvents();
        await fetchProducts();
        filterProducts();
        
        // Expose to window for cross-module or test synchronization
        window.PRODUCTS = state.products;
        window.App = {
            state,
            showToast,
            filterProducts
        };
    }

    // --- Toast Notification System ---
    function setupToastContainer() {
        const existing = document.getElementById('toast-container');
        if (existing) {
            elements.toastContainer = existing;
        } else {
            elements.toastContainer.id = 'toast-container';
            elements.toastContainer.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(elements.toastContainer);
        }
    }

    function showToast(message, iconName = 'check-circle') {
        const toast = document.createElement('div');
        toast.className = 'flex items-center gap-3 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-2xl shadow-xl shadow-slate-900/15 pointer-events-auto transform translate-y-4 opacity-0 transition-all duration-300 ease-out';
        toast.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 text-emerald-400 shrink-0"></i><span>${message}</span>`;
        
        elements.toastContainer.appendChild(toast);
        lucide.createIcons({ root: toast });

        // Trigger entrance transition
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        });

        // Dismiss timer
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    }

    // --- Skeleton Loaders ---
    function renderSkeletonLoaders() {
        if (!elements.productGrid) return;
        elements.productGrid.innerHTML = Array(6).fill(0).map(() => `
            <div class="bg-white rounded-2xl border border-slate-200/80 p-4 animate-pulse">
                <div class="bg-slate-200 h-64 rounded-xl mb-4"></div>
                <div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div class="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div class="h-5 bg-slate-200 rounded w-1/4"></div>
                    <div class="h-9 bg-slate-200 rounded-xl w-1/3"></div>
                </div>
            </div>
        `).join('');
    }

    // --- API Communication ---
    async function fetchProducts() {
        try {
            state.isLoading = true;
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            state.products = Array.isArray(data) && data.length > 0 ? data : FALLBACK_PRODUCTS;
        } catch (err) {
            console.warn('Backend API unavailable or offline. Loading rich fallback mock catalog.', err);
            state.products = FALLBACK_PRODUCTS;
            state.error = err.message;
        } finally {
            state.isLoading = false;
        }
    }

    // --- Filtering & Searching ---
    function filterProducts() {
        const query = state.searchQuery.toLowerCase().trim();
        state.filteredProducts = state.products.filter(product => {
            const matchesCategory = state.currentCategory === 'All' || product.category === state.currentCategory;
            const matchesSearch = !query || 
                product.name.toLowerCase().includes(query) || 
                product.description.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });

        renderProducts();
    }

    // --- Rendering Products ---
    function renderProducts() {
        if (!elements.productGrid) return;

        if (state.filteredProducts.length === 0) {
            elements.productGrid.innerHTML = `
                <div class="col-span-full py-16 text-center text-slate-400">
                    <i data-lucide="search-x" class="w-12 h-12 stroke-[1.5] mx-auto mb-3 text-slate-300"></i>
                    <p class="text-base font-semibold text-slate-700">No products found</p>
                    <p class="text-sm text-slate-500 mt-1">Try adjusting your search query or category filters.</p>
                </div>
            `;
            lucide.createIcons({ root: elements.productGrid });
            return;
        }

        elements.productGrid.innerHTML = state.filteredProducts.map(product => `
            <div class="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
                <div class="relative bg-slate-100 h-64 overflow-hidden cursor-pointer product-card-image" data-id="${product.id}">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out">
                    <div class="absolute top-3 left-3">
                        <span class="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-semibold rounded-lg shadow-sm">
                            ${product.category}
                        </span>
                    </div>
                    ${product.rating ? `
                        <div class="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-xs font-semibold text-slate-800 shadow-sm">
                            <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>
                            <span>${product.rating}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 class="font-bold text-slate-900 text-base mb-1.5 group-hover:text-indigo-600 transition-colors cursor-pointer product-card-title" data-id="${product.id}">
                            ${product.name}
                        </h3>
                        <p class="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">
                            ${product.description}
                        </p>
                    </div>
                    <div class="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                        <div class="flex flex-col">
                            <span class="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Price</span>
                            <span class="text-lg font-extrabold text-slate-900">$${product.price.toFixed(2)}</span>
                        </div>
                        <button class="add-to-cart-btn px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-slate-900/10 transition-all flex items-center gap-2" data-id="${product.id}">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        lucide.createIcons({ root: elements.productGrid });
    }

    // --- Event Binding ---
    function bindGlobalEvents() {
        // Search Input Event
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value;
                filterProducts();
            });
        }

        // Category Filter Buttons (HTML container or dynamically generated)
        const filterContainer = document.getElementById('filter-container') || elements.categoryFilters;
        if (filterContainer) {
            filterContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-category]');
                if (!btn) return;

                const category = btn.getAttribute('data-category');
                state.currentCategory = category === 'all' ? 'All' : category;

                // Update active styles on category buttons
                filterContainer.querySelectorAll('[data-category]').forEach(b => {
                    const isSelected = (b.getAttribute('data-category') === category || (category === 'all' && b.getAttribute('data-category') === 'all'));
                    if (isSelected) {
                        b.className = "filter-btn px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 text-white shadow-sm transition-all whitespace-nowrap";
                    } else {
                        b.className = "filter-btn px-4 py-2 rounded-xl text-sm font-medium bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all whitespace-nowrap";
                    }
                });

                filterProducts();
            });
        }

        // Product Grid Delegated Events (Add to Cart & View Detail)
        if (elements.productGrid) {
            elements.productGrid.addEventListener('click', (e) => {
                const addToCartBtn = e.target.closest('.add-to-cart-btn');
                if (addToCartBtn) {
                    const productId = parseInt(addToCartBtn.getAttribute('data-id'), 10);
                    const product = state.products.find(p => p.id === productId);
                    if (product && window.Cart) {
                        window.Cart.addItem(product);
                        showToast(`Added ${product.name} to cart`, 'shopping-bag');
                    }
                    return;
                }

                const cardClick = e.target.closest('.product-card-image, .product-card-title');
                if (cardClick) {
                    const productId = parseInt(cardClick.getAttribute('data-id'), 10);
                    const product = state.products.find(p => p.id === productId);
                    if (product) {
                        showToast(`Viewing details for ${product.name}`, 'info');
                    }
                }
            });
        }
    }

    // Run Initialization
    init();
});