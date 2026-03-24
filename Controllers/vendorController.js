import Booking from '../Models/Booking.js';
import Hostel from '../Models/Hostel.js';
import Vendor from "../Models/Vendor.js";
import jwt from "jsonwebtoken";
import VendorBanner from "../Models/vendorBannerModel.js";
import Notification from "../Models/Notification.js";

// image url helper
const getImageUrl = (req, imgPath) => {
  if (!imgPath) return null;
  return `${req.protocol}://${req.get("host")}/${imgPath}`;
};




// REGISTER VENDOR
export const registerVendor = async (req, res) => {
  try {

    const { name, mobileNumber, email } = req.body;

    const existingVendor = await Vendor.findOne({ mobileNumber });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: "Vendor already registered with this number"
      });
    }

    const vendor = await Vendor.create({
      name,
      mobileNumber,
      email,
      hostelImage: req.file ? req.file.path : null
    });



    res.status(201).json({
      success: true,
      message: "Vendor registered successfully",
      data: {
        id: vendor._id,
        name: vendor.name,
        mobileNumber: vendor.mobileNumber,
        email: vendor.email,
        hostelImage: getImageUrl(req, vendor.hostelImage)
      }
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
};





// LOGIN VENDOR
export const loginVendor = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // ✅ deletedAt: null — excludes soft deleted vendors
    const vendor = await Vendor.findOne({ mobileNumber, deletedAt: null });

    if (!vendor) {
      return res.status(200).json({
        success: true,
        isExists: false,
        message: "Vendor not registered",
      });
    }

    const otp = "1234";
    vendor.otp = otp;
    await vendor.save();

    const token = jwt.sign(
      { id: vendor._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "10m" }
    );

    return res.status(200).json({
      success: true,
      isExists: true,
      message: "OTP sent successfully",
      userId: vendor._id,
      mobileNumber: vendor.mobileNumber,
      token,
      otp, // Remove in production
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// VERIFY OTP
export const verifyVendorOtp = async (req, res) => {
  try {
    const { mobileNumber, token, otp } = req.body;

    if (!mobileNumber || !token || !otp) {
      return res.status(400).json({
        success: false,
        message: "mobileNumber, token, and otp are required",
      });
    }

    // ✅ Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message:
          jwtError.name === "TokenExpiredError"
            ? "OTP expired, please request a new one"
            : "Invalid token",
      });
    }

    // ✅ deletedAt: null — excludes soft deleted vendors
    const vendor = await Vendor.findOne({
      _id: decoded.id,
      mobileNumber,
      deletedAt: null,
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    vendor.otpVerified = true;
    vendor.otp = null;
    await vendor.save();

    const authToken = jwt.sign(
      { id: vendor._id, mobileNumber: vendor.mobileNumber },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      vendorId: vendor._id,
      mobileNumber: vendor.mobileNumber,
      token: authToken,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateVendorProfile = async (req, res) => {
  try {
    const { vendorId } = req.params;

    // FIX: req.body may be undefined if Content-Type header is missing
    const { name, email } = req.body || {};

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // FIX: declare changes array before using it
    const changes = [];

    if (name && name !== vendor.name) {
      vendor.name = name;
      changes.push("name");
    }

    if (email && email !== vendor.email) {
      vendor.email = email;
      changes.push("email");
    }

    if (req.file) {
      vendor.hostelImage = req.file.path;
      changes.push("hostelImage");
    }

    await vendor.save();

    if (changes.length > 0) {
      await createNotification(
        vendor._id,
        "📝 Profile Updated",
        `Your profile has been updated successfully. Changed: ${changes.join(", ")}.`,
        "system",
        vendor._id,
        "Vendor"
      );
    }

    const imageUrl = vendor.hostelImage
      ? `${req.protocol}://${req.get("host")}/${vendor.hostelImage}`
      : null;

    res.json({
      success: true,
      message: "Vendor profile updated successfully",
      data: {
        vendorId: vendor._id,
        name: vendor.name,
        mobileNumber: vendor.mobileNumber,
        email: vendor.email,
        hostelImage: imageUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
export const getVendorProfile = async (req, res) => {
  try {

    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    const imageUrl = vendor.hostelImage
      ? `${req.protocol}://${req.get("host")}/${vendor.hostelImage}`
      : null;

    res.json({
      success: true,
      data: {
        vendorId: vendor._id,
        name: vendor.name,
        mobileNumber: vendor.mobileNumber,
        email: vendor.email,
        hostelImage: imageUrl
      }
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
};

// DELETE VENDOR ACCOUNT BY ID
export const deleteVendorAccount = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required"
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    // Optional: Check if vendor has any active bookings or hostels
    // This depends on your business logic - you might want to prevent deletion
    // if there are active bookings or hostels
    
    const hostels = await Hostel.find({ vendorId });
    const hasActiveBookings = await Booking.exists({ 
      hostelId: { $in: hostels.map(h => h._id) },
      // Add any conditions for active bookings, e.g., future dates
      // startDate: { $gte: new Date() }
    });

    if (hasActiveBookings) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete vendor with active bookings. Please cancel all bookings first."
      });
    }

    // Optional: Delete all related data
    // 1. Delete all hostels belonging to this vendor
    await Hostel.deleteMany({ vendorId });
    
    // 2. Delete all bookings for these hostels
    // Note: You might want to keep booking history instead of deleting
    // await Booking.deleteMany({ hostelId: { $in: hostels.map(h => h._id) } });
    
    // 3. Delete vendor banners (if any)
    await VendorBanner.deleteMany({ vendorId }); // Note: You may need to add vendorId to VendorBanner schema

    // Finally, delete the vendor
    await Vendor.findByIdAndDelete(vendorId);

    res.status(200).json({
      success: true,
      message: "Vendor account and associated data deleted successfully",
      data: {
        vendorId: vendor._id,
        name: vendor.name,
        mobileNumber: vendor.mobileNumber
      }
    });

  } catch (error) {
    console.error("❌ Error deleting vendor account:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/* CREATE BANNER */

export const createVendorBanner = async (req, res) => {
  try {

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Images required"
      });
    }

    const images = req.files.map(file => `uploads/${file.filename}`);

    const banner = await VendorBanner.create({ images });

    const response = {
      _id: banner._id,
      images: banner.images.map(img => getImageUrl(req, img)),
      createdAt: banner.createdAt
    };

    res.status(201).json({
      success: true,
      message: "Vendor banner created successfully",
      banner: response
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


/* GET ALL BANNERS */

export const getAllVendorBanners = async (req, res) => {
  try {

    const banners = await VendorBanner.find().sort("-createdAt");

    const formatted = banners.map(banner => ({
      _id: banner._id,
      images: banner.images.map(img => getImageUrl(req, img)),
      createdAt: banner.createdAt
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      banners: formatted
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


/* GET BANNER BY ID */

export const getVendorBannerById = async (req, res) => {
  try {

    const banner = await VendorBanner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    const response = {
      _id: banner._id,
      images: banner.images.map(img => getImageUrl(req, img)),
      createdAt: banner.createdAt
    };

    res.status(200).json({
      success: true,
      banner: response
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


/* UPDATE BANNER */

export const updateVendorBanner = async (req, res) => {
  try {

    const banner = await VendorBanner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    let images = banner.images;

    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `uploads/${file.filename}`);
    }

    const updated = await VendorBanner.findByIdAndUpdate(
      req.params.id,
      { images },
      { new: true }
    );

    const response = {
      _id: updated._id,
      images: updated.images.map(img => getImageUrl(req, img)),
      updatedAt: updated.updatedAt
    };

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      banner: response
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


/* DELETE BANNER */

export const deleteVendorBanner = async (req, res) => {
  try {

    const banner = await VendorBanner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


export const getBookingsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required"
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    // Step 1: Find all hostels belonging to this vendor
    const hostels = await Hostel.find({ vendorId }).select("_id name");
    
    if (hostels.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No hostels found for this vendor",
        totalBookings: 0,
        bookings: []
      });
    }

    // Get all hostel IDs
    const hostelIds = hostels.map(h => h._id);

    // Step 2: Find all bookings for these hostels
    const bookings = await Booking.find({ 
      hostelId: { $in: hostelIds } 
    })
    .populate("userId", "name mobileNumber email")
    .populate("hostelId", "name address location")
    .sort("-createdAt");

    if (bookings.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No bookings found for this vendor's hostels",
        totalBookings: 0,
        bookings: []
      });
    }

    // Step 3: Format the response
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      user: booking.userId,
      hostel: booking.hostelId,
      bookingType: booking.bookingType,
      shareType: booking.shareType,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.status(200).json({
      success: true,
      totalBookings: formattedBookings.length,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        mobile: vendor.mobile
      },
      hostels: hostels.map(h => ({
        id: h._id,
        name: h.name
      })),
      bookings: formattedBookings
    });

  } catch (error) {
    console.error("❌ Error fetching bookings by vendor:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ------------------------
// CREATE NOTIFICATION (INTERNAL USE)
// Import and call this from bookings, hostel create, etc.
// ------------------------
export const createVendorNotification = async (vendorId, message, type = "info") => {
  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      console.error("❌ Vendor not found:", vendorId);
      return;
    }
 
    vendor.notifications.push({ message, type, read: false });
    await vendor.save();
 
    console.log("✅ Notification saved for vendor:", vendorId);
  } catch (err) {
    console.error("❌ Error creating vendor notification:", err.message);
  }
};
 
// ------------------------
// TEST ENDPOINT
// POST /api/vendors/:vendorId/notifications/test
// Use this in Postman to verify the pipeline works end-to-end
// ------------------------
export const testCreateNotification = async (req, res) => {
  try {
    const { vendorId } = req.params;
 
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
 
    vendor.notifications.push({
      message: "Test notification at " + new Date().toISOString(),
      type: "info",
      read: false
    });
 
    await vendor.save();
 
    res.json({
      success: true,
      message: "Test notification created",
      notifications: vendor.notifications
    });
 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
// ------------------------
// GET ALL NOTIFICATIONS
// GET /api/vendors/:vendorId/notifications
// ------------------------
export const getVendorNotifications = async (req, res) => {
  try {
    const { vendorId } = req.params;
 
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
 
    res.json({
      success: true,
      count: vendor.notifications.length,
      notifications: vendor.notifications
    });
 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
// ------------------------
// MARK ONE AS READ
// PATCH /api/vendors/:vendorId/notifications/:notificationId/read
// ------------------------
export const markVendorNotificationAsRead = async (req, res) => {
  try {
    const { vendorId, notificationId } = req.params;
 
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
 
    const notification = vendor.notifications.id(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
 
    notification.read = true;
    await vendor.save();
 
    res.json({ success: true, message: "Notification marked as read" });
 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
// ------------------------
// MARK ALL AS READ
// PATCH /api/vendors/:vendorId/notifications/read-all
// ------------------------
export const markAllVendorNotificationsAsRead = async (req, res) => {
  try {
    const { vendorId } = req.params;
 
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
 
    vendor.notifications.forEach(n => { n.read = true; });
    await vendor.save();
 
    res.json({ success: true, message: "All notifications marked as read" });
 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
// ------------------------
// CLEAR ALL NOTIFICATIONS
// DELETE /api/vendors/:vendorId/notifications
// ------------------------
export const clearVendorNotifications = async (req, res) => {
  try {
    const { vendorId } = req.params;
 
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
 
    vendor.notifications = [];
    await vendor.save();
 
    res.json({ success: true, message: "All notifications cleared" });
 
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};