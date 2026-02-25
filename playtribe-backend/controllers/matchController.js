const asyncHandler = require('express-async-handler');
const Match = require('../models/Match');

// @desc    Get all matches by city
// @route   GET /api/matches
// @access  Public
const getMatches = asyncHandler(async (req, res) => {
    const city = req.query.city;
    const filter = city ? { city } : {};
    const matches = await Match.find(filter).populate('creator', 'name').populate('participants', 'name');
    res.json(matches);
});

// @desc    Create a match
// @route   POST /api/matches
// @access  Private
const createMatch = asyncHandler(async (req, res) => {
    const { sport, date, time, location, city, maxPlayers } = req.body;

    if (!sport || !date || !time || !location || !city || !maxPlayers) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    const match = await Match.create({
        sport,
        date,
        time,
        location,
        city,
        maxPlayers,
        creator: req.user.id,
        participants: [req.user.id]
    });

    res.status(201).json(match);
});

// @desc    Join a match directly
// @route   POST /api/matches/:id/join
// @access  Private
const joinMatch = asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    if (match.participants.includes(req.user.id)) {
        res.status(400);
        throw new Error('Already joined this match');
    }

    if (match.participants.length >= match.maxPlayers) {
        res.status(400);
        throw new Error('Match is full');
    }

    match.participants.push(req.user.id);
    await match.save();

    res.json({ message: 'Joined match successfully', match });
});

module.exports = { getMatches, createMatch, joinMatch };
