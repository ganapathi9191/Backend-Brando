import Booking from '../Models/Booking.js';
import Hostel from '../Models/Hostel.js';
import Vendor from "../Models/Vendor.js";
import jwt from "jsonwebtoken";
import VendorBanner from "../Models/vendorBannerModel.js";

// image url helper
const getImageUrl = (req, imgPath) => {
  if (!imgPath) return null;
  return `${req.protocol}://${req.get("host")}/${imgPath}`;
};


// Helper function to create vendor notifications
export const createVendorNotification = async (vendorId, title, message, type = "info", metadata = {}) => {
  try {
    if (!vendorId) return null;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return null;

    const notification = {
      title,
      message,
      type,
      read: false,
      metadata,
      createdAt: new Date()
    };

    vendor.notifications.push(notification);
    await vendor.save();
    
    return vendor.notifications[vendor.notifications.length - 1];
  } catch (err) {
    console.error("Error creating vendor notification:", err);
    return null;
  }
};

/**
 * GET ALL NOTIFICATIONS FOR A VENDOR
 * GET /api/vendor/:vendorId/notifications
 */

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

      // Add notification for profile update
    if (changes.length > 0) {
      await addVendorNotification(
        vendor._id,
        `Your profile has been updated: ${changes.join(", ")} was successfully changed.`,
        'info'
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

    // Check for new bookings and create notifications
    // This could be done based on last checked time, but for simplicity, we'll check recent bookings
    const recentBookings = bookings.filter(booking => {
      const hoursSinceCreation = (Date.now() - new Date(booking.createdAt)) / (1000 * 60 * 60);
      return hoursSinceCreation < 24; // Notify about bookings from last 24 hours
    });

    // Create notifications for recent bookings (avoid duplicates)
    for (const booking of recentBookings) {
      // Check if notification already exists for this booking
      const notificationExists = vendor.notifications.some(n => 
        n.message.includes(booking.bookingReference) && 
        new Date(n.createdAt) > new Date(booking.createdAt).getTime() - 60000
      );
      
      if (!notificationExists) {
        const hostel = hostels.find(h => h._id.toString() === booking.hostelId.toString());
        await createVendorNotification(
          vendorId,
          `📅 New booking #${booking.bookingReference || booking._id} from ${booking.userId?.name || 'Guest'} for ${hostel?.name || 'hostel'}`
        );
      }
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
        mobile: vendor.mobileNumber
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



/**
 * GET ALL NOTIFICATIONS FOR A VENDOR
 * GET /api/vendor/:vendorId/notifications
 */
export const getVendorNotifications = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 500000, type, read } = req.query;

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    let notifications = [...vendor.notifications];
    
    // Filter by type
    if (type && type !== 'all') {
      notifications = notifications.filter(n => n.type === type);
    }
    
    // Filter by read status
    if (read !== undefined) {
      const isRead = read === 'true';
      notifications = notifications.filter(n => n.read === isRead);
    }
    
    // Sort by newest first
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const total = notifications.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedNotifications = notifications.slice(startIndex, endIndex);
    
    // Calculate stats
    const unreadCount = vendor.notifications.filter(n => !n.read).length;
    const totalCount = vendor.notifications.length;
    
    res.status(200).json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        stats: {
          total: totalCount,
          unread: unreadCount,
          read: totalCount - unreadCount
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error("Error getting vendor notifications:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * MARK NOTIFICATION AS READ
 * PUT /api/vendor/:vendorId/notifications/:notificationId/read
 */
export const markNotificationRead = async (req, res) => {
  try {
    const { vendorId, notificationId } = req.params;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }
    
    // Find notification by _id
    const notification = vendor.notifications.id(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    
    notification.read = true;
    await vendor.save();
    
    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification
    });
    
  } catch (error) {
    console.error("Error marking notification read:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * MARK ALL NOTIFICATIONS AS READ
 * PUT /api/vendor/:vendorId/notifications/read-all
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }
    
    // Mark all unread notifications as read
    let updatedCount = 0;
    vendor.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        updatedCount++;
      }
    });
    
    await vendor.save();
    
    res.status(200).json({
      success: true,
      message: `${updatedCount} notifications marked as read`,
      updatedCount
    });
    
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE SINGLE NOTIFICATION
 * DELETE /api/vendor/:vendorId/notifications/:notificationId
 */
export const deleteVendorNotification = async (req, res) => {
  try {
    const { vendorId, notificationId } = req.params;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }
    
    // Find and remove notification
    const notification = vendor.notifications.id(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    
    notification.deleteOne();
    await vendor.save();
    
    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE MULTIPLE NOTIFICATIONS (BULK DELETE)
 * DELETE /api/vendor/:vendorId/notifications/bulk-delete
 * Body: { notificationIds: ["id1", "id2", ...] }
 */
export const bulkDeleteVendorNotifications = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "notificationIds array is required"
      });
    }
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }
    
    // Remove specified notifications
    let deletedCount = 0;
    notificationIds.forEach(id => {
      const notification = vendor.notifications.id(id);
      if (notification) {
        notification.deleteOne();
        deletedCount++;
      }
    });
    
    await vendor.save();
    
    res.status(200).json({
      success: true,
      message: `${deletedCount} notifications deleted successfully`,
      deletedCount,
      totalRequested: notificationIds.length
    });
    
  } catch (error) {
    console.error("Error bulk deleting notifications:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



/**
 * GET UNREAD NOTIFICATIONS COUNT
 * GET /api/vendor/:vendorId/notifications/unread-count
 */
export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }
    
    const unreadCount = vendor.notifications.filter(n => !n.read).length;
    
    res.status(200).json({
      success: true,
      unreadCount,
      totalCount: vendor.notifications.length
    });
    
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
