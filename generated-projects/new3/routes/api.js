// Import necessary modules and dependencies
const express = require('express');
const router = express.Router();
const Item = require('../models/item');
const Cart = require('../models/cart');
const PaymentInfo = require('../models/payment_info');

// Define routes and handlers
router.get('/items', async (req, res) => {
  try {
    const items = await Item.findAll();
    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const item = await Item.create({ name, price, description });
    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/cart', async (req, res) => {
  try {
    const userId = req.query.userId;
    const cart = await Cart.findByPk(userId);
    res.status(200).json({ cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cart', async (req, res) => {
  try {
    const { itemId } = req.body;
    const item = await Item.findByPk(itemId);
    const cart = await Cart.findByPk(req.query.userId);
    const updatedCart = await cart.addItem(item);
    res.status(201).json({ cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/cart/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Item.findByPk(itemId);
    const cart = await Cart.findByPk(req.query.userId);
    const updatedCart = await cart.removeItem(item);
    res.status(200).json({ cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/checkout', async (req, res) => {
  try {
    const { userId, paymentInfo } = req.body;
    const user = await User.findByPk(userId);
    const payment = await Payment.create(paymentInfo);
    const order = await Order.create({ user, payment });
    const orderItems = await order.getOrderItems();
    const totalPrice = orderItems.reduce((sum, item) => sum + item.price, 0);
    const orderId = await order.save();
    const updatedCart = await Cart.findByUserId(userId);
    const updatedCartItems = await updatedCart.removeAllItems();
    updatedCart.save();
    res.status(201).json({ orderId, cartItems: updatedCartItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;