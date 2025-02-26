const express = require('express');
const router = express.Router();
const upload = require ("../helper/multer")
const NodeCache = require('node-cache');
const cache = new NodeCache();
const fileStorage = require('../utils/fileStorage');
const normalAwb = require('../controller/normalAwb')
const sessionAuth = require('../middlewares/sessionAuth')
const {fetchAdminProfile,addAdmin,login,addAwb,getAllAirlines,addAirline,getawb,sendOTP,verifyOTP} = require('../controller/AdminController')

const { Shipment } = require('../models/Shipment');

// Get shipment details
router.get("/tracking-details", async (req, res) => {
    const { awbNumber } = req.query;
    if (!awbNumber) {
        return res.status(400).json({ error: "AWB Number is required" });
    }

    try {
        const shipment = await Shipment.findOne({ awbNumber });
        if (!shipment) {
            return res.status(404).json({ error: "Shipment not found" });
        }

        // Sort timeline by timestamp
        shipment.timeline.sort((a, b) => a.timestamp - b.timestamp);

        // Get the timeline entry that matches the current location for facility type
        const currentLocationEntry = shipment.timeline.find(entry => 
            entry.location === shipment.currentLocation
        );
        
        const facilityType = currentLocationEntry?.description || 
                            shipment.timeline?.[shipment.timeline.length - 1]?.description || 
                            "N/A";

        if (req.headers.accept.includes('text/html')) {
            return res.render("admin/updateAwb", { 
                shipment,
                awbNumber,
                timeline: shipment.timeline,
                currentLocation: shipment.currentLocation || "N/A",
                facilityType: facilityType
            });
        }

        return res.json({
            timeline: shipment.timeline,
            currentLocation: shipment.currentLocation || "N/A",
            status: shipment.status
        });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

 
router.post('/addLocation/:awbNumber', async (req, res) => {
    const { location, status, description, updatedBy } = req.body;
    const { awbNumber } = req.params;

    if (!location || !status) {
        console.error("Missing location or status in request body.");
        return res.status(400).json({ message: 'Location and status are required.' });
    } 

    try {
        const shipment = await Shipment.findOne({ awbNumber: awbNumber.trim() });
        if (!shipment) {
            console.error("Shipment not found for AWB:", awbNumber);
            return res.status(404).json({ message: 'Shipment not found.' });
        }

        // Create the new timeline event
        const newTimelineEvent = {
            location,
            status,
            description,
            timestamp: new Date(),
            updatedBy: updatedBy || 'System',
            isCompleted: false
        };

        // Add to timeline array
        shipment.timeline.push(newTimelineEvent);
        
        // REMOVE THIS LINE - don't update currentLocation when adding a new location
        // shipment.currentLocation = location;
        
        // Save to database
        await shipment.save();

        // Find the timeline entry that matches the current location for facility type
        const currentLocationEntry = shipment.timeline.find(entry => 
            entry.location === shipment.currentLocation
        );
        
        const facilityType = currentLocationEntry?.description || "N/A";

        res.status(201).json({
            message: 'Location added successfully.',
            timeline: shipment.timeline,
            currentLocation: shipment.currentLocation, // This will be the unchanged current location
            facilityType: facilityType,
            status: shipment.status,
            success: true
        });
    } catch (error) {
        console.error('Error adding location:', error.stack);
        res.status(500).json({ 
            message: 'An error occurred while adding location.',
            success: false 
        });
    }
});

router.post('/update-timeline', async (req, res) => {
    const { id, awbNumber, isCompleted } = req.body;
    
    console.log('Update timeline request:', { id, awbNumber, isCompleted });
    
    try {
        // First find the shipment to get the timeline item's status
        const shipment = await Shipment.findOne({ awbNumber });
        
        if (!shipment) {
            console.error(`Shipment not found for AWB: ${awbNumber}`);
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }
        
        // Find the timeline item we're updating
        const timelineItem = shipment.timeline.find(item => item._id.toString() === id);
        
        if (!timelineItem) {
            console.error(`Timeline item ${id} not found in shipment ${awbNumber}`);
            return res.status(404).json({
                success: false,
                message: 'Timeline item not found'
            });
        }
        
        console.log('Found timeline item:', timelineItem);
        
        // Update the isCompleted status of the timeline item
        const updateResult = await Shipment.updateOne(
            { awbNumber, 'timeline._id': id },
            { $set: { 'timeline.$.isCompleted': isCompleted } }
        );
        
        console.log('Timeline item update result:', updateResult);
        
        // If the item is being marked as completed, update the overall shipment status
        // and currentLocation
        if (isCompleted) {
            const statusUpdateResult = await Shipment.updateOne(
                { awbNumber },
                { 
                    $set: { 
                        status: timelineItem.status,
                        currentLocation: timelineItem.location  // This line is correct
                    } 
                }
            );
            
            console.log('Status and location update result:', statusUpdateResult);
        }
        
        // Get the updated shipment
        const updatedShipment = await Shipment.findOne({ awbNumber });
        
        // THIS IS THE ISSUE - you're ignoring the database's currentLocation and overriding with timeline data
        // Remove or change these lines:
        
        // Sort timeline by timestamp to get the latest entry
        // Note: We're creating a copy with [...] to avoid modifying the original
        const sortedTimeline = [...updatedShipment.timeline].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        // Get the current location and facility type from the most recent timeline entry
       
        
        // INSTEAD, use the updatedShipment's currentLocation directly:
        
        // Find the timeline entry that matches the shipment's currentLocation for facility type
        const currentLocationEntry = updatedShipment.timeline.find(entry => 
            entry.location === updatedShipment.currentLocation
        );
        
        const facilityType = currentLocationEntry?.description || "N/A";
        
        console.log('Updated shipment status:', updatedShipment.status);
        console.log('Current location:', updatedShipment.currentLocation); // Use this instead
        console.log('Facility type:', facilityType);
        
        res.json({
            success: true,
            message: 'Timeline updated successfully',
            timeline: updatedShipment.timeline,
            status: updatedShipment.status,
            currentLocation: updatedShipment.currentLocation, // Use this instead
            facilityType: facilityType
        });

    } catch (error) {
        console.error('Error updating timeline:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update timeline',
            error: error.message
        });
    }
});
router.post("/addAwb",addAwb)
router.get("/fetchShipment",normalAwb.fetchAllAwb)
router.get("/createAwb",sessionAuth,normalAwb.getAwbPage)
router.post("/createAwb",sessionAuth,normalAwb.createAwb)
router.get('/track',   sessionAuth,normalAwb.getTrackingPage);
router.post('/track', sessionAuth,normalAwb.trackShipment);         
router.get("/login", (req, res) => res.render("admin/login"));
router.post("/login", login);
router.post("/generate-mawb",normalAwb.generatemawb)
router.get("/mawb", normalAwb.getMawb)
router.post("/generate-hawb",normalAwb.generateHawb)
router.get("/hawb", normalAwb.getHawb)
router.get("/getShipment", normalAwb.getShipment)
router.get("/profile" ,sessionAuth,  fetchAdminProfile)
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/add-admin', addAdmin);
router.get('/getSavedAddresses', normalAwb.getSavedAddresses);
router.get("/airlines",getAllAirlines)
router.post('/add-airline', upload.single('airlineImage'), addAirline);
router.get("/getawb",getawb)
router.get('/downloadPdf/:pdfFile',normalAwb.downloadPdf);
  

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login')
    });
});
  




module.exports = router;