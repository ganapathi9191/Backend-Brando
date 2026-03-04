import express from "express";
import { createHostel } from "../Controllers/adminController.js";
import upload from "../Config/multer.js";

const router = express.Router();

router.post("/create", upload.array("images", 5), createHostel);

export default router;