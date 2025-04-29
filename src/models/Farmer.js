const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  farmPhotos: [{
    type: String
  }],
  productCategories: [{
    type: String,
    enum: ['vegetables', 'fruits', 'meat', 'dairy', 'eggs', 'grains', 'other']
  }],
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  paymentDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  activeListingsCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Farmer = mongoose.model('Farmer', farmerSchema);

module.exports = Farmer;