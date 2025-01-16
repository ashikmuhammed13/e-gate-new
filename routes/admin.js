const express = require('express');
const router = express.Router();
// const { fetchShipment } = require("../controller/timeline");
const { 
    addLocation, 
    getTimeline, 
    initializeTimeline 
} = require('../controller/timeline'); // Create this controller file
const normalAwb = require('../controller/normalAwb')


const sessionAuth = require('../middlewares/sessionAuth')

const { 
    fetchAdminProfile,
    addAdmin,login
} = require('../controller/adminController')
 
router.get("/createAwb",sessionAuth,normalAwb.getAwbPage)
router.post("/createAwb",sessionAuth,normalAwb.createAwb)
router.get('/track',   sessionAuth,normalAwb.getTrackingPage);
router.post('/track', sessionAuth,normalAwb.trackShipment);         
router.get("/login", (req, res) => res.render("admin/login"));
router.post("/login", login);

router.get("/profile" ,sessionAuth,  fetchAdminProfile)
router.post("/add",  sessionAuth    ,    addAdmin)
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