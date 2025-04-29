const express = require('express');
const itemController = require('../controllers/item.controller');
const { auth, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Item routes
router.get('/', itemController.getAllItems);
router.get('/:itemId', itemController.getItemById);
router.put('/:itemId', auth, authorize(['farmer']), itemController.updateItem);
router.delete('/:itemId', auth, authorize(['farmer']), itemController.deleteItem);

// Farmer-specific item routes (defined in app.js as /farmers/:farmerId/items)
router.post('/', auth, authorize(['farmer']), itemController.createItem);

module.exports = router;