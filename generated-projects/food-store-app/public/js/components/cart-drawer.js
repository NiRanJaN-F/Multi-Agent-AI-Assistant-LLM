/**
 * @file cart-drawer.js
 * @description Slide-over cart drawer component for DEVGEAR e-commerce storefront.
 * Handles display of cart items, quantity adjustments, item removal, subtotal/shipping calculations,
 * checkout flow simulations, and reactive DOM updates synced with store.js.
 */

import { store } from '../store.js';

/**
 * Renders and initializes the slide-over cart drawer inside #cart-drawer-container.
 */
export function initCartDrawer() {
  const container = document.getElementById('cart-drawer-container');
  if (!container) return;

  container.innerHTML = `
    <!-- Cart Backdrop Overlay -->
    <div id="cart-backdrop" class="fixed inset-0 bg-dark-950/80 backdrop-blur-md z-50 transition-opacity duration-300 opacity-0 pointer-events-none"></div>

    <!-- Slide-over Drawer Panel -->
    <div id="cart-drawer" class="fixed inset-y-0 right-0 max-w-md w-full bg-dark-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-50 flex flex-col transform translate-x-full transition-transform duration-300 ease-in-out">
      
      <!-- Drawer Header -->
      <div class="p-6 border-b border-slate-800 flex items-center justify-between bg-dark-800/40">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              Your Hardware Cart
              <span id="cart-drawer-count-badge" class="text-xs px-2 py-0.5 rounded-full bg-brand text-white font-mono">0</span>
            </h3>
            <p class="text-xs text-slate-400">Review your selected items before checkout</p>
          </div>
        </div>
        <button id="close-cart-btn" class="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Free Shipping Progress Bar -->
      <div class="px-6 py-3 bg-dark-800/20 border-b border-slate-800/60">
        <div class="flex items-center justify-between text-xs mb-1.5">
          <span id="shipping-progress-text" class="text-slate-300 font-medium">Add $50.00 more for Free Priority Shipping</span>
          <span id="shipping-progress-percent" class="text-brand font-mono font-bold">0%</span>
        </div>
        <div class="w-full h-2 bg-dark-950 rounded-full overflow-hidden border border-slate-800">
          <div id="shipping-progress-bar" class="h-full bg-gradient-to-r from-brand to-brand-accent transition-all duration-500 rounded-full" style="width: 0%"></div>
        </div>
      </div>

      <!-- Cart Items List Container -->
      <div id="cart-items-container" class="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-slate-800/60">
        <!-- Dynamically populated by renderCartItems() -->
      </div>

      <!-- Drawer Footer & Checkout Actions -->
      <div id="cart-footer" class="p-6 border-t border-slate-800 bg-dark-800/40 space-y-4">
        <!-- Cost breakdown -->
        <div class="space-y-2 text-sm">
          <div class="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span id="cart-subtotal" class="font-mono text-slate-200">$0.00</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>Estimated Shipping</span>
            <span id="cart-shipping" class="font-mono text-slate-200">Calculated at checkout</span>
          </div>
          <div class="flex justify-between text-slate-400">
            <span>Tax (10%)</span>
            <span id="cart-tax" class="font-mono text-slate-200">$0.00</span>
          </div>
          <div class="pt-2 border-t border-slate-800 flex justify-between text-base font-bold text-white">
            <span>Total</span>
            <span id="cart-total" class="font-mono text-brand text-lg">$0.00</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-2 gap-3">
          <button id="clear-cart-btn" class="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 hover:text-red-400 text-slate-300 font-medium text-sm transition-colors flex items-center justify-center gap-2 border border-slate-700/50">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
            Clear Cart
          </button>
          <button id="checkout-btn" class="px-4 py-3 rounded-xl bg-gradient-to-r from-brand to-brand-accent hover:from-brand-accent hover:to-brand text-white font-medium text-sm shadow-lg shadow-brand/25 transition-all flex items-center justify-center gap-2 group">
            <span>Checkout</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>

        <!-- Secure Checkout Badges -->
        <div class="flex items-center justify-center gap-4 pt-2 text-xs text-slate-500">
          <span class="flex items-center gap-1"><i data-lucide="shield-check" class="w-3.5 h-3.5 text-brand"></i> Secure 256-bit SSL</span>
          <span class="flex items-center gap-1"><i data-lucide="zap" class="w-3.5 h-3.5 text-brand"></i> Instant Dispatch</span>
        </div>
      </div>

    </div>
  `;

  // Attach event listeners for drawer toggling and interaction
  setupCartDrawerEvents();

  // Initial subscription to store changes
  store.subscribe(state => {
    updateCartDrawerUI(state);
  });

  // Render initial state
  updateCartDrawerUI(store.getState());
}

/**
 * Sets up DOM event listeners for the cart drawer (open, close, quantity changes, checkout).
 */
function setupCartDrawerEvents() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  const closeBtn = document.getElementById('close-cart-btn');
  const clearBtn = document.getElementById('clear-cart-btn');
  const checkoutBtn = document.getElementById('checkout-btn');
  const cartItemsContainer = document.getElementById('cart-items-container');

  // Open cart listener (triggered from navbar badge or elsewhere)
  window.addEventListener('open-cart', () => {
    openCartDrawer();
  });

  // Close handlers
  closeBtn?.addEventListener('click', closeCartDrawer);
  backdrop?.addEventListener('click', closeCartDrawer);
  
  // Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCartDrawer();
  });

  // Clear cart
  clearBtn?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all items from your cart?')) {
      store.clearCart();
    }
  });

  // Checkout simulation
  checkoutBtn?.addEventListener('click', () => {
    const state = store.getState();
    if (state.cart.length === 0) {
      alert('Your cart is empty. Add some developer gear first!');
      return;
    }
    
    // Simulate secure checkout modal / process
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const grandTotal = subtotal + tax;

    alert(`🎉 Order Simulation Successful!\n\nThank you for shopping with DEVGEAR.\nItems: ${state.cart.reduce((sum, i) => sum + i.quantity, 0)}\nTotal (inc. tax): $${grandTotal.toFixed(2)}\n\nYour hardware will be dispatched immediately!`);
    
    store.clearCart();
    closeCartDrawer();
  });

  // Event delegation for cart items (quantity increments, decrements, remove)
  cartItemsContainer?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = parseInt(btn.dataset.id, 10);
    if (isNaN(id)) return;

    if (btn.classList.contains('increase-qty-btn')) {
      const item = store.getState().cart.find(i => i.id === id);
      if (item) {
        store.updateQuantity(id, item.quantity + 1);
      }
    } else if (btn.classList.contains('decrease-qty-btn')) {
      const item = store.getState().cart.find(i => i.id === id);
      if (item && item.quantity > 1) {
        store.updateQuantity(id, item.quantity - 1);
      } else {
        store.removeFromCart(id);
      }
    } else if (btn.classList.contains('remove-item-btn')) {
      store.removeFromCart(id);
    }
  });
}

/**
 * Opens the cart drawer with smooth transitions.
 */
function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (!drawer || !backdrop) return;

  backdrop.classList.remove('opacity-0', 'pointer-events-none');
  backdrop.classList.add('opacity-100');
  drawer.classList.remove('translate-x-full');
  drawer.classList.add('translate-x-0');
}

/**
 * Closes the cart drawer with smooth transitions.
 */
function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (!drawer || !backdrop) return;

  backdrop.classList.remove('opacity-100');
  backdrop.classList.add('opacity-0', 'pointer-events-none');
  drawer.classList.remove('translate-x-0');
  drawer.classList.add('translate-x-full');
}

/**
 * Updates the cart drawer UI elements based on the current store state.
 * @param {Object} state - The current application state.
 */
function updateCartDrawerUI(state) {
  const countBadge = document.getElementById('cart-drawer-count-badge');
  const itemsContainer = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const taxEl = document.getElementById('cart-tax');
  const totalEl = document.getElementById('cart-total');
  
  const progressBar = document.getElementById('shipping-progress-bar');
  const progressText = document.getElementById('shipping-progress-text');
  const progressPercent = document.getElementById('shipping-progress-percent');

  if (!itemsContainer) return;

  const totalItemsCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (countBadge) countBadge.textContent = totalItemsCount;

  // Render items or empty state
  if (state.cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
        <div class="w-16 h-16 rounded-2xl bg-dark-800/80 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
          <i data-lucide="shopping-cart" class="w-8 h-8"></i>
        </div>
        <div class="space-y-1">
          <h4 class="text-base font-bold text-white">Your cart is empty</h4>
          <p class="text-xs text-slate-400 max-w-[220px]">Explore our top-tier mechanical keyboards and developer gear.</p>
        </div>
        <button onclick="document.getElementById('cart-backdrop').click()" class="px-4 py-2 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold border border-brand/20 transition-colors">
          Start Shopping
        </button>
      </div>
    `;
  } else {
    itemsContainer.innerHTML = state.cart.map(item => `
      <div class="flex gap-4 pt-4 first:pt-0 group">
        <div class="w-20 h-20 rounded-xl bg-dark-950 border border-slate-800/80 overflow-hidden flex-shrink-0 relative">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        </div>
        <div class="flex-1 min-w-0 flex flex-col justify-between">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[10px] font-mono tracking-wider uppercase text-brand">${item.category}</span>
              <h4 class="text-sm font-semibold text-white truncate max-w-[180px]">${item.name}</h4>
            </div>
            <button data-id="${item.id}" class="remove-item-btn text-slate-500 hover:text-red-400 transition-colors p-1" title="Remove item">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
          
          <div class="flex items-center justify-between mt-2">
            <span class="font-mono text-sm font-bold text-slate-200">$${(item.price * item.quantity).toFixed(2)}</span>
            
            <div class="flex items-center border border-slate-800 rounded-lg bg-dark-950 overflow-hidden">
              <button data-id="${item.id}" class="decrease-qty-btn px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs">
                -
              </button>
              <span class="px-2 py-1 font-mono text-xs text-white min-w-[24px] text-center">${item.quantity}</span>
              <button data-id="${item.id}" class="increase-qty-btn px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs">
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Calculations
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const shippingThreshold = 150.00;
  const shippingCost = subtotal >= shippingThreshold || subtotal === 0 ? 0 : 15.00;
  const grandTotal = subtotal + tax + shippingCost;

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (shippingEl) shippingEl.textContent = shippingCost === 0 && subtotal > 0 ? 'FREE' : (subtotal === 0 ? '$0.00' : `$${shippingCost.toFixed(2)}`);
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;

  // Shipping progress bar update
  const remainingForFreeShipping = Math.max(0, shippingThreshold - subtotal);
  const progressPercentage = Math.min(100, (subtotal / shippingThreshold) * 100);

  if (progressBar) progressBar.style.width = `${progressPercentage}%`;
  if (progressPercent) progressPercent.textContent = `${Math.round(progressPercentage)}%`;
  if (progressText) {
    if (remainingForFreeShipping === 0 && subtotal > 0) {
      progressText.innerHTML = '<span class="text-brand font-semibold flex items-center gap-1"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i> You unlocked Free Priority Shipping!</span>';
    } else {
      progressText.textContent = `Add $${remainingForFreeShipping.toFixed(2)} more for Free Priority Shipping`;
    }
  }

  // Re-initialize Lucide icons for dynamically added elements
  if (window.lucide) {
    window.lucide.createIcons();
  }
}