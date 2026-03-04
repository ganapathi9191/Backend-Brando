import mongoose from "mongoose";

const sharingSchema = new mongoose.Schema({
  type: String,   // 2 Sharing / 3 Sharing
  cost: Number
}, { _id: false });

const hostelSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  address: {
    type: String,
    required: true
  },
  sharings: [sharingSchema],
  images: [String]
}, { timestamps: true });

export default mongoose.model("Hostel", hostelSchema);