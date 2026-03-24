import express from "express";
import {
  adminLogin,
  createCategory, getCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
  createHostel,
  getAllHostels,
  getHostelsByVendorId,
  getHostelsByAdminId,
  getHostelById,
  updateHostelById,
  deleteHostelById,
  createBanner,
  getAllBanners,
  getBannerById,
  updateBannerById,
  deleteBannerById,
  // Form  ✅
  serveFormPage,   // GET  /form/:hostelId  — serves HTML when QR is scanned
  submitForm,      // POST /admin/submit-form — saves FormUser to DB

  // QR (optional standalone endpoint)
  generateQRCode,
  getQRCodeImage,
  getQRCodeForHostel,
  getHostelQRCodeImage,
  showQRCodePage,
  getAllFormSubmissions,
  getFormSubmissionsByHostel,
} from "../Controllers/adminController.js";
import upload from "../Config/multer.js";
const router = express.Router();

const formUpload = upload.fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'idCard', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 }
]);

router.post("/login", adminLogin);


router.post("/createCategory", createCategory);
router.get("/getallCategories", getCategories);
router.get("/getCategory/:id", getCategoryById);
router.put("/updateCategory/:id", updateCategoryById);
router.delete("/deleteCategory/:id", deleteCategoryById);



router.post("/createHostel", upload.array("images", 10), createHostel);
router.get("/hostels", getAllHostels);
router.get("/hostel/:id", getHostelById);
router.get("/hostels/vendor/:vendorId", getHostelsByVendorId);
router.get("/hostels/admin/:adminId", getHostelsByAdminId);

router.put("/hostel/:id", upload.array("images", 10), updateHostelById);
router.delete("/hostel/:id", deleteHostelById);


router.post("/createBanner", upload.array("images", 10), createBanner);
router.get("/getAllBanners", getAllBanners);
router.get("/getBannerById/:id", getBannerById);
router.put("/updateBannerById/:id", upload.array("images", 10), updateBannerById);
router.delete("/deleteBannerById/:id", deleteBannerById);


// ✅ When user scans QR → GET /form/:hostelId → shows registration form HTML
router.get("/form/:hostelId", serveFormPage);

// ✅ Form submission from the QR form page
router.post("/submit-form", formUpload, submitForm);

// ─── QR Code standalone (optional) ────────────────────────────────────────
router.post("/generate-qr", generateQRCode);
router.get("/hostel/:hostelId/qrcode", getQRCodeImage);
// Add this route to your adminRoutes.js
router.get("/hostel/:hostelId/qrcode", getQRCodeForHostel);

// QR Code routes
router.get("/hostel/:hostelId/qrcode-image", getHostelQRCodeImage);  // Returns PNG image


router.get("/hostel/:hostelId/qr", showQRCodePage);                  // Shows nice HTML page with QR

// Form submission routes
router.get("/submissions", getAllFormSubmissions);  // Get all form submissions
router.get("/submissions/hostel/:hostelId", getFormSubmissionsByHostel);  // Get submissions by hostel

export default router;