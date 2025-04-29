const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Get all notifications for the current user
 */
const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { read, page = 1, limit = 10 } = req.query;
    
    // Build query filters
    const query = { userId };
    if (read !== undefined) {
      query.read = read === 'true';
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('relatedTo.orderId', 'status totalAmount')
      .populate('relatedTo.itemId', 'name images')
      .populate('relatedTo.conversationId');
    
    // Count total matching notifications
    const total = await Notification.countDocuments(query);
    
    // Count unread notifications
    const unreadCount = await Notification.countDocuments({ userId, read: false });
    
    res.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      userId
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.read = true;
    await notification.save();
    
    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      userId
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await Notification.findByIdAndDelete(id);
    
    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  deleteNotification
};