const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for efficient queries
chatSchema.index({ team: 1 });
chatSchema.index({ match: 1 });
chatSchema.index({ 'messages.timestamp': -1 });

// Virtual for getting the most recent messages
chatSchema.virtual('recentMessages', {
  ref: 'ChatMessage',
  localField: '_id',
  foreignField: 'chat',
  options: { sort: { timestamp: -1 }, limit: 50 }
});

module.exports = mongoose.model('Chat', chatSchema);
