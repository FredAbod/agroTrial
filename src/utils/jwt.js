const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate access token for authentication
 * @param {Object} payload - Data to include in the token
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRATION
  });
};

/**
 * Generate refresh token for token renewal
 * @param {Object} payload - Data to include in the token
 * @returns {String} JWT token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.REFRESH_TOKEN_SECRET, {
    expiresIn: config.REFRESH_TOKEN_EXPIRATION
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @param {String} secret - Secret used to sign the token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token, secret = config.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
};