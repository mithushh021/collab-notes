import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";

// ❌ REMOVED: console.log("Loaded MONGO_URI:") — NEVER log secrets, even locally

const PORT = process.env.PORT || 5000;

// ✅ Validate required env vars before starting
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("❌ Missing required environment variables: MONGO_URI, JWT_SECRET");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // ✅ exit cleanly on DB failure
  });

// ✅ Handle unhandled promise rejections globally
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  process.exit(1);
});