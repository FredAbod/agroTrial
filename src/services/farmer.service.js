const Farmer = require('../models/Farmer');
const Item = require('../models/Item');
const User = require('../models/User');

/**
 * Get all farmers with optional filtering
 * @param {Object} filters - Filtering criteria (location, rating, etc.)
 * @param {Object} pagination - Pagination options (page, limit)
 * @returns {Object} List of farmers with pagination info
 */
const getAllFarmers = async (filters = {}, pagination = {}) => {
  const { location, rating } = filters;
  const { page = 1, limit = 10 } = pagination;
  
  // Build query
  const query = {};
  
  // Filter by minimum rating if provided
  if (rating) {
    query['rating.average'] = { $gte: parseFloat(rating) };
  }
  
  // Filter by location if provided (basic text search for now)
  if (location) {
    query['location.address'] = { $regex: location, $options: 'i' };
  }
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Find farmers with pagination
  const farmers = await Farmer.find(query)
    .sort({ 'rating.average': -1 }) // Sort by rating
    .limit(parseInt(limit))
    .skip(skip)
    .populate('userId', 'name avatar');
  
  // Count total matching farmers
  const total = await Farmer.countDocuments(query);
  
  return {
    farmers,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * Get a single farmer by ID with their recent listings
 * @param {String} farmerId - The farmer ID
 * @returns {Object} Farmer profile and recent items
 */
const getFarmerById = async (farmerId) => {
  // Find farmer
  const farmer = await Farmer.findById(farmerId)
    .populate('userId', 'name avatar');
  
  if (!farmer) {
    const error = new Error('Farmer not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Get recent listings
  const recentItems = await Item.find({ farmerId })
    .sort({ createdAt: -1 })
    .limit(5);
  
  return { farmer, recentItems };
};

/**
 * Update farmer profile details
 * @param {String} farmerId - The farmer ID
 * @param {String} userId - Current user ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated farmer profile
 */
const updateFarmerProfile = async (farmerId, userId, updateData) => {
  // Find farmer
  const farmer = await Farmer.findById(farmerId);
  
  if (!farmer) {
    const error = new Error('Farmer not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Check if the current user owns this farmer profile
  if (farmer.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized to update this profile');
    error.statusCode = 403;
    throw error;
  }
  
  const { 
    farmName, 
    description, 
    location, 
    farmPhotos, 
    productCategories,
    paymentDetails 
  } = updateData;
  
  // Update fields if provided
  if (farmName) farmer.farmName = farmName;
  if (description) farmer.description = description;
  if (location) farmer.location = location;
  if (farmPhotos) farmer.farmPhotos = farmPhotos;
  if (productCategories) farmer.productCategories = productCategories;
  if (paymentDetails) farmer.paymentDetails = paymentDetails;
  
  await farmer.save();
  
  return { farmer };
};

module.exports = {
  getAllFarmers,
  getFarmerById,
  updateFarmerProfile
};