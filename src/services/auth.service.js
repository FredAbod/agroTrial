const User = require('../models/User');
const Farmer = require('../models/Farmer');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const config = require('../config');

/**
 * Register a new user in the system
 * @param {Object} userData - User registration data
 * @returns {Object} User object and tokens
 */
const registerUser = async (userData) => {
  const { name, email, password, role, phoneNumber, location, farmName } = userData;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 400;
    throw error;
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
  let farmer = null;
  if (user.role === 'farmer') {
    farmer = new Farmer({
      userId: user._id,
      farmName: farmName || `${name}'s Farm`,
      location: {
        address: location || 'Address not provided'
      }
    });
    
    await farmer.save();
  }
  
  // Generate tokens
  const accessToken = generateAccessToken({ userId: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user._id });
  
  return { user, farmer, accessToken, refreshToken };
};

/**
 * Authenticate a user with email and password
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} User object and tokens
 */
const loginUser = async (email, password) => {
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }
  
  // Validate password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }
  
  // Generate tokens
  const accessToken = generateAccessToken({ userId: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user._id });
  
  return { user, accessToken, refreshToken };
};

/**
 * Get a new access token using a refresh token
 * @param {String} refreshToken - The refresh token
 * @returns {String} New access token
 */
const refreshUserToken = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 400;
    throw error;
  }
  
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken, config.REFRESH_TOKEN_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({ userId: user._id, role: user.role });
    
    return { accessToken };
  } catch (error) {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }
};

/**
 * Get the current user's profile
 * @param {String} userId - The user's ID
 * @returns {Object} User profile data
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Don't send password
  user.password = undefined;
  
  let farmerProfile = null;
  if (user.role === 'farmer') {
    farmerProfile = await Farmer.findOne({ userId: user._id });
  }
  
  return { user, farmerProfile };
};

/**
 * Update the current user's profile
 * @param {String} userId - The user's ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated user profile
 */
const updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  
  const { name, avatar, phoneNumber, location } = updateData;
  
  // Update user fields if provided
  if (name) user.name = name;
  if (avatar) user.avatar = avatar;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (location) user.location = location;
  
  await user.save();
  
  // Don't send password
  user.password = undefined;
  
  return { user };
};

module.exports = {
  registerUser,
  loginUser,
  refreshUserToken,
  getCurrentUser,
  updateUserProfile
};