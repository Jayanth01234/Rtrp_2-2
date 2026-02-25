const mongoose = require('mongoose');

const matchSchema = mongoose.Schema({
    sport: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    city: { type: String, required: true },
    maxPlayers: { type: Number, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);
