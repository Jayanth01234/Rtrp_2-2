const express = require('express');
const router = express.Router();
const { createJoinRequest, getTeamRequests, updateRequestStatus, getMyRequests } = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/team/:teamId', protect, createJoinRequest);
router.get('/team/:teamId', protect, getTeamRequests);
router.put('/:id', protect, updateRequestStatus);
router.get('/me', protect, getMyRequests);

module.exports = router;
