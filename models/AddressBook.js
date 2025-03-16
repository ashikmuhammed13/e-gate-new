// models/AddressBook.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressBookSchema = new Schema({
  type: {
    type: String,
    enum: ['shipper', 'consignee'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String, 
    required: true
  },
  contactInfo: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AddressBook', AddressBookSchema);