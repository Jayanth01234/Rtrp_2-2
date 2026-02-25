const asyncHandler = require('express-async-handler');
const Team = require('../models/Team');

// @desc    Get all teams by city
// @route   GET /api/teams
// @access  Public
const getTeams = asyncHandler(async (req, res) => {
    const city = req.query.city;
    const filter = city ? { city } : {};
    const teams = await Team.find(filter).populate('admin', 'name').populate('members', 'name');
    res.json(teams);
});

// @desc    Create a team
// @route   POST /api/teams
// @access  Private
const createTeam = asyncHandler(async (req, res) => {
    const { name, sport, city, description } = req.body;

    if (!name || !sport || !city) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    const team = await Team.create({
        name,
        sport,
        city,
        description,
        admin: req.user.id,
        members: [req.user.id]
    });

    res.status(201).json(team);
});

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Public
const getTeamById = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id)
        .populate('admin', 'name email')
        .populate('members', 'name skillLevel');

    if (team) {
        res.json(team);
    } else {
        res.status(404);
        throw new Error('Team not found');
    }
});

module.exports = { getTeams, createTeam, getTeamById };
