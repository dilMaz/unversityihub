const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  // Student details shown on the Profile page (optional for backward compatibility)
  itNumber: String,
  specialization: String,
  year: Number,
  semester: Number,
  // Relative path under /uploads, e.g. "profile/avatar-123.png"
  avatar: { type: String, default: "" },
  nic: String,
  email: String,
  phone: String,
  status: {
    type: String,
    enum: ["graduate", "undergraduate"],
    default: "undergraduate"
  },
  password: String,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  downloads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);