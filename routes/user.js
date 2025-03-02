const express = require('express');
const router = express.Router();
const { fetchShipment } = require("../controller/user");


// Define routes here
router.get('/', (req, res) => {
  res.render("user/index");
});
router.get('/support', (req, res) => {
  res.render("user/support");
});
router.get('/contact', (req, res) => {
  res.render("user/contact");
});
router.post("/track-shipment", fetchShipment);
router.get('/about', (req, res) => {
  res.render("user/about");
});    

module.exports = router; // Ensure you export the router.
 