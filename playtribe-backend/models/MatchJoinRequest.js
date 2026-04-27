const mongoose = require('mongoose');

const matchJoinRequestSchema = mongoose.Schema({
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    },
}, {
    timestamps: true
});

// Prevent duplicate requests
matchJoinRequestSchema.index({ match: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('MatchJoinRequest', matchJoinRequestSchema);
