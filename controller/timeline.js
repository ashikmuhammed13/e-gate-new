// const Timeline = require('../models/timeline'); // Create this model file
// const moment = require('moment');

// // Initialize timeline when AWB is created
// exports.initializeTimeline = async (awbNumber) => {
//     try {
//         // Check if timeline already exists
//         const existingTimeline = await Timeline.findOne({ awbNumber });
//         if (existingTimeline) {
//             throw new Error('Timeline already exists for this AWB');
//         }

//         const initialLocation = {
//             name: 'E GATE SHIPPING',
//             address: 'DAMMAM, SA',
//             status: 'shipped',
//             timestamp: new Date(),
//             icon: 'box-seam',
//             isCompleted: true
//         };

//         const timeline = new Timeline({
//             awbNumber,
//             locations: [initialLocation]
//         });

//         await timeline.save();
//         return timeline;
//     } catch (error) {
//         throw error;
//     }
// };

// // Add new location
// exports.addLocation = async (req, res) => {
//     try {
//         const { awbNumber, name, address, status } = req.body;

//         // Validate required fields
//         if (!awbNumber || !name || !address || !status) {
//             return res.status(400).json({ error: 'Missing required fields' });
//         }

//         const newLocation = {
//             name,
//             address,
//             status,
//             timestamp: new Date(),
//             icon: getIconForStatus(status),
//             isCompleted: false
//         };

//         const updatedTimeline = await Timeline.findOneAndUpdate(
//             { awbNumber },
//             { $push: { locations: newLocation } },
//             { new: true }
//         );

//         if (!updatedTimeline) {
//             return res.status(404).json({ error: 'Timeline not found' });
//         }

//         return res.json(updatedTimeline);
//     } catch (error) {
//         return res.status(500).json({ error: error.message });
//     }
// };

// // Get timeline
// exports.getTimeline = async (req, res) => {
//     try {
//         const { awbNumber } = req.params;
        
//         const timeline = await Timeline.findOne({ awbNumber });
        
//         if (!timeline) {
//             return res.status(404).json({ error: 'Timeline not found' });
//         }

//         return res.json(timeline);
//     } catch (error) {
//         return res.status(500).json({ error: error.message });
//     }
// };

// // Update location status
// exports.updateLocationStatus = async (awbNumber, locationId, status) => {
//     try {
//         const timeline = await Timeline.findOneAndUpdate(
//             { 
//                 awbNumber,
//                 'locations._id': locationId 
//             },
//             { 
//                 $set: { 
//                     'locations.$.status': status,
//                     'locations.$.icon': getIconForStatus(status)
//                 } 
//             },
//             { new: true }
//         );

//         if (!timeline) {
//             throw new Error('Timeline or location not found');
//         }

//         return timeline;
//     } catch (error) {
//         throw error;
//     }
// };

// // Delete location
// exports.deleteLocation = async (awbNumber, locationId) => {
//     try {
//         const timeline = await Timeline.findOneAndUpdate(
//             { awbNumber },
//             { $pull: { locations: { _id: locationId } } },
//             { new: true }
//         );

//         if (!timeline) {
//             throw new Error('Timeline not found');
//         }

//         return timeline;
//     } catch (error) {
//         throw error;
//     }
// };
 
// // Helper function to determine icon based on status
// const getIconForStatus = (status) => {
//     const iconMap = {
//         'shipped': 'box-seam',
//         'in-transit': 'truck',
//         'out-for-delivery': 'bicycle',
//         'delivered': 'house-check'
//     };
//     return iconMap[status.toLowerCase()] || 'circle';
// };