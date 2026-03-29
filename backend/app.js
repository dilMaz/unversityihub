require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PDFDocument = require("pdfkit");

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
const supportRoutes = require("./routes/supportRoutes");
const videoRoutes = require("./routes/videoRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const User = require("./models/User");
const Note = require("./models/Note");
const bcrypt = require("bcryptjs");
const fs = require("fs");

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

const ensureAdmin = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Admin only" });
    return false;
  }
  return true;
};

const isValidSriLankanNic = (nic) => /^(?:\d{12}|\d{9}V)$/i.test((nic || "").trim());
const isValidPhoneStartingZero = (phone) => /^0\d{9}$/.test(String(phone || "").replace(/[\s\-()]/g, ""));

const monthKey = (year, month) => `${year}-${String(month).padStart(2, "0")}`;

const buildMonthSlots = (monthCount = 6) => {
  const now = new Date();
  const slots = [];

  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    slots.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      key: monthKey(date.getFullYear(), date.getMonth() + 1),
      label: date.toLocaleString("en-US", { month: "short", year: "numeric" }),
    });
  }

  return slots;
};

const mapAggByMonth = (rows = []) => {
  const map = new Map();
  rows.forEach((row) => {
    const key = monthKey(row?._id?.year, row?._id?.month);
    map.set(key, row?.count || 0);
  });
  return map;
};

const getAnalyticsPayload = async (monthCount = 6) => {
  const monthSlots = buildMonthSlots(monthCount);
  const startDate = new Date(monthSlots[0].year, monthSlots[0].month - 1, 1);

  const [
    totalUsers,
    totalAdmins,
    totalNotes,
    commentsCountRows,
    downloadsRows,
    usersMonthlyRows,
    notesMonthlyRows,
    commentsMonthlyRows,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "admin" }),
    Note.countDocuments(),
    Note.aggregate([
      { $unwind: "$comments" },
      { $count: "total" },
    ]),
    Note.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$downloads", 0] } },
        },
      },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Note.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    Note.aggregate([
      { $unwind: "$comments" },
      { $match: { "comments.createdAt": { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: "$comments.createdAt" },
            month: { $month: "$comments.createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const usersMap = mapAggByMonth(usersMonthlyRows);
  const notesMap = mapAggByMonth(notesMonthlyRows);
  const commentsMap = mapAggByMonth(commentsMonthlyRows);

  const monthly = monthSlots.map((slot) => ({
    monthKey: slot.key,
    monthLabel: slot.label,
    users: usersMap.get(slot.key) || 0,
    notes: notesMap.get(slot.key) || 0,
    comments: commentsMap.get(slot.key) || 0,
  }));

  return {
    summary: {
      totalUsers,
      totalAdmins,
      totalStudents: Math.max(totalUsers - totalAdmins, 0),
      totalNotes,
      totalComments: commentsCountRows[0]?.total || 0,
      totalDownloads: downloadsRows[0]?.total || 0,
    },
    monthly,
  };
};

// test
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// auth
app.use("/api/auth", authRoutes);

// notes
app.use("/api/notes", noteRoutes);

// study support (student + admin)
app.use("/api/support", supportRoutes);

// admin videos
app.use("/api/videos", videoRoutes);

// dashboard (protected)
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
      nic: user.nic || "",
      status: user.status || "undergraduate",
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
      nic,
      phone,
      status,
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

    if ((user.role || "").toLowerCase() === "admin") {
      if (phone !== undefined && !isValidPhoneStartingZero(phone)) {
        return res.status(400).json({ message: "Phone must start with 0 and have exactly 10 numbers" });
      }

      if (nic !== undefined) {
        const normalizedNic = String(nic).trim().toUpperCase();
        if (!isValidSriLankanNic(normalizedNic)) {
          return res.status(400).json({ message: "NIC must be 12 digits or 9 digits followed by V" });
        }
        user.nic = normalizedNic;
      }

      if (status !== undefined) {
        if (!["graduate", "undergraduate"].includes(String(status))) {
          return res.status(400).json({ message: "Invalid status" });
        }
        user.status = String(status);
      }
    }

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
      nic: user.nic || "",
      status: user.status || "undergraduate",
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

    if (typeof nic === "string") {
      const nicValue = nic.trim();
      if (nicValue && !isValidSriLankanNic(nicValue)) {
        return res.status(400).json({
          message: "NIC must be 12 digits or 9 digits followed by V",
        });
      }
    }

    if (typeof name === "string") user.name = name.trim();
    if (typeof email === "string") user.email = email.trim();
    if (typeof nic === "string") user.nic = nic.trim().toUpperCase();
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

    if (String(req.user?.id) === String(req.params.id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted", deletedUserId: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= ADMIN ANALYTICS =================
app.get("/api/admin/analytics/summary", authMiddleware, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const payload = await getAnalyticsPayload(6);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/admin/analytics/monthly/download", authMiddleware, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const payload = await getAnalyticsPayload(12);
    const now = new Date();
    const fileName = `admin-monthly-analytics-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`;
    const websiteName = process.env.WEBSITE_NAME || "UniHub";
    const websiteUrl = process.env.WEBSITE_URL || "http://localhost:3000";
    const supportEmail = process.env.WEBSITE_SUPPORT_EMAIL || "support@unihub.local";
    const generatedBy = req.user?.id ? `Admin (${req.user.id})` : "Admin";
    const reportPeriod = payload.monthly?.length
      ? `${payload.monthly[0].monthLabel} - ${payload.monthly[payload.monthly.length - 1].monthLabel}`
      : "N/A";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    doc.save();
    doc.roundedRect(40, 40, 515, 66, 10).fill("#1a237e");
    doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold").text(`${websiteName} Analytics`, 58, 58);
    doc.fontSize(11).font("Helvetica").fillColor("#d8e4ff").text("Monthly Admin Report", 58, 80);
    doc.restore();

    doc.moveDown(4.6);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#222").text("Website Details", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").fillColor("#444").text(`Website: ${websiteName}`);
    doc.text(`URL: ${websiteUrl}`);
    doc.text(`Support: ${supportEmail}`);
    doc.text(`Report Period: ${reportPeriod}`);
    doc.text(`Generated By: ${generatedBy}`);
    doc.text(`Generated On: ${now.toLocaleString()}`);

    doc.fillColor("#000");

    doc.moveDown(1);
    doc.fontSize(14).font("Helvetica-Bold").text("Website Summary");
    doc.moveDown(0.4);
    doc.fontSize(11).font("Helvetica").text(`Total Users: ${payload.summary.totalUsers}`);
    doc.text(`Total Admins: ${payload.summary.totalAdmins}`);
    doc.text(`Total Students: ${payload.summary.totalStudents}`);
    doc.text(`Total Notes: ${payload.summary.totalNotes}`);
    doc.text(`Total Comments: ${payload.summary.totalComments}`);
    doc.text(`Total Downloads: ${payload.summary.totalDownloads}`);

    doc.moveDown(1);
    doc.fontSize(14).text("Monthly Trend (Last 12 Months)");
    doc.moveDown(0.5);

    const startX = 40;
    let y = doc.y;

    doc.fontSize(10).fillColor("#111");
    doc.text("Month", startX, y, { width: 140 });
    doc.text("New Users", startX + 150, y, { width: 100, align: "right" });
    doc.text("New Notes", startX + 260, y, { width: 100, align: "right" });
    doc.text("New Comments", startX + 370, y, { width: 110, align: "right" });
    y += 18;

    doc.moveTo(startX, y - 4).lineTo(555, y - 4).strokeColor("#ddd").stroke();

    payload.monthly.forEach((row) => {
      if (y > 760) {
        doc.addPage();
        y = 50;
      }

      doc.fillColor("#000").fontSize(10);
      doc.text(row.monthLabel, startX, y, { width: 140 });
      doc.text(String(row.users || 0), startX + 150, y, { width: 100, align: "right" });
      doc.text(String(row.notes || 0), startX + 260, y, { width: 100, align: "right" });
      doc.text(String(row.comments || 0), startX + 370, y, { width: 110, align: "right" });
      y += 16;
    });

    doc.end();
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

