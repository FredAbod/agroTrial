const express = require('express');
const categoryController = require('../controllers/category.controller');
const { auth, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Category routes - public access for listing
router.get('/', categoryController.getAllCategories);

// Admin-only routes for managing categories
router.post('/', auth, authorize(['admin']), categoryController.createCategory);
router.put('/:id', auth, authorize(['admin']), categoryController.updateCategory);
router.delete('/:id', auth, authorize(['admin']), categoryController.deleteCategory);

module.exports = router;