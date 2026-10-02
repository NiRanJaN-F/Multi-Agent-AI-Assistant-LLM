// public/js/api.js
// ES module providing a thin wrapper around the backend e‑commerce API.

const API_BASE = '/api';

/**
 * Helper to process fetch responses.
 * Throws an error if the API indicates failure or the HTTP status is not ok.
 */
async function handleResponse(response) {
  const json = await response.json();
  if (!response.ok || !json.success) {
    const errMsg = json.message || response.statusText || 'API error';
    throw new Error(errMsg);
  }
  return json.data;
}

/**
 * Fetch the list of products.
 * @returns {Promise<Array<{id:number,name:string,price:number,image:string}>>}
 */
export async function fetchProducts() {
  const resp = await fetch(`${API_BASE}/products`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(resp);
}

/**
 * Retrieve the current cart state.
 * @returns {Promise<{items:Array, total:number}>}
 */
export async function fetchCart() {
  const resp = await fetch(`${API_BASE}/cart`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(resp);
}

/**
 * Add a new item to the cart.
 * @param {number} productId
 * @param {number} [quantity=1]
 * @returns {Promise<{items:Array, total:number}>}
 */
export async function addItemToCart(productId, quantity = 1) {
  const resp = await fetch(`${API_BASE}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ productId, quantity }),
  });
  return handleResponse(resp);
}

/**
 * Update quantity of an existing cart item.
 * @param {number} itemId
 * @param {number} quantity
 * @returns {Promise<{items:Array, total:number}>}
 */
export async function updateCartItem(itemId, quantity) {
  const resp = await fetch(`${API_BASE}/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ quantity }),
  });
  return handleResponse(resp);
}

/**
 * Remove an item from the cart.
 * @param {number} itemId
 * @returns {Promise<{items:Array, total:number}>}
 */
export async function removeCartItem(itemId) {
  const resp = await fetch(`${API_BASE}/cart/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
  });
  return handleResponse(resp);
}

/**
 * Perform checkout.
 * @param {Object} checkoutData - payload expected by the backend (e.g., address, payment info)
 * @returns {Promise<{orderId:string}>}
 */
export async function checkout(checkoutData = {}) {
  const resp = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(checkoutData),
  });
  return handleResponse(resp);
}