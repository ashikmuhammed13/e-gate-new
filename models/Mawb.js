const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Timeline Event Schema for MAWB tracking
const mawbTimelineEventSchema = new Schema({
  location: { type: String, required: true },
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  description: String,
  updatedBy: String,
  isCompleted: { type: Boolean, default: false }
});

const MAWBSchema = new Schema({
  awbNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hawbNumber: {
    type: String
  },
  shipperName: String,
  consigneeName: String,
  carrierCode: String,
  grossWeight: {
    type: Number,
    min: 0
  },
  dimensions: {
    type: String
  },
  departure: String,
  destination: String,
  handlingInformation: String,
  prepaid: Number,
  totalChargesCarrier: {
    type: Number,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  place: String,
  signature: String,
  frieght: String,
  iataCode: String,
  routingTO1: String,
  ICN: String,
  SAR: String,
  PP: String,
  COLUMN1: String,
  COLUMN2: String,
  NVD: String,
  NCV: String,
  kiloGram: String,
  RATECHARGE: Number,
  consolidated: String,
  totalQTY: {
    type: Number,
    min: 0
  },
  cargoItems: [{
    QTY: String,
    grossWeight: String,
    dimensions: String,
    RATECHARGE: String,
    consolidated: String
  }],
  QTY: {
    type: Number,
    min: 0
  },
  
  // Add status field for tracking overall status
  status: {
    type: String,
    enum: [
      'Created',
      'Processing',
      'In Transit',
      'Arrived',
      'Customs Clearance',
      'Delivered',
      'Exception'
    ],
    default: 'Created'
  },
  
  // Add current location field
  currentLocation: {
    type: String,
    required: false
  },
  
  // Add timeline for tracking progress
  timeline: [mawbTimelineEventSchema],
  
  // Add estimated delivery date
  estimatedDeliveryDate: Date,
  
  // Add signature information
  signedBy: String,
  signedAt: Date

}, { timestamps: true });

module.exports = mongoose.model('MAWB', MAWBSchema);