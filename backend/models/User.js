const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
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