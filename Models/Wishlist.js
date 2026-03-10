// Models/Wishlist.js
import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",
    required: true
  }
}, {
  timestamps: true
});

// Ensure a user can't add the same hostel twice
wishlistSchema.index({ userId: 1, hostelId: 1 }, { unique: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;