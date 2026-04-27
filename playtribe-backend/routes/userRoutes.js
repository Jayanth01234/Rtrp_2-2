const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, uploadProfileImage } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.post('/upload-profile', protect, uploadProfileImage);

module.exports = router;
