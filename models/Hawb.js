const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HAWBSchema = new Schema({
  awbNumber: {
    type: String,
    required: true,
    
  },
  mawbNumber: {
    type: String
   
  },
  shipperName: String,
  consigneeName: String,
  carrierCode: String,
  grossWeight: {
    type: Number,
    min: 0
  },
  By: String,
              firstcarrier: String,
  dimensions: {
    type: String
  },
  departure: String,
  destination: String,
  handlingInformation: String,
  prepaid:  Number,
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
  kiloGram: {
    type: Number,
    min: 0
  },
  RATECHARGE: Number,
  consolidated:String,
  totalQTY: {
    type: Number,
    min: 0
  },
  QTY: {
    type: Number,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('HAWB', HAWBSchema);

// const mongoose = require('mongoose');

// const hawbSchema = new mongoose.Schema({
//     // Core HAWB Information
//     hawbNumber: {
//         type: String,
//         required: [true, 'HAWB number is required'],
//         unique: true,
//         trim: true
//     },
//     mawbReference: {
//         mawbNumber: {
//             type: String,
//             required: [true, 'MAWB reference is required'],
//             ref: 'MAWB'
//         },
//         consolidationType: {
//             type: String,
//             enum: ['DIRECT', 'CONSOLIDATED'],
//             default: 'DIRECT'
//         }
//     },
//     status: {
//         type: String,
//         enum: ['DRAFT', 'ISSUED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
//         default: 'DRAFT'
//     },
    
//     // Shipper Information
//     shipperName: {
//         type: String,
//         required: [true, 'Shipper name is required'],
//         trim: true
//     },
//     shipperAddress: {
//         street: String,
//         city: String,
//         state: String,
//         country: String,
//         zipCode: String,
//         contactNumber: String,
//         email: String
//     },
    
//     // Consignee Information
//     consigneeName: {
//         type: String,
//         required: [true, 'Consignee name is required'],
//         trim: true
//     },
//     consigneeAddress: {
//         street: String,
//         city: String,
//         state: String,
//         country: String,
//         zipCode: String,
//         contactNumber: String,
//         email: String
//     },
    
//     // Routing Information (inherited from MAWB)
//     departure: {
//         airport: String,
//         date: Date
//     },
//     destination: {
//         airport: String,
//         estimatedArrival: Date
//     },
    
//     // Cargo Details
//     cargoDetails: {
//         grossWeight: {
//             value: Number,
//             unit: {
//                 type: String,
//                 enum: ['KG', 'LB'],
//                 default: 'KG'
//             }
//         },
//         volumetricWeight: {
//             value: Number,
//             unit: {
//                 type: String,
//                 enum: ['KG', 'LB'],
//                 default: 'KG'
//             }
//         },
//         pieces: Number,
//         dimensions: [{
//             length: Number,
//             width: Number,
//             height: Number,
//             unit: {
//                 type: String,
//                 enum: ['CM', 'IN'],
//                 default: 'CM'
//             }
//         }],
//         natureOfGoods: String,
//         specialHandlingCodes: [String],
//         packageType: String
//     },
    
//     // Charges
//     charges: {
//         weightCharge: Number,
//         valuation: Number,
//         tax: Number,
//         totalOtherCharges: Number,
//         total: Number,
//         declaredValue: Number,
//         currency: {
//             type: String,
//             default: 'USD'
//         },
//         prepaid: {
//             weight: Number,
//             valuation: Number,
//             tax: Number,
//             otherCharges: Number,
//             total: Number
//         },
//         collect: {
//             weight: Number,
//             valuation: Number,
//             tax: Number,
//             otherCharges: Number,
//             total: Number
//         }
//     },
    
//     // Other Information
//     specialInstructions: String,
//     handlingInformation: String,
//     deliveryInstructions: String,
    
//     // Customs Information
//     customsInformation: {
//         brokerName: String,
//         declarationNumber: String,
//         customsStatus: String,
//         HSCodes: [String],
//         documentsProvided: [{
//             documentType: String,
//             documentNumber: String,
//             issueDate: Date
//         }]
//     },
    
//     // Tracking
//     trackingEvents: [{
//         timestamp: Date,
//         location: String,
//         status: String,
//         remarks: String,
//         updatedBy: String
//     }],
    
//     // Delivery Information
//     delivery: {
//         requestedDate: Date,
//         actualDeliveryDate: Date,
//         receivedBy: String,
//         proofOfDelivery: String,
//         remarks: String
//     },
    
//     // Metadata
//     issuedBy: {
//         type: String,
//         required: true
//     },
//     issuedAt: {
//         type: Date,
//         default: Date.now
//     },
//     lastModifiedBy: String,
//     lastModifiedAt: Date,
    
//     // Document References
//     attachments: [{
//         type: String,
//         name: String,
//         url: String,
//         uploadedAt: Date,
//         uploadedBy: String
//     }]
// }, {
//     timestamps: true
// });

// // Add indexes for frequently queried fields
// hawbSchema.index({ hawbNumber: 1 });
// hawbSchema.index({ 'mawbReference.mawbNumber': 1 });
// hawbSchema.index({ status: 1 });
// hawbSchema.index({ 'departure.date': 1 });

// // Pre-save middleware to update lastModifiedAt
// hawbSchema.pre('save', function(next) {
//     this.lastModifiedAt = new Date();
//     next();
// });

// // Virtual for getting full routing information from MAWB
// hawbSchema.virtual('fullRouting', {
//     ref: 'MAWB',
//     localField: 'mawbReference.mawbNumber',
//     foreignField: 'mawbNumber',
//     justOne: true
// });

// module.exports = mongoose.model('HAWB', hawbSchema);