import express from "express";
import {
    sendOtp,
    verifyOtp,
    updateUserLocation,
    updateProfile,
    getUserById,
    getNearbyHostelsByUser,
    searchFilterHostels,
    toggleWishlist,
    getUserWishlist,
    createBooking,
    getAllBookings,           // Add this
    //  getAllCancelledBookings,
    //  getBookingsByUserId,
    checkAvailableHostels,
    submitBookingForm,
     getAllBookingForms,
  getBookingFormById,
  getFormsByUserId,
  updateBookingFormById,
  deleteBookingFormById

} from "../Controllers/authController.js";
import upload from "../Config/multer.js";

const router = express.Router();

router.post("/send-otp", sendOtp);      // body: { mobileNumber }
router.post("/verify-otp", verifyOtp);  // body: { token, otp }

router.put("/update-location", updateUserLocation);
router.put("/update-profile", upload.single("profileImage"), updateProfile);
router.get("/user/:userId", getUserById);

router.get("/nearby-hostels/:userId", getNearbyHostelsByUser);

router.get("/search-filter-hostels", searchFilterHostels);


// Toggle wishlist (add/remove)
router.post("/wishlist/toggle", toggleWishlist);

// Get user's wishlist
router.get("/wishlist/:userId", getUserWishlist);

//booking
router.post("/createBooking", createBooking);
// router.get('/bookings', getAllBookings);
// router.get('/bookings/cancelled', getAllCancelledBookings);
// router.get('/bookings/user/:userId', getBookingsByUserId);

router.get("/get-all-bookings", getAllBookings);
router.get("/available-hostels", checkAvailableHostels);


router.post(
  "/submit-booking-form",
  upload.fields([
    { name: "aadharCardImage", maxCount: 1 },
    { name: "panCardImage", maxCount: 1 },
    { name: "profileImage", maxCount: 1 }
  ]),
  submitBookingForm
);
router.get("/forms", getAllBookingForms);

router.get("/forms/:id", getBookingFormById);

router.get("/forms/user/:userId", getFormsByUserId);

router.put(
  "/forms/:id",
  upload.fields([
    { name: "aadharCardImage", maxCount: 1 },
    { name: "panCardImage", maxCount: 1 },
    { name: "profileImage", maxCount: 1 }
  ]),
  updateBookingFormById
);

router.delete("/forms/:id", deleteBookingFormById);

export default router;