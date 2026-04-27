const asyncHandler = require('express-async-handler');
const Team = require('../models/Team');
const JoinRequest = require('../models/JoinRequest');
const User = require('../models/User');

// @desc    Debug endpoint to check team and request data
// @route   GET /api/debug/team/:teamId
// @access  Private
const debugTeamRequests = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user.id;
    
    console.log('=== DEBUG INFO ===');
    console.log('Team ID:', teamId);
    console.log('User ID:', userId);
    
    // Get team
    const team = await Team.findById(teamId);
    console.log('Team found:', !!team);
    if (team) {
        console.log('Team name:', team.name);
        console.log('Team admin:', team.admin);
        console.log('Is user admin:', team.admin.toString() === userId);
    }
    
    // Get all requests for this team
    const allRequests = await JoinRequest.find({ team: teamId })
        .populate('user', 'name city sport skillLevel');
    
    console.log('All requests:', allRequests.length);
    allRequests.forEach(req => {
        console.log(`- ${req.user?.name} (${req.status})`);
    });
    
    // Get pending requests
    const pendingRequests = await JoinRequest.find({ 
        team: teamId, 
        status: 'pending' 
    }).populate('user', 'name city sport skillLevel');
    
    console.log('Pending requests:', pendingRequests.length);
    
    res.json({
        team: team ? {
            id: team._id,
            name: team.name,
            admin: team.admin,
            isAdmin: team.admin.toString() === userId
        } : null,
        allRequestsCount: allRequests.length,
        pendingRequestsCount: pendingRequests.length,
        allRequests: allRequests,
        pendingRequests: pendingRequests,
        debug: {
            userId,
            teamId,
            isAdmin: team?.admin?.toString() === userId
        }
    });
});

module.exports = { debugTeamRequests };
