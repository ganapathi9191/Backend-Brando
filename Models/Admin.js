import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      default: "admin123@gmail.com"
    },

    password: {
      type: String,
      required: true,
      default: "Admin@123"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);