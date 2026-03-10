import express from "express";
import {
    adminLogin,
    createCategory, getCategories,
    getCategoryById,
    updateCategoryById,
    deleteCategoryById,
    createHostel,
    getHostels,
    getHostelById,
    updateHostelById,
    deleteHostelById,
    createBanner,
    getAllBanners,
    getBannerById,
    updateBannerById,
    deleteBannerById
} from "../Controllers/adminController.js";
import upload from "../Config/multer.js";
const router = express.Router();

router.post("/login", adminLogin);


router.post("/createCategory", createCategory);
router.get("/getallCategories", getCategories);
router.get("/getCategory/:id", getCategoryById);
router.put("/updateCategory/:id", updateCategoryById);
router.delete("/deleteCategory/:id", deleteCategoryById);



router.post("/createHostel", upload.array("images", 10), createHostel);
router.get("/getallHostels", getHostels);
router.get("/getHostelById/:id", getHostelById);
router.put("/updateHostel/:id", upload.array("images", 10), updateHostelById);
router.delete("/deleteHostel/:id", deleteHostelById);



router.post("/createBanner", upload.array("images", 10), createBanner);
router.get("/getAllBanners", getAllBanners);
router.get("/getBannerById/:id", getBannerById);
router.put("/updateBannerById/:id", upload.array("images", 10), updateBannerById);
router.delete("/deleteBannerById/:id", deleteBannerById);




export default router;