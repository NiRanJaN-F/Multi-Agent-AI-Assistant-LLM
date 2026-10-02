// models/product.js
//
// In-memory product model with CRUD operations and validation.
// This module is used by the Express routes to serve product data
// and to manage the product catalog.

const { v4: uuidv4 } = require('uuid');

/**
 * Sample product data. In a real application this would be
 * replaced by a database layer.
 */
const products = [
  {
    id: uuidv4(),
    name: 'Wireless Mouse',
    price: 29.99,
    description: 'Ergonomic wireless mouse with adjustable DPI.',
    image: 'https://via.placeholder.com/150?text=Mouse',
  },
  {
    id: uuidv4(),
    name: 'Mechanical Keyboard',
    price: 79.99,
    description: 'RGB mechanical keyboard with blue switches.',
    image: 'https://via.placeholder.com/150?text=Keyboard',
  },
  {
    id: uuidv4(),
    name: 'HD Monitor',
    price: 199.99,
    description: '24-inch full HD monitor with ultra-thin bezel.',
    image: 'https://via.placeholder.com/150?text=Monitor',
  },
];

/**
 * Validate product data before adding or updating.
 * @param {Object} data
 * @throws {Error} If validation fails.
 */
function validateProductData(data) {
  const { name, price, description, image } = data;

  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error('Product name must be a non-empty string.');
  }

  if (typeof price !== 'number' || price <= 0) {
    throw new Error('Product price must be a positive number.');
  }

  if (typeof description !== 'string') {
    throw new Error('Product description must be a string.');
  }

  if (typeof image !== 'string' || !/^https?:\/\//i.test(image)) {
    throw new Error('Product image must be a valid URL.');
  }
}

/**
 * Retrieve all products.
 * @returns {Array<Object>} Array of product summaries.
 */
function getAllProducts() {
  return products.map(({ id, name, price, image }) => ({
    id,
    name,
    price,
    image,
  }));
}

/**
 * Retrieve a single product by ID.
 * @param {string} id
 * @returns {Object} Full product details.
 * @throws {Error} If product not found.
 */
function getProductById(id) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    throw new Error(`Product with id ${id} not found.`);
  }
  return { ...product };
}

/**
 * Add a new product to the catalog.
 * @param {Object} data
 * @returns {Object} The newly created product.
 * @throws {Error} If validation fails.
 */
function addProduct(data) {
  validateProductData(data);
  const newProduct = {
    id: uuidv4(),
    name: data.name.trim(),
    price: data.price,
    description: data.description.trim(),
    image: data.image.trim(),
  };
  products.push(newProduct);
  return { ...newProduct };
}

/**
 * Update an existing product.
 * @param {string} id
 * @param {Object} updates
 * @returns {Object} The updated product.
 * @throws {Error} If product not found or validation fails.
 */
function updateProduct(id, updates) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    throw new Error(`Product with id ${id} not found.`);
  }

  const updatedData = { ...product, ...updates };
  validateProductData(updatedData);

  product.name = updatedData.name.trim();
  product.price = updatedData.price;
  product.description = updatedData.description.trim();
  product.image = updatedData.image.trim();

  return { ...product };
}

/**
 * Delete a product from the catalog.
 * @param {string} id