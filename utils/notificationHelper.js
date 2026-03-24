import Notification from "../Models/Notification.js";
import Vendor from "../Models/Vendor.js";

export const createNotification = async (
  vendorId,
  title,
  message,
  type = "system",
  relatedId = null,
  relatedModel = null
) => {
  try {
    if (!vendorId) {
      console.error("❌ No vendorId provided");
      return null;
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      console.error("❌ Vendor not found with ID:", vendorId);
      return null;
    }

    // Only set relatedModel if relatedId is also provided
    const notificationData = {
      vendorId,
      title,
      message,
      type,
      ...(relatedId && relatedModel
        ? { relatedId, relatedModel }
        : {}),
    };

    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error.message);
    return null;
  }
};