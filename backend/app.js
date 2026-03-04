const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("UniNotes API is Running 🚀");
});

// 🔥 LOGIN ROUTE
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  console.log("Login Request:", email, password);

  res.json({
    message: "Login Successful",
    token: "dummy-token-123"
  });
});

// 🔥 REGISTER ROUTE
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  console.log("Register Request:", name, email);

  res.json({
    message: "Register Successful"
  });
});

// MongoDB Connection
mongoose.connect("mongodb+srv://admin:iPTXvEiynbCydYHa@cluster0.bhaclhu.mongodb.net/uninotesDB")
.then(() => {
  console.log("Connected to MongoDB");

  app.listen(5000, () => {
    console.log("Server running on port 5000");
  });
})
.catch((err) => console.log(err));