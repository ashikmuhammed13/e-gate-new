const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const AWB = require("../models/AwbNumb")
const Airlines = require("../models/Airlines")
const { sendOtps, generateOTP } = require('../utils/otp');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Load environment variables from .env file

const login = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.render('admin/login', { 
        error: 'Email and password are required',
        email: email || '' // Preserve entered email
      });
    }
    
    // Fetch admin by email
    const admin = await Admin.findOne({ email }).select('+password');
    
    // Check if admin exists
    if (!admin) {
      return res.render('admin/login', { 
        error: 'Invalid email or password',
        email: email || '' // Preserve entered email
      });
    }
    
    // Check if account is locked
    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((admin.lockUntil - Date.now()) / (60 * 1000));
      return res.render('admin/login', {
        error: `Account is temporarily locked. Please try again in ${minutesLeft} minutes.`,
        email: email || ''
      });
    }
    
    // Validate password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    // Handle invalid password
    if (!isPasswordValid) {
      // Increment login attempts
      admin.loginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
        await admin.save();
        return res.render('admin/login', { 
          error: 'Too many failed attempts. Account locked for 30 minutes.',
          email: email || ''
        });
      }
      
      await admin.save();
      
      return res.render('admin/login', { 
        error: 'Invalid email or password',
        email: email || ''
      });
    }
    
    // Check if admin is active
    if (admin.status !== 'active') {
      return res.render('admin/login', {
        error: 'Your account is inactive. Please contact support.',
        email: email || ''
      });
    }
    
    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
      admin.loginAttempts = 0;
      admin.lockUntil = null;
      await admin.save();
    }
    
    // Set session
    req.session.user = {
      id: admin._id,
      role: admin.role,
      name: `${admin.firstName} ${admin.lastName}`,
      email: admin.email
    };
    
    // Redirect based on verification status
    if (!admin.isVerified) {
      return res.redirect('/admin/complete-profile');
    }
    
    res.redirect('/admin/profile');
  } catch (error) {
    console.error('Error during login:', error);
    res.render('admin/login', {
      error: 'An unexpected error occurred. Please try again later.'
    });
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
      isVerified: true,
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



const fetchAdminProfile = async (req, res) => {
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
    const { awbNumber, awbType, origin, destination, carrier, status, notes, prefix } = req.body;
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
    // Fetch all airlines from the database
    const airlines = await Airlines.find().lean();
    
    // For each airline, get the AWB count
    for (let airline of airlines) {
      const awbCount = await AWB.countDocuments({ prefix: airline.prefix });
      airline.awbCount = awbCount;
    }
    
    // Get total AWB count
    const totalAwbs = await AWB.countDocuments();
    
    // Get active airlines count
    const activeAirlinesCount = airlines.length;
    
    // Get 5 most recently used AWBs across all airlines
    const recentAwbs = await AWB.find({ isUsed: true })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate({
        path: 'prefix',
        select: 'prefix'
      })
      .lean();
      
    // Format recent AWBs with airline info
    const formattedRecentAwbs = [];
    
    for (const awb of recentAwbs) {
      const airline = await Airlines.findOne({ prefix: awb.prefix }).lean();
      
      formattedRecentAwbs.push({
        awbNumber: `${awb.prefix}-${awb.awbNumber}`,
        airlineName: airline ? airline.airlineName : 'Unknown Airline',
        timestamp: awb.updatedAt,
        origin: awb.origin,
        destination: awb.destination
      });
    }
    
    // Calculate growth percentage (example calculation - you can adjust this based on your needs)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const lastMonthAwbs = await AWB.countDocuments({ createdAt: { $lte: oneMonthAgo } });
    const growthPercentage = lastMonthAwbs > 0 
      ? Math.round(((totalAwbs - lastMonthAwbs) / lastMonthAwbs) * 100) 
      : 0;
    
    res.render('admin/airlines', { 
      airlines, 
      totalAwbs, 
      activeAirlinesCount,
      recentAwbs: formattedRecentAwbs,
      growthPercentage
    });
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

// Modified getawb controller function
const getawb = async (req, res) => {
  try {
    const { prefix } = req.query;
    if (!prefix) return res.status(400).send("Prefix is required");

    // Get all AWBs with the specified prefix
    const awbs = await AWB.find({ prefix }).lean();
    
    // Get the airline information
    const airlines = await Airlines.findOne({ prefix }).lean();
    
    // Get the last 3 used AWBs, sorted by most recent first
    const recentlyUsedAwbs = await AWB.find({ 
      prefix, 
      isUsed: true 
    })
    .sort({ updatedAt: -1 })
    .limit(3)
    .lean();

    res.render("admin/awb", { 
      awbs, 
      prefix, 
      airlines, 
      airlineId: airlines._id,
      recentlyUsedAwbs 
    });
  } catch (error) {
    console.error("Error fetching AWBs:", error);
    res.status(500).send("Internal Server Error");
  }
}






module.exports = {
  fetchAdminProfile,
  addAdmin, login, createSuperAdmin, addAwb, getAllAirlines, addAirline, getawb, verifyOTP, sendOTP
};


