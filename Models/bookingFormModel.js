import mongoose from "mongoose";

const bookingFormSchema = new mongoose.Schema({

  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },

  roomNo: {
    type: String,
    required: true
  },

  name: {
    type: String,
    required: true
  },

  mobileNumber: {
    type: String,
    required: true
  },

  aadharCardImage: {
    type: String,
    required: true
  },

  panCardImage: {
    type: String,
    required: true
  },

  profileImage: {
    type: String,
    required: true
  }

}, { timestamps: true });

const BookingForm = mongoose.model("BookingForm", bookingFormSchema);

export default BookingForm;