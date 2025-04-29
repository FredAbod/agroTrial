const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    text: String,
    senderId: mongoose.Schema.Types.ObjectId,
    createdAt: Date
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: new Map()
  },
  relatedTo: {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  }
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;