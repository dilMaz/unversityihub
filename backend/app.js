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
  const user = await User.findById(req.user.id);

  res.json({
    name: user.name,
    email: user.email,
  });
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