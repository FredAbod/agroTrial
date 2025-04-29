require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/agri-connect-api',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-replace-in-production',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '7d',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-replace-in-production',
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION || '30d'
};