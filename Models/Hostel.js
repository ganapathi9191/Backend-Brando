import mongoose from "mongoose";

const sharingSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["AC", "Non-AC"],
    required: true
  },
  shareType: {
    type: String,
    required: true
  },
  monthlyPrice: {
    type: Number,
    required: true
  },
  dailyPrice: {
    type: Number,
    required: true
  }
}, { _id: false });

const hostelSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", default: null },

  name: { type: String, required: true },
  rating: { type: Number, default: 0 },
  address: { type: String, required: true },
  monthlyAdvance: { type: Number, default: 0 },

  sharings: [sharingSchema],

  images: [{ type: String }],

  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }
  },
  qrCode: {
  type: String,
  default: null
}

}, { timestamps: true });

hostelSchema.index({ location: "2dsphere" });

export default mongoose.model("Hostel", hostelSchema);