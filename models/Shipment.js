const mongoose = require('mongoose');

// Address Schema
const addressSchema = new mongoose.Schema({
  contactName: { type: String, required: true },
  company: String,
  phoneNumber: { type: String, required: true },
  email: String,
  country: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: String,
  addressLine3: String,
  postalCode: String,
  city: { type: String, required: true },
  isResidential: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Timeline Event Schema (for tracking shipment progress)
const timelineEventSchema = new mongoose.Schema({
  location: { type: String, required: true },
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  description: String,
  updatedBy: String
});

// Package Schema (for individual packages within shipment)
const packageSchema = new mongoose.Schema({
  packageType: { 
    type: String, 
    required: true,
    enum: ['Document', 'Parcel', 'Heavy Cargo']
  },
  weight: { 
    type: Number, 
    required: true,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  }
});

// Main Shipment Schema
const shipmentSchema = new mongoose.Schema({
  awbNumber: { 
    type: String, 
    required: true,
    unique: true
  },
  shipmentDate: { 
    type: Date, 
    required: true 
  },
  
  // Sender and Receiver Information
  sender: {
    addressDetails: { type: mongoose.Schema.Types.Mixed, required: true }, // Stores address directly
    savedAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' } // Reference if saved
  },
  receiver: {
    addressDetails: { type: mongoose.Schema.Types.Mixed, required: true },
    savedAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' }
  },

  // Package Information
  packages: [packageSchema],
  totalPackages: { 
    type: Number, 
    required: true,
    min: 1 
  },
  totalWeight: { 
    type: Number, 
    required: true,
    min: 0 
  },

  // Shipment Status and Tracking
  status: {
    type: String,
    required: true,
    enum: [
      'Created',
      'Pickup Scheduled',
      'Picked Up',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Failed Delivery',
      'Cancelled'
    ],
    default: 'Created'
  },
  timeline: [timelineEventSchema],

  // Additional Details
  serviceType: String,
  specialInstructions: String,
  estimatedDeliveryDate: Date,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
addressSchema.index({ contactName: 1, phoneNumber: 1 });
shipmentSchema.index({ 'sender.addressDetails.contactName': 1 });
shipmentSchema.index({ 'receiver.addressDetails.contactName': 1 });
shipmentSchema.index({ status: 1 });

// Create models
const Address = mongoose.model('Address', addressSchema);
const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = { Address, Shipment };