const mongoose = require("mongoose");
const { Address, Shipment } = require('../models/Shipment');


const fetchShipment = async (req, res) => {
    try {
        const { trackingId } = req.body;
        if (!trackingId) {
            return res.status(400).send("Tracking ID is required.");
        }

        const shipment = await Shipment.findOne({ awbNumber: trackingId });
        if (!shipment) {
            return res.status(404).render("user/userTracking", { 
                error: "Shipment not found. Please check your tracking ID." 
            });
        }

        res.render("user/userTracking", { shipment });
    } catch (error) {
        console.error("Error fetching shipment:", error);
        res.status(500).render("user/userTracking", { 
            error: "An error occurred while fetching the shipment. Please try again." 
        });
    }
};
 

module.exports = { fetchShipment };
