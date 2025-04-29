const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  name: String,
  unit: String
});

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'cash_on_delivery']
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    instructions: String
  },
  deliveryDate: Date,
  deliveryFee: {
    type: Number,
    default: 0
  },
  contactPhone: String,
  notes: String,
  trackingInfo: {
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;