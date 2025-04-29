const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Get user's conversations
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Find conversations where user is a participant
    const conversations = await Conversation.find({ 
      participants: userId 
    })
    .sort({ 'lastMessage.createdAt': -1 })
    .populate('participants', 'name avatar role')
    .populate('relatedTo.itemId', 'name images')
    .populate('relatedTo.orderId', 'status totalAmount');
    
    // Format response data
    const formattedConversations = conversations.map(conversation => {
      // Filter out current user from participants
      const otherParticipants = conversation.participants.filter(
        participant => participant._id.toString() !== userId.toString()
      );
      
      return {
        _id: conversation._id,
        otherParticipants,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCounts.get(userId.toString()) || 0,
        relatedTo: conversation.relatedTo,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };
    });
    
    res.json({ conversations: formattedConversations });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new conversation
 */
const createConversation = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { recipientId, itemId, orderId, initialMessage } = req.body;
    
    // Validate recipient
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Check if conversation already exists between these users
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
      ...(itemId && { 'relatedTo.itemId': itemId }),
      ...(orderId && { 'relatedTo.orderId': orderId })
    });
    
    // If conversation doesn't exist, create a new one
    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, recipientId],
        relatedTo: {
          ...(itemId && { itemId }),
          ...(orderId && { orderId })
        },
        unreadCounts: new Map([[recipientId.toString(), 1]])
      });
      
      // Set initial last message
      if (initialMessage) {
        conversation.lastMessage = {
          text: initialMessage,
          senderId: userId,
          createdAt: new Date()
        };
      }
      
      await conversation.save();
    }
    
    // Create initial message if provided
    if (initialMessage) {
      const message = new Message({
        conversationId: conversation._id,
        senderId: userId,
        text: initialMessage
      });
      
      await message.save();
      
      // Update conversation's last message
      conversation.lastMessage = {
        text: initialMessage,
        senderId: userId,
        createdAt: message.createdAt
      };
      
      // Increment unread count for recipient
      const unreadCount = conversation.unreadCounts.get(recipientId.toString()) || 0;
      conversation.unreadCounts.set(recipientId.toString(), unreadCount + 1);
      
      await conversation.save();
      
      // Create notification for recipient
      const sender = await User.findById(userId);
      const notification = new Notification({
        userId: recipientId,
        title: 'New Message',
        message: `${sender.name} sent you a message`,
        type: 'message',
        relatedTo: { conversationId: conversation._id }
      });
      
      await notification.save();
    }
    
    res.status(201).json({
      message: 'Conversation created successfully',
      conversation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages in a conversation
 */
const getMessages = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { convId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Check if user is a participant in this conversation
    const conversation = await Conversation.findOne({ 
      _id: convId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get messages with pagination (most recent first)
    const messages = await Message.find({ conversationId: convId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('senderId', 'name avatar role');
    
    // Count total messages
    const total = await Message.countDocuments({ conversationId: convId });
    
    // Mark messages as read
    await Message.updateMany(
      { 
        conversationId: convId,
        senderId: { $ne: userId },
        read: false
      },
      { read: true }
    );
    
    // Reset unread count for this user
    conversation.unreadCounts.set(userId.toString(), 0);
    await conversation.save();
    
    res.json({
      messages: messages.reverse(), // Return in chronological order
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
 * Send a message in a conversation
 */
const sendMessage = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { convId } = req.params;
    const { text, attachments } = req.body;
    
    if (!text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    
    // Check if user is a participant in this conversation
    const conversation = await Conversation.findOne({ 
      _id: convId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or access denied' });
    }
    
    // Create new message
    const message = new Message({
      conversationId: convId,
      senderId: userId,
      text,
      attachments: attachments || []
    });
    
    await message.save();
    
    // Update conversation's last message
    conversation.lastMessage = {
      text,
      senderId: userId,
      createdAt: message.createdAt
    };
    
    // Increment unread counts for other participants
    conversation.participants.forEach(participant => {
      if (participant.toString() !== userId.toString()) {
        const unreadCount = conversation.unreadCounts.get(participant.toString()) || 0;
        conversation.unreadCounts.set(participant.toString(), unreadCount + 1);
        
        // Create notification for recipient
        createMessageNotification(userId, participant, convId);
      }
    });
    
    await conversation.save();
    
    res.status(201).json({
      message: 'Message sent successfully',
      sentMessage: await Message.findById(message._id).populate('senderId', 'name avatar role')
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to create message notification
 */
async function createMessageNotification(senderId, recipientId, conversationId) {
  try {
    const sender = await User.findById(senderId);
    
    const notification = new Notification({
      userId: recipientId,
      title: 'New Message',
      message: `${sender.name} sent you a message`,
      type: 'message',
      relatedTo: { conversationId }
    });
    
    await notification.save();
  } catch (error) {
    logger.error('Error creating message notification:', error);
  }
}

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage
};