const express = require('express');
const orderController = require('../controllers/order.controller');
const { auth, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Order routes
router.post('/', auth, orderController.createOrder);
router.get('/', auth, orderController.getUserOrders);
router.get('/:orderId', auth, orderController.getOrderById);
router.put('/:orderId/status', auth, authorize(['farmer']), orderController.updateOrderStatus);
router.delete('/:orderId', auth, orderController.cancelOrder);

module.exports = router;