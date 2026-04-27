// Test script to verify auth endpoints
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB for testing'))
  .catch(err => console.error('MongoDB connection failed:', err));

// Test User model
const User = require('./models/User');

const testUser = async () => {
  try {
    // Check if test user exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      await User.deleteOne({ email: 'test@example.com' });
      console.log('Deleted existing test user');
    }

    // Create test user
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      city: 'Test City',
      sport: 'Football',
      skillLevel: 'Beginner'
    };

    console.log('Creating test user with data:', userData);
    const user = await User.create(userData);
    console.log('Test user created successfully:', user.email);

    // Test password matching
    const isMatch = await user.matchPassword('password123');
    console.log('Password match test:', isMatch);

    // Clean up
    await User.deleteOne({ email: 'test@example.com' });
    console.log('Test user cleaned up');

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

testUser();
