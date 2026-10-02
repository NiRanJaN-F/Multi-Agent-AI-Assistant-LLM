/**
 * DevCore™ - Products Catalog & Rendering Engine
 * Manages product data, filtering, searching, and dynamic DOM rendering.
 */

const products = window.PRODUCTS = [
    {
        id: 'kbd-001',
        name: 'CyberBoard Pro Wireless',
        category: 'Keyboards',
        price: 289.99,
        rating: 4.9,
        reviews: 142,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800',
        badge: 'Best Seller',
        description: 'CNC aluminum chassis, gasket mount structure, hot-swappable tri-mode connectivity with RGB ambient underglow.',
        specs: ['Tri-mode Wireless', 'Hot-swappable PCB', 'Custom CNC Aluminum', 'Per-key RGB']
    },
    {
        id: 'kbd-002',
        name: 'Apex Pro TKL Mechanical',
        category: 'Keyboards',
        price: 219.99,
        rating: 4.8,
        reviews: 98,
        image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=800',
        badge: 'Pro Choice',
        description: 'Adjustable magnetic switches for lightning-fast actuation and responsive tactile feedback during intense coding sprints.',
        specs: ['OmniPoint 2.0', 'OLED Smart Display', 'Aircraft-grade Aluminum', 'Detachable Type-C']
    },
    {
        id: 'aud-001',
        name: 'Audiophile Studio Pro ANC',
        category: 'Audio',
        price: 349.99,
        rating: 4.7,
        reviews: 86,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
        badge: 'Hi-Res Audio',
        description: 'Planar magnetic drivers delivering pristine acoustic clarity, zero listening fatigue, and active noise isolation.',
        specs: ['Planar Drivers', 'Hybrid ANC', '40h Battery Life', 'Memory Foam Cushions']
    },
    {
        id: 'dsk-001',
        name: 'ErgoLift Dual-Motor Standing Desk',
        category: 'Desks',
        price: 599.99,
        rating: 4.9,
        reviews: 215,
        image: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=80&w=800',
        badge: 'Ergonomic',
        description: 'Solid bamboo desktop powered by ultra-quiet dual motors with 4 programmable memory height presets and anti-collision.',
        specs: ['Dual Silent Motors', 'Solid Bamboo Top', 'Memory Keypad', 'Anti-Collision Tech']
    },
    {
        id: 'acc-001',
        name: 'Macropad V2 Programmable',
        category: 'Accessories',
        price: 89.99,
        rating: 4.6,
        reviews: 64,
        image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=800',
        badge: 'New Arrival',
        description: '12 fully programmable mechanical keys with dual rotary encoders for rapid IDE macros, volume, and workspace switching.',
        specs: ['QMK/VIA Support', 'Dual Rotary Encoders', 'CNC Case', 'Hot-swap Sockets']
    },
    {
        id: 'kbd-003',
        name: 'ErgoSplit 65% Alice Layout',
        category: 'Keyboards',
        price: 319.99,
        rating: 4.9,
        reviews: 112,
        image: 'https://images.unsplash.com/photo-1595225476633-c21528c707dd?auto=format&fit=crop&q=80&w=800',
        badge: 'Ergo Master',
        description: 'Ergonomic angled layout designed for prolonged coding sessions, reducing wrist pronation and shoulder strain.',
        specs: ['Alice Layout', 'Brass Weight', 'Brass Plate', 'PBT Dye-Sub Keycaps']
    },
    {
        id: 'acc-002',
        name: 'DeskMat Pro XL - CyberGrid',
        category: 'Accessories',
        price: 39.99,
        rating: 4.8,
        reviews: 178,
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=800',
        badge: 'Popular',
        description: 'Ultra-smooth waterproof micro-fiber surface with anti-fray stitched edges and high-grip natural rubber backing.',
        specs: ['900x400x4mm', 'Water-Resistant', 'Stitched Edges', 'Natural Rubber Base']
    },
    {
        id: 'aud-002',
        name: 'BoomArm Broadcast Studio mic',
        category: 'Audio',
        price: 179.99,
        rating: 4.7,
        reviews: 91,
        image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800',
        badge: 'Studio Grade',
        description: 'USB/XLR dual-output condenser microphone with built-in zero-latency headphone monitoring and mute touch-button.',
        specs: ['Cardioid Condenser', 'Dual USB/XLR', 'Tap-to-Mute', 'All-Metal Build']
    }
];

class ProductCatalog {
    constructor() {
        this.currentCategory = 'All';
        this.searchQuery = '';
        this.productsGrid = document.getElementById('products-grid');
        this.noResultsEl = document.getElementById('no-results');
        this.categoryTabs = document.querySelectorAll('.category-tab');
        this.searchInputDesktop = document.getElementById('search-input');
        this.searchInputMobile = document.getElementById('search-input-mobile');

        this.initListeners();
        this.render();
    }

    initListeners() {
        // Category tab filtering
        this.categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.categoryTabs.forEach(t => {
                    t.classList.remove('active', 'bg-accent-600', 'text-white', 'shadow-lg', 'shadow-accent-500/25', 'border-accent-500');
                    t.classList.add('bg-dark-800', 'text-slate-400', 'border-slate-800');
                });
                const target = e.currentTarget;
                target.classList.add('active', 'bg-accent-600', 'text-white', 'shadow-lg', 'shadow-accent-500/25', 'border-accent-500');
                target.classList.remove('bg-dark-800', 'text-slate-400', 'border-slate-800');

                this.currentCategory = target.dataset.category || 'All';
                this.render();
            });
        });

        // Search input handlers
        const handleSearch = (e) => {
            this.searchQuery = e.target.value.trim().toLowerCase();
            // Sync both search bars
            if (this.searchInputDesktop && this.searchInputDesktop !== e.target) {
                this.searchInputDesktop.value = e.target.value;
            }
            if (this.searchInputMobile && this.searchInputMobile !== e.target) {
                this.searchInputMobile.value = e.target.value;
            }
            this.render();
        };

        if (this.searchInputDesktop) {
            this.searchInputDesktop.addEventListener('input', handleSearch);
        }
        if (this.searchInputMobile) {
            this.searchInputMobile.addEventListener('input', handleSearch);
        }
    }

    getFilteredProducts() {
        return products.filter(product => {
            const matchesCategory = this.currentCategory === 'All' || product.category === this.currentCategory;
            const matchesSearch = product.name.toLowerCase().includes(this.searchQuery) ||
                                  product.description.toLowerCase().includes(this.searchQuery) ||
                                  product.category.toLowerCase().includes(this.searchQuery);
            return matchesCategory && matchesSearch;
        });
    }

    render() {
        if (!this.productsGrid) return;

        const filtered = this.getFilteredProducts();

        if (filtered.length === 0) {
            this.productsGrid.innerHTML = '';
            if (this.noResultsEl) {
                this.noResultsEl.classList.remove('hidden');
            }
            return;
        }

        if (this.noResultsEl) {
            this.noResultsEl.classList.add('hidden');
        }

        this.productsGrid.innerHTML = filtered.map((product, index) => `
            <div class="group relative bg-dark-800/60 backdrop-blur-sm border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all duration-300 flex flex-col shadow-xl hover:shadow-2xl hover:shadow-accent-500/5 animate-fade-in" style="animation-delay: ${index * 50}ms">
                <!-- Product Image Container -->
                <div class="relative aspect-[4/3] w-full overflow-hidden bg-dark-900">
                    <img src="${product.image}" alt="${product.name}" class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent opacity-60"></div>
                    
                    <!-- Badge -->
                    <div class="absolute top-3 left-3">
                        <span class="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-lg bg-dark-900/90 text-accent-400 border border-accent-500/30 backdrop-blur-md shadow-lg">
                            ${product.badge}
                        </span>
                    </div>

                    <!-- Category tag -->
                    <div class="absolute bottom-3 left-3">
                        <span class="text-xs font-medium text-slate-300 bg-dark-900/70 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-slate-700/50">
                            ${product.category}
                        </span>
                    </div>
                </div>

                <!-- Product Content -->
                <div class="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div class="space-y-2">
                        <!-- Rating & Reviews -->
                        <div class="flex items-center justify-between text-xs">
                            <div class="flex items-center gap-1.5 text-amber-400 font-medium">
                                <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400"></i>
                                <span>${product.rating}</span>
                                <span class="text-slate-500">(${product.reviews})</span>
                            </div>
                            <span class="text-[11px] text-slate-400 flex items-center gap-1">
                                <i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-400"></i> In Stock
                            </span>
                        </div>

                        <!-- Title -->
                        <h3 class="font-bold text-slate-100 text-base group-hover:text-accent-400 transition-colors line-clamp-1">
                            ${product.name}
                        </h3>

                        <!-- Description -->
                        <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            ${product.description}
                        </p>

                        <!-- Specs tags -->
                        <div class="flex flex-wrap gap-1.5 pt-1">
                            ${product.specs.slice(0, 2).map(spec => `
                                <span class="text-[10px] bg-dark-700/50 text-slate-300 px-2 py-0.5 rounded border border-slate-700/30">
                                    ${spec}
                                </span>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Footer: Price & Add to Cart -->
                    <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-slate-500 uppercase font-semibold">Price</span>
                            <span class="text-lg font-extrabold text-white">$${product.price.toFixed(2)}</span>
                        </div>
                        <button onclick="window.cartManager.addItem('${product.id}')" class="add-to-cart-btn px-4 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-semibold text-xs flex items-center gap-2 transition-all duration-200 shadow-lg shadow-accent-600/25 hover:shadow-accent-500/40 active:scale-95 group/btn">
                            <i data-lucide="shopping-bag" class="w-4 h-4 group-hover/btn:rotate-12 transition-transform"></i>
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Re-initialize Lucide icons for dynamically injected markup
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.productCatalog = new ProductCatalog();
});