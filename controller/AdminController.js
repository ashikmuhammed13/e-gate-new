const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const AWB = require("../models/AwbNumb")
 // Ensure correct path to Admin model
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
        // Check if email already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).send('Email already registered.');
        }

        // Create a new admin (password will be hashed by pre-save hook)
        const newAdmin = new Admin({
            firstName,
            lastName,
            email,
            phone,
            role,
            status,
            password, // Pass plain-text password
        });

        await newAdmin.save();
        res.redirect('/admin/profile')
    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).send('Server error.');
    }},
    addAwb = async (req, res) => {
        try {
          const { awbNumber, awbType, origin, destination, carrier, status, notes } = req.body;
      
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
            notes,
          });
      
          await newAwb.save();
      
          res.redirect('/admin/profile')
        } catch (error) {
          console.error("Error adding AWB:", error);
          res.status(500).send("Internal Server Error");
        }
};





module.exports = {
    fetchAdminProfile,
    addAdmin, login ,createSuperAdmin,addAwb
};


