const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Team = require('../models/Team');
const Match = require('../models/Match');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');

    if (user) {
        const teams = await Team.find({ members: user._id });
        const matches = await Match.find({ participants: user._id });
        res.json({ user, teams, matches });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.city = req.body.city || user.city;
        user.preferredSport = req.body.preferredSport || user.preferredSport;
        user.skillLevel = req.body.skillLevel || user.skillLevel;

        // Only update password if provided
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            city: updatedUser.city,
            preferredSport: updatedUser.preferredSport,
            skillLevel: updatedUser.skillLevel
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = { getUserProfile, updateUserProfile };
