const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

// Get port from environment or use default
const PORT = config.PORT;

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = server;