require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const User = require("./models/User");

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
    const users = await User.find({}, "_id name email role").sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

// ================= SEED =================
app.get("/api/notes/seed", async (req, res) => {
  const Note = require("./models/Note");
  await Note.deleteMany();

  const notes = await Note.insertMany([
    { title: "Java Notes", subject: "Programming", downloads: 0 },
    { title: "DB Notes", subject: "Database", downloads: 0 },
  ]);

  res.json(notes);
});

// ================= SEARCH =================
app.get("/api/notes", async (req, res) => {
  const Note = require("./models/Note");
  const keyword = req.query.search || "";

  const notes = await Note.find({
    $or: [
      { title: { $regex: keyword, $options: "i" } },
      { subject: { $regex: keyword, $options: "i" } },
    ],
  });
  res.json(notes);
});

// DB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected ✅");
    app.listen(process.env.PORT, () =>
      console.log("Server running 🚀")
    );
  })
  .catch((err) => console.log(err));
