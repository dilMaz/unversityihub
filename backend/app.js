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
const Note = require("./models/Note");

const ensureAdmin = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Admin only" });
    return false;
  }
  return true;
};

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
    const csvLines = ["Month,New Users,New Notes,New Comments"];

    payload.monthly.forEach((row) => {
      csvLines.push(`${row.monthLabel},${row.users},${row.notes},${row.comments}`);
    });

    const now = new Date();
    const fileName = `admin-monthly-analytics-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(csvLines.join("\n"));
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

