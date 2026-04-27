const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 });
    
    res.json(notifications);
});

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
    const unreadCount = await Notification.countDocuments({
        user: req.user.id,
        isRead: false,
    });

    res.json({ unreadCount });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    // Check for user
    if (notification.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
});

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
};
