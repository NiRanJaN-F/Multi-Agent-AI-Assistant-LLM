// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch {
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add an item to the cart
  const addItem = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // Remove an item from the cart
  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Update quantity for a specific item
  const updateQuantity = (id, quantity) => {
    const qty = Math.max(1, quantity);
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  };

  // Clear the entire cart
  const clearCart = () => setCartItems([]);

  // Calculate subtotal
  const getSubtotal = () =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Tax and delivery constants
  const TAX_RATE = 0.1; // 10%
  const DELIVERY_FEE = 5; // $5 flat fee

  // Calculate tax
  const getTax = () => getSubtotal() * TAX_RATE;

  // Calculate delivery fee (free if cart is empty)
  const getDeliveryFee = () => (getSubtotal() > 0 ? DELIVERY_FEE : 0);

  // Calculate grand total
  const getGrandTotal = () =>
    getSubtotal() + getTax() + getDeliveryFee();

  // Checkout modal controls
  const openCheckout = () => setIsCheckoutOpen(true);
  const closeCheckout = () => setIsCheckoutOpen(false);

  // Memoize context value to avoid unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      cartItems,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getSubtotal,
      getTax,
      getDeliveryFee,
      getGrandTotal,
      isCheckoutOpen,
      openCheckout,
      closeCheckout,
    }),
    [
      cartItems,
      isCheckoutOpen,
      getSubtotal(),
      getTax(),
      getDeliveryFee(),
      getGrandTotal(),
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);