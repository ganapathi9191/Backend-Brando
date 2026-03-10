import express from "express";
import {
    sendOtp,
    verifyOtp,
    updateUserLocation,
    updateProfile,
    getUserById,
    getNearbyHostelsByUser,
    searchFilterHostels,
    bookHostel,
    getAllBookings,
    getBookingById,
    updateBookingById,
    deleteBookingById,

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
//booking
router.post("/createBooking", bookHostel);
router.get("/getAllBookings", getAllBookings);
router.get("/getBookingById/:id", getBookingById);
router.put("/updateBookingById/:id", updateBookingById);
router.delete("/deleteBookingById/:id", deleteBookingById);





export default router;