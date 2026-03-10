import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({

  images: [
    {
      type: String,
      required: true
    }
  ]
  
}, { timestamps: true });

export default mongoose.model("Banner", bannerSchema);
