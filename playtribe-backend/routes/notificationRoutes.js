const express = require('express');
const router = express.Router();
const { getNotifications, getUnreadCount, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getNotifications);
router.route('/unread-count').get(protect, getUnreadCount);
router.route('/:id/read').patch(protect, markAsRead);

module.exports = router;
