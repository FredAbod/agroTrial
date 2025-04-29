const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

/**
 * Authentication middleware to protect routes
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found, authentication failed' });
    }
    
    // Add user to request object
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Convert single role to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check if user has required role
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { auth, authorize };