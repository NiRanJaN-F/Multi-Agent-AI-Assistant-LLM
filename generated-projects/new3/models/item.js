// models/item.js
//
// This module defines the Item model used by the e‑commerce API.
// It uses Mongoose for schema definition, validation, and persistence.
// The exported functions provide a clean API for CRUD operations
// and encapsulate error handling so that route handlers can focus
// on request/response logic.

const mongoose = require('mongoose');

// ------------------------------------------------------------------
// Schema definition
// ------------------------------------------------------------------
const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: [1, 'Item name must be at least 1 character'],
    },
    price: {
      type: Number,
      required: [true, 'Item price is required'],
      min: [0, 'Item price must be a non‑negative number'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ------------------------------------------------------------------
// Model
// ------------------------------------------------------------------
const Item = mongoose.model('Item', itemSchema);

// ------------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------------
/**
 * Retrieve all items from the database.
 * @returns {Promise<Array>} Array of item documents.
 */
async function getAllItems() {
  try {
    return await Item.find({});
  } catch (err) {
    // Wrap and re‑throw to preserve stack trace
    throw new Error(`Failed to fetch items: ${err.message}`);
  }
}

/**
 * Create a new item.
 * @param {Object} payload - Item data.
 * @param {string} payload.name - Name of the item.
 * @param {number} payload.price - Price of the item.
 * @param {string} [payload.description] - Description of the item.
 * @returns {Promise<Object>} The created item document.
 */
async function createItem({ name, price, description = '' }) {
  try {
    const item = new Item({ name, price, description });
    return await item.save();
  } catch (err) {
    // Mongoose validation errors are passed through
    throw new Error(`Failed to create item: ${err.message}`);
  }
}

// ------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------
module.exports = {
  Item,
  getAllItems,
  createItem,
};