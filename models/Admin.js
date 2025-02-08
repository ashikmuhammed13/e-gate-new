const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: function() { return this.isVerified; },
      trim: true,
    },
    lastName: {
      type: String,
      required: function() { return this.isVerified; },
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\d{10,15}$/, 'Please use a valid phone number'],
    },
    role: {
      type: String,
      enum: ['Super Admin', 'Admin', 'Moderator'],
      required: true,
      default: 'Admin',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      required: true,
      default: 'active',
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    otp: String,
    otpExpires: Date,
    isVerified: { type: Boolean, default: false },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
  },
  {
    timestamps: true,
  }
);


// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Instance method to check password
adminSchema.methods.isPasswordValid = async function (password) {
  return bcrypt.compare(password, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
