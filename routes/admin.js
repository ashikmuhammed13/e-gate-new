const express = require('express');
const router = express.Router();
const upload = require ("../helper/multer")
const normalAwb = require('../controller/normalAwb')
const sessionAuth = require('../middlewares/sessionAuth')
const { 
    fetchAdminProfile,
    addAdmin,login,addAwb,getAllAirlines,addAirline,getawb,generateAdminOTP,verifyAdminOTP
} = require('../controller/adminController')

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

        if (req.headers.accept.includes('text/html')) {
            return res.render("admin/updateAwb", { 
                shipment,
                awbNumber,
                timeline: shipment.timeline,
                currentLocation: shipment.timeline?.[shipment.timeline.length - 1]?.location || "N/A",
                facilityType: shipment.timeline?.[shipment.timeline.length - 1]?.description || "N/A"
            });
        }

        return res.json({
            timeline: shipment.timeline,
            currentLocation: shipment.timeline?.[shipment.timeline.length - 1]?.location || "N/A",
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

        const newTimelineEvent = {
            location,
            status,
            description,
            timestamp: new Date(),
            updatedBy: updatedBy || 'System',
        };

        shipment.timeline.push(newTimelineEvent);
        shipment.status = status; // Update shipment status
        await shipment.save();

        console.log("Location added successfully:", newTimelineEvent);
        res.status(201).json({ message: 'Location added successfully.', timeline: shipment.timeline });
    } catch (error) {
        console.error('Error adding location:', error.stack);
        res.status(500).json({ message: 'An error occurred while adding location.' });
    }
});




// Update timeline event status
router.post('/update-timeline', async (req, res) => {
    const { id, awbNumber, isCompleted } = req.body;
    
    try {
        // Use updateOne with a very specific query to update only the exact timeline item
        const result = await Shipment.updateOne(
            { 
                awbNumber: awbNumber,
                'timeline._id': id 
            },
            { 
                $set: {
                    'timeline.$.isCompleted': isCompleted
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Timeline item not found'
            });
        }

        // Fetch the updated shipment to verify the change
        const updatedShipment = await Shipment.findOne({ awbNumber });
        const updatedItem = updatedShipment.timeline.find(
            item => item._id.toString() === id
        );

        if (!updatedItem || updatedItem.isCompleted !== isCompleted) {
            throw new Error('Failed to update timeline item');
        }

        res.json({
            success: true,
            message: 'Timeline updated successfully',
            timeline: updatedShipment.timeline
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
router.post("/add",  sessionAuth    ,    addAdmin)
router.get('/getSavedAddresses', normalAwb.getSavedAddresses);
router.get("/airlines",getAllAirlines)
router.post('/add-airline', upload.single('airlineImage'), addAirline);
router.get("/getawb",getawb)
router.post('/generate-otp',generateAdminOTP)
 router.post('/verify-otp',verifyAdminOTP)
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