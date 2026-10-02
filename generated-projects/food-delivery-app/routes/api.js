// routes/api.js
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

// Middleware to parse JSON bodies
router.use(bodyParser.json());

// In-memory menu data
const menu = [
  {
    id: 1,
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomatoes, mozzarella, and basil.',
    price: 12.99,
    image: '/images/pizza.jpg',
  },
  {
    id: 2,
    name: 'Cheeseburger',
    description: 'Juicy beef patty with cheddar, lettuce, and tomato.',
    price: 10.49,
    image: '/images/burger.jpg',
  },
  {
    id: 3,
    name: 'California Sushi Roll',
    description: 'Crab, avocado, cucumber, and rice wrapped in nori.',
    price: 8.75,
    image: '/images/sushi.jpg',
  },
];

// Helper to get cart from session or initialize
function getCart(req) {
  if (!req.session) {
    req.session = {};
  }
  if (!req.session.cart) {
    req.session.cart = [];
  }
  return req.session.cart;
}

// GET /api/menu - return menu items
router.get('/menu', (req, res) => {
  res.json({ success: true, menu });
});

// POST /api/cart/add - add item to cart
router.post('/cart/add', (req, res) => {
  const { id, quantity } = req.body;
  const item = menu.find((m) => m.id === id);
  if (!item) {
    return res.status(400).json({ success: false, message: 'Item not found' });
  }
  const qty = parseInt(quantity, 10) || 1;
  const cart = getCart(req);
  const existing = cart.find((c) => c.id === id);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ id, name: item.name, price: item.price, quantity: qty });
  }
  res.json({ success: true, cart });
});

// GET /api/cart - get current cart
router.get('/cart', (req, res) => {
  const cart = getCart(req);
  res.json({ success: true, cart });
});

// POST /api/cart/remove - remove item from cart
router.post('/cart/remove', (req, res) => {
  const { id } = req.body;
  const cart = getCart(req);
  const index = cart.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(400).json({ success: false, message: 'Item not in cart' });
  }
  cart.splice(index, 1);
  res.json({ success: true, cart });
});

// POST /api/cart/clear - clear the cart
router.post('/cart/clear', (req, res) => {
  req.session.cart = [];
  res.json({ success: true, cart: [] });
});

// POST /api/checkout - process order
router.post('/checkout', (req, res) => {
  const { name, address, payment } = req.body;
  if (!name || !address || !payment) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing required fields' });
  }

  const cart = getCart(req);
  if (!cart.length) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.1; // 10%
  const deliveryFee = 5.0; // flat fee
  const tax = subtotal * taxRate;
  const total = subtotal + tax + deliveryFee;

  // Simulate order ID
  const orderId = `ORD-${Date.now()}`;

  // Clear cart after checkout
  req.session.cart = [];

  res.json({
    success: true,
    order: {
      id: orderId,
      customer: { name, address },
      items: cart,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: total.toFixed(2),
      paymentMethod: payment,
      status: 'Processing',
    },
  });
});

module.exports = router;