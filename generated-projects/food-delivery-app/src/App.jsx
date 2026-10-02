import React, { useState } from 'react';
import Header from './components/Header';
import ItemList from './components/ItemList';
import Cart from './components/Cart';
import CheckoutModal from './components/CheckoutModal';
import Footer from './components/Footer';
import { CartProvider } from './context/CartContext';

function App() {
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);

  const openCheckout = () => setCheckoutOpen(true);
  const closeCheckout = () => setCheckoutOpen(false);

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Header />
        <main className="flex flex-1 container mx-auto px-4 py-6">
          <ItemList className="flex-1" />
          <Cart onCheckout={openCheckout} />
        </main>
        <CheckoutModal isOpen={isCheckoutOpen} onClose={closeCheckout} />
        <Footer />
      </div>
    </CartProvider>
  );
}

export default App;