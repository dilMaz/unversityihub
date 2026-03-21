const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: String,
    subject: String,
    filePath: {
      type: String,
      required: true
    },
    downloads: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);