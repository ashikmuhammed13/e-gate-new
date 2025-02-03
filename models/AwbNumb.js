// models/AWB.js
const mongoose = require('mongoose');

const awbSchema = new mongoose.Schema({
 
  awbNumber: {
    type: String,
    required: true,
    unique: true
  },
  awbType: {
    type: String,
    enum: ['master', 'house'],
    required: true
  },
  prefix: {
    type: String,
    required: true,
    unique: true
},
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  carrier: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AWB', awbSchema);