const asyncHandler = require('express-async-handler');
const JoinRequest = require('../models/JoinRequest');
const Team = require('../models/Team');
const Notification = require('../models/Notification');

// @desc    Create a join request for a team
// @route   POST /api/requests/team/:teamId
// @access  Private
const createJoinRequest = asyncHandler(async (req, res) => {
    console.log('Creating join request - Team ID:', req.params.teamId);
    console.log('User ID:', req.user.id);
    
    const team = await Team.findById(req.params.teamId);

    if (!team) {
        console.log('Team not found:', req.params.teamId);
        res.status(404);
        throw new Error('Team not found');
    }

    console.log('Team found:', team.name);
    console.log('Team admin:', team.admin);
    console.log('Team members:', team.members);

    if (team.members.some(memberId => memberId.toString() === req.user.id)) {
        console.log('User is already a member');
        res.status(400);
        throw new Error('User is already a member of this team');
    }

    const existingRequest = await JoinRequest.findOne({
        user: req.user.id,
        team: req.params.teamId
    });

    if (existingRequest) {
        console.log('Request already exists');
        res.status(400);
        throw new Error('Join request already exists');
    }

    const joinRequest = await JoinRequest.create({
        user: req.user.id,
        team: req.params.teamId,
        status: 'pending'
    });

    await Notification.create({
        user: team.admin,
        message: `New join request from ${req.user.name} for team ${team.name}`,
        type: 'REQUEST_RECEIVED'
    });

    console.log('Join request created successfully:', joinRequest._id);
    res.status(201).json(joinRequest);
});

// @desc    Get team join requests
// @route   GET /api/requests/team/:teamId
// @access  Private
const getTeamRequests = asyncHandler(async (req, res) => {
    console.log('Fetching team requests - Team ID:', req.params.teamId);
    console.log('Requesting user ID:', req.user.id);
    
    const team = await Team.findById(req.params.teamId);

    if (!team) {
        console.log('Team not found for requests:', req.params.teamId);
        res.status(404);
        throw new Error('Team not found');
    }

    console.log('Team found for requests:', team.name);
    console.log('Team admin:', team.admin);
    console.log('Requesting user is admin:', team.admin.toString() === req.user.id);

    if (team.admin.toString() !== req.user.id) {
        console.log('User not authorized to view requests');
        res.status(403);
        throw new Error('Not authorized as admin');
    }

    const requests = await JoinRequest.find({
        team: req.params.teamId,
        status: { $in: ['pending', 'Pending'] }
    })
        .populate('user', 'name city sport skillLevel profileImage');

    console.log('Found requests:', requests.length);
    console.log('Requests:', requests.map(r => ({ 
        id: r._id, 
        user: r.user?.name, 
        status: r.status 
    })));

    res.json(requests);
});

// @desc    Update join request status
// @route   PUT /api/requests/:id
// @access  Private
const updateRequestStatus = asyncHandler(async (req, res) => {
    const normalizedStatus = String(req.body.status || '').toLowerCase();
    if (!['accepted', 'rejected'].includes(normalizedStatus)) {
        res.status(400);
        throw new Error('Invalid status');
    }

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

    joinRequest.status = normalizedStatus;
    await joinRequest.save();

    if (normalizedStatus === 'accepted') {
        await Team.findByIdAndUpdate(joinRequest.team, {
            $addToSet: { members: joinRequest.user }
        });
    }

    if (normalizedStatus === 'accepted' || normalizedStatus === 'rejected') {
        await Notification.create({
            user: joinRequest.user,
            message: `Your request to join team ${team.name} has been ${normalizedStatus}`,
            type: normalizedStatus === 'accepted' ? 'REQUEST_ACCEPTED' : 'REQUEST_REJECTED'
        });
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
