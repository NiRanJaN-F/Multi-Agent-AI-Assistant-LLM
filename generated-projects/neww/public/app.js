/* =========================================================================
   public/app.js — Storefront client
   Vanilla JS SPA: product grid, cart sidebar, checkout, order confirmation.
   Talks to the Express API defined in the contract.
   ========================================================================= */

(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 1. STATE
   * ------------------------------------------------------------------ */
  const state = {
    products: [],
    cartId: null,
    cartItems: [],          // [{ productId, quantity }]
    checkout: {
      name: '',
      email: '',
      address: '',
      city: '',
      zip: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
    },
    order: null,            // { orderId, status }
    view: 'shop',           // 'shop' | 'checkout' | 'confirmation'
    filters: {
      query: '',
      category: 'all',
      sort: 'featured',
    },
    toasts: [],
  };

  const CART_KEY = 'storefront.cartId';
  const CHECKOUT_KEY = 'storefront.checkout';

  const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'audio', label: 'Audio' },
    { id: 'wearables', label: 'Wearables' },
    { id: 'home', label: 'Home' },
    { id: 'lighting', label: 'Lighting' },
    { id: 'accessories', label: 'Accessories' },
  ];

  const SORTS = [
    { id: 'featured', label: 'Featured' },
    { id: 'price-asc', label: 'Price: Low → High' },
    { id: 'price-desc', label: 'Price: High → Low' },
    { id: 'name', label: 'Name A–Z' },
  ];

  /* ------------------------------------------------------------------ *
   * 2. DOM REFERENCES
   * ------------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const els = {};

  function cacheDom() {
    els.header = $('#header');
    els.searchInput = $('#search-input');
    els.cartToggle = $('#cart-toggle');
    els.cartCount = $('#cart-count');
    els.cartSidebar = $('#cart-sidebar');
    els.cartBackdrop = $('#cart-backdrop');
    els.cartClose = $('#cart-close');
    els.cartItems = $('#cart-items');
    els.cartEmpty = $('#cart-empty');
    els.cartSubtotal = $('#cart-subtotal');
    els.cartCheckoutBtn = $('#cart-checkout-btn');

    els.productGrid = $('#product-grid');
    els.categoryChips = $('#category-chips');
    els.sortSelect = $('#sort-select');
    els.resultCount = $('#result-count');

    els.checkoutForm = $('#checkout-form');
    els.checkoutSummary = $('#checkout-summary');
    els.checkoutBack = $('#checkout-back');
    els.placeOrderBtn = $('#place-order-btn');

    els.confirmation = $('#order-confirmation');
    els.confirmOrderId = $('#confirm-order-id');
    els.confirmEmail = $('#confirm-email');
    els.confirmTotal = $('#confirm-total');
    els.confirmItems = $('#confirm-items');
    els.confirmBack = $('#confirm-back');

    els.toastContainer = $('#toast-container');
    els.footer = $('#footer');
    els.year = $('#year');
  }

  /* ------------------------------------------------------------------ *
   * 3. HELPERS
   * ------------------------------------------------------------------ */
  const money = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .format(Number(n) || 0);

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  const debounce = (fn, ms = 250) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const slugify = (s) =>
    String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const productById = (id) => state.products.find((p) => p.id === id);

  const cartQty = (productId) => {
    const it = state.cartItems.find((i) => i.productId === productId);
    return it ? it.quantity : 0;
  };

  const cartTotal = () =>
    state.cartItems.reduce((sum, item) => {
      const p = productById(item.productId);
      return p ? sum + p.price * item.quantity : sum;
    }, 0);

  const cartCount = () =>
    state.cartItems.reduce((sum, item) => sum + item.quantity, 0);

  /* ------------------------------------------------------------------ *
   * 4. API CLIENT
   * ------------------------------------------------------------------ */
  const api = {
    async getProducts() {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },

    async createCart() {
      const res = await fetch('/api/cart', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create cart');
      return res.json();
    },

    async getCart(cartId) {
      const res = await fetch(`/api/cart/${cartId}`);
      if (!res.ok) throw new Error('Failed to fetch cart');
      return res.json();
    },

    async addToCart(cartId, productId, quantity = 1) {
      const res = await fetch(`/api/cart/${cartId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      if (!res.ok) throw new Error('Failed to add to cart');
      return res.json();
    },

    async updateCartItem(cartId, productId, quantity) {
      const res = await fetch(`/api/cart/${cartId}/items/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error('Failed to update cart item');
      return res.json();
    },

    async removeFromCart(cartId, productId) {
      const res = await fetch(`/api/cart/${cartId}/items/${productId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove from cart');
      return res.json();
    },

    async checkout(cartId, details) {
      const res = await fetch(`/api/cart/${cartId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      if (!res.ok) throw new Error('Checkout failed');
      return res.json();
    },
  };

  /* ------------------------------------------------------------------ *
   * 5. TOASTS
   * ------------------------------------------------------------------ */
  function showToast(message, type = 'info', duration = 3000) {
    const id = Date.now() + Math.random();
    state.toasts.push({ id, message, type });
    renderToasts();
    setTimeout(() => {
      state.toasts = state.toasts.filter((t) => t.id !== id);
      renderToasts();
    }, duration);
  }

  function renderToasts() {
    if (!els.toastContainer) return;
    els.toastContainer.innerHTML = state.toasts
      .map(
        (t) => `
        <div class="toast toast--${t.type}" data-toast-id="${t.id}">
          <span class="toast__message">${escapeHtml(t.message)}</span>
          <button class="toast__close" data-close-toast="${t.id}" aria-label="Close notification">&times;</button>
        </div>`
      )
      .join('');

    // Bind close buttons
    $$('.toast__close', els.toastContainer).forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.closeToast);
        state.toasts = state.toasts.filter((t) => t.id !== id);
        renderToasts();
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 6. RENDERING
   * ------------------------------------------------------------------ */
  function renderHeader() {
    if (els.cartCount) {
      const count = cartCount();
      els.cartCount.textContent = count;
      els.cartCount.classList.toggle('cart-count--hidden', count === 0);
    }
  }