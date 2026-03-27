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
  markNotificationRead,
  markAllNotificationsRead,
  deleteVendorNotification,
  bulkDeleteVendorNotifications,
  getUnreadNotificationsCount
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


// 🔔 NOTIFICATION ROUTES
router.get('/:vendorId/notifications', getVendorNotifications);
router.get('/:vendorId/notifications/unread-count', getUnreadNotificationsCount);
router.put('/:vendorId/notifications/:notificationId/read', markNotificationRead);
router.put('/:vendorId/notifications/read-all', markAllNotificationsRead);
router.delete('/:vendorId/notifications/:notificationId', deleteVendorNotification);
router.delete('/:vendorId/notifications/bulk-delete', bulkDeleteVendorNotifications);

export default router;