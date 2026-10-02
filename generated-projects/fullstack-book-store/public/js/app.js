/**
 * Bookstore Application - Client-Side Controller
 * Principal Frontend Architecture & UI/UX Design Implementation
 * 
 * Component Tree mapping:
 * - StoreApp (Global State & Orchestrator)
 * - Header (Navbar, Search, Cart Trigger, Theme Toggle)
 * - ProductCatalog (Grid container, filter hooks)
 * - ProductCard (Individual interactive book card)
 * - CartDrawer (Slide-over panel for cart management)
 * - CartItem (Line item inside cart)
 * - CheckoutModal (Multi-step or clean checkout dialog)
 * - OrderConfirmation (Success receipt state)
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // --- MOCK DATA FALLBACK & INITIAL STATE ---
    const FALLBACK_PRODUCTS = [
        {
            id: 1,
            title: "The Architecture of Happiness",
            author: "Alain de Botton",
            price: 24.99,
            category: "Philosophy",
            rating: 4.8,
            image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800",
            description: "A sparkling and immensely stimulating exploration of our built environment and its profound influence on our moods and identity."
        },
        {
            id: 2,
            title: "Designing Data-Intensive Applications",
            author: "Martin Kleppmann",
            price: 49.99,
            category: "Technology",
            rating: 4.9,
            image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800",
            description: "Working data systems and core architectural principles for reliable, scalable, and maintainable enterprise applications."
        },
        {
            id: 3,
            title: "Atomic Habits",
            author: "James Clear",
            price: 18.50,
            category: "Self-Help",
            rating: 4.9,
            image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
            description: "No matter your goals, Atomic Habits offers a proven framework for improving every single day."
        },
        {
            id: 4,
            title: "Dune",
            author: "Frank Herbert",
            price: 21.00,
            category: "Sci-Fi",
            rating: 4.7,
            image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800",
            description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, who would become the mysterious man known as Muad'Dib."
        },
        {
            id: 5,
            title: "Clean Code",
            author: "Robert C. Martin",
            price: 42.00,
            category: "Technology",
            rating: 4.6,
            image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
            description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees."
        },
        {
            id: 6,
            title: "Thinking, Fast and Slow",
            author: "Daniel Kahneman",
            price: 19.99,
            category: "Psychology",
            rating: 4.8,
            image: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&q=80&w=800",
            description: "Major laureate takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think."
        },
        {
            id: 7,
            title: "Sapiens: A Brief History of Humankind",
            author: "Yuval Noah Harari",
            price: 22.50,
            category: "History",
            rating: 4.9,
            image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800",
            description: "From a notable historian comes a gripping narrative of human creation and evolution, exploring how we shaped the world."
        },
        {
            id: 8,
            title: "The Pragmatic Programmer",
            author: "Andrew Hunt & David Thomas",
            price: 45.00,
            category: "Technology",
            rating: 4.9,
            image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800",
            description: "Straight from the programming trenches, this comprehensive guide illuminates the best practices and major pitfalls of coding."
        }
    ];

    // --- APPLICATION STATE ---
    const state = {
        products: FALLBACK_PRODUCTS,
        cart: { items: [], total: 0 },
        searchQuery: '',
        selectedCategory: 'All',
        isCartOpen: false,
        isCheckoutOpen: false,
        lastOrder: null,
        loading: false,
        toastMessage: null,
        darkMode: localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    };

    // Expose state globally for testing or cross-file access
    window.StoreApp = {
        getState: () => state,
        setState: (newState) => {
            Object.assign(state, newState);
            render();
        }
    };

    // --- DOM ELEMENT REFERENCES ---
    const elements = {
        app: document.getElementById('app'),
        searchBar: document.getElementById('search-bar'),
        categoryFilters: document.getElementById('category-filters'),
        productGrid: document.getElementById('product-grid'),
        cartToggle: document.getElementById('cart-toggle'),
        cartBadge: document.getElementById('cart-badge'),
        cartDrawer: document.getElementById('cart-drawer'),
        cartBackdrop: document.getElementById('cart-backdrop'),
        closeCart: document.getElementById('close-cart'),
        cartItemsContainer: document.getElementById('cart-items'),
        cartTotal: document.getElementById('cart-total'),
        checkoutBtn: document.getElementById('checkout-btn'),
        checkoutModal: document.getElementById('checkout-modal'),
        closeModal: document.getElementById('close-modal'),
        checkoutForm: document.getElementById('checkout-form'),
        orderSuccess: document.getElementById('order-success'),
        closeSuccess: document.getElementById('close-success'),
        themeToggle: document.getElementById('theme-toggle'),
        toast: document.getElementById('toast')
    };

    // --- THEME MANAGER ---
    function initTheme() {
        applyTheme(state.darkMode);
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }
    }

    function applyTheme(isDark) {
        state.darkMode = isDark;
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            if (elements.themeToggle) {
                elements.themeToggle.innerHTML = '<i data-lucide="sun" class="w-5 h-5 text-amber-400"></i>';
            }
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            if (elements.themeToggle) {
                elements.themeToggle.innerHTML = '<i data-lucide="moon" class="w-5 h-5 text-slate-700 dark:text-slate-200"></i>';
            }
        }
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function toggleTheme() {
        applyTheme(!state.darkMode);
    }

    // --- TOAST NOTIFICATIONS ---
    function showToast(message) {
        state.toastMessage = message;
        if (!elements.toast) return;
        
        elements.toast.textContent = message;
        elements.toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
        elements.toast.classList.add('translate-y-0', 'opacity-100');

        setTimeout(() => {
            elements.toast.classList.remove('translate-y-0', 'opacity-100');
            elements.toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
            state.toastMessage = null;
        }, 3000);
    }

    // --- CART LOGIC ---
    function addToCart(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = state.cart.items.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            state.cart.items.push({ ...product, quantity: 1 });
        }

        updateCartTotals();
        renderCart();
        showToast(`Added "${product.title}" to cart`);
    }

    function updateQuantity(productId, delta) {
        const itemIndex = state.cart.items.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            state.cart.items[itemIndex].quantity += delta;
            if (state.cart.items[itemIndex].quantity <= 0) {
                state.cart.items.splice(itemIndex, 1);
            }
        }
        updateCartTotals();
        renderCart();
    }

    function updateCartTotals() {
        state.cart.total = state.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalItemsCount = state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

        if (elements.cartBadge) {
            elements.cartBadge.textContent = totalItemsCount;
            if (totalItemsCount > 0) {
                elements.cartBadge.classList.remove('hidden');
            } else {
                elements.cartBadge.classList.add('hidden');
            }
        }

        if (elements.cartTotal) {
            elements.cartTotal.textContent = `$${state.cart.total.toFixed(2)}`;
        }
    }

    // --- RENDERING UI ---
    function render() {
        renderProducts();
        renderCart();
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function renderProducts() {
        if (!elements.productGrid) return;

        const filtered = state.products.filter(product => {
            const matchesSearch = product.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                                  product.author.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                                  product.category.toLowerCase().includes(state.searchQuery.toLowerCase());
            const matchesCategory = state.selectedCategory === 'All' || product.category === state.selectedCategory;
            return matchesSearch && matchesCategory;
        });

        if (filtered.length === 0) {
            elements.productGrid.innerHTML = `
                <div class="col-span-full py-16 text-center">
                    <i data-lucide="book-x" class="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4"></i>
                    <h3 class="text-lg font-medium text-slate-700 dark:text-slate-300">No books found</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or filter criteria.</p>
                </div>
            `;
            return;
        }

        elements.productGrid.innerHTML = filtered.map(product => `
            <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
                <div class="relative h-64 bg-slate-100 dark:bg-slate-900 overflow-hidden group">
                    <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    <span class="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-200">
                        ${product.category}
                    </span>
                </div>
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs text-slate-500 dark:text-slate-400">${product.author}</span>
                            <div class="flex items-center text-amber-500 text-xs font-medium">
                                <i data-lucide="star" class="w-3.5 h-3.5 fill-current mr-1"></i>
                                ${product.rating}
                            </div>
                        </div>
                        <h3 class="font-semibold text-slate-800 dark:text-slate-100 mb-2 line-clamp-1" title="${product.title}">${product.title}</h3>
                        <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">${product.description}</p>
                    </div>
                    <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                        <span class="font-bold text-lg text-slate-900 dark:text-white">$${product.price.toFixed(2)}</span>
                        <button onclick="window.StoreApp.addToCart(${product.id})" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm">
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderCart() {
        if (!elements.cartItemsContainer) return;

        if (state.cart.items.length === 0) {
            elements.cartItemsContainer.innerHTML = `
                <div class="py-12 text-center">
                    <i data-lucide="shopping-cart" class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3"></i>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">Your cart is empty</p>
                </div>
            `;
            return;
        }

        elements.cartItemsContainer.innerHTML = state.cart.items.map(item => `
            <div class="flex items-center space-x-4 py-4 border-b border-slate-100 dark:border-slate-700">
                <img src="${item.image}" alt="${item.title}" class="w-16 h-20 object-cover rounded-md bg-slate-100 dark:bg-slate-900 flex-shrink-0">
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">${item.title}</h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400">$${item.price.toFixed(2)}</p>
                    <div class="flex items-center space-x-2 mt-2">
                        <button onclick="window.StoreApp.updateQuantity(${item.id}, -1)" class="w-6 h-6 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                            -
                        </button>
                        <span class="text-xs font-semibold text-slate-700 dark:text-slate-200 w-4 text-center">${item.quantity}</span>
                        <button onclick="window.StoreApp.updateQuantity(${item.id}, 1)" class="w-6 h-6 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                            +
                        </button>
                    </div>
                </div>
                <button onclick="window.StoreApp.updateQuantity(${item.id}, -${item.quantity})" class="text-slate-400 hover:text-red-500 transition-colors p-1">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');
    }

    // --- EVENT LISTENERS & SETUP ---
    function setupEventListeners() {
        // Search bar input
        if (elements.searchBar) {
            elements.searchBar.addEventListener('input', (e) => {
                state.searchQuery = e.target.value;
                renderProducts();
            });
        }

        // Category filters
        if (elements.categoryFilters) {
            elements.categoryFilters.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-category]');
                if (!btn) return;

                elements.categoryFilters.querySelectorAll('button').forEach(b => {
                    b.classList.remove('bg-indigo-600', 'text-white');
                    b.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300', 'border', 'border-slate-200', 'dark:border-slate-700');
                });

                btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300', 'border', 'border-slate-200', 'dark:border-slate-700');
                btn.classList.add('bg-indigo-600', 'text-white');

                state.selectedCategory = btn.getAttribute('data-category');
                renderProducts();
            });
        }

        // Cart Drawer Toggles
        const toggleCartDrawer = (open) => {
            state.isCartOpen = open;
            if (!elements.cartDrawer || !elements.cartBackdrop) return;
            if (open) {
                elements.cartDrawer.classList.remove('translate-x-full');
                elements.cartBackdrop.classList.remove('opacity-0', 'pointer-events-none');
                elements.cartBackdrop.classList.add('opacity-100');
            } else {
                elements.cartDrawer.classList.add('translate-x-full');
                elements.cartBackdrop.classList.remove('opacity-100');
                elements.cartBackdrop.classList.add('opacity-0', 'pointer-events-none');
            }
        };

        if (elements.cartToggle) elements.cartToggle.addEventListener('click', () => toggleCartDrawer(true));
        if (elements.closeCart) elements.closeCart.addEventListener('click', () => toggleCartDrawer(false));
        if (elements.cartBackdrop) elements.cartBackdrop.addEventListener('click', () => toggleCartDrawer(false));

        // Checkout Modal Toggles
        if (elements.checkoutBtn) {
            elements.checkoutBtn.addEventListener('click', () => {
                if (state.cart.items.length === 0) {
                    showToast('Your cart is empty');
                    return;
                }
                toggleCartDrawer(false);
                if (elements.checkoutModal) {
                    elements.checkoutModal.classList.remove('hidden');
                    elements.checkoutModal.classList.add('flex');
                }
            });
        }

        if (elements.closeModal) {
            elements.closeModal.addEventListener('click', () => {
                if (elements.checkoutModal) {
                    elements.checkoutModal.classList.remove('flex');
                    elements.checkoutModal.classList.add('hidden');
                }
            });
        }

        // Checkout Form Submit
        if (elements.checkoutForm) {
            elements.checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(elements.checkoutForm);
                state.lastOrder = {
                    id: Math.floor(100000 + Math.random() * 900000),
                    name: formData.get('name'),
                    email: formData.get('email'),
                    total: state.cart.total,
                    items: [...state.cart.items]
                };

                // Clear cart
                state.cart.items = [];
                updateCartTotals();

                if (elements.checkoutModal) {
                    elements.checkoutModal.classList.remove('flex');
                    elements.checkoutModal.classList.add('hidden');
                }

                if (elements.orderSuccess) {
                    const orderIdEl = document.getElementById('order-id');
                    if (orderIdEl) orderIdEl.textContent = `#${state.lastOrder.id}`;
                    elements.orderSuccess.classList.remove('hidden');
                    elements.orderSuccess.classList.add('flex');
                }
                elements.checkoutForm.reset();
            });
        }

        if (elements.closeSuccess) {
            elements.closeSuccess.addEventListener('click', () => {
                if (elements.orderSuccess) {
                    elements.orderSuccess.classList.remove('flex');
                    elements.orderSuccess.classList.add('hidden');
                }
                render();
            });
        }
    }

    // Attach actions to window for inline HTML handlers
    window.StoreApp.addToCart = addToCart;
    window.StoreApp.updateQuantity = updateQuantity;

    // --- INITIALIZATION ---
    initTheme();
    setupEventListeners();
    render();
});