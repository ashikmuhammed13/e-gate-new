const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate a 6-digit numeric OTP
const generateOTP = () => {
  return otpGenerator.generate(6, { 
    upperCase: false, 
    specialChars: false,
    alphabets: false,
    digits: true
  });
};

const sendOtps = async (email, otp) => {
  // Current date for the email
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: `"E-GATE SHIPPING" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Verification Code',
    text: `Your verification code is: ${otp}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
        <style>
          body {
            font-family: 'Poppins', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f7fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .email-wrapper {
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          }
          .header {
            background: linear-gradient(45deg, #4F46E5, #06B6D4);
            padding: 30px 20px;
            text-align: center;
          }
          .logo {
            margin-bottom: 15px;
          }
          .logo i {
            font-size: 48px;
            color: white;
          }
          .header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px 25px;
            color: #333;
          }
          .otp-container {
            margin: 25px 0;
            text-align: center;
          }
          .otp-code {
            background-color: #f0f4f9;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 6px;
            color: #4F46E5;
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
          }
          p {
            margin: 0 0 15px;
            line-height: 1.6;
          }
          .help-text {
            font-size: 14px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <div class="logo">
                <img src="https://yourwebsite.com/logo.png" alt="E-GATE SHIPPING" style="width: 60px; height: auto;">
              </div>
              <h1>E-GATE SHIPPING</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for using E-GATE SHIPPING. Please use the verification code below to complete your request:</p>
              
              <div class="otp-container">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p>This code will expire in 15 minutes for security reasons.</p>
              <p>If you didn't request this code, please ignore this email or contact our support team if you believe this is an error.</p>
              
              <p class="help-text">Need help? Contact our support team at support@egateshipping.com</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} E-GATE SHIPPING. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
              <p>${currentDate}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOtps };