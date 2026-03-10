import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import mongoose from "mongoose";
import path from "path";
import cors from "cors";
import { fileURLToPath } from 'url';

import authRoutes from "./Routes/authRoutes.js";
import hostelRoutes from "./Routes/adminRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS middleware
app.use(cors());

// Middleware
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log("Body:", req.body);
    next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/Admin", hostelRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

// DB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT, () =>
        console.log(`Server running on port ${process.env.PORT}`)
    );
})
.catch(err => console.log("MongoDB connection error:", err));