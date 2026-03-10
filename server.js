import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from 'url';
import authRoutes from "./Routes/authRoutes.js";
import hostelRoutes from "./Routes/adminRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Use absolute path for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());

console.log("JWT_SECRET:", process.env.JWT_SECRET);

app.use("/api/auth", authRoutes);
app.use("/api/Admin", hostelRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => console.log(err));