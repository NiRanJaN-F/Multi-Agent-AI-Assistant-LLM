// models/cart.js
// In‑memory cart model with full CRUD operations and validation.
// Exported as a singleton instance to be used by route handlers.

const { getProductById } = require('./product');

/**
 * CartItem shape:
 * {
 *   productId: string,
 *   quantity: number,
 *   price: number   // snapshot of the product price at add‑time
 * }
 */
class Cart {
  constructor() {
    /** @type {CartItem[]} */
    this.items = [];
  }

  /** Find an item in the cart by productId */
  _findItem(productId) {
    return this.items.find((i) => i.productId === productId);
  }

  /** Compute the cart total */
  _computeTotal() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  /** Return a plain representation of the cart */
  async getCart() {
    return {
      items: this.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
      })),
      total: this._computeTotal(),
    };
  }

  /** Add a product to the cart (or increase its quantity) */
  async addItem(productId, quantity) {
    // ---- validation ----
    if (!productId || typeof productId !== 'string') {
      throw new Error('Invalid productId');
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive integer');
    }

    // ---- fetch product to get price ----
    const product = await getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // ---- add / update item ----
    const existing = this._findItem(productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({
        productId,
        quantity,
        price: product.price,
      });
    }

    return this.getCart();
  }

  /** Set a new quantity for a product already in the cart */
  async updateItem(productId, quantity) {
    // ---- validation ----
    if (!productId || typeof productId !== 'string') {
      throw new Error('Invalid productId');
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error('Quantity must be a non‑negative integer');
    }

    const item = this._findItem(productId);
    if (!item) {
      throw new Error('Item not found in cart');
    }

    if (quantity === 0) {
      // remove the item if quantity set to zero
      this.items = this.items.filter((i) => i.productId !== productId);
    } else {
      item.quantity = quantity;
    }

    return this.getCart();
  }

  /** Remove a product from the cart */
  async removeItem(productId) {
    // ---- validation ----
    if (!productId || typeof productId !== 'string') {
      throw new Error('Invalid productId');
    }

    const before = this.items.length;
    this.items = this.items.filter((i) => i.productId !== productId);
    if (this.items.length === before) {
      throw new Error('Item not found in cart');
    }

    return this.getCart();
  }

  /** Empty the entire cart */
  async clear() {
    this.items = [];
    return this.getCart();
  }
}

// Export a singleton cart instance
module.exports = new Cart();