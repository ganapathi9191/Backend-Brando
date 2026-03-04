import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  selectedCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);