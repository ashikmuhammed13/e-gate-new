// Add this to your controller file
const AddressBook = require('../models/AddressBook'); // Adjust path as needed

// Add these new controller methods
module.exports.saveAddress = async (req, res) => {
    try {
      const { type, address } = req.body;
      console.log("save:", type, address);
      
      if (!type || !address) {
        return res.status(400).json({ success: false, message: 'Type and address are required' });
      }
      
      const newAddress = new AddressBook({
        type,
        name: address.split('\n')[0] || 'Unknown',
        address
      });
      
      try {
        const savedAddress = await newAddress.save();
        console.log("Saved address:", savedAddress);
        res.status(200).json({ success: true, message: 'Address saved successfully' });
      } catch (saveError) {
        console.error('Error during save operation:', saveError);
        res.status(500).json({ success: false, message: 'Database error while saving', error: saveError.message });
      }
    } catch (error) {
      console.error('Error saving address:', error);
      res.status(500).json({ success: false, message: 'Error saving address', error: error.message });
    }
  };

module.exports.searchAddresses = async (req, res) => {
  try {
    const { query, type } = req.query;
    console.log("save:",query, type)
    if (!query || !type) {
      return res.status(400).json({ success: false, message: 'Query and type are required' });
    }
    
    const addresses = await AddressBook.find({
      type,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    console.error('Error searching addresses:', error);
    res.status(500).json({ success: false, message: 'Error searching addresses' });
  }
};