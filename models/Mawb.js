const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  kiloGram: String,
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

module.exports = mongoose.model('MAWB', MAWBSchema);
 
// const mongoose = require('mongoose');

// const mawbSchema = new mongoose.Schema({
//     // Core AWB Information
//     mawbNumber: {
//         type: String,
//         required: [true, 'MAWB number is required'],
//         unique: true,
//         trim: true
//     },
//     airlinePrefix: {
//         type: String,
//         required: [true, 'Airline prefix is required'],
//         trim: true
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
    
//     // Routing Information
//     departure: {
//         airport: {
//             type: String,
//             required: [true, 'Departure airport is required']
//         },
//         date: Date
//     },
//     destination: {
//         airport: {
//             type: String,
//             required: [true, 'Destination airport is required']
//         },
//         estimatedArrival: Date
//     },
//     routingDetails: [{
//         flight: String,
//         carrier: String,
//         date: Date,
//         from: String,
//         to: String
//     }],
    
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
//         dangerousGoods: {
//             isDangerous: {
//                 type: Boolean,
//                 default: false
//             },
//             UNNumber: String,
//             class: String,
//             packingGroup: String
//         }
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
//     customsInformation: {
//         brokerName: String,
//         declarationNumber: String,
//         customsStatus: String
//     },
    
//     // Tracking
//     trackingEvents: [{
//         timestamp: Date,
//         location: String,
//         status: String,
//         remarks: String,
//         updatedBy: String
//     }],
    
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
//     lastModifiedAt: Date
// }, {
//     timestamps: true
// });

// // Add indexes for frequently queried fields
// mawbSchema.index({ mawbNumber: 1 });
// mawbSchema.index({ 'departure.date': 1 });
// mawbSchema.index({ status: 1 });

// module.exports = mongoose.model('MAWB', mawbSchema);