// Models/Hostel.js
import mongoose from "mongoose";

const sharingSchema = new mongoose.Schema({
  shareType: {
    type: String,
    enum: ["1 Share", "2 Share", "3 Share", "4 Share", "5 Share"],
    required: true
  },
  acMonthlyPrice: {
    type: Number,
    required: true
  },
  acDailyPrice: {
    type: Number,
    required: true
  },
  nonAcMonthlyPrice: {
    type: Number,
    required: true
  },
  nonAcDailyPrice: {
    type: Number,
    required: true
  }
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
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  monthlyAdvance: {
    type: Number,
    required: true
  },
  sharings: [sharingSchema],
  images: [String]
}, { timestamps: true });

hostelSchema.index({ location: "2dsphere" });

export default mongoose.model("Hostel", hostelSchema);