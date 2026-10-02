// server.js
// Express backend for a simple e‑commerce store (products, cart, checkout)

const express = require('express');
const cors = require('cors');
const { body, param, validationResult } = require('express-validator');
const morgan = require('morgan');
const path = require('path');

// In‑memory data stores (replace with DB in production)
const products = [
  { id: 1, name: 'T‑Shirt', description: 'Cotton t‑shirt', price: 19.99, image: '/images/tshirt.jpg' },
  { id: 2, name: 'Mug', description: 'Ceramic mug', price: 9.99, image: '/images/mug.jpg' },
  { id: 3, name: 'Backpack', description: 'Durable backpack', price: 49.99, image: '/images/backpack.jpg' },
];

let carts = {}; // { sessionId: [{ productId, quantity }] }
let orders = []; // simple order history

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static assets (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Helper to find product
const findProduct = (id) => products.find((p) => p.id === Number(id));

// ---------- API ROUTES ----------
const router = express.Router();

/**
 * GET /api/products
 * Return list of all products
 */
router.get('/products', (req, res) => {
  res.json(products);
});

/**
 * GET /api/products/:id
 * Return a single product
 */
router.get(
  '/products/:id',
  param('id').isInt({ gt: 0 }).withMessage('Product ID must be a positive integer'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const product = findProduct(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  }
);

/**
 * POST /api/cart
 * Add product to cart (creates a cart for the session if needed)
 * Body: { sessionId, productId, quantity }
 */
router.post(
  '/cart',
  [
    body('sessionId').isString().notEmpty(),
    body('productId').isInt({ gt: 0 }),
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be at least 1'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { sessionId, productId, quantity } = req.body;
    const product = findProduct(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (!carts[sessionId]) carts[sessionId] = [];

    const existing = carts[sessionId].find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      carts[sessionId].push({ productId, quantity });
    }

    res.status(201).json({ message: 'Item added to cart', cart: carts[sessionId] });
  }
);

/**
 * GET /api/cart/:sessionId
 * Retrieve cart contents for a session
 */
router.get(
  '/cart/:sessionId',
  param('sessionId').isString().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { sessionId } = req.params;
    const cart = carts[sessionId] || [];
    // Enrich with product details
    const detailed = cart.map((item) => {
      const prod = findProduct(item.productId);
      return {
        productId: item.productId,
        name: prod?.name,
        price: prod?.price,
        quantity: item.quantity,
        subtotal: prod ? prod.price * item.quantity : 0,
      };
    });
    const total = detailed.reduce((sum, i) => sum + i.subtotal, 0);
    res.json({ items: detailed, total });
  }
);

/**
 * PUT /api/cart/:sessionId/:productId
 * Update quantity of a product in the cart
 * Body: { quantity }
 */
router.put(
  '/cart/:sessionId/:productId',
  [
    param('sessionId').isString().notEmpty(),
    param('productId').isInt({ gt: 0 }),
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be at least 1'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { sessionId, productId } = req.params;
    const { quantity } = req.body;

    const cart = carts[sessionId];
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = cart.find((i) => i.productId === Number(productId));
    if (!item) return res.status(404).json({ error: 'Item not in cart' });

    item.quantity = quantity;
    res.json({ message: 'Quantity updated', cart });
  }
);

/**
 * DELETE /api/cart/:sessionId/:productId
 * Remove a product from the cart
 */
router.delete(
  '/cart/:sessionId/:productId',
  [
    param('sessionId').isString().notEmpty(),
    param('productId').isInt({ gt: 0 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { sessionId, productId } = req.params;
    const cart = carts[sessionId];
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const index = cart.findIndex((i) => i.productId === Number(productId));
    if (index === -1) return res.status(404).json({ error: 'Item not in cart' });

    cart.splice(index, 1);
    res.json({ message: 'Item removed', cart });
  }
);

/**
 * POST /api/checkout
 * Process checkout
 * Body: { sessionId, customer: { name, email, address } }
 */
router.post(
  '/checkout',
  [
    body('sessionId').isString().notEmpty(),
    body('customer.name').isString().notEmpty(),
    body('customer.email').isEmail(),
    body('customer.address').isString().notEmpty(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { sessionId, customer } = req.body;
    const cart = carts[sessionId];
    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    const items = cart.map((item) => {
      const prod = findProduct(item.productId);
      return {
        productId: item.productId,
        name: prod?.name,
        price: prod?.price,
        quantity: item.quantity,
        subtotal: prod ? prod.price * item.quantity : 0,
      };
    });
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    // Simulate order creation
    const order = {
      id: orders.length + 1,
      sessionId,
      customer,
      items,
      total,
      createdAt: new Date(),
    };
    orders.push(order);

    // Clear cart
    delete carts[sessionId];

    res.status(201).json({ message: 'Order placed successfully', order });
  }
);

/**
 * GET /api/orders/:sessionId
 * Retrieve order history for a session (simple demo)
 */
router.get(
  '/orders/:sessionId',
  param('sessionId').isString().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { sessionId } = req.params;
    const userOrders = orders.filter((o) => o.sessionId === sessionId);
    res.json(userOrders);
  }
);

// Mount API router under /api
app.use('/api', router);

// ---------- GLOBAL ERROR HANDLER ----------
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ---------- SERVER START ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

module.exports = app;