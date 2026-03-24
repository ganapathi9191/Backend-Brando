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
  emergencyNumber: String,
  aadhar: String,
  idCard: String,
  profileImage: String,
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ Make sure to export as default
const FormUser = mongoose.model('FormUser', formUserSchema);
export default FormUser;