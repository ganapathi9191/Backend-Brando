import mongoose from "mongoose";

const vendorBannerSchema = new mongoose.Schema({

  images: [
    {
      type: String,
      required: true
    }
  ]

}, { timestamps: true });

export default mongoose.model("VendorBanner", vendorBannerSchema);