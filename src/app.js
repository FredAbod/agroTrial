const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth.routes');
const farmerRoutes = require('./routes/farmers.routes');
const itemRoutes = require('./routes/items.routes');
const farmerItemRoutes = require('./routes/farmer-items.routes');
const orderRoutes = require('./routes/orders.routes');
const conversationRoutes = require('./routes/chat.routes');
const categoryRoutes = require('./routes/category.routes');
const locationRoutes = require('./routes/location.routes');
const notificationRoutes = require('./routes/notification.routes');

// Import middlewares
const errorMiddleware = require('./middlewares/error.middleware');

// Initialize express app
const app = express();

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err.message));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// Routes
app.use('/auth', authRoutes);
app.use('/farmers', farmerRoutes);
app.use('/farmers/:farmerId/items', farmerItemRoutes);
app.use('/items', itemRoutes);
app.use('/orders', orderRoutes);
app.use('/conversations', conversationRoutes);
app.use('/categories', categoryRoutes);
app.use('/locations', locationRoutes);
app.use('/notifications', notificationRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Agri-Connect API' });
});

// Error handling middleware
app.use(errorMiddleware);

module.exports = app;