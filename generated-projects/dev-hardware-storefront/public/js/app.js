/**
 * DevCore™ - Main Application Controller (public/js/app.js)
 * Coordinates Products, Cart, and UI modules, handling event binding, 
 * search, category filtering, and application initialization.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide icons if available
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }

    // 2. Initialize modules
    if (typeof Cart !== 'undefined' && typeof Cart.init === 'function') {
        Cart.init();
    }
    if (typeof UI !== 'undefined' && typeof UI.init === 'function') {
        UI.init();
    }

    // 3. Render initial product catalog
    renderProducts(PRODUCTS);

    // 4. Bind event listeners for search, category filters, and quick actions
    bindEventListeners();
});

/**
 * Renders product cards into the product-grid container.
 * @param {Array} items - List of product objects to render
 */
function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    if (!items || items.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-dark-800 text-accent-400 mb-4 border border-slate-700/60 shadow-xl">
                    <i data-lucide="search-x" class="w-8 h-8"></i>
                </div>
                <h3 class="text-lg font-semibold text-white mb-1">No hardware found</h3>
                <p class="text-sm text-slate-400 max-w-sm mx-auto">We couldn't find any developer gear matching your search or filter criteria.</p>
                <button onclick="resetFilters()" class="mt-4 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-accent-600/20">
                    Reset All Filters
                </button>
            </div>
        `;
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        return;
    }

    grid.innerHTML = items.map(product => {
        // Generate star rating markup
        const fullStars = Math.floor(product.rating);
        const hasHalfStar = product.rating % 1 !== 0;
        let starsHTML = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHTML += `<i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>`;
            } else if (i === fullStars && hasHalfStar) {
                starsHTML += `<i data-lucide="star-half" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>`;
            } else {
                starsHTML += `<i data-lucide="star" class="w-3.5 h-3.5 text-slate-600"></i>`;
            }
        }

        const badgeHTML = product.badge ? `
            <span class="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-accent-500/90 text-white backdrop-blur-md shadow-lg shadow-accent-500/30">
                ${product.badge}
            </span>
        ` : '';

        return `
            <div class="group relative bg-dark-800/60 hover:bg-dark-800 border border-slate-700/60 hover:border-slate-600 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-xl shadow-black/20 hover:shadow-accent-500/10">
                ${badgeHTML}
                
                <!-- Product Image Container -->
                <div class="relative w-full h-56 bg-dark-900 overflow-hidden flex items-center justify-center p-4">
                    <div class="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent z-10 pointer-events-none"></div>
                    <img src="${product.image}" alt="${product.name}" loading="lazy" class="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500">
                    <span class="absolute bottom-3 right-3 z-20 px-2.5 py-1 text-xs font-semibold rounded-lg bg-dark-900/80 text-slate-300 backdrop-blur-md border border-slate-700/50">
                        ${product.category}
                    </span>
                </div>

                <!-- Product Content -->
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-1.5 mb-2">
                            <div class="flex items-center">
                                ${starsHTML}
                            </div>
                            <span class="text-xs text-slate-400 font-medium ml-1">(${product.reviews})</span>
                        </div>
                        <h3 class="text-base font-bold text-white group-hover:text-accent-400 transition-colors mb-1.5">
                            ${product.name}
                        </h3>
                        <p class="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                            ${product.description}
                        </p>
                    </div>

                    <div class="pt-4 border-t border-slate-700/50 flex items-center justify-between">
                        <div>
                            <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Price</span>
                            <span class="text-lg font-extrabold text-white">$${product.price.toFixed(2)}</span>
                        </div>
                        <button onclick="Cart.addItem('${product.id}')" class="px-4 py-2.5 bg-accent-600 hover:bg-accent-500 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-accent-600/20 hover:shadow-accent-500/40 flex items-center gap-2 group/btn">
                            <i data-lucide="shopping-cart" class="w-4 h-4 transition-transform group-hover/btn:scale-110"></i>
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}

/**
 * Binds event listeners for search input, category filters, and reset actions.
 */
function bindEventListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterProducts();
        });
    }

    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            categoryButtons.exec ? null : categoryButtons.forEach(btn => {
                btn.classList.remove('bg-accent-600', 'text-white', 'shadow-lg', 'shadow-accent-600/20');
                btn.classList.add('bg-dark-800', 'text-slate-300', 'hover:bg-dark-700', 'border', 'border-slate-700/60');
            });
            categoryButtons.forEach(btn => {
                btn.classList.remove('bg-accent-600', 'text-white', 'shadow-lg', 'shadow-accent-600/20', 'border-0');
                btn.classList.add('bg-dark-800', 'text-slate-300', 'hover:bg-dark-700', 'border', 'border-slate-700/60');
            });
            
            button.classList.remove('bg-dark-800', 'text-slate-300', 'hover:bg-dark-700', 'border', 'border-slate-700/60');
            button.classList.add('bg-accent-600', 'text-white', 'shadow-lg', 'shadow-accent-600/20');
            
            filterProducts();
        });
    });
}

/**
 * Filters products based on active search query and selected category.
 */
function filterProducts() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const activeCategoryBtn = document.querySelector('.category-btn.bg-accent-600');
    const selectedCategory = activeCategoryBtn ? activeCategoryBtn.getAttribute('data-category') : 'all';

    let filtered = PRODUCTS;

    if (selectedCategory && selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (query) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.description.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
    }

    renderProducts(filtered);
}

/**
 * Resets all search and category filters back to default.
 */
function resetFilters() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }

    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        const cat = btn.getAttribute('data-category');
        if (cat === 'all') {
            btn.classList.remove('bg-dark-800', 'text-slate-300', 'hover:bg-dark-700', 'border', 'border-slate-700/60');
            btn.classList.add('bg-accent-600', 'text-white', 'shadow-lg', 'shadow-accent-600/20');
        } else {
            btn.classList.remove('bg-accent-600', 'text-white', 'shadow-lg', 'shadow-accent-600/20');
            btn.classList.add('bg-dark-800', 'text-slate-300', 'hover:bg-dark-700', 'border', 'border-slate-700/60');
        }
    });

    renderProducts(PRODUCTS);
}