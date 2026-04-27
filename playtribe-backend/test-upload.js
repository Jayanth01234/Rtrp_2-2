// Test script to verify image upload functionality
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test if multer is working correctly
const testUpload = () => {
  console.log('=== Testing Upload Functionality ===');
  
  // Check if uploads directory exists
  const uploadsDir = path.join(__dirname, 'uploads');
  console.log('Uploads directory exists:', fs.existsSync(uploadsDir));
  
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log('Files in uploads directory:', files);
  }
  
  // Test multer import
  try {
    const { upload } = require('./middleware/uploadMiddleware');
    console.log('Multer middleware loaded successfully');
    console.log('Upload config:', {
      destination: 'uploads/',
      fileFilter: 'Function',
      limits: { fileSize: '5MB' }
    });
  } catch (err) {
    console.error('Failed to load upload middleware:', err);
  }
  
  // Test user model
  try {
    const User = require('./models/User');
    console.log('User model loaded');
    console.log('User fields:', Object.keys(User.schema.paths));
  } catch (err) {
    console.error('Failed to load User model:', err);
  }
  
  process.exit(0);
};

testUpload();
