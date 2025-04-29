const express = require('express');
const authController = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', auth, authController.getCurrentUser);
router.put('/me', auth, authController.updateProfile);

module.exports = router;