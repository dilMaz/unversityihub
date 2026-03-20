const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= ROUTES IMPORT =================
const authRoutes = require("./routes/authRoutes");

// ================= ROUTES =================

// Test Route
app.get("/", (req, res) => {
  res.send("UniNotes API is Running 🚀");
});

// DB Test Route
app.get("/test-db", (req, res) => {
  res.json({ message: "DB Connected & API Working ✅" });
});

// 🔥 CONNECT AUTH ROUTES (VERY IMPORTANT)
app.use("/api/auth", authRoutes);

// ================= DATABASE CONNECTION =================

const MONGO_URI =
  "mongodb+srv://admin:Admin12345@cluster0.8hw8g7o.mongodb.net/uni_hub?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    app.listen(5000, () => {
      console.log("🚀 Server running on port 5000");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
  });