import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";

const app = express();

// ✅ Tightened CORS — restrict to your frontend origin in production
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "2mb" })); // ✅ limit body size (rich text can be large)
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => res.json({ message: "NoteCraft API running ✅" })); // ✅ return JSON not plain text

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

// ✅ Global 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

export default app;