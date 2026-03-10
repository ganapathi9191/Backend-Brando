import Hostel from "../Models/Hostel.js";
import Category from "../Models/Category.js";
import Banner from "../Models/Banner.js";

const getImageUrl = (req, path) => {
  return `${req.protocol}://${req.get("host")}/${path}`;
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Category name required" });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(409).json({ success: false, message: "Category already exists" });

    const category = await Category.create({ name });
    return res.status(201).json({ success: true, message: "Category created successfully", category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    return res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategoryById = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Category name required" });

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    return res.status(200).json({ success: true, message: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategoryById = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= HOSTEL CONTROLLERS =============


// CREATE HOSTEL
export const createHostel = async (req, res) => {
  try {
    const {
      categoryId,
      name,
      rating,
      latitude,
      longitude,
      address,
      monthlyAdvance,
      sharings
    } = req.body;

    if (!categoryId || !name || !latitude || !longitude || !address || !monthlyAdvance || !sharings) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    let parsedSharings;
    try {
      parsedSharings = typeof sharings === 'string' ? JSON.parse(sharings) : sharings;
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid sharings format" 
      });
    }

    const images = req.files && req.files.length > 0 
      ? req.files.map(file => `uploads/${file.filename}`) 
      : [];

    const hostel = await Hostel.create({
      categoryId,
      name,
      rating: rating || 0,
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)]
      },
      address,
      monthlyAdvance: Number(monthlyAdvance),
      sharings: parsedSharings,
      images
    });

    const populated = await hostel.populate("categoryId", "name");
    
    const response = {
      ...populated.toObject(),
      images: populated.images.map(img => getImageUrl(req, img))
    };

    res.status(201).json({
      success: true,
      message: "Hostel created successfully",
      hostel: response
    });

  } catch (error) {
    console.error("Error creating hostel:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GET ALL HOSTELS - SIMPLE AND CLEAN
export const getHostels = async (req, res) => {
  try {
    const { categoryId, roomType } = req.query;

    const filter = {};
    if (categoryId) filter.categoryId = categoryId;

    const hostels = await Hostel
      .find(filter)
      .populate("categoryId", "name");

    // Format response based on roomType - NO EXTRA FIELDS
    const formatted = hostels.map(hostel => {
      const hostelObj = hostel.toObject();
      
      // If roomType is specified, show only that type's prices
      if (roomType === 'AC' || roomType === 'NON-AC') {
        return {
          _id: hostelObj._id,
          categoryId: hostelObj.categoryId,
          name: hostelObj.name,
          rating: hostelObj.rating,
          location: hostelObj.location,
          address: hostelObj.address,
          monthlyAdvance: hostelObj.monthlyAdvance,
          images: hostelObj.images.map(img => getImageUrl(req, img)),
          sharings: hostelObj.sharings.map(sharing => ({
            shareType: sharing.shareType,
            monthlyPrice: roomType === 'AC' ? sharing.acMonthlyPrice : sharing.nonAcMonthlyPrice,
            dailyPrice: roomType === 'AC' ? sharing.acDailyPrice : sharing.nonAcDailyPrice
          }))
        };
      }
      
      // If no roomType specified, show all prices
      return {
        ...hostelObj,
        images: hostelObj.images.map(img => getImageUrl(req, img))
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      hostels: formatted
    });

  } catch (error) {
    console.error("Error fetching hostels:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET HOSTEL BY ID - WITH AC/NON-AC PRICE FILTERING
export const getHostelById = async (req, res) => {
  try {
    const { roomType } = req.query; // roomType can be "AC" or "NON-AC"
    
    // Find hostel by ID and populate category
    const hostel = await Hostel
      .findById(req.params.id)
      .populate("categoryId", "name");

    // Check if hostel exists
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found"
      });
    }

    const hostelObj = hostel.toObject();
    
    // Format images with full URLs
    const formattedImages = hostelObj.images.map(img => getImageUrl(req, img));
    
    // CASE 1: If roomType is AC - show only AC prices
    if (roomType === 'AC') {
      const response = {
        _id: hostelObj._id,
        categoryId: hostelObj.categoryId,
        name: hostelObj.name,
        rating: hostelObj.rating,
        location: hostelObj.location,
        address: hostelObj.address,
        monthlyAdvance: hostelObj.monthlyAdvance,
        images: formattedImages,
        roomType: 'AC',
        sharings: hostelObj.sharings.map(sharing => ({
          shareType: sharing.shareType,
          monthlyPrice: sharing.acMonthlyPrice,
          dailyPrice: sharing.acDailyPrice
        }))
      };
      
      return res.status(200).json({
        success: true,
        hostel: response
      });
    }
    
    // CASE 2: If roomType is NON-AC - show only NON-AC prices
    if (roomType === 'NON-AC') {
      const response = {
        _id: hostelObj._id,
        categoryId: hostelObj.categoryId,
        name: hostelObj.name,
        rating: hostelObj.rating,
        location: hostelObj.location,
        address: hostelObj.address,
        monthlyAdvance: hostelObj.monthlyAdvance,
        images: formattedImages,
        roomType: 'NON-AC',
        sharings: hostelObj.sharings.map(sharing => ({
          shareType: sharing.shareType,
          monthlyPrice: sharing.nonAcMonthlyPrice,
          dailyPrice: sharing.nonAcDailyPrice
        }))
      };
      
      return res.status(200).json({
        success: true,
        hostel: response
      });
    }
    
    // CASE 3: If no roomType specified - show all prices
    const response = {
      ...hostelObj,
      images: formattedImages,
      sharings: hostelObj.sharings.map(sharing => ({
        shareType: sharing.shareType,
        acMonthlyPrice: sharing.acMonthlyPrice,
        acDailyPrice: sharing.acDailyPrice,
        nonAcMonthlyPrice: sharing.nonAcMonthlyPrice,
        nonAcDailyPrice: sharing.nonAcDailyPrice
      }))
    };

    res.status(200).json({
      success: true,
      hostel: response
    });

  } catch (error) {
    console.error("Error fetching hostel:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE HOSTEL
export const updateHostelById = async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (req.body.latitude && req.body.longitude) {
      updateData.location = {
        type: "Point",
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)]
      };
    }

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => `uploads/${file.filename}`);
    }

    if (req.body.sharings) {
      try {
        updateData.sharings = typeof req.body.sharings === 'string' 
          ? JSON.parse(req.body.sharings) 
          : req.body.sharings;
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid sharings format" 
        });
      }
    }

    const updated = await Hostel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("categoryId", "name");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found"
      });
    }

    const response = {
      ...updated.toObject(),
      images: updated.images.map(img => getImageUrl(req, img))
    };

    res.status(200).json({
      success: true,
      message: "Hostel updated successfully",
      hostel: response
    });

  } catch (error) {
    console.error("Error updating hostel:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE HOSTEL
export const deleteHostelById = async (req, res) => {
  try {
    const hostel = await Hostel.findByIdAndDelete(req.params.id);

    if (!hostel) {
      return res.status(404).json({ 
        success: false, 
        message: "Hostel not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Hostel deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting hostel:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};



/* CREATE BANNER */

export const createBanner = async (req, res) => {
  try {

    const images = req.files.map(file => `uploads/${file.filename}`);

    const banner = await Banner.create({ images });

    const response = {
      ...banner._doc,
      images: banner.images.map(img => getImageUrl(req, img))
    };

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
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

export const getAllBanners = async (req, res) => {
  try {

    const banners = await Banner.find();

    const formatted = banners.map(banner => ({
      ...banner._doc,
      images: banner.images.map(img => getImageUrl(req, img))
    }));

    res.status(200).json({
      success: true,
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

export const getBannerById = async (req, res) => {
  try {

    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    const response = {
      ...banner._doc,
      images: banner.images.map(img => getImageUrl(req, img))
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

export const updateBannerById = async (req, res) => {
  try {

    const banner = await Banner.findById(req.params.id);

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

    const updated = await Banner.findByIdAndUpdate(
      req.params.id,
      { images },
      { new: true }
    );

    const response = {
      ...updated._doc,
      images: updated.images.map(img => getImageUrl(req, img))
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

export const deleteBannerById = async (req, res) => {
  try {

    const banner = await Banner.findByIdAndDelete(req.params.id);

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