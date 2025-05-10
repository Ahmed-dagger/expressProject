const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  amount:    { type: Number, required: true },
  roiRate:   { type: Number, required: true }, //5 => 5%        
  createdAt: { type: Date,   default: Date.now },
  status:    { type: String, enum: ['open','closed'], default: 'open' }
});

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    trim: true
  },
  lastname: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true, // prevent duplicate emails
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }, 
  balance: {
     type: Number, default: 0 
    },
    investments: 
    [investmentSchema]
}, { timestamps: true }); // Adds createdAt and updatedAt

// Ensure it's properly exported
module.exports = mongoose.model('User', userSchema);
