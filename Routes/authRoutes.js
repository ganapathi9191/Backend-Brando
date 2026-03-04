import express from "express";
import { sendOtp, verifyOtp, selectCategory } from "../Controllers/authController.js";
import { verifyToken } from "../Config/authMiddleware.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// select-category needs token in header
router.post("/select-category", verifyToken, selectCategory);

export default router;