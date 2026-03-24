import User from "../Models/User.js";
import { generateTempToken, generateFinalToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";
import Booking from "../Models/Booking.js";
import Hostel from "../Models/Hostel.js";
import mongoose from "mongoose";
import Wishlist from "../Models/Wishlist.js";
import Razorpay from 'razorpay';
import BookingForm from "../Models/bookingFormModel.js";
import Notification from "../Models/Notification.js";

export const getImageUrl = (req, path) => {
  return `${req.protocol}://${req.get("host")}/${path}`;
};
 
// ------------------------
// CREATE NOTIFICATION (INTERNAL USE)
// Call this from anywhere: bookings, hostel updates, etc.
// ------------------------
 
export const createVendorNotification = async (vendorId, message, type = "info") => {
  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return;
 
    vendor.notifications.push({
      message,  
      type,
      read: false
    });
 
    await vendor.save();
  } catch (err) {
    console.error("Error creating vendor notification:", err);
  }
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


export const toggleWishlist = async (req, res) => {
  try {
    const { userId, hostelId } = req.body;

    // Validation
    if (!userId || !hostelId) {
      return res.status(400).json({
        success: false,
        message: "userId and hostelId are required"
      });
    }

    // Check if hostel exists
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found"
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if wishlist item already exists
    const existingWishlist = await Wishlist.findOne({ userId, hostelId });

    if (existingWishlist) {
      // Remove from wishlist
      await Wishlist.findByIdAndDelete(existingWishlist._id);

         // 🔔 NOTIFICATION: Item removed from wishlist
      await createNotification(
        userId,
        "❤️ Removed from Wishlist",
        `${hostel.name} has been removed from your wishlist.`,
        "system",
        hostelId,
        "Hostel"
      );

      return res.status(200).json({
        success: true,
        message: "Hostel removed from wishlist",
        isWishlisted: false
      });
    } else {
      // Add to wishlist
      const wishlist = await Wishlist.create({ userId, hostelId });

           // 🔔 NOTIFICATION: Item added to wishlist
      await createNotification(
        userId,
        "✨ Added to Wishlist",
        `${hostel.name} has been added to your wishlist. You can find it saved for later!`,
        "system",
        hostelId,
        "Hostel"
      );

      return res.status(201).json({
        success: true,
        message: "Hostel added to wishlist",
        isWishlisted: true,
        wishlist
      });
    }

  } catch (error) {
    // Handle duplicate key error (in case of race condition)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Hostel already in wishlist"
      });
    }

    console.error("Error toggling wishlist:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all wishlist items for a user
 * GET /api/wishlist/:userId
 */
export const getUserWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roomType } = req.query; // Optional: filter by AC/NON-AC

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get all wishlist items for the user and populate hostel details
    const wishlistItems = await Wishlist.find({ userId })
      .populate({
        path: "hostelId",
        populate: {
          path: "categoryId",
          select: "name"
        }
      })
      .sort({ createdAt: -1 }); // Most recent first

    if (!wishlistItems.length) {
      return res.status(200).json({
        success: true,
        message: "Wishlist is empty",
        count: 0,
        wishlist: []
      });
    }

    // Format the response based on roomType
    const formattedWishlist = wishlistItems.map(item => {
      const hostel = item.hostelId.toObject();

      // Format images with full URLs
      const formattedImages = hostel.images.map(img => getImageUrl(req, img));

      // If roomType is specified (AC or NON-AC), filter prices
      if (roomType === 'AC' || roomType === 'NON-AC') {
        return {
          _id: item._id,
          wishlistId: item._id,
          addedAt: item.createdAt,
          hostel: {
            _id: hostel._id,
            name: hostel.name,
            category: hostel.categoryId,
            rating: hostel.rating,
            location: hostel.location,
            address: hostel.address,
            monthlyAdvance: hostel.monthlyAdvance,
            images: formattedImages,
            roomType: roomType,
            sharings: hostel.sharings.map(sharing => ({
              shareType: sharing.shareType,
              monthlyPrice: roomType === 'AC' ? sharing.acMonthlyPrice : sharing.nonAcMonthlyPrice,
              dailyPrice: roomType === 'AC' ? sharing.acDailyPrice : sharing.nonAcDailyPrice
            }))
          }
        };
      }

      // If no roomType specified, show all prices
      return {
        _id: item._id,
        wishlistId: item._id,
        addedAt: item.createdAt,
        hostel: {
          ...hostel,
          images: formattedImages
        }
      };
    });

    res.status(200).json({
      success: true,
      count: formattedWishlist.length,
      wishlist: formattedWishlist
    });

  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to generate booking reference
const generateBookingReference = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BK${year}${month}${day}${random}`;
};





// export const createBooking = async (req, res) => {
//   try {
//     console.log('Create booking request received:', req.body);

//     const {
//       hostelId,
//       userId,
//       roomType,
//       shareType,
//       bookingType,
//       startDate,
//       endDate,
//       transactionId
//     } = req.body;

//     // Basic validation
//     if (!hostelId || !userId || !roomType || !shareType || !bookingType || !startDate || !transactionId) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields including transactionId are required"
//       });
//     }

//     // Check if user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     // Check if hostel exists
//     const hostel = await Hostel.findById(hostelId);
//     if (!hostel) {
//       return res.status(404).json({
//         success: false,
//         message: "Hostel not found"
//       });
//     }

//     // Find sharing type
//     const selectedSharing = hostel.sharings.find(s => s.shareType === shareType);
//     if (!selectedSharing) {
//       return res.status(400).json({
//         success: false,
//         message: "Share type not available"
//       });
//     }

//     // Parse dates
//     const parsedStartDate = new Date(startDate);
//     if (isNaN(parsedStartDate.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid start date"
//       });
//     }

//     // Calculate amount
//     let totalAmount = 0;
//     let parsedEndDate = null;

//     if (bookingType === "monthly") {
//       totalAmount = roomType === "AC" ? selectedSharing.acMonthlyPrice : selectedSharing.nonAcMonthlyPrice;
//     } else {
//       if (!endDate) {
//         return res.status(400).json({
//           success: false,
//           message: "End date required for daily booking"
//         });
//       }

//       parsedEndDate = new Date(endDate);
//       if (isNaN(parsedEndDate.getTime())) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid end date"
//         });
//       }

//       const dailyPrice = roomType === "AC" ? selectedSharing.acDailyPrice : selectedSharing.nonAcDailyPrice;
//       const days = Math.ceil((parsedEndDate - parsedStartDate) / (1000 * 60 * 60 * 24));

//       if (days <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: "End date must be after start date"
//         });
//       }

//       totalAmount = dailyPrice * days;
//     }

//     // VERIFY PAYMENT WITH RAZORPAY
//     try {
//       console.log('Attempting to verify payment with Razorpay...');
//       console.log('Transaction ID:', transactionId);
//       console.log('Expected booking amount:', totalAmount);

//       // Initialize Razorpay instance
//       const razorpay = new Razorpay({
//         key_id: process.env.RAZORPAY_KEY_ID,
//         key_secret: process.env.RAZORPAY_KEY_SECRET
//       });

//       // Fetch payment details from Razorpay
//       console.log('Fetching payment details...');
//       const payment = await razorpay.payments.fetch(transactionId);

//       console.log('Payment fetched:', {
//         id: payment.id,
//         status: payment.status,
//         amount: payment.amount,
//         amount_in_rupees: payment.amount / 100
//       });

//       // FIX: Accept any valid payment (for testing purposes)
//       const expectedAmountInPaise = Math.round(totalAmount * 100);
      
//       // For production, you might want to enforce exact amount
//       // For testing, we'll just log a warning if amounts don't match
//       if (payment.amount !== expectedAmountInPaise) {
//         console.warn(`⚠️ Payment amount mismatch! Payment: ₹${payment.amount/100}, Expected: ₹${totalAmount}`);
//         console.warn('Proceeding with booking anyway (TEST MODE ONLY)');
//       }

//       // Check if payment is valid
//       if (payment.status !== 'captured' && payment.status !== 'authorized') {
//         return res.status(400).json({
//           success: false,
//           message: `Payment cannot be processed. Current status: ${payment.status}`
//         });
//       }

//       // If payment is authorized, capture it
//       if (payment.status === 'authorized') {
//         console.log('Payment is authorized. Capturing payment...');
        
//         const capturedPayment = await razorpay.payments.capture(
//           transactionId,
//           payment.amount,
//           { currency: 'INR' }
//         );

//         console.log('Payment captured successfully:', {
//           id: capturedPayment.id,
//           status: capturedPayment.status
//         });
//       }

//       console.log('Payment verified successfully');

//     } catch (razorpayError) {
//       console.error('Razorpay error:', razorpayError);

//       // Check if it's an "already captured" error
//       if (razorpayError.statusCode === 400 && 
//           razorpayError.error && 
//           razorpayError.error.description && 
//           razorpayError.error.description.includes('already captured')) {
//         console.log('Payment was already captured - continuing with booking');
//         // Continue with booking creation
//       } else {
//         return res.status(400).json({
//           success: false,
//           message: "Payment verification failed",
//           error: razorpayError.error?.description || razorpayError.message
//         });
//       }
//     }

//     // Check for duplicate transaction ID
//     const existingBooking = await Booking.findOne({ transactionId });
//     if (existingBooking) {
//       return res.status(409).json({
//         success: false,
//         message: "Transaction ID already used for another booking"
//       });
//     }

//     // Create booking object with transactionId
//     const bookingData = {
//       hostelId,
//       userId,
//       roomType,
//       shareType,
//       bookingType,
//       startDate: parsedStartDate,
//       totalAmount, // This will still be 12000 even though payment was 10000
//       status: "confirmed",
//       bookingReference: generateBookingReference(),
//       transactionId,
//       paymentMethod: "online",
//       paymentStatus: "completed"
//     };

//     // Add optional fields only if needed
//     if (bookingType === "daily") {
//       bookingData.endDate = parsedEndDate;
//       bookingData.pricePerDay = roomType === "AC" ? selectedSharing.acDailyPrice : selectedSharing.nonAcDailyPrice;
//     } else {
//       bookingData.monthlyAdvance = hostel.monthlyAdvance;
//     }

//     // Create booking
//     console.log('Creating booking:', bookingData);
//     const booking = new Booking(bookingData);
//     await booking.save();

//     // Get populated booking
//     const populatedBooking = await Booking.findById(booking._id)
//       .populate('userId', 'name mobileNumber')
//       .populate('hostelId', 'name address');

//     // Send response
//     res.status(201).json({
//       success: true,
//       message: "Booking created and payment verified successfully",
//       booking: {
//         id: populatedBooking._id,
//         reference: populatedBooking.bookingReference,
//         transactionId: populatedBooking.transactionId,
//         user: {
//           id: populatedBooking.userId._id,
//           name: populatedBooking.userId.name,
//           mobile: populatedBooking.userId.mobileNumber
//         },
//         hostel: {
//           id: populatedBooking.hostelId._id,
//           name: populatedBooking.hostelId.name,
//           address: populatedBooking.hostelId.address
//         },
//         roomType: populatedBooking.roomType,
//         shareType: populatedBooking.shareType,
//         bookingType: populatedBooking.bookingType,
//         startDate: populatedBooking.startDate,
//         endDate: populatedBooking.endDate,
//         totalAmount: populatedBooking.totalAmount,
//         status: populatedBooking.status,
//         paymentStatus: populatedBooking.paymentStatus
//       }
//     });

//   } catch (error) {
//     console.error('Booking error:', error);

//     if (error.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message: "Duplicate booking reference or transaction ID. Please try again."
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

export const createBooking = async (req, res) => {
  try {

    const {
      hostelId,
      userId,
      roomType,
      shareType,
      bookingType,
      startDate,
      endDate
    } = req.body;

    // Validation
    if (!hostelId || !userId || !roomType || !shareType || !bookingType || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing"
      });
    }

    // Check user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check hostel
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found"
      });
    }

    // Find share type
    const selectedSharing = hostel.sharings.find(
      (s) => s.shareType === shareType
    );

    if (!selectedSharing) {
      return res.status(400).json({
        success: false,
        message: "Share type not available"
      });
    }

    const parsedStartDate = new Date(startDate);

    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date"
      });
    }

    let totalAmount = 0;
    let parsedEndDate = null;

    // -------------------------
    // MONTHLY BOOKING LOGIC
    // -------------------------
    if (bookingType === "monthly") {

      const monthlyPrice =
        roomType === "AC"
          ? selectedSharing.acMonthlyPrice
          : selectedSharing.nonAcMonthlyPrice;

      const monthlyAdvance = hostel.monthlyAdvance || 0;

      // Check existing active booking
      const previousBooking = await Booking.findOne({
        userId,
        hostelId,
        status: { $in: ["confirmed", "pending"] }
      });

      if (previousBooking) {
        // User already staying
        totalAmount = monthlyPrice;
      } else {
        // First time joining
        totalAmount = monthlyPrice + monthlyAdvance;
      }

      // Booking object
      const bookingData = {
        hostelId,
        userId,
        roomType,
        shareType,
        bookingType,
        startDate: parsedStartDate,
        totalAmount,
        monthlyAdvance: previousBooking ? 0 : monthlyAdvance,
        status: "confirmed",
        bookingReference: generateBookingReference()
      };

      const booking = new Booking(bookingData);
      await booking.save();

      const populatedBooking = await Booking.findById(booking._id)
        .populate("userId", "name mobileNumber")
        .populate("hostelId", "name address");

      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        booking: populatedBooking
      });
    }

    // -------------------------
    // DAILY BOOKING
    // -------------------------
    if (bookingType === "daily") {

      if (!endDate) {
        return res.status(400).json({
          success: false,
          message: "End date required for daily booking"
        });
      }

      parsedEndDate = new Date(endDate);

      if (isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date"
        });
      }

      const dailyPrice =
        roomType === "AC"
          ? selectedSharing.acDailyPrice
          : selectedSharing.nonAcDailyPrice;

      const days = Math.ceil(
        (parsedEndDate - parsedStartDate) / (1000 * 60 * 60 * 24)
      );

      if (days <= 0) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date"
        });
      }

      totalAmount = dailyPrice * days;

      const bookingData = {
        hostelId,
        userId,
        roomType,
        shareType,
        bookingType,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        pricePerDay: dailyPrice,
        totalAmount,
        status: "confirmed",
        bookingReference: generateBookingReference()
      };

      const booking = new Booking(bookingData);
      await booking.save();

      const populatedBooking = await Booking.findById(booking._id)
        .populate("userId", "name mobileNumber")
        .populate("hostelId", "name address");

      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        booking: populatedBooking
      });
    }

  } catch (error) {

    console.error("Booking error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
// // Get all bookings with optional filters and pagination
// export const getAllBookings = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 1000,
//       status,
//       paymentStatus,
//       bookingType,
//       hostelId,
//       startDate,
//       endDate,
//       search
//     } = req.query;

//     // Build filter object
//     const filter = {};

//     if (status) filter.status = status;
//     if (paymentStatus) filter.paymentStatus = paymentStatus;
//     if (bookingType) filter.bookingType = bookingType;
//     if (hostelId) filter.hostelId = hostelId;

//     // Date range filter
//     if (startDate || endDate) {
//       filter.createdAt = {};
//       if (startDate) filter.createdAt.$gte = new Date(startDate);
//       if (endDate) filter.createdAt.$lte = new Date(endDate);
//     }

//     // Search by user name or mobile (requires aggregation)
//     let bookings;
//     let total;

//     if (search) {
//       // Use aggregation for search functionality
//       const aggregationPipeline = [
//         {
//           $lookup: {
//             from: 'users',
//             localField: 'userId',
//             foreignField: '_id',
//             as: 'user'
//           }
//         },
//         {
//           $unwind: '$user'
//         },
//         {
//           $match: {
//             $or: [
//               { 'user.name': { $regex: search, $options: 'i' } },
//               { 'user.mobileNumber': { $regex: search, $options: 'i' } },
//               { bookingReference: { $regex: search, $options: 'i' } },
//               { transactionId: { $regex: search, $options: 'i' } }
//             ]
//           }
//         },
//         {
//           $match: filter
//         },
//         {
//           $sort: { createdAt: -1 }
//         },
//         {
//           $skip: (parseInt(page) - 1) * parseInt(limit)
//         },
//         {
//           $limit: parseInt(limit)
//         },
//         {
//           $project: {
//             'user.password': 0
//           }
//         }
//       ];

//       bookings = await Booking.aggregate(aggregationPipeline);
      
//       // Get total count for pagination
//       const countPipeline = [...aggregationPipeline];
//       countPipeline.splice(-3); // Remove skip, limit, project
//       const countResult = await Booking.aggregate([
//         ...countPipeline,
//         { $count: 'total' }
//       ]);
//       total = countResult[0]?.total || 0;

//     } else {
//       // Simple query without search
//       bookings = await Booking.find(filter)
//         .populate('userId', 'name mobileNumber email')
//         .populate('hostelId', 'name address city')
//         .sort({ createdAt: -1 })
//         .skip((parseInt(page) - 1) * parseInt(limit))
//         .limit(parseInt(limit));

//       total = await Booking.countDocuments(filter);
//     }

//     // Calculate statistics
//     const stats = await Booking.aggregate([
//       {
//         $group: {
//           _id: null,
//           totalBookings: { $sum: 1 },
//           totalRevenue: { $sum: '$totalAmount' },
//           confirmedBookings: {
//             $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
//           },
//           pendingBookings: {
//             $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
//           },
//           cancelledBookings: {
//             $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
//           },
//           completedBookings: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
//           }
//         }
//       }
//     ]);

//     res.status(200).json({
//       success: true,
//       data: bookings,
//       stats: stats[0] || {
//         totalBookings: 0,
//         totalRevenue: 0,
//         confirmedBookings: 0,
//         pendingBookings: 0,
//         cancelledBookings: 0,
//         completedBookings: 0
//       },
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / parseInt(limit)),
//         totalItems: total,
//         itemsPerPage: parseInt(limit)
//       }
//     });

//   } catch (error) {
//     console.error('Get all bookings error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // Get bookings by user ID
// export const getBookingsByUserId = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { status, page = 1, limit = 1000 } = req.query;

//     // Check if user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     // Build filter
//     const filter = { userId };
//     if (status) filter.status = status;

//     // Get bookings with pagination
//     const bookings = await Booking.find(filter)
//       .populate('hostelId', 'name address city images')
//       .sort({ createdAt: -1 })
//       .skip((parseInt(page) - 1) * parseInt(limit))
//       .limit(parseInt(limit));

//     const total = await Booking.countDocuments(filter);

//     // Get booking statistics for this user
//     const userStats = await Booking.aggregate([
//       { $match: { userId: mongoose.Types.ObjectId(userId) } },
//       {
//         $group: {
//           _id: null,
//           totalBookings: { $sum: 1 },
//           totalSpent: { $sum: '$totalAmount' },
//           activeBookings: {
//             $sum: {
//               $cond: [
//                 { $in: ['$status', ['confirmed', 'pending']] },
//                 1,
//                 0
//               ]
//             }
//           },
//           completedBookings: {
//             $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
//           },
//           cancelledBookings: {
//             $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
//           }
//         }
//       }
//     ]);

//     // Separate current active bookings (future dates)
//     const currentDate = new Date();
//     const activeBookings = bookings.filter(booking => 
//       (booking.status === 'confirmed' || booking.status === 'pending') &&
//       new Date(booking.startDate) >= currentDate
//     );

//     // Past bookings (completed or past dates)
//     const pastBookings = bookings.filter(booking => 
//       booking.status === 'completed' || 
//       new Date(booking.startDate) < currentDate
//     );

//     res.status(200).json({
//       success: true,
//       data: {
//         user: {
//           id: user._id,
//           name: user.name,
//           mobile: user.mobileNumber,
//           email: user.email
//         },
//         stats: userStats[0] || {
//           totalBookings: 0,
//           totalSpent: 0,
//           activeBookings: 0,
//           completedBookings: 0,
//           cancelledBookings: 0
//         },
//         bookings: {
//           active: activeBookings,
//           past: pastBookings,
//           all: bookings
//         },
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(total / parseInt(limit)),
//           totalItems: total,
//           itemsPerPage: parseInt(limit)
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get user bookings error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // Get all cancelled bookings
// export const getAllCancelledBookings = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 1000,
//       hostelId,
//       startDate,
//       endDate,
//       reason
//     } = req.query;

//     // Build filter for cancelled bookings
//     const filter = { status: 'cancelled' };

//     if (hostelId) filter.hostelId = hostelId;
//     if (reason) filter['cancellationDetails.reason'] = { $regex: reason, $options: 'i' };

//     // Date range for cancellation date
//     if (startDate || endDate) {
//       filter['cancellationDetails.cancelledAt'] = {};
//       if (startDate) filter['cancellationDetails.cancelledAt'].$gte = new Date(startDate);
//       if (endDate) filter['cancellationDetails.cancelledAt'].$lte = new Date(endDate);
//     }

//     // Get cancelled bookings with aggregation for statistics
//     const cancelledBookings = await Booking.find(filter)
//       .populate('userId', 'name mobileNumber email')
//       .populate('hostelId', 'name address')
//       .sort({ 'cancellationDetails.cancelledAt': -1 })
//       .skip((parseInt(page) - 1) * parseInt(limit))
//       .limit(parseInt(limit));

//     const total = await Booking.countDocuments(filter);

//     // Calculate cancellation statistics
//     const cancellationStats = await Booking.aggregate([
//       { $match: { status: 'cancelled' } },
//       {
//         $group: {
//           _id: null,
//           totalCancelled: { $sum: 1 },
//           totalRefundAmount: { $sum: '$totalAmount' },
//           averageCancellationTime: {
//             $avg: {
//               $subtract: [
//                 '$cancellationDetails.cancelledAt',
//                 '$createdAt'
//               ]
//             }
//           }
//         }
//       }
//     ]);

//     // Group cancellations by reason
//     const cancellationsByReason = await Booking.aggregate([
//       { $match: { status: 'cancelled', 'cancellationDetails.reason': { $exists: true } } },
//       {
//         $group: {
//           _id: '$cancellationDetails.reason',
//           count: { $sum: 1 },
//           totalAmount: { $sum: '$totalAmount' }
//         }
//       },
//       { $sort: { count: -1 } }
//     ]);

//     // Group cancellations by date (for chart)
//     const cancellationsByDate = await Booking.aggregate([
//       { $match: { status: 'cancelled' } },
//       {
//         $group: {
//           _id: {
//             $dateToString: {
//               format: '%Y-%m-%d',
//               date: '$cancellationDetails.cancelledAt'
//             }
//           },
//           count: { $sum: 1 },
//           totalAmount: { $sum: '$totalAmount' }
//         }
//       },
//       { $sort: { '_id': -1 } },
//       { $limit: 30 }
//     ]);

//     res.status(200).json({
//       success: true,
//       data: {
//         cancellations: cancelledBookings,
//         statistics: {
//           summary: cancellationStats[0] || {
//             totalCancelled: 0,
//             totalRefundAmount: 0,
//             averageCancellationTime: 0
//           },
//           byReason: cancellationsByReason,
//           byDate: cancellationsByDate
//         }
//       },
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / parseInt(limit)),
//         totalItems: total,
//         itemsPerPage: parseInt(limit)
//       }
//     });

//   } catch (error) {
//     console.error('Get cancelled bookings error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

export const getAllBookings = async (req, res) => {
  try {

    const bookings = await Booking.find()
      .populate("userId", "name mobileNumber")
      .populate("hostelId", "name address")
      .sort({ createdAt: -1 });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found"
      });
    }

    return res.status(200).json({
      success: true,
      totalBookings: bookings.length,
      bookings
    });

  } catch (error) {

    console.error("Get all bookings error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// CHECK AVAILABLE HOSTELS
export const checkAvailableHostels = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      roomType,
      shareType,
      categoryId,
      minPrice,
      maxPrice,
      latitude,
      longitude,
      maxDistance = 10000 // 10km default
    } = req.query;

    // Validate required fields
    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "Start date is required"
      });
    }

    // Parse dates
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date format"
      });
    }

    let parsedEndDate = null;
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date format"
        });
      }

      if (parsedEndDate <= parsedStartDate) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date"
        });
      }
    }

    // Build base filter for hostels
    const hostelFilter = {};

    // Filter by category
    if (categoryId) {
      hostelFilter.categoryId = categoryId;
    }

    // Filter by location if coordinates provided
    if (latitude && longitude) {
      hostelFilter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      };
    }

    // Get all hostels that match basic criteria
    const hostels = await Hostel.find(hostelFilter)
      .populate('categoryId', 'name')
      .lean();

    if (!hostels.length) {
      return res.status(200).json({
        success: true,
        message: "No hostels found",
        data: {
          availableHostels: [],
          totalCount: 0
        }
      });
    }

    // Get all bookings that might conflict
    const bookingFilter = {
      status: { $in: ['confirmed', 'pending'] },
      startDate: { $lte: parsedEndDate || parsedStartDate },
      endDate: { $gte: parsedStartDate }
    };

    // Add roomType filter if specified
    if (roomType) {
      bookingFilter.roomType = roomType;
    }

    // Add shareType filter if specified
    if (shareType) {
      bookingFilter.shareType = shareType;
    }

    const existingBookings = await Booking.find(bookingFilter)
      .select('hostelId roomType shareType startDate endDate')
      .lean();

    // Group bookings by hostel
    const bookingsByHostel = {};
    existingBookings.forEach(booking => {
      if (!bookingsByHostel[booking.hostelId]) {
        bookingsByHostel[booking.hostelId] = [];
      }
      bookingsByHostel[booking.hostelId].push(booking);
    });

    // Check availability for each hostel
    const availableHostels = [];
    const bookedHostels = [];

    hostels.forEach(hostel => {
      const hostelBookings = bookingsByHostel[hostel._id] || [];

      // Check if this specific room/share type is available
      let isAvailable = true;
      let availableShares = [];
      let bookedShares = [];

      // Filter sharings based on room type
      let availableSharings = hostel.sharings;

      // Filter by shareType if specified
      if (shareType) {
        availableSharings = availableSharings.filter(s => s.shareType === shareType);
      }

      // Check each sharing type for availability
      availableSharings.forEach(sharing => {
        const sharingBookings = hostelBookings.filter(b =>
          b.roomType === roomType && b.shareType === sharing.shareType
        );

        // For now, assume each sharing type can have multiple bookings
        // You might want to add a "total rooms" field to your hostel schema
        const isSharingAvailable = sharingBookings.length < 10; // Assuming 10 rooms per type

        if (isSharingAvailable) {
          availableShares.push({
            shareType: sharing.shareType,
            monthlyPrice: roomType === 'AC' ? sharing.acMonthlyPrice : sharing.nonAcMonthlyPrice,
            dailyPrice: roomType === 'AC' ? sharing.acDailyPrice : sharing.nonAcDailyPrice
          });
        } else {
          bookedShares.push(sharing.shareType);
        }
      });

      // Apply price filter if specified
      if (minPrice || maxPrice) {
        const min = parseFloat(minPrice) || 0;
        const max = parseFloat(maxPrice) || Infinity;

        availableShares = availableShares.filter(sharing =>
          sharing.monthlyPrice >= min && sharing.monthlyPrice <= max
        );
      }

      // Prepare hostel data
      const hostelData = {
        id: hostel._id,
        name: hostel.name,
        category: hostel.categoryId,
        address: hostel.address,
        location: hostel.location,
        rating: hostel.rating,
        monthlyAdvance: hostel.monthlyAdvance,
        images: hostel.images.map(img => getImageUrl(req, img)),
        amenities: hostel.amenities || [],
        availableShares: availableShares,
        totalShares: availableShares.length
      };

      if (availableShares.length > 0) {
        availableHostels.push(hostelData);
      } else {
        bookedHostels.push({
          id: hostel._id,
          name: hostel.name,
          message: "All rooms are booked for selected dates",
          bookedShares: bookedShares
        });
      }
    });

    // Calculate distance if location provided
    if (latitude && longitude) {
      availableHostels.forEach(hostel => {
        if (hostel.location && hostel.location.coordinates) {
          const distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            hostel.location.coordinates[1],
            hostel.location.coordinates[0]
          );
          hostel.distance = Math.round(distance * 10) / 10; // Round to 1 decimal
        }
      });

      // Sort by distance
      availableHostels.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // Prepare response
    const response = {
      success: true,
      message: availableHostels.length > 0 ? "Available hostels found" : "No hostels available for selected criteria",
      data: {
        searchCriteria: {
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          roomType: roomType || 'ALL',
          shareType: shareType || 'ALL',
          categoryId: categoryId || 'ALL',
          priceRange: {
            min: minPrice || 'ANY',
            max: maxPrice || 'ANY'
          }
        },
        availableHostels: availableHostels,
        bookedHostels: bookedHostels,
        summary: {
          totalHostels: hostels.length,
          availableCount: availableHostels.length,
          bookedCount: bookedHostels.length
        }
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Error checking available hostels:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};


export const submitBookingForm = async (req, res) => {
  try {

    const { bookingId, roomNo, name, mobileNumber } = req.body;

    if (!bookingId || !roomNo || !name || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const aadharCardImage = req.files?.aadharCardImage?.[0]?.path;
    const panCardImage = req.files?.panCardImage?.[0]?.path;
    const profileImage = req.files?.profileImage?.[0]?.path;

    if (!aadharCardImage || !panCardImage || !profileImage) {
      return res.status(400).json({
        success: false,
        message: "All images are required"
      });
    }

    const formData = new BookingForm({
      bookingId,
      roomNo,
      name,
      mobileNumber,
      aadharCardImage,
      panCardImage,
      profileImage
    });

    await formData.save();

    res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      data: {
        _id: formData._id,
        bookingId: formData.bookingId,
        roomNo: formData.roomNo,
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        aadharCardImage: getImageUrl(req, formData.aadharCardImage),
        panCardImage: getImageUrl(req, formData.panCardImage),
        profileImage: getImageUrl(req, formData.profileImage),
        createdAt: formData.createdAt
      }
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


export const getAllBookingForms = async (req, res) => {
  try {

    const forms = await BookingForm.find()
      .populate({
        path: "bookingId",
        populate: [
          { path: "userId", select: "name mobileNumber" },
          { path: "hostelId", select: "name address" }
        ]
      })
      .sort({ createdAt: -1 });

    const formatted = forms.map(form => ({
      ...form._doc,
      aadharCardImage: getImageUrl(req, form.aadharCardImage.replace(/\\/g, "/")),
      panCardImage: getImageUrl(req, form.panCardImage.replace(/\\/g, "/")),
      profileImage: getImageUrl(req, form.profileImage.replace(/\\/g, "/"))
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


export const getBookingFormById = async (req, res) => {
  try {

    const { id } = req.params;

    const form = await BookingForm.findById(id)
      .populate({
        path: "bookingId",
        populate: [
          { path: "userId", select: "name mobileNumber" },
          { path: "hostelId", select: "name address" }
        ]
      });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    const formatted = {
      ...form._doc,
      aadharCardImage: getImageUrl(req, form.aadharCardImage.replace(/\\/g, "/")),
      panCardImage: getImageUrl(req, form.panCardImage.replace(/\\/g, "/")),
      profileImage: getImageUrl(req, form.profileImage.replace(/\\/g, "/"))
    };

    res.status(200).json({
      success: true,
      data: formatted
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


export const getFormsByUserId = async (req, res) => {
  try {

    const { userId } = req.params;

    const forms = await BookingForm.find()
      .populate({
        path: "bookingId",
        match: { userId },
        populate: [
          { path: "userId", select: "name mobileNumber" },
          { path: "hostelId", select: "name address" }
        ]
      });

    const filteredForms = forms.filter(f => f.bookingId !== null);

    const formatted = filteredForms.map(form => ({
      ...form._doc,
      aadharCardImage: getImageUrl(req, form.aadharCardImage.replace(/\\/g, "/")),
      panCardImage: getImageUrl(req, form.panCardImage.replace(/\\/g, "/")),
      profileImage: getImageUrl(req, form.profileImage.replace(/\\/g, "/"))
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



export const updateBookingFormById = async (req, res) => {
  try {

    const { id } = req.params;
    const { roomNo, name, mobileNumber } = req.body;

    const form = await BookingForm.findById(id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    if (roomNo) form.roomNo = roomNo;
    if (name) form.name = name;
    if (mobileNumber) form.mobileNumber = mobileNumber;

    if (req.files?.aadharCardImage) {
      form.aadharCardImage = req.files.aadharCardImage[0].path;
    }

    if (req.files?.panCardImage) {
      form.panCardImage = req.files.panCardImage[0].path;
    }

    if (req.files?.profileImage) {
      form.profileImage = req.files.profileImage[0].path;
    }

    await form.save();

    res.status(200).json({
      success: true,
      message: "Form updated successfully",
      data: form
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


export const deleteBookingFormById = async (req, res) => {
  try {

    const { id } = req.params;

    const form = await BookingForm.findByIdAndDelete(id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Form deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};