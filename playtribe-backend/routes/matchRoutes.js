const express = require('express');
const router = express.Router();
const { getMatches, createMatch, joinMatch } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getMatches).post(protect, createMatch);
router.route('/:id/join').post(protect, joinMatch);

module.exports = router;
