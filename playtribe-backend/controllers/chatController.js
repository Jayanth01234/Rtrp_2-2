const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');
const Team = require('../models/Team');
const Match = require('../models/Match');
const User = require('../models/User');

// @desc    Get or create chat for team
// @route   GET /api/chat/team/:teamId
// @access  Private
const getTeamChat = asyncHandler(async (req, res) => {
  const teamId = req.params.teamId;
  const userId = req.user.id;

  // Check if user is member of the team
  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  const isMember = team.admin.toString() === userId || 
                  team.members.some(memberId => memberId.toString() === userId);
  
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to access team chat');
  }

  // Find or create chat
  let chat = await Chat.findOne({ team: teamId })
    .populate('messages.sender', 'name profileImage')
    .populate('participants', 'name profileImage');

  if (!chat) {
    // Create new chat for the team
    chat = new Chat({
      team: teamId,
      participants: [team.admin, ...team.members]
    });
    await chat.save();
    
    // Populate after saving
    chat = await Chat.findById(chat._id)
      .populate('messages.sender', 'name profileImage')
      .populate('participants', 'name profileImage');
  }

  res.json(chat);
});

// @desc    Get or create chat for match
// @route   GET /api/chat/match/:matchId
// @access  Private
const getMatchChat = asyncHandler(async (req, res) => {
  const matchId = req.params.matchId;
  const userId = req.user.id;

  // Check if user is participant or creator of the match
  const match = await Match.findById(matchId);
  if (!match) {
    res.status(404);
    throw new Error('Match not found');
  }

  const isParticipant = match.creator.toString() === userId || 
                       match.participants.some(participantId => participantId.toString() === userId);

  if (!isParticipant) {
    res.status(403);
    throw new Error('Not authorized to access match chat');
  }

  // Find or create chat
  let chat = await Chat.findOne({ match: matchId })
    .populate('messages.sender', 'name profileImage')
    .populate('participants', 'name profileImage');

  if (!chat) {
    // Create new chat for the match
    chat = new Chat({
      match: matchId,
      participants: [match.creator, ...match.participants]
    });
    await chat.save();
    
    // Populate after saving
    chat = await Chat.findById(chat._id)
      .populate('messages.sender', 'name profileImage')
      .populate('participants', 'name profileImage');
  }

  res.json(chat);
});

// @desc    Send message in chat
// @route   POST /api/chat/:chatId/message
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const chatId = req.params.chatId;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    res.status(400);
    throw new Error('Message content is required');
  }

  // Find chat and verify user is participant
  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  const isParticipant = chat.participants.some(
    participantId => participantId.toString() === userId
  );

  if (!isParticipant) {
    res.status(403);
    throw new Error('Not authorized to send messages in this chat');
  }

  // Add message
  const newMessage = {
    sender: userId,
    content: content.trim(),
    timestamp: new Date()
  };

  chat.messages.push(newMessage);
  chat.lastMessage = content.trim();
  chat.lastMessageTime = new Date();

  await chat.save();

  // Return populated message
  const populatedChat = await Chat.findById(chatId)
    .populate('messages.sender', 'name profileImage')
    .select('messages');

  const latestMessage = populatedChat.messages[populatedChat.messages.length - 1];

  res.json(latestMessage);
});

// @desc    Get chat history
// @route   GET /api/chat/:chatId/messages
// @access  Private
const getChatMessages = asyncHandler(async (req, res) => {
  const chatId = req.params.chatId;
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  // Find chat and verify user is participant
  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  const isParticipant = chat.participants.some(
    participantId => participantId.toString() === userId
  );

  if (!isParticipant) {
    res.status(403);
    throw new Error('Not authorized to access this chat');
  }

  // Get messages with pagination
  const startIndex = (page - 1) * limit;
  const messages = chat.messages
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(startIndex, startIndex + limit);

  // Populate sender info
  const populatedMessages = await Promise.all(
    messages.map(async (message) => {
      const sender = await User.findById(message.sender, 'name profileImage');
      return {
        ...message.toObject(),
        sender
      };
    })
  );

  res.json({
    messages: populatedMessages.reverse(), // Reverse to show oldest first
    hasMore: startIndex + limit < chat.messages.length,
    total: chat.messages.length
  });
});

// @desc    Get all user chats
// @route   GET /api/chat/my-chats
// @access  Private
const getUserChats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const chats = await Chat.find({
    participants: userId
  })
    .populate('team', 'name sport city')
    .populate('match', 'sport city date time')
    .populate('participants', 'name profileImage')
    .sort({ lastMessageTime: -1 });

  res.json(chats);
});

// @desc    Update chat participants (when team/match membership changes)
// @route   PATCH /api/chat/:chatId/participants
// @access  Private
const updateChatParticipants = asyncHandler(async (req, res) => {
  const { participants } = req.body;
  const chatId = req.params.chatId;
  const userId = req.user.id;

  if (!participants || !Array.isArray(participants)) {
    res.status(400);
    throw new Error('Participants array is required');
  }

  // Find chat
  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  // Verify user is admin of team or creator of match
  if (chat.team) {
    const team = await Team.findById(chat.team);
    if (team.admin.toString() !== userId) {
      res.status(403);
      throw new Error('Only team admin can update participants');
    }
  } else if (chat.match) {
    const match = await Match.findById(chat.match);
    if (match.creator.toString() !== userId) {
      res.status(403);
      throw new Error('Only match creator can update participants');
    }
  }

  // Update participants
  chat.participants = participants;
  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate('participants', 'name profileImage');

  res.json(updatedChat);
});

module.exports = {
  getTeamChat,
  getMatchChat,
  sendMessage,
  getChatMessages,
  getUserChats,
  updateChatParticipants
};
