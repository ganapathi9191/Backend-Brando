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
    getBookingById,           // Update this
    cancelBooking,            // Add this
    getUserBookings,   
    checkAvailableHostels,    

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
router.get("/bookings", getAllBookings);                   
router.get("/booking/:id", getBookingById);                 
router.patch("/booking/:id/cancel", cancelBooking);       
router.get("/user-bookings/:userId", getUserBookings);      

router.get("/available-hostels", checkAvailableHostels);


export default router;