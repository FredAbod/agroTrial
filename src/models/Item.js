const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits', 'meat', 'dairy', 'eggs', 'grains', 'other']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{
    type: String
  }],
  harvestDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  organic: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  available: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Add text index for search functionality
itemSchema.index({ name: 'text', description: 'text' });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;