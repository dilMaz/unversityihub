require("dotenv").config();

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
const authMiddleware = require("./middleware/authMiddleware");
const User = require("./models/User");

// test route
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// auth routes
app.use("/api/auth", authRoutes);

// note routes
app.use("/api/notes", noteRoutes);

// dashboard (protected)
app.get("/api/dashboard", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      email: user.email,
    });
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