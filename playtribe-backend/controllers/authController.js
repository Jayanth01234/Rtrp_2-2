const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    console.log('Registration request body:', req.body);
    
    const { name, email, password, city, sport, skillLevel } = req.body;

    if (!name || !email || !password || !city || !sport || !skillLevel) {
        console.log('Missing fields:', { name, email, password: !!password, city, sport, skillLevel });
        res.status(400);
        throw new Error('Please add all fields');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        console.log('User already exists:', email);
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name, email, password, city, sport, skillLevel
    });

    console.log('User created successfully:', user.email);

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    console.log('Login request body:', req.body);
    
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log('User found:', !!user);

    if (user && (await user.matchPassword(password))) {
        console.log('Login successful for:', email);
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } else {
        console.log('Login failed for:', email);
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

module.exports = { registerUser, loginUser };
