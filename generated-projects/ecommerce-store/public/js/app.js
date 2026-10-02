/**
 * AETHER & CO. - E-Commerce Frontend Architecture
 * public/js/app.js
 * 
 * Component Tree Orchestration:
 * [App] -> [Navbar, ProductCatalog ([ProductCard]), CartDrawer ([CartItem]), CheckoutModal, OrderConfirmation]
 */

document.addEventListener('DOMContentLoaded', () => {
    // Application State Store
    const state = {
        products: [],
        filteredProducts: [],
        cart: JSON.parse(localStorage.getItem('aether_cart')) || [],
        searchQuery: '',
        selectedCategory: 'all',
        isCartOpen: false,
        isCheckoutOpen: false,
        lastOrder: null,
        loading: true,
        error: null
    };

    // DOM Elements Cache
    const DOM = {
        productGrid: document.getElementById('product-grid'),
        searchInput: document.getElementById('search-input'),
        categoryFilters: document.getElementById('category-filters'),
        cartToggleBtn: document.getElementById('cart-toggle-btn'),
        cartBadge: document.getElementById('cart-badge'),
        cartDrawer: document.getElementById('cart-drawer'),
        cartOverlay: document.getElementById('cart-overlay'),
        closeCartBtn: document.getElementById('close-cart-btn'),
        cartItemsContainer: document.getElementById('cart-items-container'),
        cartSubtotal: document.getElementById('cart-subtotal'),
        cartTax: document.getElementById('cart-tax'),
        cartTotal: document.getElementById('cart-total'),
        checkoutBtn: document.getElementById('checkout-btn'),
        checkoutModal: document.getElementById('checkout-modal'),
        closeCheckoutBtn: document.getElementById('close-checkout-btn'),
        checkoutForm: document.getElementById('checkout-form'),
        checkoutTotalDisplay: document.getElementById('checkout-total-display'),
        orderConfirmationModal: document.getElementById('order-confirmation-modal'),
        orderIdDisplay: document.getElementById('order-id-display'),
        orderTotalDisplay: document.getElementById('order-total-display'),
        closeConfirmationBtn: document.getElementById('close-confirmation-btn'),
        toastContainer: document.getElementById('toast-container'),
        yearSpan: document.getElementById('current-year')
    };

    // Fallback Rich Mock Data if API fails or empty
    const fallbackProducts = [
        {
            id: 1,
            name: "Aether Chronograph Mk. I",
            price: 299.00,
            category: "Watches",
            rating: 4.9,
            reviewsCount: 128,
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
            description: "Minimalist matte black timepiece featuring sapphire crystal glass, Japanese automatic movement, and genuine Tuscan leather strap."
        },
        {
            id: 2,
            name: "Nomad Leather Rucksack",
            price: 185.50,
            category: "Accessories",
            rating: 4.8,
            reviewsCount: 94,
            image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800",
            description: "Handcrafted full-grain leather backpack built for daily commuters and weekend explorers. Includes padded 15-inch laptop sleeve."
        },
        {
            id: 3,
            name: "SonicWave Wireless ANC Headphones",
            price: 249.99,
            category: "Audio",
            rating: 4.7,
            reviewsCount: 215,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
            description: "Immersive active noise-canceling headphones with 40-hour battery life, high-res acoustic drivers, and cloud-soft memory foam earcups."
        },
        {
            id: 4,
            name: "Lumina Ceramic Pour-Over Set",
            price: 68.00,
            category: "Home",
            rating: 4.9,
            reviewsCount: 62,
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
            description: "Architectural matte white ceramic coffee dripper and server designed for pristine extraction and morning rituals."
        },
        {
            id: 5,
            name: "Apex Polarized Aviator Sunglasses",
            price: 140.00,
            category: "Accessories",
            rating: 4.6,
            reviewsCount: 81,
            image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800",
            description: "Ultra-lightweight titanium frames with anti-glare polarized lenses offering 100% UV400 protection."
        },
        {
            id: 6,
            name: "Kinetics Ergonomic Desk Lamp",
            price: 115.00,
            category: "Home",
            rating: 4.8,
            reviewsCount: 45,
            image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800",
            description: "Dimmable LED task light with adjustable color temperature, wireless phone charging base, and touch-sensitive fluid controls."
        },
        {
            id: 7,
            name: "Vortex Bluetooth Mechanical Keyboard",
            price: 159.99,
            category: "Audio", // grouped as tech
            rating: 4.9,
            reviewsCount: 310,
            image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800",
            description: "Compact 75% layout mechanical keyboard with hot-swappable tactile switches, RGB backlighting, and multi-device Bluetooth pairing."
        },
        {
            id: 8,
            name: "Elysian Botanical Perfume Oil",
            price: 54.00,
            category: "Accessories",
            rating: 4.7,
            reviewsCount: 53,
            image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800",
            description: "Alcohol-free organic roll-on fragrance infused with notes of bergamot, cedarwood, amber, and wild vetiver."
        }
    ];

    // --- INITIALIZATION ---
    async function initApp() {
        if (DOM.yearSpan) DOM.yearSpan.textContent = new Date().getFullYear();
        
        await fetchProducts();
        setupEventListeners();
        render();
    }

    // --- API CALLS ---
    async function fetchProducts() {
        try {
            state.loading = true;
            renderProductGridLoading();
            
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Failed to fetch from server');
            
            const data = await response.json();
            state.products = (data && data.length > 0) ? data : fallbackProducts;
        } catch (err) {
            console.warn('API endpoint unreachable or error returned. Falling back to local mock catalog.', err);
            state.products = fallbackProducts;
        } finally {
            state.loading = false;
            filterProducts();
            render();
        }
    }

    async function submitOrderApi(orderPayload) {
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });
            if (!response.ok) throw new Error('Order submission failed');
            return await response.json();
        } catch (err) {
            console.warn('Backend order API failed. Simulating successful checkout transaction.', err);
            // Simulated fallback response matching contract
            return {
                success: true,
                orderId: 'ord_' + Math.floor(10000 + Math.random() * 90000),
                total: orderPayload.total
            };
        }
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        // Search Input
        if (DOM.searchInput) {
            DOM.searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value.trim().toLowerCase();
                filterProducts();
                renderProductGrid();
            });
        }

        // Category Filter Buttons
        if (DOM.categoryFilters) {
            DOM.categoryFilters.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-category]');
                if (!btn) return;
                
                document.querySelectorAll('#category-filters button').forEach(b => {
                    b.classList.remove('bg-neutral-900', 'text-white', 'shadow-md');
                    b.classList.add('bg-white', 'text-neutral-700', 'hover:bg-neutral-100', 'border', 'border-neutral-200');
                });
                
                btn.classList.remove('bg-white', 'text-neutral-700', 'hover:bg-neutral-100', 'border', 'border-neutral-200');
                btn.classList.add('bg-neutral-900', 'text-white', 'shadow-md');

                state.selectedCategory = btn.getAttribute('data-category');
                filterProducts();
                renderProductGrid();
            });
        }

        // Cart Drawer Toggles
        if (DOM.cartToggleBtn) DOM.cartToggleBtn.addEventListener('click', toggleCart);
        if (DOM.closeCartBtn) DOM.closeCartBtn.addEventListener('click', toggleCart);
        if (DOM.cartOverlay) DOM.cartOverlay.addEventListener('click', toggleCart);

        // Product Grid Delegated Events (Add to Cart, Quick View)
        if (DOM.productGrid) {
            DOM.productGrid.addEventListener('click', (e) => {
                const addBtn = e.target.closest('.add-to-cart-btn');
                if (addBtn) {
                    const productId = parseInt(addBtn.dataset.id, 10);
                    addToCart(productId);
                }
            });
        }

        // Cart Items Delegated Events (Quantity adjustments, Remove)
        if (DOM.cartItemsContainer) {
            DOM.cartItemsContainer.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;

                const id = parseInt(target.dataset.id, 10);
                if (target.classList.contains('increase-qty')) {
                    updateCartQuantity(id, 1);
                } else if (target.classList.contains('decrease-qty')) {
                    updateCartQuantity(id, -1);
                } else if (target.classList.contains('remove-item')) {
                    removeFromCart(id);
                }
            });
        }

        // Checkout Trigger
        if (DOM.checkoutBtn) {
            DOM.checkoutBtn.addEventListener('click', () => {
                if (state.cart.length === 0) return;
                toggleCart();
                openCheckoutModal();
            });
        }

        // Checkout Modal Toggles
        if (DOM.closeCheckoutBtn) DOM.closeCheckoutBtn.addEventListener('click', closeCheckoutModal);

        // Checkout Form Submit
        if (DOM.checkoutForm) {
            DOM.checkoutForm.addEventListener('submit', handleCheckoutSubmit);
        }

        // Order Confirmation Close
        if (DOM.closeConfirmationBtn) {
            DOM.closeConfirmationBtn.addEventListener('click', () => {
                DOM.orderConfirmationModal.classList.add('hidden');
                DOM.orderConfirmationModal.classList.remove('flex');
            });
        }
    }

    // --- STATE LOGIC & FILTERS ---
    function filterProducts() {
        state.filteredProducts = state.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(state.searchQuery) ||
                                  product.description.toLowerCase().includes(state.searchQuery);
            const matchesCategory = state.selectedCategory === 'all' || 
                                    product.category.toLowerCase() === state.selectedCategory.toLowerCase();
            return matchesSearch && matchesCategory;
        });
    }

    // --- CART ACTIONS ---
    function addToCart(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = state.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            state.cart.push({ ...product, quantity: 1 });
        }

        saveCart();
        renderCart();
        showToast(`Added "${product.name}" to your cart.`);
    }

    function updateCartQuantity(productId, delta) {
        const item = state.cart.find(i => i.id === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            state.cart = state.cart.filter(i => i.id !== productId);
        }

        saveCart();
        renderCart();
    }

    function removeFromCart(productId) {
        const item = state.cart.find(i => i.id === productId);
        state.cart = state.cart.filter(i => i.id !== productId);
        saveCart();
        renderCart();
        if (item) showToast(`Removed ${item.name} from cart.`);
    }

    function saveCart() {
        localStorage.setItem('aether_cart', JSON.stringify(state.cart));
    }

    function toggleCart() {
        state.isCartOpen = !state.isCartOpen;
        if (state.isCartOpen) {
            DOM.cartDrawer.classList.remove('translate-x-full');
            DOM.cartOverlay.classList.remove('opacity-0', 'pointer-events-none');
            DOM.cartOverlay.classList.add('opacity-100', 'pointer-events-auto');
        } else {
            DOM.cartDrawer.classList.add('translate-x-full');
            DOM.cartOverlay.classList.remove('opacity-100', 'pointer-events-auto');
            DOM.cartOverlay.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    // --- CHECKOUT ACTIONS ---
    function openCheckoutModal() {
        const subtotal = calculateSubtotal();
        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        if (DOM.checkoutTotalDisplay) {
            DOM.checkoutTotalDisplay.textContent = `$${total.toFixed(2)}`;
        }
        DOM.checkoutModal.classList.remove('hidden');
        DOM.checkoutModal.classList.add('flex');
    }

    function closeCheckoutModal() {
        DOM.checkoutModal.classList.add('hidden');
        DOM.checkoutModal.classList.remove('flex');
    }

    async function handleCheckoutSubmit(e) {
        e.preventDefault();
        const formData = new FormData(DOM.checkoutForm);
        const customerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            address: formData.get('address'),
            city: formData.get('city'),
            zip: formData.get('zip')
        };

        const subtotal = calculateSubtotal();
        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        const orderPayload = {
            items: state.cart,
            customer: customerData,
            subtotal: parseFloat(subtotal.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            total: parseFloat(total.toFixed(2))
        };

        const submitBtn = DOM.checkoutForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin w-5 h-5 mx-auto"></i>`;
        lucide.createIcons();

        try {
            const result = await submitOrderApi(orderPayload);
            if (result.success) {
                state.lastOrder = result;
                state.cart = [];
                saveCart();
                renderCart();
                closeCheckoutModal();
                DOM.checkoutForm.reset();

                // Show confirmation modal
                if (DOM.orderIdDisplay) DOM.orderIdDisplay.textContent = result.orderId;
                if (DOM.orderTotalDisplay) DOM.orderTotalDisplay.textContent = `$${result.total.toFixed(2)}`;
                DOM.orderConfirmationModal.classList.remove('hidden');
                DOM.orderConfirmationModal.classList.add('flex');
                lucide.createIcons();
            } else {
                throw new Error('Order verification failed');
            }
        } catch (err) {
            showToast('Checkout encountered an error. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            lucide.createIcons();
        }
    }

    function calculateSubtotal() {
        return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // --- RENDER FUNCTIONS ---
    function render() {
        renderProductGrid();
        renderCart();
    }

    function renderProductGridLoading() {
        if (!DOM.productGrid) return;
        DOM.productGrid.innerHTML = Array(6).fill(0).map(() => `
            <div class="bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm animate-pulse">
                <div class="w-full h-64 bg-neutral-200 rounded-xl mb-4"></div>
                <div class="h-4 bg-neutral-200 rounded w-1/4 mb-2"></div>
                <div class="h-6 bg-neutral-200 rounded w-3/4 mb-4"></div>
                <div class="flex justify-between items-center">
                    <div class="h-6 bg-neutral-200 rounded w-1/4"></div>
                    <div class="h-10 bg-neutral-200 rounded-xl w-1/3"></div>
                </div>
            </div>
        `).join('');
    }

    function renderProductGrid() {
        if (!DOM.productGrid) return;

        if (state.filteredProducts.length === 0) {
            DOM.productGrid.innerHTML = `
                <div class="col-span-full py-16 text-center">
                    <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                        <i data-lucide="search-x" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-neutral-800 mb-1">No products found</h3>
                    <p class="text-neutral-500 text-sm">Try adjusting your search query or category filter.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        DOM.productGrid.innerHTML = state.filteredProducts.map(product => `
            <div class="group bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div>
                    <!-- Product Image Container -->
                    <div class="relative w-full h-72 bg-neutral-100 overflow-hidden">
                        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-3 left-3">
                            <span class="bg-white/90 backdrop-blur-md text-neutral-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                                ${product.category}
                            </span>
                        </div>
                        <div class="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-neutral-800 shadow-sm">
                            <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>
                            <span>${product.rating}</span>
                        </div>
                    </div>

                    <!-- Product Meta -->
                    <div class="p-5">
                        <h3 class="font-semibold text-neutral-900 text-lg mb-1 group-hover:text-neutral-700 transition-colors">
                            ${product.name}
                        </h3>
                        <p class="text-neutral-500 text-sm line-clamp-2 leading-relaxed mb-4">
                            ${product.description}
                        </p>
                    </div>
                </div>

                <!-- Price & Action Footer -->
                <div class="p-5 pt-0 flex items-center justify-between mt-auto">
                    <div>
                        <span class="text-xs text-neutral-400 block font-medium uppercase tracking-wider">Price</span>
                        <span class="text-xl font-bold text-neutral-900">$${product.price.toFixed(2)}</span>
                    </div>
                    <button data-id="${product.id}" class="add-to-cart-btn bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm active:scale-95">
                        <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                        <span>Add</span>
                    </button>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    function renderCart() {
        const totalItemsCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Update Navbar Badge
        if (DOM.cartBadge) {
            DOM.cartBadge.textContent = totalItemsCount;
            if (totalItemsCount > 0) {
                DOM.cartBadge.classList.remove('scale-0');
                DOM.cartBadge.classList.add('scale-100');
            } else {
                DOM.cartBadge.classList.remove('scale-100');
                DOM.cartBadge.classList.add('scale-0');
            }
        }

        // Render Cart Items
        if (!DOM.cartItemsContainer) return;

        if (state.cart.length === 0) {
            DOM.cartItemsContainer.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                    <div class="w-20 h-20 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mb-4">
                        <i data-lucide="shopping-bag" class="w-10 h-10 stroke-1"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-neutral-800 mb-1">Your cart is empty</h4>
                    <p class="text-neutral-500 text-sm max-w-xs mb-6">Discover our curated collection and add items to your cart to begin checkout.</p>
                    <button onclick="document.getElementById('cart-toggle-btn').click()" class="bg-neutral-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors">
                        Start Shopping
                    </button>
                </div>
            `;
            if (DOM.cartSubtotal) DOM.cartSubtotal.textContent = '$0.00';
            if (DOM.cartTax) DOM.cartTax.textContent = '$0.00';
            if (DOM.cartTotal) DOM.cartTotal.textContent = '$0.00';
            if (DOM.checkoutBtn) {
                DOM.checkoutBtn.disabled = true;
                DOM.checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            lucide.createIcons();
            return;
        }

        if (DOM.checkoutBtn) {
            DOM.checkoutBtn.disabled = false;
            DOM.checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }

        DOM.cartItemsContainer.innerHTML = state.cart.map(item => `
            <div class="flex gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 items-center">
                <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-xl bg-white border border-neutral-200 shrink-0">
                <div class="flex-1 min-w-0">
                    <h5 class="font-semibold text-neutral-900 text-sm truncate mb-1">${item.name}</h5>
                    <div class="text-neutral-900 font-medium text-sm mb-3">$${(item.price * item.quantity).toFixed(2)}</div>
                    
                    <!-- Stepper -->
                    <div class="flex items-center gap-3">
                        <div class="flex items-center border border-neutral-200 rounded-lg bg-white overflow-hidden shadow-xs">
                            <button data-id="${item.id}" class="decrease-qty w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors">
                                <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                            </button>
                            <span class="w-8 text-center text-xs font-semibold text-neutral-800">${item.quantity}</span>
                            <button data-id="${item.id}" class="increase-qty w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors">
                                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                        <button data-id="${item.id}" class="remove-item text-neutral-400 hover:text-red-500 p-1.5 transition-colors ml-auto" title="Remove item">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        const subtotal = calculateSubtotal();
        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        if (DOM.cartSubtotal) DOM.cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        if (DOM.cartTax) DOM.cartTax.textContent = `$${tax.toFixed(2)}`;
        if (DOM.cartTotal) DOM.cartTotal.textContent = `$${total.toFixed(2)}`;

        lucide.createIcons();
    }

    // --- TOAST NOTIFICATION SYSTEM ---
    function showToast(message, type = 'success') {
        if (!DOM.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium text-white transition-all duration-300 transform translate-y-2 opacity-0 ${
            type === 'success' ? 'bg-neutral-900 border border-neutral-800' : 'bg-red-600 border border-red-500'
        }`;
        
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle-2' : 'alert-circle'}" class="w-4 h-4 shrink-0 text-white"></i>
            <span>${message}</span>
        `;

        DOM.toastContainer.appendChild(toast);
        lucide.createIcons();

        // Trigger entrance
        setTimeout(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        }, 10);

        // Remove after 3.5s
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // Execute application bootstrap
    initApp();
});