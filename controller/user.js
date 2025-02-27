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

        // Helper functions for the template
        const helpers = {
            formatDate: function(dateString) {
                const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
                return new Date(dateString).toLocaleDateString('en-US', options);
            },
            formatTime: function(dateString) {
                const options = { hour: 'numeric', minute: 'numeric', hour12: true };
                return new Date(dateString).toLocaleTimeString('en-US', options);
            },
            getStatusIcon: function(status) {
                const iconMap = {
                    "Created": "bi-receipt",
                    "Pickup Scheduled": "bi-calendar-check",
                    "Picked Up": "bi-box-seam",
                    "In Transit": "bi-truck",
                    "Out for Delivery": "bi-bicycle",
                    "Delivered": "bi-check-circle",
                    "Failed Delivery": "bi-exclamation-triangle",
                    "Cancelled": "bi-x-circle"
                };
                return iconMap[status] || "bi-circle";
            },
            calculateCountdown: function(targetDate) {
                const now = new Date();
                const target = new Date(targetDate);
                const diffTime = Math.abs(target - now);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) {
                    return "Today";
                } else if (diffDays === 1) {
                    return "1 day";
                } else {
                    return `${diffDays} days`;
                }
            }
        };

        // Process timeline based on current status and location
        const currentStatus = shipment.status;
        const currentLocation = shipment.currentLocation;

        // Update timeline to mark items as completed or active
        shipment.timeline = shipment.timeline.map((step, index) => {
            // Determine if this step is completed based on its status and the current shipment status
            const statusOrder = ["Created", "Pickup Scheduled", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];
            const currentStatusIndex = statusOrder.indexOf(currentStatus);
            const stepStatusIndex = statusOrder.indexOf(step.status);
            
            // Mark as completed if the step status comes before the current status in the order
            const isCompleted = stepStatusIndex < currentStatusIndex || 
                               (step.status === currentStatus && step.location !== currentLocation);
            
            // Mark as active if this is the current status and location
            const isActive = step.status === currentStatus && 
                           (step.location === currentLocation || 
                            (currentLocation && step.location.includes(currentLocation)) || 
                            (currentLocation && currentLocation.includes(step.location)));
            
            return {
                ...step,
                isCompleted: isCompleted,
                isActive: isActive
            };
        });
        
        // Calculate progress percentage for timeline
        const statusOrder = ["Created", "Pickup Scheduled", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];
        const currentStatusIndex = statusOrder.indexOf(currentStatus);
        const progressPercentage = Math.max(0, Math.min(100, (currentStatusIndex / (statusOrder.length - 1)) * 100));
        
        // Prepare data for rendering
        const viewData = {
            shipment,
            helpers,
            progressPercentage,
            countdown: helpers.calculateCountdown(shipment.estimatedDeliveryDate || new Date(Date.now() + 86400000)) // Add 1 day if no date
        };

        res.render("user/userTracking", viewData);
    } catch (error) {
        console.error("Error fetching shipment:", error);
        res.status(500).render("user/userTracking", { 
            error: "An error occurred while fetching the shipment. Please try again."
        });
    }
}
 

module.exports = { fetchShipment };
