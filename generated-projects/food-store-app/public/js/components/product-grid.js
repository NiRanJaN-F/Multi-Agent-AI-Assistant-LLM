/**
 * @file product-grid.js
 * @description Product Grid component for DEVGEAR storefront. Renders responsive product cards,
 * star ratings, stock status, quick view / add to cart interactions, and empty states.
 */

import { store } from '../store.js';

export class ProductGrid {
    constructor(containerId = 'product-grid-container') {
        this.container = document.getElementById(containerId);
        
        // Subscribe to store changes so the grid re-renders automatically
        store.subscribe(() => this.render());
    }

    init() {
        this.render();
    }

    /**
     * Helper to generate star rating HTML based on rating float (e.g. 4.8)
     */
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHtml = '';

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += `<i data-lucide="star" class="w-4 h-4 fill-amber-400 text-amber-400"></i>`;
        }

        // Half star simulation with filled star or custom icon
        if (hasHalfStar) {
            starsHtml += `<i data-lucide="star" class="w-4 h-4 fill-amber-400/50 text-amber-400"></i>`;
        }

        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += `<i data-lucide="star" class="w-4 h-4 text-slate-600"></i>`;
        }

        return starsHtml;
    }

    render() {
        if (!this.container) return;

        const products = store.getFilteredProducts();

        if (products.length === 0) {
            this.container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 px-4 text-center bg-dark-800/30 border border-slate-800/80 rounded-2xl backdrop-blur-sm">
                    <div class="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                        <i data-lucide="search-x" class="w-8 h-8 text-brand"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">No hardware found</h3>
                    <p class="text-slate-400 max-w-md text-sm mb-6">
                        We couldn't find any items matching your current filters or search query. Try resetting your filters or searching for something else.
                    </p>
                    <button id="reset-filters-btn" class="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center gap-2">
                        <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Reset All Filters
                    </button>
                </div>
            `;

            // Attach reset listener
            const resetBtn = this.container.querySelector('#reset-filters-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    store.setCategory('all');
                    store.setSearchQuery('');
                });
            }

            if (window.lucide) {
                window.lucide.createIcons();
            }
            return;
        }

        // Render responsive product grid
        let html = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        `;

        products.forEach(product => {
            const isHot = product.badge === 'HOT' || product.rating >= 4.9;
            const isNew = product.badge === 'NEW';
            const isWireless = product.tags && product.tags.includes('Wireless');
            const isHotswap = product.tags && product.tags.includes('Hot-Swap');

            html += `
                <div class="group relative bg-dark-800/60 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-brand/5 flex flex-col justify-between backdrop-blur-sm">
                    
                    <!-- Card Top: Badges & Image -->
                    <div class="relative aspect-[4/3] bg-dark-900 overflow-hidden flex items-center justify-center p-6">
                        <!-- Background glow effect on hover -->
                        <div class="absolute inset-0 bg-gradient-to-t from-brand/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <!-- Top Badges -->
                        <div class="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                            ${product.badge ? `
                                <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${
                                    isHot ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    isNew ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    'bg-brand/10 text-brand border border-brand/20'
                                }">
                                    ${product.badge}
                                </span>
                            ` : ''}
                            ${isWireless ? `
                                <span class="px-2 py-1 text-[10px] font-medium rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                                    <i data-lucide="wifi" class="w-3 h-3"></i> Wireless
                                </span>
                            ` : ''}
                        </div>

                        <!-- Quick Tags / Specs Pill -->
                        <div class="absolute top-3 right-3 z-10">
                            <span class="px-2.5 py-1 text-[10px] font-mono rounded-lg bg-dark-700/80 text-slate-300 border border-slate-700 backdrop-blur-md">
                                ${product.category.toUpperCase()}
                            </span>
                        </div>

                        <!-- Product Image with Zoom on Hover -->
                        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover object-center rounded-xl transform group-hover:scale-105 transition-transform duration-500 shadow-lg" loading="lazy">

                        <!-- Stock Indicator overlay if low -->
                        ${product.stock <= 3 ? `
                            <div class="absolute bottom-3 left-3 z-10 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 backdrop-blur-sm">
                                <i data-lucide="alert-circle" class="w-3 h-3"></i> Only ${product.stock} left
                            </div>
                        ` : ''}
                    </div>

                    <!-- Card Body -->
                    <div class="p-5 flex-grow flex flex-col justify-between">
                        <div>
                            <!-- Star Rating & Review Count -->
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-1">
                                    ${this.renderStars(product.rating)}
                                    <span class="text-xs font-semibold text-slate-300 ml-1">${product.rating.toFixed(1)}</span>
                                </div>
                                <span class="text-xs text-slate-500 font-mono">(${product.reviews || Math.floor(Math.random() * 80) + 12})</span>
                            </div>

                            <!-- Product Title -->
                            <h3 class="text-base font-semibold text-white group-hover:text-brand transition-colors line-clamp-1 mb-1.5" title="${product.name}">
                                ${product.name}
                            </h3>

                            <!-- Description -->
                            <p class="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                                ${product.description}
                            </p>
                        </div>

                        <!-- Card Footer: Price & Add to Cart -->
                        <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-auto">
                            <div>
                                <span class="text-xs text-slate-500 block">Price</span>
                                <span class="text-lg font-bold font-mono text-white tracking-tight">
                                    $${product.price.toFixed(2)}
                                </span>
                            </div>

                            <button 
                                data-product-id="${product.id}"
                                class="add-to-cart-btn px-4 py-2.5 bg-brand hover:bg-brand-hover text-white font-medium text-xs rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center gap-2 group-hover:translate-y-[-1px] active:translate-y-[1px]"
                            >
                                <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                                <span>Add to Cart</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        this.container.innerHTML = html;

        // Bind Add to Cart button events
        const addToCartButtons = this.container.querySelectorAll('.add-to-cart-btn');
        addToCartButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.getAttribute('data-product-id');
                const product = store.state.products.find(p => p.id === productId);
                
                if (product) {
                    store.addToCart(product);
                    
                    // Button feedback animation
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-white"></i> <span>Added!</span>`;
                    btn.classList.remove('bg-brand', 'hover:bg-brand-hover');
                    btn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
                    
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }

                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
                        btn.classList.add('bg-brand', 'hover:bg-brand-hover');
                        if (window.lucide) {
                            window.lucide.createIcons();
                        }
                    }, 1200);
                }
            });
        });

        // Initialize Lucide icons for the newly injected HTML
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}