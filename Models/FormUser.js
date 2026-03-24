// Models/FormUser.js
import mongoose from 'mongoose';

const formUserSchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  emergencyNumber: String,
  aadhar: String,
  idCard: String,
  profileImage: String,
  advance: {
    type: Number,
    required: true,
    min: 0
  },
  roomNo: {
    type: String,
    required: true,
    trim: true
  },
  joiningDate: {
    type: Date,
    required: true
  },
  tenure: {
    type: String,
    enum: ['monthly', 'daily'],
    required: true
  },
  roomType: {
    type: String,
    enum: ['AC', 'Non-AC'],
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ Make sure to export as default
const FormUser = mongoose.model('FormUser', formUserSchema);
export default FormUser;