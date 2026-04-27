const express = require('express');
const router = express.Router();
const { debugTeamRequests } = require('../controllers/debugController');
const { protect } = require('../middleware/authMiddleware');

router.get('/team/:teamId', protect, debugTeamRequests);

module.exports = router;
