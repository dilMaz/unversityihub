const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("UniNotes API is Running 🚀");
});

// MongoDB Connection
mongoose.connect("mongodb+srv://sewminitheekshana00_db_user:sewmini123@cluster0.bhaclhu.mongodb.net/uninotesDB")
.then(() => {
  console.log("Connected to MongoDB");

  app.listen(5000, () => {
    console.log("Server running on port 5000");
  });
})
.catch((err) => console.log(err));