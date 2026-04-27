const mongoose = require('mongoose');

const joinRequestSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, {
    timestamps: true
});

module.exports = mongoose.model('JoinRequest', joinRequestSchema);
