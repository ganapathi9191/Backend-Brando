import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["booking", "hostel", "system", "promotion"],
    default: "system",
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "relatedModel",
    default: null,
  },
  // FIX: removed default: null — null is not in the enum, which caused
  // silent validation errors when relatedModel was not provided
  relatedModel: {
    type: String,
    enum: ["Booking", "Hostel", "Vendor", null],
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000),
  },
});

// Auto-remove expired notifications via TTL index
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Set readAt automatically when isRead is set to true
notificationSchema.pre("save", function (next) {
  if (this.isModified("isRead") && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;