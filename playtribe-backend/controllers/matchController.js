const asyncHandler = require('express-async-handler');
const Match = require('../models/Match');
const Notification = require('../models/Notification');

// @desc    Get all matches by city
// @route   GET /api/matches
// @access  Public
const getMatches = asyncHandler(async (req, res) => {
    const { city, sport, skillLevel } = req.query;
    const filter = {};

    if (city) {
        filter.city = city;
    }
    if (sport) {
        filter.sport = sport;
    }

    const matches = await Match.find(filter)
        .populate('creator', 'name profileImage skillLevel')
        .populate('participants', 'name profileImage');

    const filteredMatches = skillLevel
        ? matches.filter((match) => match.creator?.skillLevel === skillLevel)
        : matches;

    res.json(filteredMatches);
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

    const populatedMatch = await Match.findById(match._id)
        .populate('creator', 'name profileImage')
        .populate('participants', 'name profileImage');

    res.status(201).json(match);
});

// @desc    Join a match directly
// @route   POST /api/matches/:id/join
// @access  Private
const joinMatch = asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id)
        .populate('creator', 'name profileImage')
        .populate('participants', 'name profileImage');

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

    if (match.creator.toString() !== req.user.id) {
        await Notification.create({
            user: match.creator,
            message: `${req.user.name} has joined your match in ${match.city}`,
            type: 'MATCH_JOINED'
        });
    }

    res.json({ message: 'Joined match successfully', match });
});

// @desc    Get single match
// @route   GET /api/matches/:id
// @access  Public
const getMatch = asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id)
        .populate('creator', 'name profileImage')
        .populate('participants', 'name profileImage');

    if (match) {
        res.json(match);
    } else {
        res.status(404);
        throw new Error('Match not found');
    }
});

module.exports = { getMatches, createMatch, joinMatch, getMatch };
