import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hostel",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    roomType: {
        type: String,
        enum: ["AC", "NON-AC"],
        required: true
    },
    shareType: {
        type: String,
        enum: ["1 Share", "2 Share", "3 Share", "4 Share", "5 Share"],
        required: true
    },
    bookingType: {
        type: String,
        enum: ["monthly", "daily"],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    totalAmount: {
        type: Number,
        required: true
    },
    monthlyAdvance: {
        type: Number
    },
    pricePerDay: {
        type: Number
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending"
    },
    bookingReference: {
        type: String,
        unique: true
    },
        transactionId: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined values while maintaining uniqueness for non-null values
        required: false // Not required for backward compatibility
    },
    paymentMethod: {
        type: String,
        enum: ["online", "cash"],
        default: "online"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending"
    },
    paymentDetails: {
        type: Object // To store additional Razorpay payment details if needed
    }
}, { 
    timestamps: true 
});

// NO PRE-SAVE MIDDLEWARE AT ALL - REMOVE EVERYTHING

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;