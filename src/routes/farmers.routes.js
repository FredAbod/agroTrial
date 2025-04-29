const express = require('express');
const farmerController = require('../controllers/farmer.controller');
const { auth, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Farmer routes
router.get('/', farmerController.getAllFarmers);
router.get('/:farmerId', farmerController.getFarmerById);
router.put('/:farmerId', auth, authorize(['farmer']), farmerController.updateFarmerProfile);

module.exports = router;