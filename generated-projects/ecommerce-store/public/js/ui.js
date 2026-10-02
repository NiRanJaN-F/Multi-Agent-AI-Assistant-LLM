/* public/js/ui.js */

/* --------------------------- Utility Functions --------------------------- */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

/* --------------------------- API Calls --------------------------- */
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API error');
  return json.data;
}

async function getProducts() {
  return await apiFetch('/api/products');
}

async function getCart() {
  return await apiFetch('/api/cart');
}

async function addItemToCart(productId, quantity = 1) {
  return await apiFetch('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

async function updateCartItem(itemId, quantity) {
  return await apiFetch(`/api/cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

async function deleteCartItem(itemId) {
  return await apiFetch(`/api/cart/items/${itemId}`, {
    method: 'DELETE',
  });
}

async function checkout(order) {
  return await apiFetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

/* --------------------------- State --------------------------- */
let state = {
  products: [],
  cart: { items: [], total: 0 },
};

/* --------------------------- Rendering --------------------------- */
function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/* Header */
function renderHeader() {
  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1 class="logo">My Store</h1>
    <nav>
      <a href="#" id="nav-home">Home</a>
      <a href="#" id="nav-cart">Cart (<span id="cart-count">0</span>)</a>
    </nav>
  `;
  document.body.appendChild(header);
}

/* Footer */
function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <p>&copy; ${new Date().getFullYear()} My Store. All rights reserved.</p>
  `;
  document.body.appendChild(footer);
}

/* Product List */
function renderProductList() {
  const section = document.createElement('section');
  section.id = 'product-list';
  section.className = 'product-list';
  const title = document.createElement('h2');
  title.textContent = 'Products';
  section.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'product-grid';
  state.products.forEach((product) => {
    grid.appendChild(renderProductCard(product));
  });
  section.appendChild(grid);
  return section;
}

/* Product Card */
function renderProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.id = product.id;

  card.innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="product-image"/>
    <h3 class="product-name">${product.name}</h3>
    <p class="product-price">$${product.price.toFixed(2)}</p>
    <button class="add-to-cart-btn">Add to Cart</button>
  `;

  const btn = card.querySelector('.add-to-cart-btn');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Adding...';
    try {
      await addItemToCart(product.id, 1);
      await refreshCart();
    } catch (e) {
      alert('Failed to add item: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Add to Cart';
    }
  });

  return card;
}

/* Cart View */
function renderCartView() {
  const section = document.createElement('section');
  section.id = 'cart-view';
  section.className = 'cart-view';
  const title = document.createElement('h2');
  title.textContent = 'Shopping Cart';
  section.appendChild(title);

  if (state.cart.items.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Your cart is empty.';
    section.appendChild(empty);
    return section;
  }

  const table = document.createElement('table');
  table.className = 'cart-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th><th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  state.cart.items.forEach((item) => {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;
    tr.innerHTML = `
      <td>${item.name}</td>
      <td><input type="number" min="1" value="${item.quantity}" class="qty-input"/></td>
      <td>$${item.price.toFixed(2)}</td>
      <td class="subtotal">$${(item.price * item.quantity).toFixed(2)}</td>
      <td><button class="remove-btn">✕</button></td>
    `;

    // Quantity change
    const qtyInput = tr.querySelector('.qty-input');
    qtyInput.addEventListener('change', async (e) => {
      const newQty = parseInt(e.target.value, 10);
      if (isNaN(newQty) || newQty < 1) {
        e.target.value = item.quantity;
        return;
      }
      try {
        await updateCartItem(item.id, newQty);
        await refreshCart();
      } catch (err) {
        alert('Failed to update quantity: ' + err.message);
      }
    });

    // Remove button
    tr.querySelector('.remove-btn').addEventListener('click', async () => {
      try {
        await deleteCartItem(item.id);
        await refreshCart();
      } catch (err) {
        alert('Failed to remove item: ' + err.message);
      }
    });

    tbody.appendChild(tr);
  });

  section.appendChild(table);
  section.appendChild(renderCartSummary());
  section.appendChild(renderCheckoutForm());

  return section;
}

/* Cart Summary */
function renderCartSummary() {
  const div = document.createElement('div');
  div.className = 'cart-summary';
  div.innerHTML = `
    <p>Total: <strong id="cart-total">$${state.cart.total.toFixed(2)}</strong></p>
  `;
  return div;
}

/* Checkout Form */
function renderCheckoutForm() {
  const form = document.createElement('form');
  form.id = 'checkout-form';
  form.className = 'checkout-form';
  form.innerHTML = `
    <h3>Checkout</h3>
    <label>
      Name
      <input type="text" name="name" required/>
    </label>
    <label>
      Email
      <input type="email" name="email" required/>
    </label>
    <label>
      Address
      <textarea name="address" rows="3" required></textarea>
    </label>
    <button type="submit">Place Order</button>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const order = {
      name: formData.get('name'),
      email: formData.get('email'),
      address: formData.get('address'),
      items: state.cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    try {
      const result = await checkout(order);
      alert(`Order placed! Your order ID is ${result.orderId}`);
      // Reset cart view
      await refreshCart();
    } catch (err) {
      alert('Checkout failed: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Place Order';
    }
  });

  return form;
}

/* Main App Render */
function renderApp() {
  // Clear body first (except any script tags)
  const scripts = $$('script');
  document.body.innerHTML = '';
  scripts.forEach((s) => document.body.appendChild(s));

  renderHeader();

  const main = document.createElement('main');
  main.id = 'main-content';
  main.appendChild(renderProductList());
  main.appendChild(renderCartView());
  document.body.appendChild(main);

  renderFooter();

  // Update cart count in header
  $('#cart-count').textContent = state.cart.items.reduce((a, i) => a + i.quantity, 0);
}

/* --------------------------- Data Refresh --------------------------- */
async function refreshProducts() {
  try {
    state.products = await getProducts();
  } catch (e) {
    alert('Failed to load products: ' + e.message);
    state.products = [];
  }
}

async function refreshCart() {
  try {
    state.cart = await getCart();
  } catch (e) {
    alert('Failed to load cart: ' + e.message);
    state.cart = { items: [], total: 0 };
  }
}

/* --------------------------- Init --------------------------- */
async function init() {
  await Promise.all([refreshProducts(), refreshCart()]);
  renderApp();
}

/* --------------------------- Navigation --------------------------- */
function setupNav() {
  $('#nav-home')?.addEventListener('click', (e) => {
    e.preventDefault();
    $('#product-list').scrollIntoView({ behavior: 'smooth' });
  });
  $('#nav-cart')?.addEventListener('click', (e) => {
    e.preventDefault();
    $('#cart-view').scrollIntoView({ behavior: 'smooth' });
  });
}

/* --------------------------- DOM Ready --------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  await init();
  setupNav();
});