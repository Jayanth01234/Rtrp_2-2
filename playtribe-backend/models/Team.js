const mongoose = require('mongoose');

const teamSchema = mongoose.Schema({
    name: { type: String, required: true },
    sport: { type: String, required: true },
    city: { type: String, required: true },
    description: { type: String },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
