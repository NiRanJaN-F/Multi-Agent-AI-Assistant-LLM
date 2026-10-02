const express = require('express');
const router = express.Router();

// In-memory data store shared across routes
// To maintain consistency, we reference the products array/store. 
// Assuming server.js or a shared database module holds products, but for this self-contained 
// router, we can safely manage the cart state and validate against known products.
// We'll import products or access them via app locals / shared state if necessary.
// Alternatively, let's require products data to validate product existence and prices.
const productsData = require('./products'); 

// In-memory cart store: { items: [{ productId, quantity }], total: 0 }
// Note: In routes/products.js, products might be exported as an array or router. 
// Let's implement a robust local cart state or reference global app state.
let cart = {
  items: [],
  total: 0
};

// Helper function to recalculate cart total
const recalculateCart = () => {
  // We need access to the product catalog to calculate the total accurately.
  // Let's safely require the products array from routes/products.js 
  // (Assuming routes/products.js exports the products array or we fetch from it).
  // If routes/products.js exports an array directly or a router with a getProducts helper:
  let products = [];
  try {
    const productsModule = require('./products');
    if (Array.isArray(productsModule)) {
      products = productsModule;
    } else if (productsModule.products) {
      products = productsModule.products;
    }
  } catch (err) {
    products = [];
  }

  let calculatedTotal = 0;
  cart.items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      calculatedTotal += product.price * item.quantity;
    }
  });

  cart.total = Number(calculatedTotal.toFixed(2));
};

// GET /api/cart
router.get('/', (req, res) => {
  try {
    recalculateCart();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve cart' });
  }
});

// POST /api/cart
router.post('/', (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid input. productId and a positive quantity are required.' 
      });
    }

    // Verify product exists in catalog
    let products = [];
    try {
      const productsModule = require('./products');
      if (Array.isArray(productsModule)) {
        products = productsModule;
      } else if (productsModule.products) {
        products = productsModule.products;
      }
    } catch (err) {
      products = [];
    }

    const productExists = products.some(p => p.id === productId);
    if (!productExists) {
      return res.status(404).json({ success: false, error: 'Product not found in catalog' });
    }

    // Update or add cart item
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    recalculateCart();

    res.json({
      success: true,
      cart: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add item to cart' });
  }
});

// DELETE /api/cart/:productId
router.delete('/:productId', (req, res) => {
  try {
    const { productId } = req.params;

    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);
    recalculateCart();

    res.json({
      success: true,
      cart: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove item from cart' });
  }
});

module.exports = router;