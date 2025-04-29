const Item = require('../models/Item');
const Farmer = require('../models/Farmer');

/**
 * Get all items with filtering, sorting, and pagination
 * @param {Object} filters - Filtering criteria
 * @param {Object} sortOptions - Sorting options
 * @param {Object} pagination - Pagination options
 * @returns {Object} List of items with pagination info
 */
const getAllItems = async (filters = {}, sortOptions = {}, pagination = {}) => {
  const { 
    category, 
    minPrice, 
    maxPrice, 
    location,
    search 
  } = filters;
  
  const { 
    sort = 'createdAt',
    order = 'desc'
  } = sortOptions;
  
  const { 
    page = 1, 
    limit = 10 
  } = pagination;
  
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
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Determine sort field and order
  const sortCriteria = {};
  sortCriteria[sort] = order === 'asc' ? 1 : -1;
  
  // Filter by location if provided
  if (location) {
    // Get farmers in the specified location
    const farmers = await Farmer.find({
      'location.address': { $regex: location, $options: 'i' }
    }).select('_id');
    
    const farmerIds = farmers.map(farmer => farmer._id);
    query.farmerId = { $in: farmerIds };
  }
  
  // Find items with pagination
  const items = await Item.find(query)
    .sort(sortCriteria)
    .limit(parseInt(limit))
    .skip(skip)
    .populate('farmerId', 'farmName location rating');
  
  // Count total matching items
  const total = await Item.countDocuments(query);
  
  return {
    items,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * Get items for a specific farmer
 * @param {String} farmerId - The farmer ID
 * @param {Object} filters - Filtering criteria
 * @param {Object} sortOptions - Sorting options
 * @param {Object} pagination - Pagination options
 * @returns {Object} List of items with pagination info and farmer details
 */
const getFarmerItems = async (farmerId, filters = {}, sortOptions = {}, pagination = {}) => {
  // Validate farmer exists
  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    const error = new Error('Farmer not found');
    error.statusCode = 404;
    throw error;
  }
  
  const { available, category } = filters;
  const { sort = 'createdAt', order = 'desc' } = sortOptions;
  const { page = 1, limit = 10 } = pagination;
  
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
  const sortCriteria = {};
  sortCriteria[sort] = order === 'asc' ? 1 : -1;
  
  // Find items with pagination
  const items = await Item.find(query)
    .sort(sortCriteria)
    .limit(parseInt(limit))
    .skip(skip);
  
  // Count total matching items
  const total = await Item.countDocuments(query);
  
  return {
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
  };
};

/**
 * Get a single item by ID with related items
 * @param {String} itemId - The item ID
 * @returns {Object} Item details and related items
 */
const getItemById = async (itemId) => {
  const item = await Item.findById(itemId)
    .populate('farmerId', 'farmName location rating farmPhotos userId');
  
  if (!item) {
    const error = new Error('Item not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Get related items from the same farmer
  const relatedItems = await Item.find({ 
    farmerId: item.farmerId._id,
    _id: { $ne: itemId },
    available: true
  })
  .limit(4)
  .sort({ createdAt: -1 });
  
  return { item, relatedItems };
};

/**
 * Create a new item listing
 * @param {String} userId - The user ID
 * @param {Object} itemData - The item data
 * @returns {Object} Created item
 */
const createItem = async (userId, itemData) => {
  // Check if user is a farmer
  const farmer = await Farmer.findOne({ userId });
  
  if (!farmer) {
    const error = new Error('You must be registered as a farmer to create listings');
    error.statusCode = 403;
    throw error;
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
  } = itemData;
  
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
  
  return { item };
};

/**
 * Update an existing item
 * @param {String} itemId - The item ID
 * @param {String} userId - The user ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated item
 */
const updateItem = async (itemId, userId, updateData) => {
  // Find the item
  const item = await Item.findById(itemId);
  
  if (!item) {
    const error = new Error('Item not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Check if user owns this item
  const farmer = await Farmer.findOne({ userId, _id: item.farmerId });
  
  if (!farmer) {
    const error = new Error('Not authorized to update this item');
    error.statusCode = 403;
    throw error;
  }
  
  const {
    name,
    description,
    price,
    quantity,
    images,
    expiryDate,
    available
  } = updateData;
  
  // Update fields if provided
  if (name) item.name = name;
  if (description) item.description = description;
  if (price) item.price = price;
  if (quantity !== undefined) item.quantity = quantity;
  if (images) item.images = images;
  if (expiryDate) item.expiryDate = expiryDate;
  if (available !== undefined) item.available = available;
  
  await item.save();
  
  return { item };
};

/**
 * Delete an item
 * @param {String} itemId - The item ID
 * @param {String} userId - The user ID
 * @returns {Boolean} Success flag
 */
const deleteItem = async (itemId, userId) => {
  // Find the item
  const item = await Item.findById(itemId);
  
  if (!item) {
    const error = new Error('Item not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Check if user owns this item
  const farmer = await Farmer.findOne({ userId, _id: item.farmerId });
  
  if (!farmer) {
    const error = new Error('Not authorized to delete this item');
    error.statusCode = 403;
    throw error;
  }
  
  await Item.findByIdAndDelete(itemId);
  
  // Update farmer's active listings count
  farmer.activeListingsCount = Math.max(0, farmer.activeListingsCount - 1);
  await farmer.save();
  
  return { success: true };
};

module.exports = {
  getAllItems,
  getFarmerItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
};