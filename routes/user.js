const express = require('express');
const router = express.Router();
// const { fetchShipment } = require("../controller/user");


// Define routes here
router.get('/', (req, res) => {
  res.render("user/index");
});
// router.post("/track-shipment", fetchShipment);
    

module.exports = router; // Ensure you export the router.
