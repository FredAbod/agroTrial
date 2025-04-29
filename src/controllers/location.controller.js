const Location = require('../models/Location');
const logger = require('../utils/logger');

/**
 * Get all supported locations
 */
const getAllLocations = async (req, res, next) => {
  try {
    const { country, state, deliveryAvailable } = req.query;
    
    // Build query filters
    const query = { active: true };
    if (country) query.country = country;
    if (state) query.state = state;
    if (deliveryAvailable !== undefined) {
      query.deliveryAvailable = deliveryAvailable === 'true';
    }
    
    const locations = await Location.find(query)
      .sort({ name: 1 });
    
    res.json({ locations });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new location (admin only)
 */
const createLocation = async (req, res, next) => {
  try {
    const { name, city, state, country, coordinates, zipCode, deliveryAvailable, deliveryFee } = req.body;
    
    // Check if location already exists
    const existingLocation = await Location.findOne({ 
      name, city, state, country 
    });
    
    if (existingLocation) {
      return res.status(400).json({ message: 'This location already exists' });
    }
    
    const location = new Location({
      name,
      city,
      state,
      country,
      coordinates,
      zipCode,
      deliveryAvailable: deliveryAvailable !== undefined ? deliveryAvailable : true,
      deliveryFee: deliveryFee || 0
    });
    
    await location.save();
    
    res.status(201).json({
      message: 'Location added successfully',
      location
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a location (admin only)
 */
const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      city, 
      state, 
      country, 
      coordinates, 
      zipCode, 
      active, 
      deliveryAvailable, 
      deliveryFee 
    } = req.body;
    
    const location = await Location.findById(id);
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    // Update fields if provided
    if (name) location.name = name;
    if (city) location.city = city;
    if (state) location.state = state;
    if (country) location.country = country;
    if (coordinates) location.coordinates = coordinates;
    if (zipCode) location.zipCode = zipCode;
    if (active !== undefined) location.active = active;
    if (deliveryAvailable !== undefined) location.deliveryAvailable = deliveryAvailable;
    if (deliveryFee !== undefined) location.deliveryFee = deliveryFee;
    
    await location.save();
    
    res.json({
      message: 'Location updated successfully',
      location
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a location (admin only)
 */
const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deletedLocation = await Location.findByIdAndDelete(id);
    
    if (!deletedLocation) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    res.json({
      message: 'Location deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation
};