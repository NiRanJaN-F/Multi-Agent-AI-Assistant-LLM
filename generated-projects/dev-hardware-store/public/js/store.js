/**
 * KEYCRAFT Store - State Management & Business Logic
 * Handles products catalog, cart state, localStorage persistence, and filtering.
 */

const PRODUCTS_DATA = [
    {
        id: "kc-01",
        name: "Apex Pro Wireless MK",
        category: "keyboards",
        price: 249.99,
        rating: 4.9,
        reviews: 128,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800",
        badge: "Best Seller",
        description: "Custom mechanical keyboard with adjustable actuation switches, CNC aluminum chassis, and per-key RGB backlighting."
    },
    {
        id: "kc-02",
        name: "HHKB Professional Hybrid",
        category: "keyboards",
        price: 319.00,
        rating: 4.8,
        reviews: 94,
        image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=800",
        badge: "Enthusiast",
        description: "Topre electrostatic capacitive switches offering supreme tactile feedback and legendary compact productivity layout."
    },
    {
        id: "kc-03",
        name: "Audiophile Studio DAC/Amp",
        category: "audio",
        price: 189.50,
        rating: 4.7,
        reviews: 62,
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=800",
        badge: "Hi-Res",
        description: "Balanced desktop amplifier and digital-to-analog converter engineered for pristine lossless audio monitoring."
    },
    {
        id: "kc-04",
        name: "Ergo Planar Studio Headphones",
        category: "audio",
        price: 399.00,
        rating: 5.0,
        reviews: 45,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
        badge: "Pro Audio",
        description: "Open-back planar magnetic headphones delivering exceptionally wide soundstage and ultra-low harmonic distortion."
    },
    {
        id: "kc-05",
        name: "Battlestation Motorized Desk",
        category: "desks",
        price: 599.00,
        rating: 4.6,
        reviews: 81,
        image: "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=80&w=800",
        badge: "Ergonomic",
        description: "Dual-motor height adjustable sit-stand desk with solid bamboo top, programmable memory pads, and cable management tray."
    },
    {
        id: "kc-06",
        name: "Macropad MacroDeck V2",
        category: "accessories",
        price: 89.99,
        rating: 4.8,
        reviews: 110,
        image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=800",
        badge: "Hot Deal",
        description: "Programmable 15-key LCD macro pad for instant developer workflows, CI/CD triggers, and shortcut execution."
    },
    {
        id: "kc-07",
        name: "Custom Brass Keycap Kit",
        category: "accessories",
        price: 65.00,
        rating: 4.5,
        reviews: 38,
        image: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=800",
        badge: "Limited",
        description: "CNC-milled solid brass artisanal keycaps with PVD coating designed for Cherry MX compatible stem switches."
    },
    {
        id: "kc-08",
        name: "Ambient Desk Light Bar",
        category: "accessories",
        price: 49.99,
        rating: 4.7,
        reviews: 95,
        image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=800",
        badge: "Popular",
        description: "Monitor-mounted asymmetric optical desk light with adjustable color temperature and wireless desktop controller dial."
    }
];

class StoreManager {
    constructor() {
        this.products = PRODUCTS_DATA;
        this.cart = this.loadCart();
        this.currentCategory = 'all';
        this.searchQuery = '';
    }

    loadCart() {
        try {
            const saved = localStorage.getItem('keycraft_cart');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading cart from localStorage:', e);
            return [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem('keycraft_cart', JSON.stringify(this.cart));
        } catch (e) {
            console.error('Error saving cart to localStorage:', e);
        }
    }

    getFilteredProducts() {
        return this.products.filter(product => {
            const matchesCategory = this.currentCategory === 'all' || product.category === this.currentCategory;
            const matchesSearch = product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                                  product.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                                  product.category.toLowerCase().includes(this.searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }

    setCategory(category) {
        this.currentCategory = category;
    }

    setSearchQuery(query) {
        this.searchQuery = query ? query.trim() : '';
    }

    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return false;

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: quantity
            });
        }
        this.saveCart();
        return true;
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
    }

    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = parseInt(quantity, 10);
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.saveCart();
            }
        }
    }

    getCartCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    getCartSubtotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
    }
}

// Global store instance exported to window for UI consumption
window.Store = new StoreManager();