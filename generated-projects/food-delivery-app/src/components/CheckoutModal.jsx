import React, { useContext, useState, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import { api } from '../api';

export default function CheckoutModal({ isOpen, onClose }) {
  const { cartItems, clearCart } = useContext(CartContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const taxRate = 0.08;
  const deliveryFee = 5.0;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * taxRate;
  const total = subtotal + tax + deliveryFee;

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPaymentMethod('card');
      setErrors({});
      setSubmitError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Valid email is required';
    if (!phone.trim() || !/^\+?[0-9]{7,15}$/.test(phone))
      newErrors.phone = 'Valid phone number is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    setSubmitError('');

    const order = {
      customer: { name, email, phone, address },
      items: cartItems.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      paymentMethod,
      subtotal,
      tax,
      deliveryFee,
      total,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await api.createOrder(order);
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to place order');
      }
      clearCart();
      onClose();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="checkout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="checkout-title"
    >
      <div className="bg-gray-900 text-gray-200 rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-100"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 id="checkout-title" className="text-2xl font-semibold mb-4">
          Checkout
        </h2>

        {submitError && (
          <div className="mb-4 text-sm text-red-400">{submitError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1 block w-full rounded-md border ${
                  errors.name ? 'border-red-500' : 'border-gray-700'
                } bg-gray-800 text-gray-200 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 block w-full rounded-md border ${
                  errors.email ? 'border-red-500' : 'border-gray-700'
                } bg-gray-800 text-gray-200 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`mt-1 block w-full rounded-md border ${
                  errors.phone ? 'border-red-500' : 'border-gray-700'
                }