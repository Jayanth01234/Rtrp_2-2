const express = require('express');
const router = express.Router();
const { 
  getTeamChat, 
  getMatchChat, 
  sendMessage, 
  getChatMessages, 
  getUserChats,
  updateChatParticipants
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Get or create chat for team
router.get('/team/:teamId', protect, getTeamChat);

// Get or create chat for match
router.get('/match/:matchId', protect, getMatchChat);

// Send message in chat
router.post('/:chatId/message', protect, sendMessage);

// Get chat history with pagination
router.get('/:chatId/messages', protect, getChatMessages);

// Get all user chats
router.get('/my-chats', protect, getUserChats);

// Update chat participants
router.patch('/:chatId/participants', protect, updateChatParticipants);

module.exports = router;
