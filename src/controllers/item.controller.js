const Item = require('../models/Item');
const Farmer = require('../models/Farmer');
const logger = require('../utils/logger');

/**
 * Get all items with filtering, sorting, and pagination
 */
const getAllItems = async (req, res, next) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      location,
      search,
      sort = 'createdAt',
      order = 'desc',
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build query
    const query = { available: true };
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Filter by price range if provided
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Search by text if provided
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by location (requires aggregation with farmer location)
    let items;
    let total;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort field and order
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    if (location) {
      // Get farmers in the specified location
      const farmers = await Farmer.find({
        'location.address': { $regex: location, $options: 'i' }
      }).select('_id');
      
      const farmerIds = farmers.map(farmer => farmer._id);
      query.farmerId = { $in: farmerIds };
    }
    
    // Find items with pagination
    items = await Item.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('farmerId', 'farmName location rating');
    
    // Count total matching items
    total = await Item.countDocuments(query);
    
    res.json({
      items,
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
 * Get items for a specific farmer
 */
const getFarmerItems = async (req, res, next) => {
  try {
    const { farmerId } = req.params;
    const { 
      available, 
      category, 
      sort = 'createdAt', 
      order = 'desc',
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Validate farmer exists
    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }
    
    // Build query
    const query = { farmerId };
    
    // Filter by availability if provided
    if (available !== undefined) {
      query.available = available === 'true';
    }
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort field and order
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // Find items with pagination
    const items = await Item.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);
    
    // Count total matching items
    const total = await Item.countDocuments(query);
    
    res.json({
      items,
      farmer: {
        id: farmer._id,
        name: farmer.farmName,
        description: farmer.description
      },
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
 * Get a single item by ID
 */
const getItemById = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    
    const item = await Item.findById(itemId)
      .populate('farmerId', 'farmName location rating farmPhotos userId');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Get related items from the same farmer
    const relatedItems = await Item.find({ 
      farmerId: item.farmerId._id,
      _id: { $ne: itemId },
      available: true
    })
    .limit(4)
    .sort({ createdAt: -1 });
    
    res.json({
      item,
      relatedItems
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new item listing
 */
const createItem = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Check if user is a farmer
    const farmer = await Farmer.findOne({ userId });
    
    if (!farmer) {
      return res.status(403).json({ message: 'You must be registered as a farmer to create listings' });
    }
    
    const {
      name,
      description,
      category,
      price,
      unit,
      quantity,
      images,
      harvestDate,
      expiryDate,
      organic
    } = req.body;
    
    // Create new item
    const item = new Item({
      farmerId: farmer._id,
      name,
      description,
      category,
      price,
      unit,
      quantity,
      images: images || [],
      harvestDate,
      expiryDate,
      organic: organic || false
    });
    
    await item.save();
    
    // Update farmer's active listings count
    farmer.activeListingsCount += 1;
    await farmer.save();
    
    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing item
 */
const updateItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.userId;
    
    // Find the item
    const item = await Item.findById(itemId);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if user owns this item
    const farmer = await Farmer.findOne({ userId, _id: item.farmerId });
    
    if (!farmer) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }
    
    const {
      name,
      description,
      price,
      quantity,
      images,
      expiryDate,
      available
    } = req.body;
    
    // Update fields if provided
    if (name) item.name = name;
    if (description) item.description = description;
    if (price) item.price = price;
    if (quantity !== undefined) item.quantity = quantity;
    if (images) item.images = images;
    if (expiryDate) item.expiryDate = expiryDate;
    if (available !== undefined) item.available = available;
    
    await item.save();
    
    res.json({
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an item
 */
const deleteItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.userId;
    
    // Find the item
    const item = await Item.findById(itemId);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if user owns this item
    const farmer = await Farmer.findOne({ userId, _id: item.farmerId });
    
    if (!farmer) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }
    
    await Item.findByIdAndDelete(itemId);
    
    // Update farmer's active listings count
    farmer.activeListingsCount = Math.max(0, farmer.activeListingsCount - 1);
    await farmer.save();
    
    res.json({
      message: 'Item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllItems,
  getFarmerItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
};