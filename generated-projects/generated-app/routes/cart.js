// routes/cart.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, param, validationResult } = require('express-validator');
const products = require('./products'); // Assuming products.js exports an array of product objects

const router = express.Router();

// In-memory cart store: { cartId: { items: [{ productId, quantity, price }] } }
const carts = {};

/**
 * Helper to find a product by ID
 */
const findProduct = (id) => products.find((p) => p.id === id);

/**
 * POST /api/cart
 * Add an item to a cart. Creates a new cart if none exists for the user.
 * Request body: { productId: number, quantity: number }
 * Response: { success: true, data: { cartId: string, items: [...] } }
 */
router.post(
  '/api/cart',
  [
    body('productId').isInt({ gt: 0 }).withMessage('productId must be a positive integer'),
    body('quantity').isInt({ gt: 0 }).withMessage('quantity must be a positive integer'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { productId, quantity } = req.body;
    const product = findProduct(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // For simplicity, we create a new cart for each request.
    // In a real app, you'd associate the cart with a user session.
    const cartId = uuidv4();
    const item = {
      productId,
      quantity,
      price: product.price * quantity,
    };

    carts[cartId] = { items: [item] };

    return res.status(201).json({ success: true, data: { cartId, items: carts[cartId].items } });
  }
);

/**
 * GET /api/cart
 * Retrieve all items across all carts.
 * Response: { success: true, data: [{ productId, quantity, price }, ...] }
 */
router.get('/api/cart', (req, res) => {
  const allItems = Object.values(carts).flatMap((cart) => cart.items);
  return res.json({ success: true, data: allItems });
});

/**
 * DELETE /api/cart/:id
 * Delete a cart by its ID.
 * Response: { success: true }
 */
router.delete(
  '/api/cart/:id',
  [param('id').isUUID().withMessage('Invalid cart ID')],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    if (!carts[id]) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    delete carts[id];
    return res.json({ success: true });
  }
);

module.exports = router;