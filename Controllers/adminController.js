import Hostel from "../Models/Hostel.js";

// Create Hostel
export const createHostel = async (req, res) => {
  try {
    const { name, category, rating, latitude, longitude, address, sharings } = req.body;

    // Validate category
    if (!["mens pg", "womens pg", "coliving pg"].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }
    
    const imagePaths = req.files.map(file => file.path);

    const hostel = await Hostel.create({
      name,
      category,
      rating,
      location: {
        latitude,
        longitude
      },
      address,
      sharings: JSON.parse(sharings),
      images: imagePaths
    });

    res.status(201).json({
      success: true,
      message: "Hostel created successfully",
      hostel
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};