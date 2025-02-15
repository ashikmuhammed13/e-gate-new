const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const AWB = require("../models/AwbNumb")
const Airlines=require("../models/Airlines")
const { sendOtps,generateOTP } = require('../utils/otp');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Load environment variables from .env file

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Fetch admin by email
        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin) {
            return res.status(401).send('Invalid credentials');
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).send('Invalid');
        }

        // Set session
        req.session.user = {
            id: admin._id,
            role: admin.role,
            name: `${admin.firstName} ${admin.lastName}`,
        };

        res.redirect('/admin/profile')
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server error');
    }
};



// Function to create a Super Admin
const createSuperAdmin = async (req, res) => {
    try {
        const existingSuperAdmin = await Admin.findOne({ role: 'Super Admin' });
        if (existingSuperAdmin) {
            console.log('Super Admin already exists.');
            return;
        }

        const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
        const password = process.env.SUPER_ADMIN_PASSWORD || 'superadminpassword';

        if (!email || !password) {
            throw new Error('Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in environment.');
        }

        const superAdmin = new Admin({
            firstName: 'Super',
            lastName: 'Admin',
            email,
            isVerified:true,
            role: 'Super Admin',
            status: 'active',
            password, // Directly assign the raw password here
        });

        await superAdmin.save();
        console.log('Super Admin created successfully.');
    } catch (error) {
        console.error('Error creating Super Admin:', error);
    }
};



const fetchAdminProfile =  async(req, res) => {
    try {
        const isSuperAdmin = req.user?.role === 'Super Admin';
        
        if (isSuperAdmin) {
            

            // Fetch all admins for super admin view
            const adminList = await Admin.find({});
            // await Admin.deleteMany({ isVerified: false, createdAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) } });
            res.render('admin/admin', { 
                isSuperAdmin: true,
                adminList,
                admin: req.user
            }); 
        } else {
            // Normal admin view
            res.render('admin/admin', {
                isSuperAdmin: false,
                admin: req.user
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
}


const addAdmin = async (req, res) => {
    const { firstName, lastName, email, phone, role, status, password } = req.body;
    
    try {
      const admin = await Admin.findOne({ email });
      if (!admin /* You could also check for a temporary flag if you set one */) {
        return res.json({ success: false, message: 'Email not verified. Please verify OTP first' });
      }
      
      // Now update with final details and mark as verified
      admin.firstName = firstName;
      admin.lastName = lastName;
      admin.phone = phone;
      admin.role = role;
      admin.status = status || 'active';
      admin.password = password; // Will be hashed in pre-save hook
      admin.isVerified = true;
      
      await admin.save();
      res.json({ success: true, message: 'Admin created successfully' });
      
    } catch (error) {
      console.error('Error adding admin:', error);
      res.json({ success: false, message: 'Server error.' });
    }
  };
  
  

  const sendOTP = async (req, res) => {
    const { email } = req.body;
    try {
      const otp = generateOTP();
      const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
  
      let admin = await Admin.findOne({ email });
      if (!admin) {
        // Create with temporary (non-empty) values for required fields
        admin = new Admin({
          email,
          otp,
          otpExpires,
          isVerified: false,
          password: 'tempPassword', // Temporary; update later
          firstName: 'tempFirstName', // Non-empty dummy value
          lastName: 'tempLastName'    // Non-empty dummy value
        });
      } else {
        // Update OTP details for an existing record
        admin.otp = otp;
        admin.otpExpires = otpExpires;
        admin.isVerified = false;
      }
      await admin.save();
      await sendOtps(email, otp);
      res.json({ success: true, message: 'OTP sent successfully' });
    } catch (err) {
      console.error('Error sending OTP:', err);
      res.json({ success: false, message: 'Error sending OTP' });
    }
  }
  
  const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.json({ success: false, message: 'Admin record not found' });
      }
      if (admin.otp !== otp || admin.otpExpires < Date.now()) {
        return res.json({ success: false, message: 'Invalid or expired OTP' });
      }
      // Clear OTP fields but do not mark as verified yet
      admin.otp = undefined;
      admin.otpExpires = undefined;
      await admin.save();
      res.json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
      console.error('Error verifying OTP:', err);
      res.json({ success: false, message: 'Error verifying OTP' });
    }
  };
  
  



    
  addAwb = async (req, res) => {
    try {
      const { awbNumber, awbType, origin, destination, carrier, status, notes,prefix } = req.body;
  console.log(req.body)
      // Check if the AWB number already exists and has been used
      const existingAwb = await AWB.findOne({ awbNumber });
      if (existingAwb) {
        if (existingAwb.used) {
          return res.status(400).send("This AWB number has already been used and cannot be reused.");
        } else {
          return res.status(400).send("This AWB number already exists.");
        }
      }
  
      // Create a new AWB document
      const newAwb = new AWB({
        awbNumber,
        awbType,
        origin,
        destination,
        carrier,
        status,
        prefix,
        notes,
      });
  
      await newAwb.save();
      const awbs = await AWB.find({ prefix }).lean(); 
      res.render("admin/awb", { awbs, prefix });

    } catch (error) {
      console.error("Error adding AWB:", error);
      res.status(500).send("Internal Server Error");
    }
}

const getAllAirlines = async (req, res) => {
try {
  const airlines = await Airlines.find(); // Fetch all airlines from the database
  res.render('admin/airlines', { airlines });
} catch (error) {
  console.error('Error fetching airlines:', error);
  res.status(500).send('Internal Server Error');
}
};
addAirline = async (req, res) => {
try {
    let { airlineName, prefix } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    // Prevent saving if airlineName is missing
    if (!airlineName || !prefix) {
        return res.status(400).send('Airline Name and Prefix are required.');
    }

    // Trim whitespace
    airlineName = airlineName.trim();
    prefix = prefix.trim();

    // Check if airlineName or prefix already exists
    const existingAirline = await Airlines.findOne({
        $or: [{ airlineName }, { prefix }]
    });

    if (existingAirline) {
        return res.status(400).send('Airline Name or Prefix already exists.');
    }

    const newAirline = new Airlines({
        airlineName,
        prefix,
        image
    });

    await newAirline.save();
    res.redirect('/admin/airlines'); // Redirect after successful creation
} catch (err) {
    console.error(err);
    res.status(500).send('Error saving airline');
}
};

getawb= async (req, res) => {
try {
    const { prefix } = req.query;
    if (!prefix) return res.status(400).send("Prefix is required");

    const awbs = await AWB.find({ prefix }).lean(); // Fetch AWBs with the given prefix
    const airlines = await Airlines.findOne({ prefix }).lean(); // Fetch only one airline

    res.render("admin/awb", { awbs, prefix ,airlines}); // Render the AWB numbers page
} catch (error) {
    console.error("Error fetching AWBs:", error);
    res.status(500).send("Internal Server Error");
}
}






module.exports = {
    fetchAdminProfile,
    addAdmin, login ,createSuperAdmin,addAwb,getAllAirlines,addAirline,getawb,verifyOTP,sendOTP
};


