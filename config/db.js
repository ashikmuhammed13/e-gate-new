const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from a .env file into process.env
dotenv.config();

// Read the MongoDB URI from environment variables
const mongoURI = process.env.MONGO_URI;

// Debugging: Log the MongoDB URI to ensure it's being read correctly
console.log('MONGO_URI:', mongoURI);

// Add a check to ensure the URI is defined
if (!mongoURI) {
  console.error('Error: MONGO_URI is not defined');
  process.exit(1);
}

// Set Mongoose options
mongoose.set('strictQuery', true);

// Connect to MongoDB using the URI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Get the default connection
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to Mongoose'));
db.on('disconnected', () => {
  console.log('Mongoose Disconnected');
});

module.exports = db;
