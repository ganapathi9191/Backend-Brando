import User from "../Models/User.js";
import { generateTempToken, generateFinalToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";


// STEP 1: Send OTP
export const sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number required"
      });
    }

    let user = await User.findOne({ phoneNumber });

    if (!user) {
      user = await User.create({ phoneNumber });
    }

    const tempToken = generateTempToken(user);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp: "1234",
      token: tempToken
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// STEP 2: Verify OTP (Token + OTP only)
export const verifyOtp = async (req, res) => {
  try {
    const { token, otp } = req.body;

    if (!token || !otp) {
      return res.status(400).json({
        success: false,
        message: "Token and OTP required"
      });
    }
 
    
    if (otp !== "1234") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.otpVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};



// STEP 3: Select Category (Category only in payload)
export const selectCategory = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category required"
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user || !user.otpVerified) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified"
      });
    }

    user.category = category;
    await user.save();

    const finalToken = generateFinalToken(user);

    return res.status(200).json({
      success: true,
      message: "Login completed successfully",
      token: finalToken,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        category: user.category
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};