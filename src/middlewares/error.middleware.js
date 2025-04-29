/**
 * Global error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error status and message
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({ message: 'Validation Error', errors });
  }
  
  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(409).json({ 
      message: `Duplicate value: ${value} already exists for ${field}`
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Return error response
  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;