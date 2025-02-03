const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const AWB = require("../models/AwbNumb")
const Airlines=require("../models/Airlines")
const { sendOTP } = require('../utils/otp');
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
            await Admin.deleteMany({ isVerified: false, createdAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) } });
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
const generateOTP = () => Math.random().toString(36).substring(2, 8).toUpperCase();
const generateAdminOTP = async (req, res) => {
    const { email } = req.body;
    

    // Store in session
    
    console.log('Stored OTP Data:', req.session.otpData); // Debugging
    try {
        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin && existingAdmin.isVerified) {
            return res.json({ success: false, message: 'Email already verified!' });
        }

        const otp = generateOTP();
        const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        req.session.otpData = { email, otp, otpExpires };
        await Admin.findOneAndUpdate(
            { email },
            { otp, otpExpires },
            { upsert: true, new: true } // Creates new admin if not exists
        );

        await sendOTP(email, otp);
        res.json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error('OTP Generation Error:', error);
        res.json({ success: false, message: 'Failed to send OTP' });
    }
};

const addAdmin = async (req, res) => {
    const { firstName, lastName, email, phone, role, status, password } = req.body;

    try {
        const existingAdmin = await Admin.findOne({ email });

        console.log('Admin Found in DB:', existingAdmin); // Debugging

        if (!existingAdmin || !existingAdmin.isVerified) {
            return res.json({ success: false, message: 'Email not verified. Please verify OTP first' });
        }

        existingAdmin.firstName = firstName;
        existingAdmin.lastName = lastName;
        existingAdmin.phone = phone;
        existingAdmin.role = role;
        existingAdmin.status = status;
        existingAdmin.password = password; // Hash in pre-save hook

        await existingAdmin.save();
        res.json({ success: true, message: 'Admin created successfully' });

    } catch (error) {
        console.error('Error adding admin:', error);
        res.json({ success: false, message: 'Server error.' });
    }
};



const verifyAdminOTP = async (req, res) => {
    const { email, otp } = req.body;

    console.log('Received Email:', email);
    console.log('Received OTP:', otp);
    console.log('Stored OTP Data:', req.session.otpData);

    if (!req.session.otpData) {
        return res.json({ success: false, message: 'OTP session expired or not found' });
    }

    if (req.session.otpData.email !== email) {
        return res.json({ success: false, message: 'Email does not match OTP session' });
    }

    if (String(req.session.otpData.otp) !== String(otp)) {
        return res.json({ success: false, message: 'Invalid OTP' });
    }

    if (req.session.otpData.otpExpires < Date.now()) {
        return res.json({ success: false, message: 'OTP has expired' });
    }

    try {
        // ✅ Update `isVerified` to true in the database
        const updatedAdmin = await Admin.findOneAndUpdate(
            { email },
            { isVerified: true, otp: null, otpExpires: null },
            { new: true }
        );

        console.log('Updated Admin:', updatedAdmin); // Debugging

        // ✅ Check if the admin exists immediately after updating
        const checkAdmin = await Admin.findOne({ email });
        console.log('Admin After Update:', checkAdmin); // This should NOT be null

        req.session.otpVerified = email;
        req.session.otpData = null; // Clear OTP session

        res.json({ success: true, message: 'OTP verified successfully' });

    } catch (error) {
        console.error('Error updating verification status:', error);
        res.json({ success: false, message: 'Server error during OTP verification' });
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
    addAdmin, login ,createSuperAdmin,addAwb,getAllAirlines,addAirline,getawb,generateAdminOTP,verifyAdminOTP
};


