import { useContext, useState, useMemo } from "react";
import { CartContext } from "../context/CartContext";
import CheckoutModal from "./CheckoutModal";

const TAX_RATE = 0.1; // 10%
const DELIVERY_FEE = 5; // flat fee

export default function Cart() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useContext(CartContext);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  const tax = useMemo(() => subtotal * TAX_RATE, [subtotal]);
  const delivery = useMemo(() => (subtotal > 0 ? DELIVERY_FEE : 0), [
    subtotal,
  ]);
  const total = useMemo(() => subtotal + tax + delivery, [
    subtotal,
    tax,
    delivery,
  ]);

  const handleCheckout = () => setIsCheckoutOpen(true);
  const handleCloseModal = () => setIsCheckoutOpen(false);
  const handleConfirmOrder = () => {
    // In a real app you'd send the order to the server here
    clearCart();
    setIsCheckoutOpen(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="p-6 text-center text-gray-300 dark:text-gray-400">
        <p className="text-lg">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-gray-100 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Your Cart</h2>

      <ul className="space-y-4">
        {cartItems.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between bg-gray-800 p-3 rounded"
          >
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-400">
                ${item.price.toFixed(2)} each
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => decreaseQuantity(item.id)}
                className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600"
                aria-label={`Decrease quantity of ${item.name}`}
              >
                –
              </button>
              <span className="w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => increaseQuantity(item.id)}
                className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600"
                aria-label={`Increase quantity of ${item.name}`}
              >
                +
              </button>
            </div>

            <div className="flex flex-col items-end">
              <p className="font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
              <button
                onClick={() => removeItem(item.id)}
                className="text-xs text-red-400 hover:underline mt-1"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Summary */}
      <div className="mt-6 border-t border-gray-700 pt-4 text-gray-300">
        <div className="flex justify-between mb-2">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Tax (10%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Delivery</span>
          <span>${delivery.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg mt-3">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="mt-6 text-center">
        <button
          onClick={handleCheckout}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded disabled:opacity-50"
          disabled={cartItems.length === 0}
        >
          Proceed to Checkout
        </button>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmOrder}
          cartItems={cartItems}
          total={total}
        />
      )}
    </div>
  );
}