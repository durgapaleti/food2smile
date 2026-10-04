const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please enter food name'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select category'],
    enum: ['Vegetables', 'Fruits', 'Dairy', 'Bakery', 'Cooked Food', 'Groceries', 'Other']
  },
  quantity: {
    type: String,
    required: [true, 'Please enter quantity'],
    trim: true
  },
  location: {
    type: String,
    default: 'Local Pickup'
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  action: {
    type: String,
    required: true,
    enum: ['Sell', 'Discount', 'Free', 'Donate']
  },
  discount: {
    type: Number,
    default: 0
  },
  finalPrice: {
    type: Number,
    default: 0
  },
  deliveryOption: {
    type: String,
    default: 'Self Pickup'
  },
  spoilingDate: {
    type: Date,
    required: [true, 'Please select spoiling date']
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=80'
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Available', 'Requested', 'Sold', 'Given', 'Donated', 'Completed', 'Expired'],
    default: 'Available'
  }
}, {
  timestamps: true
});

// Indexes for fast searching and automatic expiry filtering
foodSchema.index({ name: 'text', category: 'text', location: 'text' });
foodSchema.index({ status: 1, spoilingDate: 1 });

module.exports = mongoose.model('Food', foodSchema);
