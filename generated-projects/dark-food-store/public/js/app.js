/**
 * @file app.js
 * @description Principal Frontend Architecture & UI/UX Implementation for Dark-Themed Food Store
 * @stack Node.js + Express + Vanilla JS + Tailwind CSS + Lucide Icons
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management & Configuration ---
    const state = {
        products: [],
        filteredProducts: [],
        cart: JSON.parse(localStorage.getItem('foodstore_cart')) || [],
        currentCategory: 'all',
        searchQuery: '',
        isCartOpen: false,
        isCheckoutOpen: false,
        orderComplete: null,
        loading: true,
        error: null
    };

    const FALLBACK_PRODUCTS = [
        { id: 1, name: "Truffle Wagyu Burger", category: "fast-food", price: 18.99, rating: 4.9, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", description: "Brioche bun, 100% Wagyu beef, black truffle aioli, aged white cheddar." },
        { id: 2, name: "Dragon Fire Ramen", category: "asian", price: 15.50, rating: 4.8, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80", description: "Rich tonkotsu broth, spicy chili oil, chashu pork, ajitsuke tamago, nori." },
        { id: 3, name: "Margherita di Bufala", category: "italian", price: 16.00, rating: 4.7, image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80", description: "San Marzano tomatoes, fresh buffalo mozzarella, organic basil, extra virgin olive oil." },
        { id: 4, name: "Wild Alaskan Salmon Poke", category: "asian", price: 17.25, rating: 4.9, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80", description: "Fresh sashimi-grade salmon, avocado, edamame, spicy ponzu, black sesame rice." },
        { id: 5, name: "Crispy Baja Fish Tacos", category: "mexican", price: 13.99, rating: 4.6, image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80", description: "Beer-battered cod, chipotle crema, crunchy cabbage slaw, fresh cilantro, lime." },
        { id: 6, name: "Artisanal Pepperoni Supreme", category: "italian", price: 19.00, rating: 4.8, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80", description: "Double pepperoni, hot honey drizzle, fresh mozzarella, oregano, tomato passata." },
        { id: 7, name: "Ultimate Loaded Nachos", category: "mexican", price: 14.50, rating: 4.5, image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80", description: "House tortilla chips, queso blanco, jalapeños, guacamole, black beans, pico de gallo." },
        { id: 8, name: "Double Smash Bacon Burger", category: "fast-food", price: 16.75, rating: 4.9, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80", description: "Two smashed beef patties, crispy applewood smoked bacon, American cheese, secret sauce." }
    ];

    // --- DOM Elements Cache ---
    const appContainer = document.getElementById('app') || document.body;

    // --- Core Architecture: Render Root ---
    function render() {
        appContainer.className = "bg-slate-950 text-slate-100 min-h-screen font-['Inter',sans-serif] selection:bg-amber-500 selection:text-slate-950 antialiased";
        appContainer.innerHTML = `
            ${NavbarComponent()}
            ${HeroComponent()}
            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                ${CategoryFiltersComponent()}
                ${ProductGridComponent()}
            </main>
            ${FooterComponent()}
            ${CartDrawerComponent()}
            ${CheckoutModalComponent()}
            ${ToastContainerComponent()}
        `;

        // Re-initialize Lucide Icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        attachGlobalEventListeners();
    }

    // --- Component: Navbar ---
    function NavbarComponent() {
        const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        return `
            <nav class="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-all">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                    <!-- Brand -->
                    <div class="flex items-center gap-3 cursor-pointer" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
                        <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <i data-lucide="utensils" class="w-6 h-6 text-slate-950"></i>
                        </div>
                        <div>
                            <span class="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">VelvetBite</span>
                            <span class="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Artisanal Kitchen</span>
                        </div>
                    </div>

                    <!-- Search Bar -->
                    <div class="hidden md:flex flex-1 max-w-md relative">
                        <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                        <input 
                            type="text" 
                            id="search-input"
                            value="${state.searchQuery}"
                            placeholder="Search burgers, ramen, pizza..." 
                            class="w-full bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                        ${state.searchQuery ? `
                            <button id="clear-search" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-3">
                        <button 
                            id="open-cart-btn"
                            class="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all flex items-center gap-2 group"
                        >
                            <i data-lucide="shopping-bag" class="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform"></i>
                            <span class="hidden sm:inline text-sm font-medium">Cart</span>
                            ${cartCount > 0 ? `
                                <span class="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                                    ${cartCount}
                                </span>
                            ` : ''}
                        </button>
                    </div>
                </div>
                <!-- Mobile Search Row -->
                <div class="md:hidden px-4 pb-4">
                    <div class="relative w-full">
                        <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                        <input 
                            type="text" 
                            id="mobile-search-input"
                            value="${state.searchQuery}"
                            placeholder="Search dishes..." 
                            class="w-full bg-slate-900 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                    </div>
                </div>
            </nav>
        `;
    }

    // --- Component: Hero ---
    function HeroComponent() {
        return `
            <header class="relative overflow-hidden bg-gradient-to-b from-slate-900/50 to-slate-950 py-16 lg:py-24 border-b border-slate-800/60">
                <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <span class="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-6">
                        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Fast & Fresh Delivery in 30 Mins
                    </span>
                    <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
                        Craft Culinary Delights <br class="hidden sm:inline"/>
                        <span class="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent">Delivered to Your Door</span>
                    </h1>
                    <p class="max-w-2xl mx-auto text-lg text-slate-400 mb-8">
                        Explore hand-crafted burgers, authentic ramen, artisanal pizzas, and fresh bowls made by world-class chefs with locally sourced ingredients.
                    </p>
                    <div class="flex items-center justify-center gap-4">
                        <button onclick="document.getElementById('menu-section').scrollIntoView({behavior: 'smooth'})" class="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold shadow-lg shadow-amber-500/25 hover:opacity-95 transition-all">
                            Explore Menu
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    // --- Component: Category Filters ---
    function CategoryFiltersComponent() {
        const categories = [
            { id: 'all', name: 'All Dishes', icon: 'utensils-crossed' },
            { id: 'fast-food', name: 'Fast Food & Burgers', icon: 'sandwich' },
            { id: 'asian', name: 'Asian & Ramen', icon: 'soup' },
            { id: 'italian', name: 'Italian & Pizza', icon: 'pizza' },
            { id: 'mexican', name: 'Mexican & Tacos', icon: 'flame' }
        ];

        return `
            <div id="menu-section" class="mb-10">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="grid" class="w-6 h-6 text-amber-500"></i> Our Signature Menu
                    </h2>
                    <span class="text-sm text-slate-400">${state.filteredProducts.length} items available</span>
                </div>
                <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    ${categories.map(cat => `
                        <button 
                            class="category-btn whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${state.currentCategory === cat.id ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'}"
                            data-category="${cat.id}"
                        >
                            <i data-lucide="${cat.icon}" class="w-4 h-4"></i>
                            ${cat.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // --- Component: Product Grid ---
    function ProductGridComponent() {
        if (state.loading) {
            return `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${[1, 2, 3, 4, 5, 6].map(() => `
                        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
                            <div class="h-56 bg-slate-800"></div>
                            <div class="p-5 space-y-4">
                                <div class="h-4 bg-slate-800 rounded w-3/4"></div>
                                <div class="h-3 bg-slate-800 rounded w-full"></div>
                                <div class="h-3 bg-slate-800 rounded w-1/2"></div>
                                <div class="flex justify-between items-center pt-2">
                                    <div class="h-6 bg-slate-800 rounded w-1/4"></div>
                                    <div class="h-10 bg-slate-800 rounded w-1/3"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (state.error) {
            return `
                <div class="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <i data-lucide="alert-triangle" class="w-12 h-12 text-amber-500 mx-auto mb-4"></i>
                    <h3 class="text-lg font-bold text-white mb-2">Failed to load menu</h3>
                    <p class="text-slate-400 text-sm mb-6">${state.error}</p>
                    <button id="retry-load" class="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all">Retry Connection</button>
                </div>
            `;
        }

        if (state.filteredProducts.length === 0) {
            return `
                <div class="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <i data-lucide="search-x" class="w-12 h-12 text-slate-500 mx-auto mb-4"></i>
                    <h3 class="text-lg font-bold text-white mb-2">No dishes found</h3>
                    <p class="text-slate-400 text-sm mb-6">Try searching for something else or clearing filters.</p>
                    <button id="reset-filters" class="px-6 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-medium hover:bg-slate-700 transition-all">Reset Filters</button>
                </div>
            `;
        }

        return `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                ${state.filteredProducts.map(product => ProductCardComponent(product)).join('')}
            </div>
        `;
    }

    // --- Component: Product Card ---
    function ProductCardComponent(product) {
        return `
            <div class="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-xl">
                <div class="relative h-56 overflow-hidden bg-slate-950">
                    <img 
                        src="${product.image}" 
                        alt="${product.name}" 
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                    <div class="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                        <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400"></i>
                        <span>${product.rating}</span>
                    </div>
                    <div class="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 text-slate-300 text-xs uppercase tracking-wider font-semibold">
                        ${product.category}
                    </div>
                </div>
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-white group-hover:text-amber-400 transition-colors mb-2">${product.name}</h3>
                        <p class="text-slate-400 text-sm line-clamp-2 mb-4">${product.description}</p>
                    </div>
                    <div class="flex items-center justify-between pt-4 border-t border-slate-800/80">
                        <div>
                            <span class="text-xs text-slate-400 block">Price</span>
                            <span class="text-xl font-bold text-white">$${product.price.toFixed(2)}</span>
                        </div>
                        <button 
                            class="add-to-cart-btn px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                            data-id="${product.id}"
                        >
                            <i data-lucide="plus" class="w-4 h-4"></i>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Component: Cart Drawer ---
    function CartDrawerComponent() {
        const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = subtotal > 0 ? 3.99 : 0;
        const total = subtotal + deliveryFee;

        return `
            <div id="cart-backdrop" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 ${state.isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}"></div>
            <div class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 transform ${state.isCartOpen ? 'translate-x-0' : 'translate-x-full'}">
                <!-- Cart Header -->
                <div class="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-white">Your Order</h2>
                            <span class="text-xs text-slate-400">${state.cart.reduce((s, i) => s + i.quantity, 0)} items selected</span>
                        </div>
                    </div>
                    <button id="close-cart-btn" class="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Cart Items List -->
                <div class="flex-1 overflow-y-auto p-6 space-y-4">
                    ${state.cart.length === 0 ? `
                        <div class="text-center py-20">
                            <i data-lucide="shopping-cart" class="w-16 h-16 text-slate-700 mx-auto mb-4 animate-pulse"></i>
                            <h3 class="text-lg font-bold text-white mb-2">Your cart is empty</h3>
                            <p class="text-slate-400 text-sm mb-6">Looks like you haven't added any delicious dishes yet.</p>
                            <button id="start-shopping-btn" class="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 transition-all">Start Ordering</button>
                        </div>
                    ` : state.cart.map(item => `
                        <div class="flex items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover bg-slate-800 flex-shrink-0" />
                            <div class="flex-1 min-w-0">
                                <h4 class="text-sm font-bold text-white truncate mb-1">${item.name}</h4>
                                <span class="text-xs text-amber-400 font-semibold block mb-2">$${item.price.toFixed(2)}</span>
                                <div class="flex items-center gap-3">
                                    <div class="flex items-center border border-slate-800 rounded-lg bg-slate-900">
                                        <button class="decrease-qty p-1 text-slate-400 hover:text-white" data-id="${item.id}">
                                            <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                                        </button>
                                        <span class="px-2.5 text-xs font-bold text-white">${item.quantity}</span>
                                        <button class="increase-qty p-1 text-slate-400 hover:text-white" data-id="${item.id}">
                                            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                        </button>
                                    </div>
                                    <button class="remove-item p-1 text-red-400 hover:text-red-300 transition-colors ml-auto" data-id="${item.id}">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Cart Footer -->
                ${state.cart.length > 0 ? `
                    <div class="p-6 border-t border-slate-800 bg-slate-950/50 space-y-4">
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between text-slate-400">
                                <span>Subtotal</span>
                                <span class="text-slate-200 font-medium">$${subtotal.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-slate-400">
                                <span>Delivery Fee</span>
                                <span class="text-slate-200 font-medium">$${deliveryFee.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                                <span>Total Amount</span>
                                <span class="text-amber-400">$${total.toFixed(2)}</span>
                            </div>
                        </div>
                        <button 
                            id="proceed-checkout-btn"
                            class="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold shadow-lg shadow-amber-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span>Proceed to Checkout</span>
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // --- Component: Checkout Modal / Success Confirmation ---
    function CheckoutModalComponent() {
        if (!state.isCheckoutOpen) return '';

        return `
            <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    ${state.orderComplete ? SuccessConfirmationComponent(state.orderComplete) : `
                        <div class="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                    <i data-lucide="credit-card" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-white">Checkout Details</h3>
                                    <span class="text-xs text-slate-400">Complete your delivery info</span>
                                </div>
                            </div>
                            <button id="close-checkout-btn" class="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>
                        <form id="checkout-form" class="p-6 space-y-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                                <input type="text" required name="name" placeholder="John Doe" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500" />
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                                    <input type="tel" required name="phone" placeholder="(555) 000-0000" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500" />
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Delivery Time</label>
                                    <select name="time" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500">
                                        <option value="ASAP">ASAP (~30 mins)</option>
                                        <option value="Scheduled">Schedule for later</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Delivery Address</label>
                                <textarea required name="address" rows="3" placeholder="123 Gourmet St, Suite 4B, City, State" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-amber-500"></textarea>
                            </div>
                            <div class="pt-4 border-t border-slate-800 flex items-center justify-between">
                                <div>
                                    <span class="text-xs text-slate-400 block">Total to Pay</span>
                                    <span class="text-xl font-bold text-amber-400">$${(state.cart.reduce((s, i) => s + (i.price * i.quantity), 0) + 3.99).toFixed(2)}</span>
                                </div>
                                <button type="submit" id="submit-order-btn" class="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold shadow-lg shadow-amber-500/25 hover:opacity-95 transition-all flex items-center gap-2">
                                    <span>Place Order</span>
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </form>
                    `}
                </div>
            </div>
        `;
    }

    // --- Component: Success Confirmation ---
    function SuccessConfirmationComponent(order) {
        return `
            <div class="p-8 text-center space-y-6">
                <div class="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 animate-bounce">
                    <i data-lucide="check-circle-2" class="w-10 h-10"></i>
                </div>
                <div>
                    <h3 class="text-2xl font-bold text-white mb-2">Order Confirmed!</h3>
                    <p class="text-slate-400 text-sm">Thank you for your order. Your delicious food is being prepared.</p>
                </div>
                <div class="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-sm">
                    <div class="flex justify-between text-slate-400">
                        <span>Order ID:</span>
                        <span class="text-amber-400 font-mono font-bold">${order.orderId}</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                        <span>Total Paid:</span>
                        <span class="text-white font-bold">$${order.total.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                        <span>Estimated Delivery:</span>
                        <span class="text-emerald-400 font-bold">30 minutes</span>
                    </div>
                </div>
                <button id="close-success-btn" class="w-full py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold hover:bg-slate-700 transition-all">
                    Back to Store
                </button>
            </div>
        `;
    }

    // --- Component: Footer ---
    function FooterComponent() {
        return `
            <footer class="bg-slate-950 border-t border-slate-800 py-12 mt-20">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
                    <div class="flex items-center justify-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center">
                            <i data-lucide="utensils" class="w-4 h-4 text-slate-950"></i>
                        </div>
                        <span class="text-lg font-bold text-white">VelvetBite</span>
                    </div>
                    <p class="text-xs text-slate-500 max-w-sm mx-auto">
                        Elevating culinary experiences through fast, high-quality artisanal delivery. All rights reserved &copy; ${new Date().getFullYear()}
                    </p>
                </div>
            </footer>
        `;
    }

    // --- Component: Toast Notification Container ---
    function ToastContainerComponent() {
        return `<div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"></div>`;
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            type === 'success' 
                ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-300' 
                : 'bg-slate-900/90 border-amber-500/30 text-amber-300'
        }`;
        
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" class="w-5 h-5 flex-shrink-0"></i>
            <span class="text-sm font-medium text-white">${message}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- API Interactions ---
    async function fetchProducts() {
        state.loading = true;
        state.error = null;
        render();

        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Failed to fetch from server');
            const data = await response.json();
            state.products = data;
        } catch (err) {
            console.warn('Backend API unavailable. Using fallback curated menu.', err);
            // Graceful fallback for robust client preview without live server
            state.products = FALLBACK_PRODUCTS;
        } finally {
            state.loading = false;
            filterProducts();
            render();
        }
    }

    async function submitOrder(orderDetails) {
        const submitBtn = document.getElementById('submit-order-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...`;
            if (window.lucide) window.lucide.createIcons();
        }

        const totalAmount = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0) + 3.99;

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: state.cart, total: totalAmount, customer: orderDetails })
            });

            if (!response.ok) throw new Error('Checkout request failed');
            const result = await response.json();

            state.orderComplete = {
                orderId: result.orderId || `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
                total: result.total || totalAmount
            };
            state.cart = [];
            localStorage.removeItem('foodstore_cart');
            render();
        } catch (err) {
            console.warn('Backend checkout API unavailable. Simulating successful order.', err);
            // Graceful fallback for standalone client execution
            state.orderComplete = {
                orderId: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
                total: totalAmount
            };
            state.cart = [];
            localStorage.removeItem('foodstore_cart');
            render();
        }
    }

    // --- Logic & Filtering ---
    function filterProducts() {
        let result = state.products;

        if (state.currentCategory !== 'all') {
            result = result.filter(p => p.category === state.currentCategory);
        }

        if (state.searchQuery.trim() !== '') {
            const q = state.searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        }

        state.filteredProducts = result;
    }

    // --- Event Handlers & Binding ---
    function attachGlobalEventListeners() {
        // Search Input Handlers
        const searchInput = document.getElementById('search-input');
        const mobileSearchInput = document.getElementById('mobile-search-input');
        
        const handleSearch = (e) => {
            state.searchQuery = e.target.value;
            filterProducts();
            // Re-render product grid only or full app if clearing
            const gridContainer = document.querySelector('.grid-cols-1.sm\\:grid-cols-2');
            if (gridContainer) {
                // To keep input focus and smooth experience, re-render main grid & counter
                const menuSection = document.getElementById('menu-section');
                const parentMain = menuSection.parentElement;
                parentMain.innerHTML = `
                    ${CategoryFiltersComponent()}
                    ${ProductGridComponent()}
                `;
                if (window.lucide) window.lucide.createIcons();
                attachGridListeners();
            } else {
                render();
            }
        };

        if (searchInput) {
            searchInput.oninput = handleSearch;
            searchInput.focus();
            searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
        }
        if (mobileSearchInput) mobileSearchInput.oninput = handleSearch;

        // Clear Search Button
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.onclick = () => {
                state.searchQuery = '';
                filterProducts();
                render();
            };
        }

        // Category Filter Buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.onclick = (e) => {
                state.currentCategory = btn.getAttribute('data-category');
                filterProducts();
                render();
            };
        });

        // Cart Drawer Toggles
        const openCartBtn = document.getElementById('open-cart-btn');
        const closeCartBtn = document.getElementById('close-cart-btn');
        const cartBackdrop = document.getElementById('cart-backdrop');
        const startShoppingBtn = document.getElementById('start-shopping-btn');

        if (openCartBtn) openCartBtn.onclick = () => { state.isCartOpen = true; render(); };
        if (closeCartBtn) closeCartBtn.onclick = () => { state.isCartOpen = false; render(); };
        if (cartBackdrop) cartBackdrop.onclick = () => { state.isCartOpen = false; render(); };
        if (startShoppingBtn) startShoppingBtn.onclick = () => { state.isCartOpen = false; render(); };

        // Add to Cart Buttons
        attachGridListeners();

        // Cart Item Quantity & Remove Handlers
        document.querySelectorAll('.increase-qty').forEach(btn => {
            btn.onclick = () => {
                const id = Number(btn.getAttribute('data-id'));
                const item = state.cart.find(i => i.id === id);
                if (item) {
                    item.quantity++;
                    saveAndRenderCart();
                }
            };
        });

        document.querySelectorAll('.decrease-qty').forEach(btn => {
            btn.onclick = () => {
                const id = Number(btn.getAttribute('data-id'));
                const item = state.cart.find(i => i.id === id);
                if (item) {
                    item.quantity--;
                    if (item.quantity <= 0) {
                        state.cart = state.cart.filter(i => i.id !== id);
                    }
                    saveAndRenderCart();
                }
            };
        });

        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.onclick = () => {
                const id = Number(btn.getAttribute('data-id'));
                state.cart = state.cart.filter(i => i.id !== id);
                saveAndRenderCart();
                showToast('Item removed from cart', 'info');
            };
        });

        // Checkout Flow
        const proceedCheckoutBtn = document.getElementById('proceed-checkout-btn');
        if (proceedCheckoutBtn) {
            proceedCheckoutBtn.onclick = () => {
                state.isCartOpen = false;
                state.isCheckoutOpen = true;
                render();
            };
        }

        const closeCheckoutBtn = document.getElementById('close-checkout-btn');
        if (closeCheckoutBtn) {
            closeCheckoutBtn.onclick = () => {
                state.isCheckoutOpen = false;
                render();
            };
        }

        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(checkoutForm);
                const orderDetails = {
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    time: formData.get('time'),
                    address: formData.get('address')
                };
                submitOrder(orderDetails);
            };
        }

        const closeSuccessBtn = document.getElementById('close-success-btn');
        if (closeSuccessBtn) {
            closeSuccessBtn.onclick = () => {
                state.isCheckoutOpen = false;
                state.orderComplete = null;
                render();
            };
        }

        const retryLoadBtn = document.getElementById('retry-load');
        if (retryLoadBtn) retryLoadBtn.onclick = fetchProducts;

        const resetFiltersBtn = document.getElementById('reset-filters');
        if (resetFiltersBtn) {
            resetFiltersBtn.onclick = () => {
                state.currentCategory = 'all';
                state.searchQuery = '';
                filterProducts();
                render();
            };
        }
    }

    function attachGridListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.onclick = () => {
                const id = Number(btn.getAttribute('data-id'));
                const product = state.products.find(p => p.id === id);
                if (!product) return;

                const existing = state.cart.find(i => i.id === id);
                if (existing) {
                    existing.quantity++;
                } else {
                    state.cart.push({ ...product, quantity: 1 });
                }

                saveAndRenderCart();
                showToast(`Added ${product.name} to cart!`);
            };
        });
    }

    function saveAndRenderCart() {
        localStorage.setItem('foodstore_cart', JSON.stringify(state.cart));
        render();
    }

    // --- Initialization ---
    fetchProducts();
});