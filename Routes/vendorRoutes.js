import express from 'express';
import {
  getBookingsByVendor,

  registerVendor,
  loginVendor,
  verifyVendorOtp,
  updateVendorProfile,
  getVendorProfile,
  deleteVendorAccount,
  createVendorBanner,
  getAllVendorBanners,
  getVendorBannerById,
  updateVendorBanner,
  deleteVendorBanner,
  getVendorNotifications,
  markVendorNotificationAsRead,
  markAllVendorNotificationsAsRead,
  clearVendorNotifications
} from '../Controllers/vendorController.js';

import upload from "../Config/multer.js";

const router = express.Router();

// Public routes
router.post("/register", upload.single("hostelImage"), registerVendor);

router.post("/login", loginVendor);
router.post("/verify-otp", verifyVendorOtp);
router.put("/update-profile/:vendorId", upload.single("hostelImage"), updateVendorProfile);
router.get("/profile/:vendorId", getVendorProfile);
router.delete("/delete-account/:vendorId", deleteVendorAccount);

router.post("/create", upload.array("images", 10), createVendorBanner);

router.get("/all", getAllVendorBanners);

router.get("/:id", getVendorBannerById);

router.put("/update/:id", upload.array("images", 10), updateVendorBanner);

router.delete("/delete/:id", deleteVendorBanner);


router.get("/vendorsbookings/:vendorId", getBookingsByVendor);


// GET routes
router.get("/:vendorId/notifications", getVendorNotifications);
router.patch("/:vendorId/notifications/read-all", markAllVendorNotificationsAsRead);
router.patch("/:vendorId/notifications/:notificationId/read", markVendorNotificationAsRead);
router.delete("/:vendorId/notifications", clearVendorNotifications);
export default router;