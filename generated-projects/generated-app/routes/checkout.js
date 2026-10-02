// routes/checkout.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// In-memory store for orders (for demo purposes)
const orders = [];

/**
 * Validate the checkout request body.
 * @param {Object} body
 * @returns {Array} Array of error messages (empty if valid)
 */
function validateCheckoutBody(body) {
  const errors = [];

  if (!body) {
    errors.push('Request body is required.');
    return errors;
  }

  const { items, total, shipping } = body;

  if (!Array.isArray(items)) {
    errors.push('items must be an array.');
  } else {
    items.forEach((item, idx) => {
      if (typeof item.productId !== 'number' || item.productId <= 0) {
        errors.push(`items[${idx}].productId must be a positive integer.`);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`items[${idx}].quantity must be a positive integer.`);
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        errors.push(`items[${idx}].price must be a non-negative number.`);
      }
    });
  }

  if (typeof total !== 'number' || total < 0) {
    errors.push('total must be a non-negative number.');
  }

  if (!shipping || typeof shipping.address !== 'string' || shipping.address.trim() === '') {
    errors.push('shipping.address must be a non-empty string.');
  }

  return errors;
}

/**
 * POST /api/checkout
 * Body: { items: [...], total: number, shipping: { address: string } }
 * Response: { success: true, data: { orderId: string, status: "confirmed" } }
 */
router.post('/api/checkout', async (req, res) => {
  try {
    const errors = validateCheckoutBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    const { items, total, shipping } = req.body;

    // Recalculate total to ensure integrity
    const calculatedTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return res.status(400).json({
        success: false,
        errors: ['Total does not match sum of item prices.'],
      });
    }

    const orderId = uuidv4();
    const order = {
      orderId,
      items,
      total,
      shipping,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    // Persist order (in-memory for this demo)
    orders.push(order);

    return res.status(201).json({
      success: true,
      data: {
        orderId,
        status: order.status,
      },
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({
      success: false,
      errors: ['Internal server error.'],
    });
  }
});

module.exports = router;