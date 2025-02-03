const mongoose = require('mongoose');

// Airline Schema
const airlineSchema = new mongoose.Schema({
    airlineName: { type: String, unique: true, sparse: true },
    image: {
        type: String,
        trim: true
    },
    prefix: {
        type: String,
        required: true,
        unique: true
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
airlineSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Airline = mongoose.model('Airline', airlineSchema);

module.exports = Airline;
