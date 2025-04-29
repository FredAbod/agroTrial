const express = require('express');
const locationController = require('../controllers/location.controller');
const { auth, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Location routes - public access for listing
router.get('/', locationController.getAllLocations);

// Admin-only routes for managing locations
router.post('/', auth, authorize(['admin']), locationController.createLocation);
router.put('/:id', auth, authorize(['admin']), locationController.updateLocation);
router.delete('/:id', auth, authorize(['admin']), locationController.deleteLocation);

module.exports = router;