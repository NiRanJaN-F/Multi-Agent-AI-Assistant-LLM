/**
 * Application: Modern Bookstore E-Commerce Client
 * Architecture: Component-Driven Vanilla JS + Reactive State Pattern
 * Author: Principal Frontend Architect & Senior UI/UX Designer
 */

(function () {
    'use strict';

    // --- State Management ---
    const state = {
        products: [],
        filteredProducts: [],
        cart: { items: [], total: 0 },
        searchQuery: '',
        selectedCategory: 'All',
        isCartOpen: false,
        isCheckoutOpen: false,
        lastOrder: null,
        loading: true,
        notification: null,
        darkMode: localStorage.getItem('darkMode') === 'true' || 
                  (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches),
        // Mock fallback catalog with stunning Unsplash imagery & rich data
        mockProducts: [
            { id: 1, title: "The Architecture of Modern Web Apps", author: "Aria Sterling", price: 39.99, category: "Technology", rating: 4.9, image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800", description: "Deep dive into scalable frontend architectures, design systems, and resilient UI state management." },
            { id: 2, title: "Design Systems Handbook", author: "Marcus Vance", price: 29.50, category: "Design", rating: 4.8, image: "https://images.unsplash.com/photo-1507842229432-2689234c264d?auto=format&fit=crop&q=80&w=800", description: "Create cohesive, accessible, and high-performing component libraries for multi-platform products." },
            { id: 3, title: "Silent Echoes of the Cosmos", author: "Dr. Elena Rostova", price: 24.99, category: "Science Fiction", rating: 4.7, image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800", description: "An interstellar journey exploring quantum entanglement and the fragile nature of human consciousness." },
            { id: 4, title: "Culinary Alchemy", author: "Chef Jean-Luc", price: 45.00, category: "Lifestyle", rating: 4.9, image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800", description: "Mastering flavor profiles, molecular techniques, and elevating everyday home cooking into an art form." },
            { id: 5, title: "Foundations of Neural Networks", author: "Kaito Tanaka", price: 54.99, category: "Technology", rating: 4.6, image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800", description: "Practical machine learning from scratch using pure mathematics and modern JavaScript/Python runtimes." },
            { id: 6, title: "The Art of Minimalist Living", author: "Sienna Brooks", price: 19.99, category: "Lifestyle", rating: 4.5, image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800", description: "Declutter your physical and mental space to cultivate lasting joy, peace, and purposeful productivity." },
            { id: 7, title: "Chronicles of the Forgotten Empire", author: "Gareth Thorne", price: 22.50, category: "Fantasy", rating: 4.8, image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=800", description: "A sweeping epic fantasy of political intrigue, forgotten gods, and reluctant heroes in a shattered realm." },
            { id: 8, title: "Productivity Psychology", author: "Dr. Nadia Malik", price: 27.99, category: "Business", rating: 4.7, image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800", description: "Evidence-based strategies to optimize cognitive bandwidth, eliminate burnout, and supercharge output." }
        ]
    };

    // --- DOM Root & Template Engine ---
    const root = document.getElementById('root');

    function applyTheme() {
        if (state.darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    }

    window.toggleDarkMode = function() {
        state.darkMode = !state.darkMode;
        applyTheme();
        render();
    };

    function render() {
        applyTheme();
        root.innerHTML = `
            <div class="min-h-screen flex flex-col ${state.darkMode ? 'bg-slate-900 text-slate-100 dark' : 'bg-slate-50 text-slate-900'} font-['Inter',sans-serif] selection:bg-amber-500 selection:text-white transition-colors duration-300">
                ${Navbar()}
                <main class="flex-grow">
                    ${HeroSection()}
                    ${ProductCatalog()}
                </main>
                ${Footer()}
                ${CartDrawer()}
                ${CheckoutModal()}
                ${NotificationToast()}
            </div>
        `;
        attachEventListeners();
    }

    // --- Navbar Component ---
    function Navbar() {
        const totalItems = state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        return `
            <header class="sticky top-0 z-40 backdrop-blur-md ${state.darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} border-b transition-colors duration-300">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div class="flex items-center space-x-3 cursor-pointer" onclick="window.resetFilters()">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                            </svg>
                        </div>
                        <div>
                            <span class="text-xl font-bold tracking-tight bg-gradient-to-r ${state.darkMode ? 'from-amber-400 to-indigo-400' : 'from-amber-600 to-indigo-600'} bg-clip-text text-transparent">Lumina</span>
                            <span class="text-xs block ${state.darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium tracking-widest uppercase">Bookstore</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <button onclick="window.toggleDarkMode()" aria-label="Toggle Dark Mode" class="p-2.5 rounded-xl ${state.darkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} transition-colors relative">
                            ${state.darkMode ? `
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                            ` : `
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                                </svg>
                            `}
                        </button>

                        <button onclick="window.toggleCart()" class="relative flex items-center space-x-2 px-4 py-2.5 rounded-xl ${state.darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-900 hover:bg-slate-800 text-white'} transition-all shadow-md shadow-slate-900/10">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                            </svg>
                            <span class="text-sm font-semibold hidden sm:inline">Cart</span>
                            ${totalItems > 0 ? `<span class="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">${totalItems}</span>` : ''}
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    // --- Hero Section Component ---
    function HeroSection() {
        return `
            <section class="relative overflow-hidden py-16 lg:py-24 ${state.darkMode ? 'bg-gradient-to-b from-slate-900 to-slate-800' : 'bg-gradient-to-b from-slate-100/50 to-white'}">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div class="text-center max-w-3xl mx-auto space-y-6">
                        <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full ${state.darkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'} text-xs font-semibold tracking-wide uppercase">
                            <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            <span>Curated Literature & Ideas</span>
                        </div>
                        <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight ${state.darkMode ? 'text-white' : 'text-slate-900'} leading-tight">
                            Expand Your Mind With <span class="bg-gradient-to-r ${state.darkMode ? 'from-amber-400 to-indigo-400' : 'from-amber-600 to-indigo-600'} bg-clip-text text-transparent">Masterpieces</span>
                        </h1>
                        <p class="text-lg sm:text-xl ${state.darkMode ? 'text-slate-300' : 'text-slate-600'} font-normal leading-relaxed">
                            Discover transformative books spanning cutting-edge technology, transcendent design, speculative fiction, and profound lifestyle philosophy.
                        </p>
                        
                        <!-- Search Bar -->
                        <div class="pt-4 max-w-xl mx-auto">
                            <div class="relative flex items-center shadow-2xl shadow-indigo-500/10 rounded-2xl overflow-hidden">
                                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                                <input 
                                    type="text" 
                                    id="search-input"
                                    value="${state.searchQuery}"
                                    placeholder="Search by title, author, or keyword..." 
                                    class="w-full pl-12 pr-4 py-4 ${state.darkMode ? 'bg-slate-800 text-white placeholder-slate-400 border-slate-700 focus:bg-slate-750' : 'bg-white text-slate-900 placeholder-slate-400 border-slate-200'} border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-base"
                                    oninput="window.handleSearch(event)"
                                />
                                ${state.searchQuery ? `
                                    <button onclick="window.clearSearch()" class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    // --- Product Catalog Component ---
    function ProductCatalog() {
        const categories = ['All', 'Technology', 'Design', 'Science Fiction', 'Lifestyle', 'Fantasy', 'Business'];
        
        return `
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <!-- Category Filter Pills -->
                <div class="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
                    ${categories.map(cat => `
                        <button 
                            onclick="window.selectCategory('${cat}')"
                            class="px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                                state.selectedCategory === cat 
                                    ? 'bg-amber-500 text-white shadow-amber-500/30' 
                                    : state.darkMode 
                                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }"
                        >
                            ${cat}
                        </button>
                    `).join('')}
                </div>

                <!-- Catalog Grid / Loading / Empty -->
                ${state.loading ? renderSkeletonGrid() : state.filteredProducts.length === 0 ? renderEmptyState() : `
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        ${state.filteredProducts.map(product => ProductCard(product)).join('')}
                    </div>
                `}
            </section>
        `;
    }

    function ProductCard(product) {
        return `
            <div class="${state.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden shadow-xl shadow-slate-900/5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col group">
                <div class="relative aspect-[4/5] overflow-hidden ${state.darkMode ? 'bg-slate-700' : 'bg-slate-100'}">
                    <img 
                        src="${product.image}" 
                        alt="${product.title}" 
                        class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                    <div class="absolute top-3 right-3">
                        <span class="px-3 py-1 rounded-lg text-xs font-bold bg-slate-900/80 backdrop-blur-md text-white shadow-lg">
                            ${product.category}
                        </span>
                    </div>
                    <div class="absolute bottom-3 left-3 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/90 backdrop-blur-md text-white text-xs font-bold shadow-lg">
                        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <span>${product.rating}</span>
                    </div>
                </div>

                <div class="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div class="space-y-1.5">
                        <h3 class="font-bold ${state.darkMode ? 'text-white' : 'text-slate-900'} text-lg leading-snug line-clamp-1 group-hover:text-amber-500 transition-colors">
                            ${product.title}
                        </h3>
                        <p class="text-sm ${state.darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium">
                            By ${product.author}
                        </p>
                        <p class="text-xs ${state.darkMode ? 'text-slate-400' : 'text-slate-600'} line-clamp-2 pt-1">
                            ${product.description}
                        </p>
                    </div>

                    <div class="flex items-center justify-between pt-4 border-t ${state.darkMode ? 'border-slate-700' : 'border-slate-100'}">
                        <div>
                            <span class="text-xs block ${state.darkMode ? 'text-slate-400' : 'text-slate-400'} font-medium">Price</span>
                            <span class="text-xl font-extrabold ${state.darkMode ? 'text-white' : 'text-slate-900'}">$${product.price.toFixed(2)}</span>
                        </div>
                        <button 
                            onclick="window.addToCart(${product.id})"
                            class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            <span>Add</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderSkeletonGrid() {
        return `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                ${[1, 2, 3, 4, 5, 6, 7, 8].map(() => `
                    <div class="${state.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden shadow-sm animate-pulse">
                        <div class="aspect-[4/5] ${state.darkMode ? 'bg-slate-700' : 'bg-slate-200'}"></div>
                        <div class="p-5 space-y-4">
                            <div class="space-y-2">
                                <div class="h-5 ${state.darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-lg w-3/4"></div>
                                <div class="h-4 ${state.darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-lg w-1/2"></div>
                            </div>
                            <div class="flex items-center justify-between pt-4 border-t ${state.darkMode ? 'border-slate-700' : 'border-slate-100'}">
                                <div class="h-6 ${state.darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-lg w-1/3"></div>
                                <div class="h-10 ${state.darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-xl w-24"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderEmptyState() {
        return `
            <div class="text-center py-24 space-y-6">
                <div class="w-20 h-20 mx-auto rounded-2xl ${state.darkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'} flex items-center justify-center">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                </div>
                <div class="space-y-2">
                    <h3 class="text-2xl font-bold ${state.darkMode ? 'text-white' : 'text-slate-900'}">No books found</h3>
                    <p class="${state.darkMode ? 'text-slate-400' : 'text-slate-500'} max-w-sm mx-auto">We couldn't find any masterpieces matching your search or category filter. Try refining your keywords.</p>
                </div>
                <button onclick="window.resetFilters()" class="px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all">
                    Reset Filters
                </button>
            </div>
        `;
    }

    // --- Cart Drawer Component ---
    function CartDrawer() {
        if (!state.isCartOpen) return '';

        return `
            <div class="fixed inset-0 z-50 overflow-hidden">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onclick="window.toggleCart()"></div>
                <div class="absolute inset-y-0 right-0 max-w-full flex pl-10">
                    <div class="w-screen max-w-md ${state.darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white text-slate-900'} shadow-2xl flex flex-col border-l">
                        <!-- Drawer Header -->
                        <div class="flex items-center justify-between px-6 py-6 border-b ${state.darkMode ? 'border-slate-800' : 'border-slate-100'}">
                            <div class="flex items-center space-x-2">
                                <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                                </svg>
                                <h2 class="text-xl font-bold">Shopping Cart</h2>
                                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">
                                    ${state.cart.items.reduce((s, i) => s + i.quantity, 0)}
                                </span>
                            </div>
                            <button onclick="window.toggleCart()" class="p-2 rounded-xl ${state.darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <!-- Drawer Body -->
                        <div class="flex-grow overflow-y-auto px-6 py-6 space-y-4">
                            ${state.cart.items.length === 0 ? `
                                <div class="text-center py-20 space-y-4">
                                    <div class="w-16 h-16 mx-auto rounded-full ${state.darkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'} flex items-center justify-center">
                                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                                        </svg>
                                    </div>
                                    <p class="${state.darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium">Your cart is currently empty.</p>
                                </div>
                            ` : state.cart.items.map(item => `
                                <div class="flex items-center space-x-4 p-4 rounded-2xl ${state.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} border">
                                    <img src="${item.image}" alt="${item.title}" class="w-16 h-20 object-cover rounded-xl shadow-md"/>
                                    <div class="flex-grow space-y-1">
                                        <h4 class="font-bold text-sm line-clamp-1">${item.title}</h4>
                                        <p class="text-xs ${state.darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium">$${item.price.toFixed(2)}</p>
                                        <div class="flex items-center space-x-3 pt-2">
                                            <div class="flex items-center space-x-2 ${state.darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-lg px-2 py-1">
                                                <button onclick="window.updateQuantity(${item.id}, ${item.quantity - 1})" class="text-slate-400 hover:text-amber-500 font-bold">-</button>
                                                <span class="text-xs font-bold w-4 text-center">${item.quantity}</span>
                                                <button onclick="window.updateQuantity(${item.id}, ${item.quantity + 1})" class="text-slate-400 hover:text-amber-500 font-bold">+</button>
                                            </div>
                                            <button onclick="window.removeFromCart(${item.id})" class="text-xs font-semibold text-red-500 hover:text-red-600">Remove</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Drawer Footer -->
                        ${state.cart.items.length > 0 ? `
                            <div class="p-6 border-t ${state.darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50'} space-y-4">
                                <div class="flex items-center justify-between text-base">
                                    <span class="${state.darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium">Subtotal</span>
                                    <span class="text-xl font-extrabold">$${state.cart.total.toFixed(2)}</span>
                                </div>
                                <button onclick="window.openCheckout()" class="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-xl shadow-amber-500/20 transition-all active:scale-98">
                                    Proceed to Checkout
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // --- Checkout Modal Component ---
    function CheckoutModal() {
        if (!state.isCheckoutOpen) return '';

        return `
            <div class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onclick="window.closeCheckout()"></div>
                <div class="relative ${state.darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white text-slate-900'} rounded-3xl shadow-2xl max-w-lg w-full p-8 overflow-hidden border z-10 animate-in">
                    ${state.lastOrder ? renderOrderSuccess() : `
                        <div class="flex items-center justify-between pb-6 border-b ${state.darkMode ? 'border-slate-800' : 'border-slate-100'}">
                            <div>
                                <h2 class="text-2xl font-bold">Secure Checkout</h2>
                                <p class="text-xs ${state.darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium pt-1">Complete your order details below</p>
                            </div>
                            <button onclick="window.closeCheckout()" class="p-2 rounded-xl ${state.darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <form id="checkout-form" onsubmit="window.handleCheckoutSubmit(event)" class="space-y-5 pt-6">
                            <div class="space-y-1.5">
                                <label class="block text-xs font-bold uppercase tracking-wider ${state.darkMode ? 'text-slate-300' : 'text-slate-700'}">Full Name</label>
                                <input type="text" required name="name" placeholder="Aria Sterling" class="w-full px-4 py-3 rounded-xl ${state.darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'} border focus:ring-2 focus:ring-amber-500 focus:outline-none"/>
                            </div>
                            <div class="space-y-1.5">
                                <label class="block text-xs font-bold uppercase tracking-wider ${state.darkMode ? 'text-slate-300' : 'text-slate-700'}">Email Address</label>
                                <input type="email" required name="email" placeholder="aria@example.com" class="w-full px-4 py-3 rounded-xl ${state.darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'} border focus:ring-2 focus:ring-amber-500 focus:outline-none"/>
                            </div>
                            <div class="space-y-1.5">
                                <label class="block text-xs font-bold uppercase tracking-wider ${state.darkMode ? 'text-slate-300' : 'text-slate-700'}">Shipping Address</label>
                                <input type="text" required name="address" placeholder="123 Innovation Drive, Suite 400" class="w-full px-4 py-3 rounded-xl ${state.darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'} border focus:ring-2 focus:ring-amber-500 focus:outline-none"/>
                            </div>

                            <div class="pt-4 border-t ${state.darkMode ? 'border-slate-800' : 'border-slate-100'} flex items-center justify-between">
                                <div>
                                    <span class="text-xs block ${state.darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium">Total Amount</span>
                                    <span class="text-2xl font-extrabold">$${state.cart.total.toFixed(2)}</span>
                                </div>
                                <button type="submit" class="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20 transition-all">
                                    Place Order
                                </button>
                            </div>
                        </form>
                    `}
                </div>
            </div>
        `;
    }

    function renderOrderSuccess() {
        return `
            <div class="text-center py-8 space-y-6">
                <div class="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-bounce">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <div class="space-y-2">
                    <h2 class="text-2xl font-bold">Order Confirmed!</h2>
                    <p class="text-sm ${state.darkMode ? 'text-slate-400' : 'text-slate-500'}">Thank you for your purchase. Your order ID is <span class="font-mono font-bold text-amber-500">#${state.lastOrder.id}</span>.</p>
                </div>
                <div class="${state.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} p-4 rounded-2xl text-left space-y-2 border text-sm">
                    <p><strong class="${state.darkMode ? 'text-slate-200' : 'text-slate-700'}">Name:</strong> ${state.lastOrder.customer.name}</p>
                    <p><strong class="${state.darkMode ? 'text-slate-200' : 'text-slate-700'}">Email:</strong> ${state.lastOrder.customer.email}</p>
                    <p><strong class="${state.darkMode ? 'text-slate-200' : 'text-slate-700'}">Address:</strong> ${state.lastOrder.customer.address}</p>
                    <p><strong class="${state.darkMode ? 'text-slate-200' : 'text-slate-700'}">Total Paid:</strong> $${state.lastOrder.total.toFixed(2)}</p>
                </div>
                <button onclick="window.finishOrder()" class="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20 transition-all">
                    Continue Shopping
                </button>
            </div>
        `;
    }

    // --- Notification Toast Component ---
    function NotificationToast() {
        if (!state.notification) return '';

        return `
            <div class="fixed bottom-6 right-6 z-50 animate-in">
                <div class="flex items-center space-x-3 px-5 py-3.5 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800">
                    <div class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                    <p class="text-sm font-semibold">${state.notification}</p>
                </div>
            </div>
        `;
    }

    // --- Footer Component ---
    function Footer() {
        return `
            <footer class="${state.darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-500'} border-t py-12 transition-colors duration-300">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                    <div class="flex items-center space-x-2">
                        <span class="font-bold bg-gradient-to-r ${state.darkMode ? 'from-amber-400 to-indigo-400' : 'from-amber-600 to-indigo-600'} bg-clip-text text-transparent">Lumina Bookstore</span>
                        <span>&copy; ${new Date().getFullYear()} All rights reserved.</span>
                    </div>
                    <div class="text-xs font-medium">
                        Architected with Component-Driven Vanilla JS
                    </div>
                </div>
            </footer>
        `;
    }

    // --- Actions & API Layer ---
    async function fetchProducts() {
        state.loading = true;
        render();

        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('API unavailable');
            const data = await response.json();
            state.products = data;
        } catch (err) {
            // Graceful fallback to mock catalog if backend isn't mounted
            state.products = state.mockProducts;
        } finally {
            state.loading = false;
            filterProducts();
        }
    }

    function filterProducts() {
        let result = state.products;

        if (state.selectedCategory !== 'All') {
            result = result.filter(p => p.category === state.selectedCategory);
        }

        if (state.searchQuery.trim() !== '') {
            const q = state.searchQuery.toLowerCase();
            result = result.filter(p => 
                p.title.toLowerCase().includes(q) || 
                p.author.toLowerCase().includes(q) || 
                p.description.toLowerCase().includes(q)
            );
        }

        state.filteredProducts = result;
        render();
    }

    function showNotification(message) {
        state.notification = message;
        render();
        setTimeout(() => {
            state.notification = null;
            render();
        }, 3000);
    }

    // --- Global Window Handlers ---
    window.selectCategory = function(category) {
        state.selectedCategory = category;
        filterProducts();
    };

    window.handleSearch = function(event) {
        state.searchQuery = event.target.value;
        filterProducts();
    };

    window.clearSearch = function() {
        state.searchQuery = '';
        filterProducts();
    };

    window.resetFilters = function() {
        state.selectedCategory = 'All';
        state.searchQuery = '';
        filterProducts();
    };

    window.toggleCart = function() {
        state.isCartOpen = !state.isCartOpen;
        render();
    };

    window.addToCart = function(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = state.cart.items.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            state.cart.items.push({ ...product, quantity: 1 });
        }

        calculateCartTotal();
        showNotification(`Added "${product.title}" to cart`);
        render();
    };

    window.updateQuantity = function(productId, quantity) {
        if (quantity <= 0) {
            window.removeFromCart(productId);
            return;
        }

        const item = state.cart.items.find(i => i.id === productId);
        if (item) {
            item.quantity = quantity;
            calculateCartTotal();
            render();
        }
    };

    window.removeFromCart = function(productId) {
        state.cart.items = state.cart.items.filter(i => i.id !== productId);
        calculateCartTotal();
        render();
    };

    function calculateCartTotal() {
        state.cart.total = state.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    window.openCheckout = function() {
        state.isCartOpen = false;
        state.isCheckoutOpen = true;
        render();
    };

    window.closeCheckout = function() {
        state.isCheckoutOpen = false;
        render();
    };

    window.handleCheckoutSubmit = async function(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const customer = {
            name: formData.get('name'),
            email: formData.get('email'),
            address: formData.get('address')
        };

        const orderPayload = {
            customer,
            items: state.cart.items,
            total: state.cart.total
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            if (response.ok) {
                const data = await response.json();
                state.lastOrder = data;
            } else {
                throw new Error('Order creation failed');
            }
        } catch (err) {
            // Fallback client-side order ID if API endpoint is absent
            state.lastOrder = {
                id: Math.floor(100000 + Math.random() * 900000),
                customer,
                total: state.cart.total
            };
        }

        state.cart.items = [];
        state.cart.total = 0;
        render();
    };

    window.finishOrder = function() {
        state.lastOrder = null;
        state.isCheckoutOpen = false;
        render();
    };

    function attachEventListeners() {
        // Keep focus on search input if user was typing
        const searchInput = document.getElementById('search-input');
        if (searchInput && state.searchQuery) {
            searchInput.focus();
            searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
        }
    }

    // --- Initialization ---
    fetchProducts();

})();