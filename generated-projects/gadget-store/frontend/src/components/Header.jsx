// frontend/src/components/Header.jsx
import { useState, useEffect, useRef } from "react";

/* ---------- Toast Component ---------- */
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none">
      <div className="flex flex-col space-y-2 w-full max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center p-4 rounded shadow-lg transition-all
                        ${
                          t.type === "error"
                            ? "bg-red-600 text-white"
                            : "bg-green-600 text-white"
                        }`}
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-4 hover:opacity-80"
            >
              <i data-lucide="x" className="w-4 h-4"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Header Component ---------- */
export default function Header({ onSearch, onFilter }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [toasts, setToasts] = useState([]);

  const debounceRef = useRef(null);

  /* ---------- Helper: Toast ---------- */
  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message: msg, type }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /* ---------- Fetch Cart ---------- */
  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setCartItems(data.items || []);
      setCartTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      addToast("Failed to load cart.", "error");
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  /* ---------- Search & Filter ---------- */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch?.(search);
    }, 300);
  }, [search, onSearch]);

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setCategory(cat);
    onFilter?.(cat);
  };

  /* ---------- Cart Actions ---------- */
  const addToCart = async (productId) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("Item added to cart!");
        fetchCart();
      } else {
        throw new Error("Add failed");
      }
    } catch (e) {
      console.error(e);
      addToast("Could not add item.", "error");
    }
  };

  const updateCartItem = async (itemId, qty) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      const data = await res.json();
      if (data.success) {
        addToast("Cart updated.");
        fetchCart();
      } else {
        throw new Error("Update failed");
      }
    } catch (e) {
      console.error(e);
      addToast("Could not update item.", "error");
    }
  };

  const removeCartItem = async (itemId) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        addToast("Item removed.");
        fetchCart();
      } else {
        throw new Error("Delete failed");
      }
    } catch (e) {
      console.error(e);
      addToast("Could not remove item.", "error");
    }
  };

  /* ---------- Icons Refresh ---------- */
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  /* ---------- Render ---------- */
  return (
    <>
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          {/* Brand */}
          <div className="flex-shrink-0 text-2xl font-bold text-indigo-600">
            ShopMate
          </div>

          {/* Search */}
          <div className="flex-1 mx-4">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div className="mr-4">
            <select
              value={category}
              onChange={handleCategoryChange}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>All</option>
              <option>Electronics</option>
              <option>Clothing</option>
              <option>Home</option>
              <option>Books</option>
            </select>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 hover:bg-gray-100 rounded-full focus:outline-none"
          >
            <i data-lucide="shopping-cart" className="w-6 h-6 text-indigo-600"></i>
            {cartTotal > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartTotal}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Cart Modal */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6 relative">
            <button
              onClick={() => setCartOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <i data-lucide="x" className="w-5 h-5"></i>
            </button>
            <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
            {cartItems.length === 0 ? (
              <p className="text-gray-600">Your cart is empty.</p>
            ) : (
              <ul className="space-y-4 max-h-80 overflow-y-auto">
                {cartItems.map((item) => (
                  <li key={item._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.productId}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          updateCartItem(item._id, Math.max(1, item.quantity - 1))
                        }
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <i data-lucide="minus" className="w-4 h-4"></i>
                      </button>
                      <button
                        onClick={() => updateCartItem(item._id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <i data-lucide="plus" className="w-4 h-4"></i>
                      </button>
                      <button
                        onClick={() => removeCartItem(item._id)}
                        className="p-1 hover:bg-gray-200 rounded text-red-600"
                      >
                        <i data-lucide="trash-2" className="w-4 h-4"></i>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex justify-between items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-lg font-bold">${cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="mt-4 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* Toasts */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );
}