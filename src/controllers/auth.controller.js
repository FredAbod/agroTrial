const User = require('../models/User');
const Farmer = require('../models/Farmer');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Register a new user (farmer or consumer)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phoneNumber, location } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password, // Will be hashed by the pre-save hook
      role: role || 'consumer', // Default to consumer if not specified
      phoneNumber,
      location
    });
    
    await user.save();
    
    // If the user is registering as a farmer, create a farmer profile
    if (user.role === 'farmer') {
      const farmer = new Farmer({
        userId: user._id,
        farmName: req.body.farmName || `${name}'s Farm`,
        location: {
          address: location || 'Address not provided'
        }
      });
      
      await farmer.save();
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });
    
    // Return user data and tokens
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });
    
    // Return user data and tokens
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken, config.REFRESH_TOKEN_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    
    res.json({
      accessToken
    });
  } catch (error) {
    logger.error('Refresh token error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

/**
 * Get current user profile
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Don't send password
    user.password = undefined;
    
    let farmerProfile = null;
    if (user.role === 'farmer') {
      farmerProfile = await Farmer.findOne({ userId: user._id });
    }
    
    res.json({
      user,
      ...(farmerProfile && { farmerProfile })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, avatar, phoneNumber, location } = req.body;
    
    // Update user fields if provided
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (location) user.location = location;
    
    await user.save();
    
    // Don't send password
    user.password = undefined;
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getCurrentUser,
  updateProfile
};