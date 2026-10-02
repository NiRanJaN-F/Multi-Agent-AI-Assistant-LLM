/**
 * App.js - Principal Frontend Architecture & UI/UX Implementation
 * Component Tree: [App, Navbar, ProductCatalog, ProductCard, CartDrawer, CartItem, CheckoutModal, OrderConfirmation]
 */

document.addEventListener('DOMContentLoaded', () => {
    // Application State Store
    const state = {
        products: [],
        filteredProducts: [],
        cart: { items: [], total: 0 },
        activeCategory: 'All',
        searchQuery: '',
        isCartOpen: false,
        isCheckoutOpen: false,
        isOrderSuccess: false,
        lastOrder: null,
        loading: true,
        toastMessage: null
    };

    // DOM Element References (Cached)
    const elements = {
        navbar: document.getElementById('navbar'),
        searchBar: document.getElementById('search-bar'),
        cartBtn: document.getElementById('cart-btn'),
        cartBadge: document.getElementById('cart-badge'),
        catalog: document.getElementById('product-catalog'),
        categoryFilters: document.getElementById('category-filters'),
        cartDrawer: document.getElementById('cart-drawer'),
        cartBackdrop: document.getElementById('cart-backdrop'),
        cartCloseBtn: document.getElementById('cart-close-btn'),
        cartItemsContainer: document.getElementById('cart-items-container'),
        cartFooter: document.getElementById('cart-footer'),
        cartTotalEl: document.getElementById('cart-total'),
        checkoutBtn: document.getElementById('checkout-btn'),
        checkoutModal: document.getElementById('checkout-modal'),
        checkoutForm: document.getElementById('checkout-form'),
        checkoutCloseBtn: document.getElementById('checkout-close-btn'),
        checkoutTotal: document.getElementById('checkout-total'),
        orderConfirmationModal: document.getElementById('order-confirmation-modal'),
        orderIdEl: document.getElementById('order-id'),
        orderTotalEl: document.getElementById('order-total'),
        continueShoppingBtn: document.getElementById('continue-shopping-btn'),
        toastContainer: document.getElementById('toast-container')
    };

    // Initialize Application
    async function init() {
        renderSkeletonLoader();
        setupEventListeners();
        await fetchInitialData();
        refreshUI();
    }

    // Event Listeners Configuration
    function setupEventListeners() {
        // Search & Filter
        if (elements.searchBar) {
            elements.searchBar.addEventListener('input', (e) => {
                state.searchQuery = e.target.value.toLowerCase().trim();
                filterProducts();
                renderCatalog();
            });
        }

        // Cart Drawer Toggles
        if (elements.cartBtn) elements.cartBtn.addEventListener('click', () => toggleCart(true));
        if (elements.cartCloseBtn) elements.cartCloseBtn.addEventListener('click', () => toggleCart(false));
        if (elements.cartBackdrop) elements.cartBackdrop.addEventListener('click', () => toggleCart(false));

        // Checkout Modal Toggles
        if (elements.checkoutBtn) {
            elements.checkoutBtn.addEventListener('click', () => {
                if (state.cart.items.length === 0) {
                    showToast('Your cart is empty', 'error');
                    return;
                }
                toggleCart(false);
                toggleCheckout(true);
            });
        }

        if (elements.checkoutCloseBtn) {
            elements.checkoutCloseBtn.addEventListener('click', () => toggleCheckout(false));
        }

        // Checkout Form Submission
        if (elements.checkoutForm) {
            elements.checkoutForm.addEventListener('submit', handleCheckoutSubmit);
        }

        // Continue Shopping / Reset Order
        if (elements.continueShoppingBtn) {
            elements.continueShoppingBtn.addEventListener('click', () => {
                elements.orderConfirmationModal.classList.add('hidden');
                state.isOrderSuccess = false;
                refreshUI();
            });
        }

        // Global Event Delegation for Product Catalog & Cart Actions
        document.addEventListener('click', (e) => {
            // Add to Cart from Product Card
            const addBtn = e.target.closest('.add-to-cart-btn');
            if (addBtn) {
                const productId = parseInt(addBtn.dataset.productId, 10);
                handleAddToCart(productId);
            }

            // Category Filter Buttons
            const catBtn = e.target.closest('.category-filter-btn');
            if (catBtn) {
                const category = catBtn.dataset.category;
                state.activeCategory = category;
                document.querySelectorAll('.category-filter-btn').forEach(b => {
                    b.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
                    b.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
                });
                catBtn.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
                catBtn.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
                filterProducts();
                renderCatalog();
            }

            // Remove Item from Cart
            const removeBtn = e.target.closest('.remove-cart-item-btn');
            if (removeBtn) {
                const productId = parseInt(removeBtn.dataset.productId, 10);
                handleRemoveFromCart(productId);
            }
        });
    }

    // API Data Fetching & State Synchronization
    async function fetchInitialData() {
        try {
            const [productsRes, cartRes] = await Promise.all([
                API.getProducts(),
                API.getCart()
            ]);

            state.products = productsRes || [];
            state.filteredProducts = [...state.products];
            state.cart = cartRes || { items: [], total: 0 };
            state.loading = false;
        } catch (error) {
            console.error('Initialization error:', error);
            showToast('Failed to load store data. Please check connection.', 'error');
            state.loading = false;
        }
    }

    // Business Logic: Filtering
    function filterProducts() {
        state.filteredProducts = state.products.filter(product => {
            const matchesCategory = state.activeCategory === 'All' || product.category === state.activeCategory;
            const matchesSearch = product.name.toLowerCase().includes(state.searchQuery) ||
                                  (product.description && product.description.toLowerCase().includes(state.searchQuery));
            return matchesCategory && matchesSearch;
        });
    }

    // Cart Actions
    async function handleAddToCart(productId) {
        try {
            // Optimistic update or call backend API
            const updatedCart = await API.addToCart(productId, 1);
            if (updatedCart) {
                state.cart = updatedCart;
                refreshUI();
                showToast('Item added to cart successfully!', 'success');
            }
        } catch (error) {
            console.error('Add to cart failed:', error);
            showToast('Could not add item to cart', 'error');
        }
    }

    async function handleRemoveFromCart(productId) {
        try {
            const updatedCart = await API.removeFromCart(productId);
            if (updatedCart) {
                state.cart = updatedCart;
                refreshUI();
                showToast('Item removed from cart', 'info');
            }
        } catch (error) {
            console.error('Remove from cart failed:', error);
            showToast('Could not remove item', 'error');
        }
    }

    // Checkout Flow
    async function handleCheckoutSubmit(e) {
        e.preventDefault();
        const formData = new FormData(elements.checkoutForm);
        const customerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            address: formData.get('address'),
            paymentMethod: formData.get('payment')
        };

        try {
            const result = await API.checkout(customerData);
            if (result && result.success) {
                state.lastOrder = result;
                state.cart = { items: [], total: 0 }; // Clear cart state locally
                toggleCheckout(false);
                elements.checkoutForm.reset();
                showOrderConfirmation(result);
                refreshUI();
            } else {
                showToast('Checkout failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            showToast('An error occurred during checkout', 'error');
        }
    }

    // UI Renderers & Refreshers
    function refreshUI() {
        renderNavbarBadge();
        renderCatalog();
        renderCartDrawer();
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function renderNavbarBadge() {
        const totalItems = state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        if (elements.cartBadge) {
            if (totalItems > 0) {
                elements.cartBadge.textContent = totalItems;
                elements.cartBadge.classList.remove('hidden');
            } else {
                elements.cartBadge.classList.add('hidden');
            }
        }
    }

    function renderSkeletonLoader() {
        if (!elements.catalog) return;
        let skeletons = '';
        for (let i = 0; i < 6; i++) {
            skeletons += `
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                    <div class="w-full h-56 bg-gray-200 rounded-xl mb-4"></div>
                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div class="flex justify-between items-center">
                        <div class="h-6 bg-gray-200 rounded w-1/4"></div>
                        <div class="h-10 bg-gray-200 rounded-xl w-1/3"></div>
                    </div>
                </div>
            `;
        }
        elements.catalog.innerHTML = skeletons;
    }

    function renderCatalog() {
        if (!elements.catalog) return;

        if (state.loading) {
            renderSkeletonLoader();
            return;
        }

        if (state.filteredProducts.length === 0) {
            elements.catalog.innerHTML = `
                <div class="col-span-full py-16 text-center">
                    <div class="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                        <i data-lucide="search-x" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800">No products found</h3>
                    <p class="text-gray-500 text-sm mt-1">Try adjusting your search or category filter.</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        elements.catalog.innerHTML = state.filteredProducts.map(product => {
            return `
                <div class="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div class="relative w-full h-56 bg-gray-50 rounded-xl overflow-hidden mb-4">
                            <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" loading="lazy">
                            <span class="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-gray-800 shadow-sm">
                                ${product.category || 'General'}
                            </span>
                        </div>
                        <h3 class="font-semibold text-gray-800 text-lg line-clamp-1 group-hover:text-indigo-600 transition-colors">${product.name}</h3>
                        <p class="text-gray-500 text-sm mt-1 line-clamp-2">${product.description || 'Experience ultimate design and supreme quality with our premier curated item.'}</p>
                    </div>
                    <div class="mt-6 flex items-center justify-between">
                        <div>
                            <span class="text-xs text-gray-400 block font-medium">Price</span>
                            <span class="text-xl font-bold text-gray-900">$${Number(product.price).toFixed(2)}</span>
                        </div>
                        <button data-product-id="${product.id}" class="add-to-cart-btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 active:scale-95 flex items-center gap-2">
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                            <span>Add</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    function renderCartDrawer() {
        if (!elements.cartItemsContainer) return;

        if (!state.cart.items || state.cart.items.length === 0) {
            elements.cartItemsContainer.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center py-12">
                    <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                        <i data-lucide="shopping-cart" class="w-8 h-8"></i>
                    </div>
                    <h4 class="font-semibold text-gray-800 text-base">Your cart is empty</h4>
                    <p class="text-gray-500 text-sm mt-1 max-w-xs">Discover our collection and add items to your cart to get started.</p>
                </div>
            `;
            elements.cartFooter.classList.add('hidden');
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        elements.cartFooter.classList.remove('hidden');
        elements.cartTotalEl.textContent = `$${Number(state.cart.total || 0).toFixed(2)}`;

        // Map cart items against state.products to get detailed view properties
        elements.cartItemsContainer.innerHTML = state.cart.items.map(cartItem => {
            const product = state.products.find(p => p.id === cartItem.productId) || {
                name: 'Unknown Product',
                price: 0,
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'
            };

            return `
                <div class="flex gap-4 items-center bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
                    <img src="${product.image}" alt="${product.name}" class="w-20 h-20 object-cover rounded-xl bg-white flex-shrink-0">
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-gray-800 text-sm truncate">${product.name}</h4>
                        <p class="text-gray-500 text-xs mt-0.5">Qty: ${cartItem.quantity}</p>
                        <p class="font-bold text-gray-900 text-sm mt-1">$${(product.price * cartItem.quantity).toFixed(2)}</p>
                    </div>
                    <button data-product-id="${cartItem.productId}" class="remove-cart-item-btn p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    // Modal Visibility Controllers
    function toggleCart(open) {
        state.isCartOpen = open;
        if (open) {
            elements.cartDrawer.classList.remove('translate-x-full');
            elements.cartBackdrop.classList.remove('hidden');
            setTimeout(() => elements.cartBackdrop.classList.remove('opacity-0'), 10);
            renderCartDrawer();
        } else {
            elements.cartDrawer.classList.add('translate-x-full');
            elements.cartBackdrop.classList.add('opacity-0');
            setTimeout(() => elements.cartBackdrop.classList.add('hidden'), 300);
        }
    }

    function toggleCheckout(open) {
        state.isCheckoutOpen = open;
        if (open) {
            elements.checkoutTotal.textContent = `$${Number(state.cart.total || 0).toFixed(2)}`;
            elements.checkoutModal.classList.remove('hidden');
            setTimeout(() => {
                elements.checkoutModal.querySelector('.modal-content')?.classList.remove('scale-95', 'opacity-0');
            }, 10);
        } else {
            elements.checkoutModal.classList.add('hidden');
        }
    }

    function showOrderConfirmation(orderData) {
        if (elements.orderIdEl) elements.orderIdEl.textContent = orderData.orderId || 'ORD-89234';
        if (elements.orderTotalEl) elements.orderTotalEl.textContent = `$${Number(orderData.total || 0).toFixed(2)}`;
        elements.orderConfirmationModal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
    }

    // Toast Notification System
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        let bgClass = 'bg-gray-900 text-white';
        let iconName = 'check-circle';

        if (type === 'error') {
            bgClass = 'bg-red-600 text-white';
            iconName = 'alert-circle';
        } else if (type === 'info') {
            bgClass = 'bg-indigo-600 text-white';
            iconName = 'info';
        }

        toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${bgClass} text-sm font-medium transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto`;
        toast.innerHTML = `
            <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
            <span>${message}</span>
        `;

        elements.toastContainer.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        // Animate In
        setTimeout(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        }, 10);

        // Animate Out & Remove
        setTimeout(() => {
            toast.classList.add('translate-y-4', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // Boot execution
    init();
});