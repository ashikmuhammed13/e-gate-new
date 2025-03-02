const Admin = require('../models/Admin');
const nodemailer = require('nodemailer');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email
const sendOtpsReset = async (email, otp) => {
  try {
    // Configure your email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // replace with your preferred email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - E-GATE SHIPPING',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4F46E5;">E-GATE SHIPPING</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <h3 style="margin-top: 0;">Password Reset Request</h3>
            <p>We received a request to reset your password. Please use the following OTP (One-Time Password) to complete the process:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 24px; letter-spacing: 5px; font-weight: bold; background-color: #e9ecef; padding: 10px; border-radius: 5px;">${otp}</div>
            </div>
            <p>This OTP is valid for 10 minutes. If you didn't request a password reset, please ignore this email.</p>
          </div>
          <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} E-GATE SHIPPING. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Controller function to send OTP
const sendOTPReset = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.json({ success: false, message: 'Email is required' });
  }
  
  try {
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    let admin = await Admin.findOne({ email });
    if (!admin) {
      return res.json({ success: false, message: 'No account found with this email address' });
    } 
    
    // Update OTP details for existing record
    admin.otp = otp;
    admin.otpExpires = otpExpires;
    await admin.save();
    
    // Send OTP via email
    await sendOtpsReset(email, otp);
    
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.json({ success: false, message: 'Error sending OTP. Please try again later.' });
  }
};

// Controller function to verify OTP
const verifyOTPReset = async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.json({ success: false, message: 'Email and OTP are required' });
  }
  
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.json({ success: false, message: 'Admin record not found' });
    }
    
    if (admin.otp !== otp) {
      return res.json({ success: false, message: 'Invalid OTP' });
    }
    
    if (admin.otpExpires < Date.now()) {
      return res.json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    
    // Mark OTP as verified but don't clear it yet
    // We'll use it to verify the password reset request
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.json({ success: false, message: 'Error verifying OTP' });
  }
};

// Controller function to reset password
const resetPassword = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.json({ success: false, message: 'Email and password are required' });
  }
  
  if (password.length < 8) {
    return res.json({ success: false, message: 'Password must be at least 8 characters long' });
  }
  
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.json({ success: false, message: 'Admin record not found' });
    }
    
    // Verify that OTP was previously validated
    if (!admin.otp || !admin.otpExpires) {
      return res.json({ success: false, message: 'Password reset not authorized. Please follow the proper reset process.' });
    }
    
    if (admin.otpExpires < Date.now()) {
      return res.json({ success: false, message: 'Password reset session has expired. Please restart the process.' });
    }
    
    // Update password and clear OTP fields
    admin.password = password;
    admin.otp = undefined;
    admin.otpExpires = undefined;
    
    // If this was an unverified admin, mark them as verified now
    if (!admin.isVerified) {
      admin.isVerified = true;
    }
    
    await admin.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.json({ success: false, message: 'Error resetting password' });
  }
};

module.exports = {
  sendOTPReset,
  verifyOTPReset,
  resetPassword,
  generateOTP,
  sendOtpsReset
};