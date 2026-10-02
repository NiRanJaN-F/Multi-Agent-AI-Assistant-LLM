/**
 * @file filters.js
 * @description Category filter tabs and sorting component for DEVGEAR storefront
 */

import { store } from '../store.js';

export function renderFilters(containerId = 'filters-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const categories = [
        { id: 'all', label: 'All Products', icon: 'grid' },
        { id: 'Keyboards', label: 'Keyboards', icon: 'keyboard' },
        { id: 'Audio', label: 'Audio', icon: 'headphones' },
        { id: 'Desks', label: 'Desks', icon: 'sliders' },
        { id: 'Accessories', label: 'Accessories', icon: 'package' }
    ];

    const currentCategory = store.getState().selectedCategory;
    const currentSort = store.getState().sortBy;

    container.innerHTML = `
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-dark-800/40 backdrop-blur-md p-2 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20">
            <!-- Category Filter Tabs -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                ${categories.map(cat => {
                    const isActive = currentCategory === cat.id;
                    return `
                        <button 
                            data-category="${cat.id}"
                            class="category-btn flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                isActive 
                                    ? 'bg-brand text-white shadow-md shadow-brand/25 font-semibold' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
                            }"
                        >
                            <i data-lucide="${cat.icon}" class="w-4 h-4"></i>
                            <span>${cat.label}</span>
                        </button>
                    `;
                }).join('')}
            </div>

            <!-- Sorting Dropdown -->
            <div class="flex items-center justify-end gap-3 px-2 py-1">
                <div class="flex items-center gap-2 text-slate-400 text-sm">
                    <i data-lucide="arrow-up-down" class="w-4 h-4 text-brand"></i>
                    <span class="hidden sm:inline">Sort by:</span>
                </div>
                <div class="relative">
                    <select 
                        id="sort-select"
                        class="bg-dark-900/80 border border-slate-700/80 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-brand focus:border-brand block w-full py-2 px-3 pr-8 appearance-none cursor-pointer transition-colors hover:border-slate-600 outline-none"
                    >
                        <option value="featured" ${currentSort === 'featured' ? 'selected' : ''}>Featured / Newest</option>
                        <option value="price-asc" ${currentSort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
                        <option value="price-desc" ${currentSort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
                        <option value="rating" ${currentSort === 'rating' ? 'selected' : ''}>Highest Rated</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Re-initialize Lucide icons inside the filters container
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Attach Event Listeners
    attachFilterEvents(container);
}

function attachFilterEvents(container) {
    // Category button clicks
    const categoryButtons = container.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            store.setCategory(category);
        });
    });

    // Sort dropdown change
    const sortSelect = container.querySelector('#sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            store.setSort(e.target.value);
        });
    }
}