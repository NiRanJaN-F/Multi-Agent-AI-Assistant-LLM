// src/api/index.js
// Central API wrapper for the Food Delivery web app.
// All endpoints are prefixed with `/api` and use the native Fetch API.
// The functions return parsed JSON responses or throw an error on failure.

const API_BASE = '/api';

/**
 * Fetch the full menu from the backend.
 * @returns {Promise<Array>} Array of menu items.
 */
export async function fetchMenu() {
  const response = await fetch(`${API_BASE}/menu`);
  if (!response.ok) {
    throw new Error(`Failed to fetch menu: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Retrieve the current cart from the backend.
 * @returns {Promise<Object>} Cart object containing items and totals.
 */
export async function fetchCart() {
  const response = await fetch(`${API_BASE}/cart`);
  if (!response.ok) {
    throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Add a new item to the cart.
 * @param {Object} item - Item to add (must contain id, name, price, quantity).
 * @returns {Promise<Object>} Updated cart object.
 */
export async function addItemToCart(item) {
  const response = await fetch(`${API_BASE}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    throw new Error(`Failed to add item to cart: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Update the quantity of an existing cart item.
 * @param {string|number} itemId - Identifier of the cart item.
 * @param {number} quantity - New quantity.
 * @returns {Promise<Object>} Updated cart object.
 */
export async function updateCartItem(itemId, quantity) {
  const response = await fetch(`${API_BASE}/cart/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update cart item: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Remove an item from the cart.
 * @param {string|number} itemId - Identifier of the cart item.
 * @returns {Promise<Object>} Updated cart object.
 */
export async function removeCartItem(itemId) {
  const response = await fetch(`${API_BASE}/cart/${itemId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to remove cart item: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Submit the final order for checkout.
 * @param {Object} order - Order payload containing cart items and user details.
 * @returns {Promise<Object>} Server response (e.g., confirmation number).
 */
export async function submitOrder(order) {
  const response = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit order: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Calculate subtotal, tax, delivery fee, and total for a given cart.
 * @param {Array} items - Array of cart items (each with price and quantity).
 * @param {number} taxRate - Tax rate as a decimal (e.g., 0.08 for 8%).
 * @param {number} deliveryFee - Flat delivery fee.
 * @returns {Object} Totals object: { subtotal, tax, delivery, total }.
 */
export function calculateTotals(items, taxRate = 0.08, deliveryFee = 5.0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax + deliveryFee;
  return { subtotal, tax, delivery: deliveryFee, total };
}