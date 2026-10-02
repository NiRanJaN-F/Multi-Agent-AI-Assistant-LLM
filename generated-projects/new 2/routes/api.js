const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { checkItemExists, checkCartExists, checkPaymentInfo } = require('../middlewares/validation');
const Item = require('../models/Item');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

// GET /api/items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/items
router.post('/', [
  check('name').not().isEmpty().withMessage('Item name is required'),
  check('price').not().isEmpty().withMessage('Item price is required'),
  check('name').custom((value) => {
    const itemExists = await Item.findOne({ name: value });
    if (itemExists) {
      return 'Item with the same name already exists';
    }
    return true;
  }),
  check('price').custom((value) => {
    const priceExists = await Item.findOne({ price: value });
    if (priceExists) {
      return 'Price already exists';
    }
    return true;
  }),
  check('name').custom((value) => {
    const cartExists = await Cart.findOne({ name: value });
    if (cartExists) {
      return 'Cart with the same name already exists';
    }
    return true;
  }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const item = new Item({
    name: req.body.name,
    price: req.body.price,
  });

  try {
    const savedItem = await item.save();
    const itemId = savedItem._id;

    const cart = new Cart({ name: req.body.name });
    try {
      const savedCart = await cart.save();
      const cartId = savedCart._id;

      const order = new Order({
        itemId,
        cartId,
      });

      try {
        const savedOrder = await order.save();
        res.status(201).json({ success: true, data: { item: savedItem.toObject(), order: savedOrder.toObject() } });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
  });
});