import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  mobileNumber: {
    type: Number,
    required: true,
    unique: true
  },

  name: {
    type: String
  },

  profileImage: {
    type: String
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  location: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    }
  },
    hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",  // Reference to Hostel model
    default: null   // Default to null when no hostel is booked
  },

}, { timestamps: true });

export default mongoose.model("User", userSchema);