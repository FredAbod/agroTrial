const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    index: '2dsphere'
  },
  zipCode: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  deliveryAvailable: {
    type: Boolean,
    default: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;