import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import mongoose from "mongoose";
import authRoutes from "./Routes/authRoutes.js";
import hostelRoutes from "./Routes/adminRoutes.js";

const app = express();
app.use(express.json());

console.log("JWT_SECRET:", process.env.JWT_SECRET);

app.use("/api/auth", authRoutes);
app.use("/api/hostel", hostelRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => console.log(err));