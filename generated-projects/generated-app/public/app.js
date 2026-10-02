// public/app.js

// ---------- Utility Functions ----------
function $(selector) {
    return document.querySelector(selector);
}
function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}

// ---------- Local Storage Cart Management ----------
const CART_KEY = 'ecom_cart';

function getCart() {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ---------- State ----------
let products = []; // will be filled from backend or fallback data

// ---------- Rendering ----------
function renderProducts() {
    const container = $('#product-list');
    container.innerHTML = '';

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}" class="product-image"/>
            <h3 class="product-name">${p.name}</h3>
            <p class="product-price">$${p.price.toFixed(2)}</p>
            <button class="add-to-cart-btn" data-id="${p.id}">Add to Cart</button>
        `;
        container.appendChild(card);
    });

    // Attach listeners for add-to-cart buttons
    $$('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const product = products.find(p => p.id === id);
            if (product) addToCart(product);
        });
    });
}

function renderCart() {
    const cart = getCart();
    const itemsContainer = $('#cart-items');
    itemsContainer.innerHTML = '';

    let total = 0;

    Object.values(cart).forEach(entry => {
        const { product, quantity } = entry;
        const lineTotal = product.price * quantity;
        total += lineTotal;

        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <span class="cart-item-name">${product.name}</span>
            <div class="cart-item-qty">
                <button class="qty-dec" data-id="${product.id}">-</button>
                <span>${quantity}</span>
                <button class="qty-inc" data-id="${product.id}">+</button>
            </div>
            <span class="cart-item-price">$${lineTotal.toFixed(2)}</span>
            <button class="remove-item" data-id="${product.id}">✕</button>
        `;
        itemsContainer.appendChild(row);
    });

    $('#cart-total').textContent = total.toFixed(2);
    updateCartCount();

    // Attach listeners for quantity changes and removal
    $$('.qty-inc').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            changeQuantity(id, 1);
        });
    });
    $$('.qty-dec').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            changeQuantity(id, -1);
        });
    });
    $$('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            removeFromCart(id);
        });
    });
}

function updateCartCount() {
    const cart = getCart();
    const count = Object.values(cart).reduce((sum, entry) => sum + entry.quantity, 0);
    $('#cart-count').textContent = count;
}

// ---------- Cart Operations ----------
function addToCart(product) {
    const cart = getCart();
    if (cart[product.id]) {
        cart[product.id].quantity += 1;
    } else {
        cart[product.id] = { product, quantity: 1 };
    }
    saveCart(cart);
    renderCart();
}

function removeFromCart(productId) {
    const cart = getCart();
    delete cart[productId];
    saveCart(cart);
    renderCart();
}

function changeQuantity(productId, delta) {
    const cart = getCart();
    if (!cart[productId]) return;
    cart[productId].quantity += delta;
    if (cart[productId].quantity <= 0) {
        delete cart[productId];
    }
    saveCart(cart);
    renderCart();
}

// ---------- Modal Controls ----------
function openCart() {
    $('#cart-modal').classList.remove('hidden');
    renderCart();
}
function closeCart() {
    $('#cart-modal').classList.add('hidden');
}
function openCheckout() {
    $('#cart-modal').classList.add('hidden');
    $('#checkout-modal').classList.remove('hidden');
}
function closeCheckout() {
    $('#checkout-modal').classList.add('hidden');
}

// ---------- Checkout ----------
function handleCheckout(event) {
    event.preventDefault();
    const name = $('#checkout-name').value.trim();
    const email = $('#checkout-email').value.trim();
    const address = $('#checkout-address').value.trim();

    if (!name || !email || !address) {
        alert('Please fill out all fields.');
        return;
    }

    // Simulate order placement
    const order = {
        customer: { name, email, address },
        items: Object.values(getCart()).map(e => ({
            id: e.product.id,
            name: e.product.name,
            price: e.product.price,
            quantity: e.quantity
        })),
        total: parseFloat($('#cart-total').textContent)
    };

    console.log('Order placed:', order);
    alert('Thank you for your purchase! Order details logged to console.');

    // Clear cart
    localStorage.removeItem(CART_KEY);
    renderCart();
    closeCheckout();
}

// ---------- Data Fetch ----------
function fetchProducts() {
    fetch('/api/products')
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(data => {
            products = data;
            renderProducts();
        })
        .catch(() => {
            // Fallback dummy data
            products = [
                { id: 'p1', name: 'Red T-Shirt', price: 19.99, image: '' },
                { id: 'p2', name: 'Blue Jeans', price: 49.99, image: '' },
                { id: 'p3', name: 'Sneakers', price: 79.99, image: '' }
            ];
            renderProducts();
        });
}

// ---------- Event Listeners ----------
document.addEventListener('DOMContentLoaded', () => {
    // Initial render
    fetchProducts();

    // Cart toggle button
    $('#cart-toggle').addEventListener('click', openCart);
    // Close cart button
    $('#close-cart-btn').addEventListener('click', closeCart);
    // Checkout button inside cart
    $('#checkout-btn').addEventListener('click', openCheckout);
    // Cancel checkout button
    $('#cancel-checkout-btn').addEventListener('click', closeCheckout);
    // Checkout form submit
    $('#checkout-form').addEventListener('submit', handleCheckout);
});