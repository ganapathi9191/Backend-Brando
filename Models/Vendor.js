// Models/Vendor.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      default: "info",
      enum: ["info", "success", "warning", "error", "booking", "hostel", "guest"]
    },
    read: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId, refPath: 'relatedModel' },
    relatedModel: { type: String, enum: ['Booking', 'Hostel', 'FormUser'], default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, unique: true, trim: true },
    email: { type: String, default: null, trim: true },
    hostelImage: { type: String, default: null },
    otp: { type: String, default: null },
    otpVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    notifications: { type: [notificationSchema], default: [] },
  },
  { timestamps: true }
);

vendorSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

vendorSchema.methods.isDeleted = function () {
  return this.deletedAt !== null;
};

export default mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);