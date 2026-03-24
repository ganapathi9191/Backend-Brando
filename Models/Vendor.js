import mongoose from "mongoose";
 
// Embedded notification sub-schema (same pattern as User model)
const notificationSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info"
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);
 
const vendorSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  mobileNumber: {
    type: String,
    required: true,
    unique: true
  },

  email: {
    type: String,
    default: null
  },

  hostelImage: {
    type: String,
    default: null
  },

  otp: {
    type: String,
    default: null
  },

  otpVerified: {
    type: Boolean,
    default: false
  },
  deletedAt: {
  type: Date,
  default: null
},
    notifications: {
      type: [notificationSchema],
      default: []
    }
  
},
{ timestamps: true }
);


// prevents OverwriteModelError
export default mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);