require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// imports
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const supportRoutes = require("./routes/supportRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const User = require("./models/User");
const Note = require("./models/Note");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const multer = require("multer");

// uploaded files (support attachments)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// uploaded profile pictures
const avatarUploadsDir = path.join(__dirname, "uploads", "profile");
fs.mkdirSync(avatarUploadsDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const base = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${base}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image uploads are allowed"));
  },
});

// test route
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// auth routes
app.use("/api/auth", authRoutes);

// note routes
app.use("/api/notes", noteRoutes);

// study support (student + admin)
app.use("/api/support", supportRoutes);

// dashboard (protected)
app.get("/api/dashboard", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Dashboard 🔐",
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// profile (protected)
app.get("/api/profile/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      userId: user._id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      itNumber: user.itNumber || "",
      specialization: user.specialization || "",
      year: user.year,
      semester: user.semester,
      avatar: user.avatar || "",
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// profile avatar upload (protected)
app.patch(
  "/api/profile/me/avatar",
  authMiddleware,
  avatarUpload.single("avatar"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!req.file) {
        return res.status(400).json({ message: "Avatar file is required" });
      }

      // Relative path used by frontend: /uploads/<avatar>
      user.avatar = `profile/${req.file.filename}`;
      await user.save();

      res.json({
        userId: user._id,
        avatar: user.avatar || "",
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// profile update (protected)
app.patch("/api/profile/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const {
      name,
      email,
      itNumber,
      phone,
      specialization,
      year,
      semester,
      password,
    } = req.body;

    // Only validate email when user is changing it
    if (email !== undefined && email !== user.email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    if (name !== undefined) user.name = String(name);
    if (itNumber !== undefined) user.itNumber = String(itNumber);
    if (phone !== undefined) user.phone = String(phone);
    if (specialization !== undefined) user.specialization = String(specialization);

    if (year !== undefined && year !== "" && year !== null) user.year = Number(year);
    if (semester !== undefined && semester !== "" && semester !== null) user.semester = Number(semester);

    if (password !== undefined && password !== "") {
      user.password = await bcrypt.hash(String(password), 10);
    }

    await user.save();

    res.json({
      userId: user._id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      itNumber: user.itNumber || "",
      specialization: user.specialization || "",
      year: user.year,
      semester: user.semester,
      avatar: user.avatar || "",
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// admin users (protected)
app.get("/api/admin/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, "_id name email role").sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// admin delete user (protected)
app.delete("/api/admin/users/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DB connect + server start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected ✅");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
    });
  })
  .catch((err) => console.log(err));