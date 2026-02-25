const express = require('express');
const router = express.Router();
const { getTeams, createTeam, getTeamById } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getTeams).post(protect, createTeam);
router.route('/:id').get(getTeamById);

module.exports = router;
