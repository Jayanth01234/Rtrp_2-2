// Test script to verify join request functionality
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB for testing'))
  .catch(err => console.error('MongoDB connection failed:', err));

// Test models
const Team = require('./models/Team');
const User = require('./models/User');
const JoinRequest = require('./models/JoinRequest');

const testRequests = async () => {
  try {
    console.log('=== Testing Join Request System ===');
    
    // Find a test user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found. Please register a user first.');
      return;
    }
    console.log('Test user:', user.name, user.email);
    
    // Find or create a test team
    let team = await Team.findOne({ admin: user._id });
    if (!team) {
      console.log('Creating test team...');
      team = await Team.create({
        name: 'Test Team',
        sport: 'Football',
        city: 'Test City',
        admin: user._id,
        members: [user._id]
      });
      console.log('Test team created:', team.name);
    }
    console.log('Test team:', team.name, 'Admin:', team.admin);
    
    // Check existing requests
    const existingRequests = await JoinRequest.find({ team: team._id });
    console.log('Existing requests for this team:', existingRequests.length);
    
    // Create a test request (if none exists)
    if (existingRequests.length === 0) {
      console.log('Creating test join request...');
      const request = await JoinRequest.create({
        user: user._id, // Using same user for testing (in real scenario this would be different)
        team: team._id,
        status: 'pending'
      });
      console.log('Test request created:', request._id);
    }
    
    // Fetch all requests for the team
    const requests = await JoinRequest.find({ team: team._id })
      .populate('user', 'name city sport skillLevel');
    
    console.log('All requests for team:');
    requests.forEach(req => {
      console.log(`- Request ID: ${req._id}`);
      console.log(`  User: ${req.user?.name}`);
      console.log(`  City: ${req.user?.city}`);
      console.log(`  Sport: ${req.user?.sport}`);
      console.log(`  Skill Level: ${req.user?.skillLevel}`);
      console.log(`  Status: ${req.status}`);
      console.log('');
    });
    
    // Clean up test data
    await JoinRequest.deleteMany({ team: team._id });
    console.log('Test requests cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

testRequests();
