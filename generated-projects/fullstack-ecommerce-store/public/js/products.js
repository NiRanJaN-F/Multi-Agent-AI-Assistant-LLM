/**
 * products.js - Product Catalog & API Integration Module
 * Principal Frontend Architecture & UI/UX Implementation
 */

class ProductCatalogManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.sortBy = 'featured';
        this.isLoading = false;

        // Rich fallback mock catalog matching high-end UI expectations
        this.fallbackProducts = [
            {
                id: 1,
                name: "Aura Noise-Canceling Headphones",
                price: 299.00,
                category: "audio",
                rating: 4.9,
                reviewsCount: 128,
                image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
                description: "Immersive high-fidelity audio with active noise cancellation and 40-hour battery life."
            },
            {
                id: 2,
                name: "Minimalist Chronograph Watch",
                price: 185.50,
                category: "accessories",
                rating: 4.8,
                reviewsCount: 94,
                image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
                description: "Swiss movement timepiece featuring a genuine leather strap and sapphire crystal glass."
            },
            {
                id: 3,
                name: "Ergonomic Mechanical Keyboard",
                price: 145.00,
                category: "electronics",
                rating: 4.7,
                reviewsCount: 215,
                image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
                description: "Hot-swappable custom mechanical switches with per-key RGB backlighting and aluminum chassis."
            },
            {
                id: 4,
                name: "Studio Wireless Earbuds",
                price: 129.99,
                category: "audio",
                rating: 4.6,
                reviewsCount: 82,
                image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
                description: "Crystal clear spatial sound with IPX4 water resistance and customizable touch controls."
            },
            {
                id: 5,
                name: "Nomad Canvas Everyday Backpack",
                price: 98.00,
                category: "accessories",
                rating: 4.9,
                reviewsCount: 310,
                image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
                description: "Weather-resistant waxed canvas with a dedicated padded 16-inch laptop compartment."
            },
            {
                id: 6,
                name: "Ultra-Wide Curved Monitor 34\"",
                price: 649.00,
                category: "electronics",
                rating: 4.9,
                reviewsCount: 67,
                image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
                description: "WQHD 3440x1440 display with 144Hz refresh rate, HDR400, and USB-C power delivery."
            },
            {
                id: 7,
                name: "Ceramic Pour-Over Coffee Set",
                price: 65.00,
                category: "lifestyle",
                rating: 4.5,
                reviewsCount: 53,
                image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
                description: "Handcrafted matte ceramic dripper and server designed for the ultimate artisanal brew."
            },
            {
                id: 8,
                name: "Anodized Aluminum Desk Lamp",
                price: 110.00,
                category: "lifestyle",
                rating: 4.7,
                reviewsCount: 41,
                image: "https://images.unsplash.com/photo-1534073828943-f801091fab18?auto=format&fit=crop&w=800&q=80",
                description: "Dimmable LED task light with adjustable color temperature and Qi wireless charging base."
            }
        ];
    }

    /**
     * Fetch products from API endpoint with graceful fallback to mock catalog
     */
    async fetchProducts() {
        this.setLoading(true);
        try {
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Validate API data structure
            if (Array.isArray(data) && data.length > 0) {
                this.products = data;
            } else {
                console.warn('API returned empty or invalid structure. Using fallback mock catalog.');
                this.products = this.fallbackProducts;
            }
        } catch (error) {
            console.warn('Failed to fetch from backend API. Utilizing high-fidelity local catalog:', error.message);
            this.products = this.fallbackProducts;
        } finally {
            this.setLoading(false);
            this.applyFiltersAndSort();
            this.renderCatalog();
            this.updateProductCountBadge();
        }
    }

    /**
     * Toggle skeleton loader state on the product grid container
     */
    setLoading(isLoading) {
        this.isLoading = isLoading;
        const container = document.getElementById('product-grid');
        if (!container) return;

        if (isLoading) {
            container.innerHTML = Array(6).fill(0).map(() => `
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse">
                    <div class="w-full h-56 bg-slate-200 rounded-xl mb-4"></div>
                    <div class="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                    <div class="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                    <div class="flex justify-between items-center mt-4">
                        <div class="h-6 bg-slate-200 rounded w-1/3"></div>
                        <div class="h-10 bg-slate-200 rounded-xl w-28"></div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * Filter and sort products based on current state parameters
     */
    applyFiltersAndSort() {
        let result = [...this.products];

        // Category Filter
        if (this.currentCategory !== 'all') {
            result = result.filter(p => p.category && p.category.toLowerCase() === this.currentCategory.toLowerCase());
        }

        // Search Query Filter
        if (this.searchQuery.trim() !== '') {
            const query = this.searchQuery.toLowerCase().trim();
            result = result.filter(p => 
                p.name.toLowerCase().includes(query) || 
                (p.description && p.description.toLowerCase().includes(query)) ||
                (p.category && p.category.toLowerCase().includes(query))
            );
        }

        // Sorting Logic
        switch (this.sortBy) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'featured':
            default:
                // Keep original relative ordering
                break;
        }

        this.filteredProducts = result;
    }

    /**
     * Render product catalog cards into DOM
     */
    renderCatalog() {
        const grid = document.getElementById('product-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (!grid) return;

        if (this.filteredProducts.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        grid.innerHTML = this.filteredProducts.map(product => `
            <div class="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col overflow-hidden relative">
                <!-- Badge & Quick Actions Overlay -->
                <div class="absolute top-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
                    <span class="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-semibold rounded-full shadow-sm uppercase tracking-wider">
                        ${product.category || 'General'}
                    </span>
                    <button onclick="window.storeApp.handleQuickView(${product.id})" class="pointer-events-auto w-9 h-9 bg-white/90 backdrop-blur-md text-slate-700 rounded-full flex items-center justify-center shadow-md hover:bg-slate-900 hover:text-white transition-all transform hover:scale-105 active:scale-95" aria-label="Quick View">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Product Image Container -->
                <div class="w-full h-64 bg-slate-50 relative overflow-hidden cursor-pointer" onclick="window.storeApp.handleQuickView(${product.id})">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 loading="lazy" />
                </div>

                <!-- Product Content Details -->
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <!-- Rating & Reviews -->
                        <div class="flex items-center gap-1.5 mb-2">
                            <div class="flex items-center text-amber-400">
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                            </div>
                            <span class="text-xs font-bold text-slate-700">${product.rating || '4.8'}</span>
                            <span class="text-xs text-slate-400">(${product.reviewsCount || '45'})</span>
                        </div>

                        <!-- Product Title -->
                        <h3 class="font-semibold text-slate-900 text-base mb-1.5 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            ${product.name}
                        </h3>

                        <!-- Description Snippet -->
                        <p class="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                            ${product.description || 'Premium craftsmanship engineered for daily reliability and performance.'}
                        </p>
                    </div>

                    <!-- Price & Add to Cart Action -->
                    <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                            <span class="text-xs text-slate-400 block uppercase font-medium">Price</span>
                            <span class="text-lg font-bold text-slate-900">$${product.price.toFixed(2)}</span>
                        </div>
                        <button onclick="window.cartManager.addItem(${product.id})" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95">
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Re-initialize Lucide icons for newly injected DOM elements
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    /**
     * Update product count badge in the filter section
     */
    updateProductCountBadge() {
        const countEl = document.getElementById('product-count-badge');
        if (countEl) {
            countEl.textContent = `${this.filteredProducts.length} items found`;
        }
    }

    /**
     * Get single product by ID for quick view or cart validation
     */
    getProductById(id) {
        return this.products.find(p => p.id === Number(id));
    }

    /**
     * Setup event listeners for filtering, sorting, and live search
     */
    initEventListeners() {
        // Category Pills
        const categoryContainer = document.getElementById('category-filters');
        if (categoryContainer) {
            categoryContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-category]');
                if (!btn) return;

                // Update active state styles across pills
                categoryContainer.querySelectorAll('[data-category]').forEach(el => {
                    el.classList.remove('bg-slate-900', 'text-white', 'shadow-md');
                    el.classList.add('bg-white', 'text-slate-600', 'hover:bg-slate-100', 'border', 'border-slate-200');
                });

                btn.classList.remove('bg-white', 'text-slate-650', 'hover:bg-slate-100', 'border', 'border-slate-200');
                btn.classList.add('bg-slate-900', 'text-white', 'shadow-md');

                this.currentCategory = btn.getAttribute('data-category');
                this.applyFiltersAndSort();
                this.renderCatalog();
                this.updateProductCountBadge();
            });
        }

        // Live Search Input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.applyFiltersAndSort();
                this.renderCatalog();
                this.updateProductCountBadge();
            });
        }

        // Sort Select Dropdown
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyFiltersAndSort();
                this.renderCatalog();
            });
        }
    }
}

// Export global instance
window.productCatalog = new ProductCatalogManager();