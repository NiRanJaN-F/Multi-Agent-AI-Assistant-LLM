<think>
The user wants me to write the complete server-side content for `routes/api.js` for a full-stack e-commerce store.
The tech stack is Express backend with HTML/JS frontend.
I need to design RESTful routes for:
- Product listings
- Shopping cart
- Checkout flow

Since it's a single file `routes/api.js`, I'll create an Express Router and define routes for:
1. Products: GET /products, GET /products/:id
2. Cart: GET /cart, POST /cart/items, PUT /cart/items/:id, DELETE /cart/items/:id
3. Checkout: POST /checkout

I'll use in-memory data for simplicity since no database is specified, but I'll structure it properly so it can be easily swapped later. I'll include proper validation, error handling, and consistent naming.

Let me design the routes carefully:

Products:
- GET /api/products - list all products
- GET /api/products/:id - get single product

Cart:
- GET /api/cart - get current cart
- POST /api/cart/items - add item to cart
- PUT /api/cart/items/:id - update item quantity
- DELETE /api/cart/items/:id - remove item from cart

Checkout:
- POST /api/checkout - process checkout

I'll use CommonJS syntax since it's standard for Express. I'll include validation middleware or inline validation. I'll handle errors properly with try-catch and error responses.

Let me write the complete code:

```javascript
const express = require('express');
const router = express.Router();

// In-memory data store
const products = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, stock: 50, description: 'High-quality wireless headphones with noise cancellation' },
  { id: 2, name: 'Mechanical Keyboard', price: 129.99, stock: 30, description: 'RGB mechanical keyboard with Cherry MX switches' },
  { id: 3, name: 'USB-C Hub', price: 49.99, stock: 100, description: '7-in-1 USB-C hub with HDMI and SD card reader' },
  { id: 4, name: 'Webcam 1080p', price: 59.99, stock: 40, description: 'Full HD webcam with built-in microphone' },
  { id: 5, name: 'Mouse Pad XL', price: 24.99, stock: 75, description: 'Extended mouse pad with stitched edges' }
];

const carts = {};
const orders = [];

// Validation helpers
const validateProductId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }
  next();
};

const validateCartId = (req, res, next) => {
  const cartId = req.query.cartId || req.body.cartId || 'default';
  if (!cartId || typeof cartId !== 'string') {
    return res.status(400).json({ error: 'Invalid cart ID' });
  }
  req.cartId = cartId;
  next();
};

// Products routes
router.get('/products', (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    let filtered = products;
    
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);
    
    res.json({
      products: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/products/:id', validateProductId, (req, res) => {
  try {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Cart routes
router.get('/cart', validateCartId, (req, res) => {
  try {
    const cart = carts[req.cartId] || { items: [], total: 0 };
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

router.post('/cart/items', validateCartId, (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || typeof productId !== 'number' || productId <= 0) {
      return res.status(400).json({ error: 'Valid product ID is required' });
    }
    
    const qty = parseInt(quantity) || 1;
    if (qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be positive' });
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.stock < qty) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    if (!carts[req.cartId]) {
      carts[req.cartId] = { items: [], total: 0 };
    }
    
    const cart = carts[req.cartId];
    const existingItem = cart.items.find(item => item.productId === productId);
    
    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (product.stock < newQty) {
        return res.status(400).json({ error: 'Insufficient stock for requested quantity' });
      }
      existingItem.quantity = newQty;
      existingItem.subtotal = existingItem.quantity * product.price;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity: qty,
        subtotal: qty * product.price
      });
    }
    
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

router.put('/cart/items/:id', validateCartId, (req, res) => {
  try {
    const { quantity } = req.body;
    const itemId = parseInt(req.params.id);
    
    if (isNaN(itemId) || itemId < 0) {
      return res.status(400).json({ error: 'Invalid item index' });
    }
    
    if (!carts[req.cartId]) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    const cart = carts[req.cartId];
    const itemIndex = cart.items.findIndex(item => item.productId === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }
    
    const product = products.find(p => p.id === itemId);
    if (!product || product.stock < qty) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    cart.items[itemIndex].quantity = qty;
    cart.items[itemIndex].subtotal = qty * product.price;
    cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

router.delete('/cart/items/:id', validateCartId, (req, res) => {
  try {
    const itemId = parseInt