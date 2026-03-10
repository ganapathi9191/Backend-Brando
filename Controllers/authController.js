import User from "../Models/User.js";
import { generateTempToken, generateFinalToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";
import Booking from "../Models/Booking.js";
import Hostel from "../Models/Hostel.js";
import mongoose from "mongoose";

export const getImageUrl = (req, path) => {
  return `${req.protocol}://${req.get("host")}/${path}`;
};


// STEP 1: Send OTP — accepts mobileNumber, returns temp token
export const sendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ success: false, message: "Mobile number required" });
    }

    let user = await User.findOne({ mobileNumber });
    if (!user) {
      user = await User.create({ mobileNumber });
    }

    const tempToken = generateTempToken(user);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp: "1234",          // hardcoded for now
      token: tempToken      // use this token in verify-otp
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// STEP 2: Verify OTP — send { token, otp } in body, returns final token
export const verifyOtp = async (req, res) => {
  try {
    const { token, otp } = req.body;

    if (!token || !otp) {
      return res.status(400).json({ success: false, message: "Token and OTP required" });
    }

    if (otp !== "1234") {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isVerified = true;
    await user.save();

    // Return final token here — no category step needed in auth
    const finalToken = generateFinalToken(user);

    return res.status(200).json({
      success: true,
      message: "OTP verified. Login complete.",
      token: finalToken,
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber
      }
    });

  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};



export const updateUserLocation = async (req, res) => {
  try {

    const { userId, latitude, longitude } = req.body;

    if (!userId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "userId, latitude and longitude required"
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          latitude,
          longitude
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      user
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

export const updateProfile = async (req, res) => {
  try {

    const { userId, name } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    let updateData = {};

    // update name
    if (name) {
      updateData.name = name;
    }

    // update image
    if (req.file) {
      updateData.profileImage = getImageUrl(req, req.file.path);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
export const getUserById = async (req, res) => {
  try {

    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const formattedUser = {
      id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      profileImage: user.profileImage,
      location: user.location,
      isVerified: user.isVerified
    };

    res.status(200).json({
      success: true,
      user: formattedUser
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


export const getNearbyHostelsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user || !user.location) {
      return res.status(404).json({
        success: false,
        message: "User location not found"
      });
    }

    const { latitude, longitude } = user.location;

    const hostels = await Hostel.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: 500000 // 500km in meters
        }
      }
    }).populate("categoryId", "name"); // Add populate to get category info

    // Format images with full URLs
    const formatted = hostels.map(hostel => {
      const hostelObj = hostel.toObject();
      
      // Format images properly
      const formattedImages = hostelObj.images.map(img => {
        // Check if image already has full URL
        if (img.startsWith('http')) {
          return img;
        }
        // Generate full URL - make sure to use the correct path format
        return getImageUrl(req, img);
      });

      return {
        ...hostelObj,
        images: formattedImages
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      hostels: formatted
    });

  } catch (error) {
    console.error("Error in getNearbyHostelsByUser:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



export const searchFilterHostels = async (req, res) => {
  try {

    const { search } = req.query;

    let filter = {};

    if (search) {

      const conditions = [];

      // search by hostel name
      conditions.push({
        name: { $regex: search, $options: "i" }
      });

      // search by type (AC / NON-AC)
      conditions.push({
        type: { $regex: search, $options: "i" }
      });

      // search by hostelId
      if (mongoose.Types.ObjectId.isValid(search)) {
        conditions.push({ _id: search });
      }

      // search by categoryId
      if (mongoose.Types.ObjectId.isValid(search)) {
        conditions.push({ categoryId: search });
      }

      filter.$or = conditions;
    }

    const hostels = await Hostel.find(filter).populate("categoryId", "name");

    const formatted = hostels.map(hostel => ({
      ...hostel._doc,
      images: hostel.images.map(img => getImageUrl(req, img))
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      hostels: formatted
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

export const bookHostel = async (req, res) => {

  try {

    const { userId, hostelId, bookingType, shareType, startDate, endDate } = req.body;

    if (!userId || !hostelId) {
      return res.status(400).json({
        success: false,
        message: "userId and hostelId required"
      });
    }

    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found"
      });
    }

    const sharing = hostel.sharings.find(s => s.shareType === shareType);

    if (!sharing) {
      return res.status(400).json({
        success: false,
        message: "Sharing type not available"
      });
    }

    let totalPrice = 0;

    if (bookingType === "Monthly") {
      totalPrice = sharing.monthlyPrice + hostel.monthlyAdvance;
    }

    if (bookingType === "Daily") {

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate required"
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      const diff = end - start;
      const days = diff / (1000 * 60 * 60 * 24);

      totalPrice = days * sharing.dailyPrice;
    }

    const booking = await Booking.create({
      userId,
      hostelId,
      bookingType,
      shareType,
      startDate,
      endDate,
      totalPrice
    });

    res.status(201).json({
      success: true,
      message: "Hostel booked successfully",
      booking
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



/* GET ALL BOOKINGS */

export const getAllBookings = async (req, res) => {

  try {

    const bookings = await Booking
      .find()
      .populate("hostelId", "name type address");

    res.status(200).json({
      success: true,
      bookings
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



/* GET BOOKING BY ID */

export const getBookingById = async (req, res) => {

  try {

    const booking = await Booking
      .findById(req.params.id)
      .populate("hostelId", "name type address");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.status(200).json({
      success: true,
      booking
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



/* UPDATE BOOKING */

export const updateBookingById = async (req, res) => {

  try {

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      booking: updated
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



/* DELETE BOOKING */

export const deleteBookingById = async (req, res) => {

  try {

    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};