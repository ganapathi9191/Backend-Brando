import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipientType: {
      type: String,
      enum: ["user", "admin", "vendor"],
      required: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "recipientType", // Dynamic reference
      required: true
    },
    
    // Notification content
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    
    // Notification type
    type: {
      type: String,
      enum: ["info", "success", "warning", "error", "booking", "payment", "system", "alert"],
      default: "info"
    },
    
    // Related entity (optional)
    entityType: {
      type: String,
      enum: ["booking", "hostel", "payment", "banner", "user", "admin", "vendor", "form"],
      default: null
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    
    // Status
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },
    
    // Additional data (for storing extra info)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    // For admin broadcast notifications
    isBroadcast: {
      type: Boolean,
      default: false
    },
    broadcastTo: {
      type: String,
      enum: ["all_users", "all_vendors", "all_admins", "specific"],
      default: null
    },
    
    // Expiry (optional)
    expiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Indexes for faster queries
notificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientType: 1, recipientId: 1, read: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(recipientType, recipientId) {
  return await this.countDocuments({
    recipientType,
    recipientId,
    read: false
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(recipientType, recipientId) {
  return await this.updateMany(
    { recipientType, recipientId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Static method to delete old notifications
notificationSchema.statics.cleanOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true // Only delete read notifications
  });
};

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);