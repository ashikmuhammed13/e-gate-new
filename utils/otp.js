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
const generateOTP = () => {
    return otpGenerator.generate(6, { upperCase: false, specialChars: false });
};
const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOTP };
