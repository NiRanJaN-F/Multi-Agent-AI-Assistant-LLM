import React, { createContext, useContext, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * @file frontend/src/main.jsx
 * @description Entry point for the modern e-commerce application.
 * Implements Global State Management (ShopContext) to handle products, 
 * shopping cart logic, and API interactions.
 */

// --- Context Definition ---
export const ShopContext = createContext();

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};

// --- Mock Data (Initial State) ---
const MOCK_PRODUCTS = [
  { _id: '1', name: 'Aura Wireless Headphones', price: 299.99, category: 'Audio', rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', description: 'Premium noise-canceling headphones with 40-hour battery life.' },
  { _id: '2', name: 'Nebula Smart Watch', price: 199.50, category: 'Wearables', rating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', description: 'Track your health and stay connected with this sleek smartwatch.' },
  { _id: '3', name: 'Vortex Gaming Mouse', price: 89.00, category: 'Accessories', rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', description: 'Ultra-responsive optical sensor with customizable RGB lighting.' },
  { _id: '4', name: 'Zenith Mechanical Keyboard', price: 159.99, category: 'Accessories', rating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80', description: 'Tactile switches and aluminum frame for the ultimate typing experience.' },
  { _id: '5', name: 'Lumina Desk Lamp', price: 75.00, category: 'Home', rating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=800&q=80', description: 'Minimalist LED lamp with adjustable brightness and color temperature.' },
  { _id: '6', name: 'Titan Tech Backpack', price: 129.00, category: 'Lifestyle', rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80', description: 'Water-resistant backpack with dedicated laptop sleeve and USB port.' },
  { _id: '7', name: 'Ember Smart Mug', price: 45.00, category: 'Home', rating: 4.4, imageUrl: 'https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?auto=format&fit=crop&w=800&q=80', description: 'Keep your coffee at the perfect temperature for hours.' },
  { _id: '8', name: 'Sonic Bluetooth Speaker', price: 149.00, category: 'Audio', rating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80', description: '360-degree immersive sound with deep bass and IPX7 waterproof rating.' }
];

// --- Provider Component ---
const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Toast Notification Helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch Products (API Integration)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.products) setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to mock data if API fails
    } finally {
      setLoading(false);
    }
  };

  // Fetch Cart (API Integration)
  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();
      if (data.items) setCart(data.items);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  // Add to Cart
  const addToCart = async (product) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id })
      });
      const data = await response.json();
      
      if (data.success) {
        // Optimistic UI update or re-fetch
        const existingItem = cart.find(item => item.productId === product._id);
        if (existingItem) {
          setCart(cart.map(item => 
            item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
          ));
        } else {
          setCart([...cart, { ...data.item, product }]);
        }
        showToast(`${product.name} added to cart!`);
      }
    } catch (error) {
      // Fallback for demo purposes if backend isn't running
      const existingItem = cart.find(item => item.productId === product._id);
      if (existingItem) {
        setCart(cart.map(item => 
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        setCart([...cart, { _id: Date.now().toString(), productId: product._id, quantity: 1, product }]);
      }
      showToast(`${product.name} added to cart!`);
    }
  };

  // Update Quantity
  const updateQuantity = async (itemId, delta) => {
    const item = cart.find(i => i._id === itemId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) return removeFromCart(itemId);

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      if (response.ok) {
        setCart(cart.map(i => i._id === itemId ? { ...i, quantity: newQty } : i));
      }
    } catch (error) {
      setCart(cart.map(i => i._id === itemId ? { ...i, quantity: newQty } : i));
    }
  };

  // Remove from Cart
  const removeFromCart = async (itemId) => {
    try {
      await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
      setCart(cart.filter(item => item._id !== itemId));
      showToast('Item removed from cart', 'info');
    } catch (error) {
      setCart(cart.filter(item => item._id !== itemId));
      showToast('Item removed from cart', 'info');
    }
  };

  // Initialize
  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  // Lucide Icon Refresh
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [products, cart, isCartOpen, notification]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartTotal = cart.reduce((acc, item) => {
    const product = products.find(p => p._id === item.productId);
    return acc + (product?.price || 0) * item.quantity;
  }, 0);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const value = {
    products: filteredProducts,
    allProducts: products,
    cart,
    cartTotal,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    searchQuery,
    setSearchQuery,
    loading,
    notification
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
      {/* Global Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-slide-up ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-800 border-slate-700 text-white'
        }`}>
          <i data-lucide={notification.type === 'success' ? 'check-circle' : 'info'} className="w-5 h-5"></i>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        body { font-family: 'Inter', sans-serif; scroll-behavior: smooth; }
        .glass-effect { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); }
      `}} />
    </ShopContext.Provider>
  );
};

// --- Render ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ShopProvider>
      <App />
    </ShopProvider>
  </React.StrictMode>
);