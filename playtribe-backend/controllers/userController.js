const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Team = require('../models/Team');
const Match = require('../models/Match');
const { upload } = require('../middleware/uploadMiddleware');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');

    if (user) {
        res.json(user);
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
        user.sport = req.body.sport || user.sport;
        user.skillLevel = req.body.skillLevel || user.skillLevel;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            city: updatedUser.city,
            sport: updatedUser.sport,
            skillLevel: updatedUser.skillLevel
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Upload profile image
// @route   POST /api/users/upload-profile
// @access  Private
const uploadProfileImage = asyncHandler(async (req, res) => {
    console.log('Uploading profile image for user:', req.user.id);
    
    // Handle the upload middleware manually
    upload.single('profileImage')(req, res, (err) => {
        if (err) {
            console.log('Upload error:', err);
            res.status(400);
            return res.json({ message: err.message || 'Image upload failed' });
        }

        if (!req.file) {
            console.log('No file uploaded');
            res.status(400);
            return res.json({ message: 'No image file provided' });
        }

        console.log('File uploaded:', req.file.filename);
        
        // Update user profile with image path
        User.findById(req.user.id).then(user => {
            if (user) {
                user.profileImage = req.file.filename;

                user.save().then(() => {
                    console.log('Profile image updated for user:', user.email);
                    res.json({
                        message: 'Profile image uploaded successfully',
                        profileImage: req.file.filename,
                        name: user.name,
                        city: user.city,
                        sport: user.sport,
                        skillLevel: user.skillLevel
                    });
                }).catch(saveErr => {
                    console.log('Save error:', saveErr);
                    res.status(500);
                    res.json({ message: 'Failed to save profile image' });
                });
            } else {
                res.status(404);
                res.json({ message: 'User not found' });
            }
        }).catch(findErr => {
            console.log('Find user error:', findErr);
            res.status(500);
            res.json({ message: 'Failed to find user' });
        });
    });
});

module.exports = { getUserProfile, updateUserProfile, uploadProfileImage };
