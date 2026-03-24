require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// multer
const multer = require('multer');

// routes
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const User = require("./models/User");

const ensureAdmin = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Admin only" });
    return false;
  }
  return true;
};

// test
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// auth
app.use("/api/auth", authRoutes);

// notes
app.use("/api/notes", noteRoutes);

// dashboard
app.get("/api/dashboard", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

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

// ================= ADMIN USERS =================
app.get("/api/admin/users", authMiddleware, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const users = await User.find({}, "_id name email nic phone status role").sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/admin/users/:id", authMiddleware, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { name, email, nic, phone, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if ((user.role || "").toLowerCase() !== "admin") {
      return res.status(400).json({ message: "Only admin details can be edited here" });
    }

    if (email && email !== user.email) {
      const duplicateEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (duplicateEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    if (status && !["graduate", "undergraduate"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (typeof name === "string") user.name = name.trim();
    if (typeof email === "string") user.email = email.trim();
    if (typeof nic === "string") user.nic = nic.trim();
    if (typeof phone === "string") user.phone = phone.trim();
    if (typeof status === "string") user.status = status;

    await user.save();

    res.json({
      message: "Admin details updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        nic: user.nic,
        phone: user.phone,
        status: user.status,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/admin/users/:id", authMiddleware, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// centralized API error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File is too large. Maximum size is 50MB." });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err) {
    return res.status(400).json({ message: err.message || "Request failed" });
  }

  next();
});

// DB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected ✅");
    const port = Number(process.env.PORT) || 5000;
    const server = app.listen(port, () =>
      console.log("Server running 🚀")
    );

    server.on("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        console.log(`Port ${port} is already in use. Backend is likely already running.`);
        return;
      }

      console.error("Server startup error:", err);
      process.exit(1);
    });
  })
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

