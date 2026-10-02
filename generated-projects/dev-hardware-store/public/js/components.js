/**
 * KEYCRAFT // Component Renderer & UI Generator
 * Handles dynamic DOM generation for product cards, cart drawer items, toast notifications, and modals.
 */

window.Components = {
  /**
   * Render a single product card
   * @param {Object} product 
   * @returns {string} HTML string for the product card
   */
  renderProductCard(product) {
    const isOutOfStock = product.stock <= 0;
    
    // Generate star rating icons
    const fullStars = Math.floor(product.rating);
    const hasHalfStar = product.rating % 1 !== 0;
    let starsHtml = '';
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHtml += `<i data-lucide="star" class="w-4 h-4 fill-amber-400 text-amber-400"></i>`;
      } else if (i === fullStars && hasHalfStar) {
        starsHtml += `<i data-lucide="star-half" class="w-4 h-4 fill-amber-400 text-amber-400"></i>`;
      } else {
        starsHtml += `<i data-lucide="star" class="w-4 h-4 text-slate-600"></i>`;
      }
    }

    const badgeHtml = product.badge 
      ? `<span class="absolute top-3 left-3 bg-cyan-500/90 backdrop-blur-md text-slate-950 font-semibold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">${product.badge}</span>`
      : '';

    return `
      <div class="group relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 flex flex-col h-full shadow-xl hover:shadow-cyan-500/10">
        <!-- Product Image & Top Badge -->
        <div class="relative aspect-[4/3] w-full overflow-hidden bg-slate-950/50 cursor-pointer product-detail-trigger" data-id="${product.id}">
          <img src="${product.image}" alt="${product.name}" class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" loading="lazy">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60"></div>
          ${badgeHtml}
          <div class="absolute top-3 right-3">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700/50 capitalize">
              ${product.category}
            </span>
          </div>
        </div>

        <!-- Product Content -->
        <div class="p-5 flex flex-col flex-grow justify-between gap-4">
          <div class="space-y-2">
            <!-- Ratings -->
            <div class="flex items-center gap-1.5">
              <div class="flex items-center gap-0.5">
                ${starsHtml}
              </div>
              <span class="text-xs font-medium text-slate-400">(${product.reviewsCount || 24})</span>
            </div>

            <!-- Title -->
            <h3 class="font-bold text-base text-slate-100 group-hover:text-cyan-400 transition-colors cursor-pointer product-detail-trigger line-clamp-1" data-id="${product.id}">
              ${product.name}
            </h3>

            <!-- Description -->
            <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              ${product.description}
            </p>
          </div>

          <!-- Specs pills -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            ${product.specs ? product.specs.slice(0, 2).map(spec => `
              <span class="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/40">
                ${spec}
              </span>
            `).join('') : ''}
          </div>

          <!-- Price & Add to Cart -->
          <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-auto">
            <div class="flex flex-col">
              <span class="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Price</span>
              <span class="text-lg font-extrabold text-white tracking-tight">$${product.price.toFixed(2)}</span>
            </div>
            
            <button 
              class="add-to-cart-btn px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-95 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              data-id="${product.id}"
              ${isOutOfStock ? 'disabled' : ''}
            >
              <i data-lucide="shopping-cart" class="w-4 h-4"></i>
              <span>${isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render cart items inside the slide-over drawer
   * @param {Array} cartItems 
   * @returns {string} HTML string for cart items list
   */
  renderCartItems(cartItems) {
    if (!cartItems || cartItems.length === 0) {
      return `
        <div class="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
          <div class="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-2">
            <i data-lucide="shopping-bag" class="w-10 h-10"></i>
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-slate-200 text-lg">Your cart is empty</h4>
            <p class="text-sm text-slate-400 max-w-xs">Looks like you haven't added any gear or mechanical keyboards to your rig yet.</p>
          </div>
          <button id="closeCartEmptyBtn" class="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl transition-colors border border-slate-700">
            Start Shopping
          </button>
        </div>
      `;
    }

    return `
      <div class="divide-y divide-slate-800/80">
        ${cartItems.map(item => `
          <div class="py-4 flex gap-4 items-center group">
            <div class="w-20 h-20 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0 relative">
              <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-slate-200 truncate group-hover:text-cyan-400 transition-colors">${item.name}</h4>
              <p class="text-xs text-slate-400 mt-0.5">$${item.price.toFixed(2)} each</p>
              
              <div class="flex items-center justify-between mt-3">
                <div class="flex items-center border border-slate-700/80 bg-slate-900/90 rounded-lg overflow-hidden">
                  <button class="cart-qty-btn decrease-qty p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" data-id="${item.id}" aria-label="Decrease quantity">
                    <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                  </button>
                  <span class="px-3 text-xs font-semibold text-slate-200">${item.quantity}</span>
                  <button class="cart-qty-btn increase-qty p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" data-id="${item.id}" aria-label="Increase quantity">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  </button>
                </div>

                <button class="remove-item-btn text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors" data-id="${item.id}" aria-label="Remove item">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Render product detail modal content
   * @param {Object} product 
   * @returns {string} HTML string for the modal body
   */
  renderProductModal(product) {
    if (!product) return '';
    
    // Generate star rating icons
    const fullStars = Math.floor(product.rating);
    const hasHalfStar = product.rating % 1 !== 0;
    let starsHtml = '';
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHtml += `<i data-lucide="star" class="w-4 h-4 fill-amber-400 text-amber-400"></i>`;
      } else if (i === fullStars && hasHalfStar) {
        starsHtml += `<i data-lucide="star-half" class="w-4 h-4 fill-amber-400 text-amber-400"></i>`;
      } else {
        starsHtml += `<i data-lucide="star" class="w-4 h-4 text-slate-600"></i>`;
      }
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <!-- Left: Image Gallery / Main View -->
        <div class="space-y-4">
          <div class="relative aspect-[4/3] rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl">
            <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
            ${product.badge ? `<span class="absolute top-4 left-4 bg-cyan-500 text-slate-950 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">${product.badge}</span>` : ''}
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="aspect-video rounded-xl bg-slate-900 border border-cyan-500/50 overflow-hidden cursor-pointer">
              <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity">
            </div>
            <div class="aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
              <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover filter brightness-75">
            </div>
            <div class="aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
              <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover filter contrast-125">
            </div>
          </div>
        </div>

        <!-- Right: Info & Actions -->
        <div class="flex flex-col space-y-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs uppercase font-bold tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">${product.category}</span>
              <span class="text-xs text-slate-400">• Stock: <strong class="text-emerald-400">${product.stock} units</strong></span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">${product.name}</h2>
            
            <div class="flex items-center gap-2 mt-3">
              <div class="flex items-center gap-0.5">${starsHtml}</div>
              <span class="text-sm font-semibold text-slate-300">${product.rating}</span>
              <span class="text-xs text-slate-500">(${product.reviewsCount || 24} developer reviews)</span>
            </div>
          </div>

          <div class="text-3xl font-extrabold text-white tracking-tight">
            $${product.price.toFixed(2)}
          </div>

          <p class="text-sm text-slate-300 leading-relaxed">
            ${product.description}
          </p>

          <!-- Specs List -->
          ${product.specs && product.specs.length > 0 ? `
            <div class="space-y-2 pt-2 border-t border-slate-800">
              <h4 class="text-xs uppercase tracking-wider font-bold text-slate-400">Hardware Specifications</h4>
              <ul class="grid grid-cols-2 gap-2">
                ${product.specs.map(spec => `
                  <li class="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
                    <i data-lucide="check" class="w-3.5 h-3.5 text-cyan-400 flex-shrink-0"></i>
                    <span class="truncate">${spec}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Action Button -->
          <div class="pt-4 border-t border-slate-800 flex items-center gap-4">
            <button 
              class="modal-add-to-cart flex-1 py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm rounded-xl shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              data-id="${product.id}"
            >
              <i data-lucide="shopping-cart" class="w-5 h-5"></i>
              <span>Add to Cart - $${product.price.toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render toast notification
   * @param {string} message 
   * @param {string} type ('success', 'info', 'error')
   * @returns {HTMLElement} toast element
   */
  showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform translate-y-4 opacity-0 ${
      type === 'success' 
        ? 'bg-slate-900/90 border-cyan-500/40 text-slate-100 shadow-cyan-500/10' 
        : 'bg-slate-900/90 border-indigo-500/40 text-slate-100 shadow-indigo-500/10'
    }`;

    const iconName = type === 'success' ? 'check-circle' : 'info';
    const iconColor = type === 'success' ? 'text-cyan-400' : 'text-indigo-400';

    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-5 h-5 ${iconColor} flex-shrink-0"></i>
      <span class="text-sm font-medium pr-2">${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Remove after 3.5 seconds
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};