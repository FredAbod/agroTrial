const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Notification routes - all require authentication
router.get('/', auth, notificationController.getUserNotifications);
router.put('/:id/read', auth, notificationController.markAsRead);
router.delete('/:id', auth, notificationController.deleteNotification);

module.exports = router;