const asyncHandler = require('express-async-handler');
const JoinRequest = require('../models/JoinRequest');
const Team = require('../models/Team');

// @desc    Create a join request for a team
// @route   POST /api/requests/team/:teamId
// @access  Private
const createJoinRequest = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    const existingRequest = await JoinRequest.findOne({
        user: req.user.id,
        team: req.params.teamId,
        status: 'Pending'
    });

    if (existingRequest) {
        res.status(400);
        throw new Error('Join request already pending');
    }

    const joinRequest = await JoinRequest.create({
        user: req.user.id,
        team: req.params.teamId
    });

    res.status(201).json(joinRequest);
});

// @desc    Get team join requests
// @route   GET /api/requests/team/:teamId
// @access  Private
const getTeamRequests = asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    if (team.admin.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized as admin');
    }

    const requests = await JoinRequest.find({ team: req.params.teamId, status: 'Pending' })
        .populate('user', 'name preferredSport skillLevel');

    res.json(requests);
});

// @desc    Update join request status
// @route   PUT /api/requests/:id
// @access  Private
const updateRequestStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const joinRequest = await JoinRequest.findById(req.params.id);

    if (!joinRequest) {
        res.status(404);
        throw new Error('Join request not found');
    }

    const team = await Team.findById(joinRequest.team);

    if (team.admin.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized as admin');
    }

    joinRequest.status = status;
    await joinRequest.save();

    if (status === 'Accepted') {
        if (!team.members.includes(joinRequest.user)) {
            team.members.push(joinRequest.user);
            await team.save();
        }
    }

    res.json(joinRequest);
});

// @desc    Get user's pending requests
// @route   GET /api/requests/me
// @access  Private
const getMyRequests = asyncHandler(async (req, res) => {
    const requests = await JoinRequest.find({ user: req.user.id })
        .populate('team', 'name sport');
    res.json(requests);
});

module.exports = { createJoinRequest, getTeamRequests, updateRequestStatus, getMyRequests };
