const express = require('express');
const chatController = require('../controllers/chat.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Chat routes
router.get('/', auth, chatController.getConversations);
router.post('/', auth, chatController.createConversation);
router.get('/:convId/messages', auth, chatController.getMessages);
router.post('/:convId/messages', auth, chatController.sendMessage);

module.exports = router;