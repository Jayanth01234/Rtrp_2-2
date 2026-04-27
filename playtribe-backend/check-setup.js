// Check current setup and identify issues
const fs = require('fs');
const path = require('path');

console.log('=== Checking Setup ===');

// Check if package.json exists
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log('Package.json exists');
  console.log('Dependencies:', Object.keys(packageJson.dependencies || {}));
  console.log('Multer in dependencies:', 'multer' in (packageJson.dependencies || {}));
} else {
  console.log('ERROR: package.json not found');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('node_modules directory exists');
  
  // Check if multer exists
  const multerPath = path.join(nodeModulesPath, 'multer');
  if (fs.existsSync(multerPath)) {
    console.log('multer is installed');
  } else {
    console.log('ERROR: multer not found in node_modules');
  }
} else {
  console.log('ERROR: node_modules directory not found');
}

// Check if uploads directory exists
const uploadsPath = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsPath)) {
  console.log('uploads directory exists');
} else {
  console.log('uploads directory not found (will be created on server start)');
}

// Check if upload middleware exists
const uploadMiddlewarePath = path.join(__dirname, 'middleware', 'uploadMiddleware.js');
if (fs.existsSync(uploadMiddlewarePath)) {
  console.log('uploadMiddleware.js exists');
} else {
  console.log('ERROR: uploadMiddleware.js not found');
}

console.log('=== Setup Check Complete ===');
