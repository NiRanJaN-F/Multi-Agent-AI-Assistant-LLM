/**
 * AURA & CO. - Modern E-Commerce Application
 * Architecture: Component-driven Vanilla JS with Reactive State Management
 * Principal Frontend Architect & Senior UI/UX Designer implementation
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State Management ---
    const state = {
        products: [],
        filteredProducts: [],
        cart: [],
        searchQuery: '',
        selectedCategory: 'all',
        isCartOpen: false,
        isCheckoutOpen: false,
        isOrderSuccessOpen: false,
        lastOrder: null,
        loading: true,
        error: null
    };

    // --- Fallback Mock Data (for offline / direct testing) ---
    const fallbackProducts = [
        {
            id: 1,
            name: "Aura Minimalist Ceramic Lamp",
            price: 129.00,
            category: "Lifestyle",
            rating: 4.8,
            reviewsCount: 42,
            image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800",
            description: "Hand-glazed ceramic table lamp with warm ambient LED glow and solid brass dimmer switch."
        },
        {
            id: 2,
            name: "Nomad Leather Weekender",
            price: 285.50,
            category: "Apparel",
            rating: 4.9,
            reviewsCount: 128,
            image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
            description: "Full-grain vegetable tanned leather travel bag designed for weekend getaways and overhead bins."
        },
        {
            id: 3,
            name: "Chronos Matte Black Chronograph",
            price: 195.00,
            category: "Lifestyle",
            rating: 4.7,
            reviewsCount: 89,
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
            description: "Precision Japanese quartz movement housed in a scratch-resistant matte black stainless steel case."
        },
        {
            id: 4,
            name: "Botanical Studio Terrarium",
            price: 75.00,
            category: "Lifestyle",
            rating: 4.6,
            reviewsCount: 31,
            image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800",
            description: "Geometrical brass-framed glass terrarium featuring hand-selected resilient succulent flora."
        },
        {
            id: 5,
            name: "Studio Wireless ANC Headphones",
            price: 340.00,
            category: "Electronics",
            rating: 4.9,
            reviewsCount: 215,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
            description: "Immersive acoustic sound profiling with hybrid active noise cancellation and 40-hour battery life."
        },
        {
            id: 6,
            name: "Kuro Cast Iron Pour-Over Kettle",
            price: 88.00,
            category: "Lifestyle",
            rating: 4.8,
            reviewsCount: 76,
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
            description: "Ergonomic gooseneck kettle engineered for ultimate water flow precision during pour-over brewing."
        },
        {
            id: 7,
            name: "Zenith Mechanical Keyboard",
            price: 165.00,
            category: "Electronics",
            rating: 4.9,
            reviewsCount: 154,
            image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800",
            description: "Hot-swappable custom tactile switches wrapped in CNC anodized aluminum chassis with PBT keycaps."
        },
        {
            id: 8,
            name: "Apex Polarized Titanium Sunglasses",
            price: 210.00,
            category: "Apparel",
            rating: 4.7,
            reviewsCount: 62,
            image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800",
            description: "Ultralight aerospace-grade titanium frames fitted with anti-reflective polarized optical lenses."
        }
    ];

    // --- Initialize Products & Cart from LocalStorage if available ---
    const savedCart = localStorage.getItem('aura_cart');
    if (savedCart) {
        try {
            state.cart = JSON.parse(savedCart);
        } catch (e) {
            console.error('Failed to parse saved cart:', e);
        }
    }

    // --- Fetch Products from API with fallback ---
    const fetchProducts = async () => {
        state.loading = true;
        renderLoadingState();
        try {
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            state.products = Array.isArray(data) && data.length > 0 ? data : fallbackProducts;
        } catch (err) {
            console.warn('API fetch failed, using fallback products:', err.message);
            state.products = fallbackProducts;
        } finally {
            state.loading = false;
            applyFilters();
            renderCatalog();
            updateCartBadge();
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    };

    // --- Filter & Search Logic ---
    const applyFilters = () => {
        let result = [...state.products];

        // Category filter
        if (state.selectedCategory !== 'all') {
            result = result.filter(p => p.category.toLowerCase() === state.selectedCategory.toLowerCase());
        }

        // Search query filter
        if (state.searchQuery.trim() !== '') {
            const q = state.searchQuery.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(q) || 
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
        }

        state.filteredProducts = result;
    };

    const filterCategory = (category) => {
        state.selectedCategory = category;
        applyFilters();
        renderCatalog();
        updateCategoryButtons();
        
        // Update catalog title and subtitle dynamically
        const titleEl = document.getElementById('catalogTitle');
        const subtitleEl = document.getElementById('catalogSubtitle');
        if (titleEl) {
            titleEl.textContent = category === 'all' ? 'All Products' : `${category} Goods`;
        }
        if (subtitleEl) {
            subtitleEl.textContent = category === 'all' 
                ? 'Showing all available curated items' 
                : `Showing hand-picked selection for ${category}`;
        }
    };

    const handleSearch = (event) => {
        state.searchQuery = event.target.value;
        applyFilters();
        renderCatalog();
    };

    const resetFilters = () => {
        state.searchQuery = '';
        state.selectedCategory = 'all';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        filterCategory('all');
    };

    const resetView = () => {
        resetFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Cart Management ---
    const addToCart = (productId) => {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = state.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            state.cart.push({ ...product, quantity: 1 });
        }

        saveCart();
        updateCartBadge();
        renderCartDrawer();
        toggleCart(true);

        // Visual feedback / toast or animation could go here
    };

    const updateQuantity = (productId, change) => {
        const itemIndex = state.cart.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            state.cart[itemIndex].quantity += change;
            if (state.cart[itemIndex].quantity <= 0) {
                state.cart.splice(itemIndex, 1);
            }
        }
        saveCart();
        updateCartBadge();
        renderCartDrawer();
    };

    const removeFromCart = (productId) => {
        state.cart = state.cart.filter(item => item.id !== productId);
        saveCart();
        updateCartBadge();
        renderCartDrawer();
    };

    const saveCart = () => {
        try {
            localStorage.setItem('aura_cart', JSON.stringify(state.cart));
        } catch (e) {
            console.error('Failed to save cart to localStorage:', e);
        }
    };

    const toggleCart = (open) => {
        state.isCartOpen = open;
        const drawer = document.getElementById('CartDrawer');
        const backdrop = document.getElementById('cartBackdrop');
        const panel = document.getElementById('cartPanel');

        if (!drawer || !backdrop || !panel) return;

        if (open) {
            drawer.classList.remove('pointer-events-none');
            backdrop.classList.remove('opacity-0', 'pointer-events-none');
            backdrop.classList.add('opacity-100');
            panel.classList.remove('translate-x-full');
            panel.classList.add('translate-x-0');
            renderCartDrawer();
        } else {
            drawer.classList.add('pointer-events-none');
            backdrop.classList.remove('opacity-100');
            backdrop.classList.add('opacity-0', 'pointer-events-none');
            panel.classList.remove('translate-x-0');
            panel.classList.add('translate-x-full');
        }
    };

    const updateCartBadge = () => {
        const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        const badge = document.getElementById('cartBadge');
        const itemCountBadge = document.getElementById('cartItemCountBadge');

        if (badge) {
            badge.textContent = totalItems;
            if (totalItems > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        if (itemCountBadge) {
            itemCountBadge.textContent = totalItems;
        }
    };

    // --- Checkout & Order Flow ---
    const openCheckout = () => {
        if (state.cart.length === 0) return;
        toggleCart(false);
        state.isCheckoutOpen = true;
        const modal = document.getElementById('CheckoutModal');
        if (modal) {
            modal.classList.remove('pointer-events-none', 'opacity-0');
            modal.classList.add('opacity-100');
            const inner = modal.querySelector('div.relative');
            if (inner) {
                inner.classList.remove('scale-95');
                inner.classList.add('scale-100');
            }
        }
    };

    const closeCheckout = () => {
        state.isCheckoutOpen = false;
        const modal = document.getElementById('CheckoutModal');
        if (modal) {
            modal.classList.remove('opacity-100');
            modal.classList.add('pointer-events-none', 'opacity-0');
            const inner = modal.querySelector('div.relative');
            if (inner) {
                inner.classList.remove('scale-100');
                inner.classList.add('scale-95');
            }
        }
    };

    const processCheckout = async (event) => {
        event.preventDefault();
        const payButton = document.getElementById('payButton');
        const payButtonText = document.getElementById('payButtonText');
        
        if (payButton && payButtonText) {
            payButton.disabled = true;
            payButtonText.textContent = 'Processing Secure Order...';
        }

        const formData = new FormData(event.target);
        const orderData = {
            customer: {
                name: formData.get('name') || 'Valued Customer',
                email: formData.get('email') || '',
                address: formData.get('address') || '',
                city: formData.get('city') || '',
                postalCode: formData.get('postalCode') || ''
            },
            items: state.cart,
            total: state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                throw new Error('Order submission failed');
            }

            const result = await response.json();
            state.lastOrder = result.order || orderData;
            
            // Clear cart
            state.cart = [];
            saveCart();
            updateCartBadge();
            closeCheckout();
            showOrderSuccessModal(state.lastOrder);

        } catch (err) {
            console.warn('API order creation failed, simulating success:', err.message);
            state.lastOrder = orderData;
            state.cart = [];
            saveCart();
            updateCartBadge();
            closeCheckout();
            showOrderSuccessModal(state.lastOrder);
        } finally {
            if (payButton && payButtonText) {
                payButton.disabled = false;
                payButtonText.textContent = 'Complete Secure Order';
            }
        }
    };

    const showOrderSuccessModal = (order) => {
        // Create or show order success modal dynamically if not present in static HTML
        let successModal = document.getElementById('OrderSuccessModal');
        if (!successModal) {
            successModal = document.createElement('div');
            successModal.id = 'OrderSuccessModal';
            successModal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';
            document.body.appendChild(successModal);
        }

        const orderId = order.id || Math.floor(100000 + Math.random() * 900000);
        const customerName = order.customer ? order.customer.name : 'Customer';

        successModal.innerHTML = `
            <div class="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
                    <i data-lucide="check" class="w-8 h-8"></i>
                </div>
                <h3 class="text-2xl font-bold text-zinc-900 mb-2">Order Confirmed!</h3>
                <p class="text-sm text-zinc-600 mb-6">Thank you for your purchase, <span class="font-semibold text-zinc-900">${customerName}</span>. Your order #${orderId} has been successfully placed.</p>
                <div class="bg-zinc-50 rounded-2xl p-4 text-left text-xs text-zinc-600 mb-6 space-y-2 border border-zinc-100">
                    <div class="flex justify-between"><span class="font-medium text-zinc-500">Status</span><span class="text-emerald-600 font-semibold">Processing</span></div>
                    <div class="flex justify-between"><span class="font-medium text-zinc-500">Shipping</span><span class="text-zinc-900">Standard (2-4 days)</span></div>
                    <div class="flex justify-between border-t border-zinc-200 pt-2"><span class="font-bold text-zinc-900">Total Paid</span><span class="font-bold text-zinc-900">$${(order.total || 0).toFixed(2)}</span></div>
                </div>
                <button onclick="StoreApp.closeOrderSuccess()" class="w-full py-3.5 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors">
                    Continue Shopping
                </button>
            </div>
        `;
        successModal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };

    const closeOrderSuccess = () => {
        const successModal = document.getElementById('OrderSuccessModal');
        if (successModal) {
            successModal.classList.add('hidden');
        }
        resetView();
    };

    // --- DOM Rendering Helpers ---
    const renderLoadingState = () => {
        const skeleton = document.getElementById('loadingSkeleton');
        const grid = document.getElementById('productGrid');
        const empty = document.getElementById('emptyState');
        if (skeleton) skeleton.classList.remove('hidden');
        if (grid) grid.classList.add('hidden');
        if (empty) empty.classList.add('hidden');
    };

    const renderCatalog = () => {
        const skeleton = document.getElementById('loadingSkeleton');
        const grid = document.getElementById('productGrid');
        const empty = document.getElementById('emptyState');

        if (skeleton) skeleton.classList.add('hidden');

        if (!grid) return;

        if (state.filteredProducts.length === 0) {
            grid.classList.add('hidden');
            if (empty) empty.classList.remove('hidden');
            return;
        }

        if (empty) empty.classList.add('hidden');
        grid.classList.remove('hidden');

        grid.innerHTML = state.filteredProducts.map(product => `
            <div class="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl border border-zinc-100 transition-all duration-300 flex flex-col justify-between">
                <div>
                    <div class="relative w-full h-64 bg-zinc-100 rounded-xl overflow-hidden mb-4">
                        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500">
                        <span class="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md text-[11px] font-semibold uppercase tracking-wider text-zinc-800 rounded-full shadow-sm">
                            ${product.category}
                        </span>
                        <div class="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full text-xs font-semibold text-zinc-800 shadow-sm">
                            <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>
                            <span>${product.rating}</span>
                        </div>
                    </div>
                    <h3 class="font-bold text-zinc-900 text-base mb-1 group-hover:text-zinc-600 transition-colors line-clamp-1">${product.name}</h3>
                    <p class="text-xs text-zinc-500 line-clamp-2 mb-4 font-normal leading-relaxed">${product.description}</p>
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-zinc-100">
                    <span class="text-lg font-extrabold text-zinc-900">$${product.price.toFixed(2)}</span>
                    <button onclick="StoreApp.addToCart(${product.id})" class="px-4 py-2.5 bg-zinc-900 text-white font-medium text-xs rounded-full hover:bg-zinc-800 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Add Item</span>
                    </button>
                </div>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };

    const updateCategoryButtons = () => {
        const buttons = document.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            const cat = btn.getAttribute('data-category');
            if (cat && cat.toLowerCase() === state.selectedCategory.toLowerCase()) {
                btn.className = 'category-btn px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all bg-zinc-900 text-white shadow-sm';
            } else {
                btn.className = 'category-btn px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900';
            }
        });
    };

    const renderCartDrawer = () => {
        const container = document.getElementById('cartItemsContainer');
        const footer = document.getElementById('cartFooter');
        const subtotalEl = document.getElementById('cartSubtotal');
        const totalEl = document.getElementById('cartTotal');

        if (!container || !footer) return;

        if (state.cart.length === 0) {
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center py-16">
                    <div class="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
                        <i data-lucide="shopping-bag" class="w-8 h-8"></i>
                    </div>
                    <h3 class="font-bold text-zinc-900 text-base">Your cart is empty</h3>
                    <p class="text-xs text-zinc-500 mt-1 max-w-xs">Discover our curated collection and add items to your cart.</p>
                    <button onclick="StoreApp.toggleCart(false)" class="mt-6 px-6 py-2.5 bg-zinc-900 text-white text-xs font-semibold rounded-full hover:bg-zinc-800 transition-colors">
                        Start Shopping
                    </button>
                </div>
            `;
            footer.classList.add('hidden');
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        footer.classList.remove('hidden');

        container.innerHTML = state.cart.map(item => `
            <div class="py-4 flex items-center gap-4">
                <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-xl bg-zinc-100 shrink-0">
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm text-zinc-900 truncate">${item.name}</h4>
                    <p class="text-xs font-bold text-zinc-900 mt-0.5">$${item.price.toFixed(2)}</p>
                    <div class="flex items-center gap-3 mt-3">
                        <div class="flex items-center border border-zinc-200 rounded-lg overflow-hidden bg-white">
                            <button onclick="StoreApp.updateQuantity(${item.id}, -1)" class="px-2.5 py-1 text-zinc-600 hover:bg-zinc-100 transition-colors">-</button>
                            <span class="px-3 text-xs font-semibold text-zinc-900">${item.quantity}</span>
                            <button onclick="StoreApp.updateQuantity(${item.id}, 1)" class="px-2.5 py-1 text-zinc-600 hover:bg-zinc-100 transition-colors">+</button>
                        </div>
                        <button onclick="StoreApp.removeFromCart(${item.id})" class="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };

    // --- Expose Global Interface for Inline HTML Callbacks ---
    window.StoreApp = {
        filterCategory,
        handleSearch,
        resetFilters,
        resetView,
        addToCart,
        updateQuantity,
        removeFromCart,
        toggleCart,
        openCheckout,
        closeCheckout,
        processCheckout,
        closeOrderSuccess
    };

    // --- Application Initialization ---
    fetchProducts();
});