const express = require('express');
const itemController = require('../controllers/item.controller');
const { auth, authorize } = require('../middlewares/auth.middleware');

const router = express.Router({ mergeParams: true });

// Farmer-specific item routes (/farmers/:farmerId/items)
router.post('/', auth, authorize(['farmer']), itemController.createItem);
router.get('/', itemController.getFarmerItems);

module.exports = router;