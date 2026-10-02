/**
 * @file store.js
 * @description Central reactive data store managing products, cart state, 
 * active filters, search queries, and localStorage persistence.
 */

export const PRODUCTS = [
    {
        id: 'dev-kb-01',
        name: 'Keychron Q1 Pro Wireless',
        category: 'Keyboards',
        price: 219.00,
        rating: 4.9,
        reviews: 128,
        image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=800',
        badge: 'Bestseller',
        description: 'Fully aluminum custom mechanical keyboard with QMK/VIA support, gasket mount design, and hot-swappable switches.',
        specs: ['Wireless 2.4G & Bluetooth', 'Hot-swappable Gateron Jupiter', 'RGB Backlit', 'CNC Aluminum Body']
    },
    {
        id: 'dev-kb-02',
        name: 'NuPhy Air75 V2 Low Profile',
        category: 'Keyboards',
        price: 139.99,
        rating: 4.8,
        reviews: 94,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800',
        badge: 'New Release',
        description: 'Ultra-slim wireless mechanical keyboard featuring 1000Hz polling rate, PBT keycaps, and custom low-profile switches.',
        specs: ['1000Hz Polling Rate', 'Tri-mode Connectivity', 'Alu Frame', 'Mac & Win Layouts']
    },
    {
        id: 'dev-kb-03',
        name: 'Logitech MX Mechanical',
        category: 'Keyboards',
        price: 169.99,
        rating: 4.7,
        reviews: 215,
        image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=800',
        badge: 'Popular',
        description: 'Advanced tactile quiet mechanical switches with smart illumination and multi-device Flow-enabled capabilities.',
        specs: ['Tactile Quiet Switches', 'Smart Backlighting', 'Logi Bolt USB', '15-day Battery']
    },
    {
        id: 'dev-au-01',
        name: 'Beyerdynamic DT 900 Pro X',
        category: 'Audio',
        price: 269.00,
        rating: 4.9,
        reviews: 182,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
        badge: 'Audiophile',
        description: 'Open-back studio headphones featuring STELLAR.45 drivers for high-performance sound across all playback devices.',
        specs: ['48 Ohm STELLAR.45 Driver', 'Velour Ear Pads', 'Detachable Cable', 'Made in Germany']
    },
    {
        id: 'dev-au-02',
        name: 'Audio-Technica AT2020USB-XP',
        category: 'Audio',
        price: 149.00,
        rating: 4.6,
        reviews: 76,
        image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800',
        badge: 'Top Pick',
        description: 'Studio-quality USB condenser microphone with built-in headphone jack, volume control, and noise-reduction digital switch.',
        specs: ['24-bit/192 kHz', 'Mute Touch Sensor', 'Headphone Amp', 'Desktop Stand Included']
    },
    {
        id: 'dev-dk-01',
        name: 'Autonomous SmartDesk Connect',
        category: 'Desks',
        price: 699.00,
        rating: 4.8,
        reviews: 64,
        image: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=80&w=800',
        badge: 'Pro Setup',
        description: 'Solid wood dual-motor standing desk with app control, anti-collision sensor, and programmable height presets.',
        specs: ['Dual Motor Lift', 'Solid Bamboo Top', 'App & Keypad Control', '300 lb Capacity']
    },
    {
        id: 'dev-ac-01',
        name: 'Elgato Stream Deck +',
        category: 'Accessories',
        price: 199.99,
        rating: 4.9,
        reviews: 310,
        image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=800',
        badge: 'Essential',
        description: 'Control audio, lights, and workflows with customizable LCD keys, endless dials, and dynamic touch strip.',
        specs: ['15 LCD Keys', '4 Push Dials', 'Dynamic Touch Strip', 'USB-C Connection']
    },
    {
        id: 'dev-ac-02',
        name: 'BenQ ScreenBar Halo Monitor Light',
        category: 'Accessories',
        price: 179.00,
        rating: 4.8,
        reviews: 142,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800',
        badge: 'Eye Care',
        description: 'Wireless controller desktop lamp with backlighting, auto-dimming ambient light sensor, and zero reflective glare.',
        specs: ['Wireless Dial Control', 'Auto-Dimming', 'Backlight Mode', 'USB Powered']
    }
];

class Store {
    constructor() {
        this.state = {
            cart: this.loadCart(),
            activeCategory: 'All',
            searchQuery: '',
            isCartOpen: false
        };
        this.listeners = [];
    }

    loadCart() {
        try {
            const saved = localStorage.getItem('devgear_cart');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load cart from localStorage:', e);
            return [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem('devgear_cart', JSON.stringify(this.state.cart));
        } catch (e) {
            console.error('Failed to save cart to localStorage:', e);
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
        // Initial call
        listener(this.state);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    setCategory(category) {
        this.state.activeCategory = category;
        this.notify();
    }

    setSearchQuery(query) {
        this.state.searchQuery = query.trim().toLowerCase();
        this.notify();
    }

    toggleCart(isOpen) {
        this.state.isCartOpen = isOpen !== undefined ? isOpen : !this.state.isCartOpen;
        this.notify();
    }

    addToCart(productId, quantity = 1) {
        const product = PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.state.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.state.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: quantity
            });
        }

        this.saveCart();
        this.notify();
        this.toggleCart(true); // Open drawer on add
    }

    updateQuantity(productId, quantity) {
        const item = this.state.cart.find(i => i.id === productId);
        if (item) {
            item.quantity = parseInt(quantity, 10);
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.saveCart();
                this.notify();
            }
        }
    }

    removeFromCart(productId) {
        this.state.cart = this.state.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.notify();
    }

    clearCart() {
        this.state.cart = [];
        this.saveCart();
        this.notify();
    }

    getFilteredProducts() {
        return PRODUCTS.filter(product => {
            const matchesCategory = this.state.activeCategory === 'All' || product.category === this.state.activeCategory;
            const matchesSearch = this.state.searchQuery === '' || 
                product.name.toLowerCase().includes(this.state.searchQuery) ||
                product.description.toLowerCase().includes(this.state.searchQuery) ||
                product.category.toLowerCase().includes(this.state.searchQuery);
            return matchesCategory && matchesSearch;
        });
    }

    getCartCount() {
        return this.state.cart.reduce((total, item) => total + item.quantity, 0);
    }

    getCartSubtotal() {
        return this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
}

// Export singleton instance
export const store = new Store();