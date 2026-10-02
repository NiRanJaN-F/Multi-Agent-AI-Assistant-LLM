// frontend/src/components/Cart.jsx
import { useEffect, useState } from "react";

const Cart = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState(null);
  const [toasts, setToasts] = useState([]);

  // ---------- Toast helpers ----------
  const addToast = (type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // ---------- API calls ----------
  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      addToast("error", "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((it) => (it._id === itemId ? { ...it, quantity } : it))
        );
        recalcTotal();
        addToast("success", "Quantity updated.");
      } else {
        throw new Error();
      }
    } catch {
      addToast("error", "Unable to update quantity.");
    }
  };

  const deleteItem = async (itemId) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((it) => it._id !== itemId));
        recalcTotal();
        addToast("success", "Item removed.");
      } else {
        throw new Error();
      }
    } catch {
      addToast("error", "Failed to remove item.");
    }
  };

  const recalcTotal = () => {
    setTotal((prev) =>
      items.reduce((sum, it) => sum + it.price * it.quantity, 0)
    );
  };

  // ---------- Effects ----------
  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    // Refresh icons after each render that changes DOM
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }, [items, loading]);

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto p-4">
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-2 rounded shadow-md text-white ${
              t.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            <i data-lucide={t.type === "success" ? "check-circle" : "x-circle"} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <h1 className="text-3xl font-semibold mb-6">Your Shopping Cart</h1>

      {items.length === 0 ? (
        <p className="text-gray-600">Your cart is empty. Start shopping!</p>
      ) : (
        <>
          {/* Cart Items */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white rounded shadow"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-medium text-lg truncate">{item.name}</h2>
                  <p className="text-gray-500">${item.price.toFixed(2)}</p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item._id, item.quantity - 1)
                    }
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <i data-lucide="minus" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item._id, item.quantity + 1)
                    }
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <i data-lucide="plus" />
                  </button>
                </div>

                {/* Subtotal */}
                <p className="w-24 text-right font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>

                {/* Delete */}
                <button
                  onClick={() => setModalItem(item)}
                  className="p-2 rounded hover:bg-gray-100 text-red-600"
                >
                  <i data-lucide="trash-2" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="flex justify-end items-center mt-6 space-x-4">
            <p className="text-xl font-semibold">
              Total: <span className="text-primary">${total.toFixed(2)}</span>
            </p>
            <button className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition">
              Proceed to Checkout
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {modalItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-lg">
            <h3 className="text-lg font-medium mb-4">Remove Item</h3>
            <p className="mb-6">
              Are you sure you want to remove{" "}
              <span className="font-semibold">{modalItem.name}</span> from your
              cart?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalItem(null)}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteItem(modalItem._id);
                  setModalItem(null);
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Cart;