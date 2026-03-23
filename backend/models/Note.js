const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: String,
    subject: String,
    moduleCode: String,
    filePath: {
      type: String,
      required: false, // ✅ මේක වෙනස් කළා
    },
    downloads: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema)