const Farmer = require('../models/Farmer');
const Item = require('../models/Item');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Get all farmers with optional filtering
 */
const getAllFarmers = async (req, res, next) => {
  try {
    const { location, rating, page = 1, limit = 10 } = req.query;
    
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
    
    res.json({
      farmers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single farmer by ID
 */
const getFarmerById = async (req, res, next) => {
  try {
    const { farmerId } = req.params;
    
    // Find farmer
    const farmer = await Farmer.findById(farmerId)
      .populate('userId', 'name avatar');
    
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }
    
    // Get recent listings
    const recentItems = await Item.find({ farmerId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      farmer,
      recentItems
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update farmer profile details
 */
const updateFarmerProfile = async (req, res, next) => {
  try {
    const { farmerId } = req.params;
    const userId = req.userId;
    
    // Find farmer
    const farmer = await Farmer.findById(farmerId);
    
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }
    
    // Check if the current user owns this farmer profile
    if (farmer.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    
    const { 
      farmName, 
      description, 
      location, 
      farmPhotos, 
      productCategories,
      paymentDetails 
    } = req.body;
    
    // Update fields if provided
    if (farmName) farmer.farmName = farmName;
    if (description) farmer.description = description;
    if (location) farmer.location = location;
    if (farmPhotos) farmer.farmPhotos = farmPhotos;
    if (productCategories) farmer.productCategories = productCategories;
    if (paymentDetails) farmer.paymentDetails = paymentDetails;
    
    await farmer.save();
    
    res.json({
      message: 'Farmer profile updated successfully',
      farmer
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFarmers,
  getFarmerById,
  updateFarmerProfile
};