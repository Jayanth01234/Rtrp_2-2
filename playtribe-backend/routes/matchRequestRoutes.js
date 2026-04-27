const express = require('express');
const router = express.Router();
const {
    createMatchJoinRequest,
    getMatchRequests,
    updateMatchRequest,
    getMyMatchRequests
} = require('../controllers/matchRequestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createMatchJoinRequest);
router.get('/match/:matchId', protect, getMatchRequests);
router.get('/my', protect, getMyMatchRequests);
router.put('/:requestId', protect, updateMatchRequest);

module.exports = router;
