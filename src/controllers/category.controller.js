const Category = require('../models/Category');
const logger = require('../utils/logger');

/**
 * Get all product categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true })
      .sort({ name: 1 });
    
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category (admin only)
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    
    const category = new Category({
      name,
      description,
      icon
    });
    
    await category.save();
    
    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category (admin only)
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, active } = req.body;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if name already exists for another category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
      category.name = name;
    }
    
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (active !== undefined) category.active = active;
    
    await category.save();
    
    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category (admin only)
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deletedCategory = await Category.findByIdAndDelete(id);
    
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};