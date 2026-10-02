const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// In-memory product catalog
const products = [
  { id: 1, name: "Wireless Headphones", price: 59.99, image: "https://via.placeholder.com/300x300?text=Headphones" },
  { id: 2, name: "Smart Watch", price: 199.99, image: "https://via.placeholder.com/300x300?text=Smart+Watch" },
  { id: 3, name: "Bluetooth Speaker", price: 39.99, image: "https://via.placeholder.com/300x300?text=Speaker" },
  { id: 4, name: "Laptop Stand", price: 29.99, image: "https://via.placeholder.com/300x300?text=Laptop+Stand" },
  { id: 5, name: "USB-C Hub", price: 49.99, image: "https://via.placeholder.com/300x300?text=USB-C+Hub" },
  { id: 6, name: "Mechanical Keyboard", price: 89.99, image: "https://via.placeholder.com/300x300?text=Keyboard" },
  { id: 7, name: "Gaming Mouse", price: 45.99, image: "https://via.placeholder.com/300x300?text=Mouse" },
  { id: 8, name: "Monitor Arm", price: 79.99, image: "https://via.placeholder.com/300x300?text=Monitor+Arm" }
];

// In-memory cart storage
const carts = new Map();

// In-memory order storage
const orders = new Map();

// Helper: generate unique ID
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

// Helper: find product by ID
function findProduct(productId) {
  return products.find(p => p.id === productId);
}

// Helper: validate cart exists
function getCartOrThrow(cartId) {
  const cart = carts.get(cartId);
  if (!cart) {
    const err = new Error('Cart not found');
    err.status = 404;
    throw err;
  }
  return cart;
}

// GET /api/products
router.get('/products', (req, res) => {
  res.json({
    success: true,
    data: products
  });
});

// POST /api/cart
router.post('/cart', (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Validate productId
    if (productId === undefined || productId === null) {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }
    const product = findProduct(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Validate quantity
    let qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, error: 'quantity must be a positive integer' });
    }

    const cartId = generateId();
    const cart = {
      cartId,
      items: [
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: qty
        }
      ]
    };
    carts.set(cartId, cart);

    res.status(201).json({
      success: true,
      data: {
        cartId,
        items: cart.items
      }
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// GET /api/cart/:cartId
router.get('/cart/:cartId', (req, res) => {
  try {
    const { cartId } = req.params;
    const cart = getCartOrThrow(cartId);

    res.json({
      success: true,
      data: {
        cartId: cart.cartId,
        items: cart.items
      }
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// PUT /api/cart/:cartId/items
router.put('/cart/:cartId/items', (req, res) => {
  try {
    const { cartId } = req.params;
    const { productId, quantity } = req.body;

    const cart = getCartOrThrow(cartId);

    // Validate productId
    if (productId === undefined || productId === null) {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }
    const product = findProduct(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Validate quantity
    let qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, error: 'quantity must be a positive integer' });
    }

    // Update or add item
    const existingItem = cart.items.find(item => item.productId === product.id);
    if (existingItem) {
      existingItem.quantity = qty;
    } else {
      cart.items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: qty
      });
    }

    res.json({
      success: true,
      data: {
        cartId: cart.cartId,
        items: cart.items
      }
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cart/:cartId/items/:productId
router.delete('/cart/:cartId/items/:productId', (req, res) => {
  try {
    const { cartId } = req.params;
    const productId = parseInt(req.params.productId, 10);

    const cart = getCartOrThrow(cartId);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, error: 'Invalid productId' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);

    res.json({
      success: true,
      data: {
        cartId: cart.cartId,
        items: cart.items
      }
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// POST /api/checkout
router.post('/checkout', (req, res) => {
  try {
    const { cartId, customerInfo } = req.body;

    // Validate cartId
    if (!cartId) {
      return res.status(400).json({ success: false, error: 'cartId is required' });
    }

    const cart = getCartOrThrow(cartId);

    // Validate cart is not empty
    if (cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    // Validate customerInfo
    if (!customerInfo || typeof customerInfo !== 'object') {
      return res.status(400).json({ success: false, error: 'customerInfo is required' });
    }
    if (!customerInfo.name || typeof customerInfo.name !== 'string' || customerInfo.name.trim() === '') {
      return res.status(400).json({ success: false, error: 'customerInfo.name is required' });
    }
    if (!customerInfo.address || typeof customerInfo.address !== 'string' || customerInfo.address.trim() === '') {
      return res.status(400).json({ success: false, error: 'customerInfo.address is required' });
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order
    const orderId = generateId();
    const order = {
      orderId,
      cartId: cart.cartId,
      items: cart