'use strict';

(function () {
  'use strict';

  // ─── State Management ────────────────────────────────────────────────
  const state = {
    products: [],
    cart: { items: [], total: 0 },
    currentView: 'products', // 'products' | 'cart' | 'checkout' | 'confirmation'
    selectedProduct: null,
    orderResult: null,
    loading: false,
    searchQuery: '',
    sortBy: 'default',
  };

  // ─── DOM References ──────────────────────────────────────────────────
  const root = document.getElementById('app-root');
  const headerEl = document.getElementById('header');
  const mainEl = document.getElementById('main-content');
  const footerEl = document.getElementById('footer');
  const cartBadge = document.getElementById('cart-badge');
  const cartCount = document.getElementById('cart-count');
  const searchInput = document.getElementById('search-input');
  const sortBySelect = document.getElementById('sort-by');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const cartCheckoutBtn = document.getElementById('cart-checkout-btn');
  const cartClearBtn = document.getElementById('cart-clear-btn');
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutSubmitBtn = document.getElementById('checkout-submit-btn');
  const checkoutOrderSummary = document.getElementById('checkout-order-summary');
  const confirmationContainer = document.getElementById('confirmation-container');
  const productDetailContainer = document.getElementById('product-detail-container');
  const productListContainer = document.getElementById('product-list');
  const loadingSpinner = document.getElementById('loading-spinner');

  // ─── Utility Functions ───────────────────────────────────────────────
  function formatCurrency(amount) {
    return '$' + Number(amount).toFixed(2);
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function showLoading() {
    loadingSpinner.classList.add('visible');
  }

  function hideLoading() {
    loadingSpinner.classList.remove('visible');
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ─── API Calls ───────────────────────────────────────────────────────
  async function fetchProducts() {
    try {
      showLoading();
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      state.products = data.products || [];
      hideLoading();
      renderProductList();
    } catch (error) {
      hideLoading();
      console.error('Failed to fetch products:', error);
      showToast('Failed to load products. Please try again.', 'error');
      productListContainer.innerHTML = `
        <div class="error-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Unable to load products</h3>
          <p>Please check your connection and try again.</p>
          <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  async function fetchProductDetail(productId) {
    try {
      showLoading();
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      state.selectedProduct = data.product;
      hideLoading();
      renderProductDetail();
    } catch (error) {
      hideLoading();
      console.error('Failed to fetch product detail:', error);
      showToast('Failed to load product details.', 'error');
    }
  }

  async function fetchCart() {
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      state.cart = data;
      updateCartBadge();
      renderCartItems();
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  }

  async function addToCart(productId) {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        state.cart = data.cart;
        updateCartBadge();
        renderCartItems();
        showToast('Product added to cart!');
        openCartSidebar();
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showToast('Failed to add product to cart.', 'error');
    }
  }

  async function updateCartItem(productId, quantity) {
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        state.cart = data.cart;
        updateCartBadge();
        renderCartItems();
        renderCheckoutSummary();
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      showToast('Failed to update cart.', 'error');
    }
  }

  async function removeFromCart(productId) {
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        state.cart = data.cart;
        updateCartBadge();
        renderCartItems();
        renderCheckoutSummary();
        showToast('Item removed from cart.');
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      showToast('Failed to remove item.', 'error');
    }
  }

  async function clearCart() {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success) {
        state.cart = data.cart;
        updateCartBadge();
        renderCartItems();
        showToast('Cart cleared.');
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);