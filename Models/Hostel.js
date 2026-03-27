// Models/Hostel.js - Complete Updated Schema with Notifications

import mongoose from "mongoose";

// Camera Schema
const cameraSchema = new mongoose.Schema({
  cameraId: { type: String },
  name: { type: String },
  ipAddress: { type: String },
  port: { type: Number, default: 554 },
  username: { type: String, default: "" },
  password: { type: String, default: "" },
  location: { type: String },
  streamUrl: { type: String },
  status: { 
    type: String, 
    enum: ["active", "inactive", "offline"], 
    default: "inactive" 
  },
  lastActive: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Unknown Visitor Schema
const unknownVisitorSchema = new mongoose.Schema({
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
  cameraId: { type: String },
  cameraName: { type: String },
  imageUrl: { type: String },
  detectedAt: { type: Date, default: Date.now },
  faceData: { type: Object },
  alertSent: { type: Boolean, default: false },
  alertType: { type: String, enum: ["voice", "sms", "email"], default: "voice" }
});

// Sharing Schema
const sharingSchema = new mongoose.Schema({
  type: { type: String, enum: ["AC", "Non-AC"] },
  shareType: { type: String },
  monthlyPrice: { type: Number },
  dailyPrice: { type: Number }
}, { _id: false });

// ✅ Notification Schema (Added)
const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['unknown_visitor', 'known_visitor', 'camera_offline', 'camera_online', 'system'],
    default: 'system'
  },
  cameraId: { type: String },
  cameraName: { type: String },
  imageUrl: { type: String },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { _id: true });

// Main Hostel Schema
const hostelSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", default: null },
  name: { type: String },
  rating: { type: Number, default: 0 },
  address: { type: String },
  monthlyAdvance: { type: Number, default: 0 },
  
  sharings: [sharingSchema],
  cameras: [cameraSchema],
  unknownVisitors: [unknownVisitorSchema],
  
  // ✅ NOTIFICATIONS ARRAY - Added Here
  notifications: [notificationSchema],
  
  images: [{ type: String }],
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] }
  },
  qrCode: { type: String, default: null },
  
  // Alert settings (Updated with notification interval)
  alertSettings: {
    voiceAlert: { type: Boolean, default: true },
    smsAlert: { type: Boolean, default: false },
    emailAlert: { type: Boolean, default: false },
    notificationEnabled: { type: Boolean, default: true },
    notificationInterval: { type: Number, default: 60 }, // Seconds between notifications
    alertPhones: [{ type: String }],
    alertEmails: [{ type: String }]
  }
}, { timestamps: true });

// Index for location
hostelSchema.index({ location: "2dsphere" });

export default mongoose.model("Hostel", hostelSchema);