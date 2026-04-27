const asyncHandler = require('express-async-handler');
const MatchJoinRequest = require('../models/MatchJoinRequest');
const Match = require('../models/Match');
const Notification = require('../models/Notification');

// @desc    Create a match join request
// @route   POST /api/match-requests
// @access  Private
const createMatchJoinRequest = asyncHandler(async (req, res) => {
    const { matchId } = req.body;
    const userId = req.user.id;

    // Check if match exists
    const match = await Match.findById(matchId);
    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    // Check if user is already a participant
    if (match.participants.includes(userId)) {
        res.status(400);
        throw new Error('Already joined this match');
    }

    // Check if match is full
    if (match.participants.length >= match.maxPlayers) {
        res.status(400);
        throw new Error('Match is full');
    }

    // Check if request already exists
    const existingRequest = await MatchJoinRequest.findOne({
        match: matchId,
        user: userId
    });

    if (existingRequest) {
        res.status(400);
        throw new Error('Request already sent');
    }

    // Create join request
    const joinRequest = await MatchJoinRequest.create({
        match: matchId,
        user: userId
    });

    // Populate user details
    const populatedRequest = await MatchJoinRequest.findById(joinRequest._id)
        .populate('user', 'name city sport skillLevel profileImage')
        .populate('match', 'sport date time location city');

    await Notification.create({
        user: match.creator,
        message: `New match join request from ${req.user.name} for ${match.sport} in ${match.city}`,
        type: 'MATCH_REQUEST_RECEIVED'
    });

    res.status(201).json(populatedRequest);
});

// @desc    Get match requests for a specific match (creator only)
// @route   GET /api/match-requests/match/:matchId
// @access  Private
const getMatchRequests = asyncHandler(async (req, res) => {
    const { matchId } = req.params;

    // Check if match exists and user is the creator
    const match = await Match.findById(matchId);
    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    if (match.creator.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to view requests for this match');
    }

    // Get all requests for this match
    const requests = await MatchJoinRequest.find({ match: matchId })
        .populate('user', 'name city sport skillLevel profileImage')
        .sort({ createdAt: -1 });

    res.json(requests);
});

// @desc    Update match request status (accept/reject)
// @route   PUT /api/match-requests/:requestId
// @access  Private (match creator only)
const updateMatchRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status');
    }

    // Find the request
    const request = await MatchJoinRequest.findById(requestId).populate('match');
    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    // Check if user is the match creator
    if (request.match.creator.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this request');
    }

    // Update request status
    request.status = status;
    await request.save();

    // If accepted, add user to match participants
    if (status === 'accepted') {
        const match = await Match.findById(request.match._id);
        
        // Check if match is full
        if (match.participants.length >= match.maxPlayers) {
            res.status(400);
            throw new Error('Match is full');
        }

        // Add user to participants
        match.participants.push(request.user);
        await match.save();
    }

    const populatedMatch = await Match.findById(request.match._id).populate('creator', 'name');
    await Notification.create({
        user: request.user,
        message: `Your request to join ${populatedMatch.sport} match in ${populatedMatch.city} was ${status}.`,
        type: status === 'accepted' ? 'REQUEST_ACCEPTED' : 'REQUEST_REJECTED',
    });

    // Return updated request with user details
    const updatedRequest = await MatchJoinRequest.findById(requestId)
        .populate('user', 'name city sport skillLevel profileImage')
        .populate('match', 'sport date time location city');

    res.json(updatedRequest);
});

// @desc    Get user's match requests
// @route   GET /api/match-requests/my
// @access  Private
const getMyMatchRequests = asyncHandler(async (req, res) => {
    const requests = await MatchJoinRequest.find({ user: req.user.id })
        .populate('match', 'sport date time location city')
        .sort({ createdAt: -1 });

    res.json(requests);
});

module.exports = {
    createMatchJoinRequest,
    getMatchRequests,
    updateMatchRequest,
    getMyMatchRequests
};
