const mongoose = require('mongoose');

const awbSchema = new mongoose.Schema({
  awbNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  awbType: {
    type: String,
    required: true,
    enum: ['master', 'house']
  },
  origin: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  carrier: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'], // 'active' means currently in use
    default: 'active'
  },
  used: {
    type: Boolean,
    default: false // Marks whether the AWB number has been used
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update `updatedAt` before save
awbSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


const AWB = mongoose.model('AWB', awbSchema);

module.exports = AWB;
