// const mongoose = require("mongoose");
// const { Shipment } = require('../models/shipment');


// const fetchShipment = async (req, res) => {
//     try {
//         console.log(req.body);
//         const { trackingId } = req.body; // Extract tracking ID from request body
//         if (!trackingId) {
//             return res.status(400).send("Tracking ID is required.");
//         }

//         const shipment = await Shipment.findOne({ awbNumber: trackingId });
//         console.log(shipment)
//         if (!shipment) {
//             return res.status(404).render("user/userTracking", { 
//                 error: "Shipment not found. Please check your tracking ID." 
//             });
//         }


//         res.render("user/userTracking", { shipment });
//     } catch (error) {
//         console.error("Error fetching shipment:", error);
//         res.status(500).render("user/userTracking", { 
//             error: "An error occurred while fetching the shipment. Please try again." 
//         });
//     }
// };
 

// module.exports = { fetchShipment };
