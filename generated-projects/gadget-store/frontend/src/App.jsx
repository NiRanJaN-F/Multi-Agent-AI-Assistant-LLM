import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Footer from './components/Footer';

/**
 * Simple toast system
 */
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map((t) => (
      <div
        key={t.id}
        className="bg-gray-800 text-white px-4 py-2 rounded shadow-md flex items-center space-x-2"
      >
        <span>{t.message}</span>
        <button
          onClick={() => removeToast(t.id)}
          className="ml-auto text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
);

const App = () => {
  /* ---------- State ---------- */
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toasts, setToasts] = useState([]);

  /* ---------- Helpers ---------- */
  const addToast = (msg) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message: msg }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products);
      setFilteredProducts(data.products);
    } catch (e) {
      console.error(e);
      addToast('Failed to load products');
    }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      setCartItems(data.items);
      setCartTotal(data.total);
    } catch (e) {
      console.error(e);
      addToast('Failed to load cart');
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterProducts(term, selectedCategory);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    filterProducts(searchTerm, category);
  };

  const filterProducts = (term, category) => {
    let filtered = products;
    if (category !== 'All') {
      filtered = filtered.filter((p) => p.category === category);
    }
    if (term) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(term.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (productId) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.success) {
        setCartItems((prev) => [...prev, data.item]);
        setCartTotal((prev) => prev + data.item.quantity * getProductPrice(productId));
        addToast('Added to cart');
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to add to cart');
    }
  };

  const getProductPrice = (id) => {
    const prod = products.find((p) => p._id === id);
    return prod ? prod.price : 0;
  };

  const handleUpdateCartItem = async (itemId, quantity) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (data.success) {
        setCartItems((prev) =>
          prev.map((i) => (i._id === itemId ? data.item : i))
        );
        // Recalculate total
        const newTotal = cartItems.reduce((sum, i) => {
          if (i._id === itemId) return sum + quantity * getProductPrice(i.productId);
          return sum + i.quantity * getProductPrice(i.productId);
        }, 0);
        setCartTotal(newTotal);
        addToast('Cart updated');
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to update cart');
    }
  };

  const handleDeleteCartItem = async (itemId) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
      const