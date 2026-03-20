const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: String,
  subject: String,

  downloads: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Note", noteSchema);