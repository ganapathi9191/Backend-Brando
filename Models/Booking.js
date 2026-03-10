import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",
    required: true
  },

  bookingType: {
    type: String,
    enum: ["Monthly", "Daily"],
    required: true
  },

  shareType: {
    type: String,
    enum: ["1 Share", "2 Share", "3 Share", "4 Share"],
    required: true
  },

  startDate: Date,
  endDate: Date,

  totalPrice: Number

}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);