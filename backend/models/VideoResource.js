const mongoose = require("mongoose");

const VIDEO_CATEGORIES = ["Lecture Video", "Paper Discussion", "Kuppi"];

const videoResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
      enum: VIDEO_CATEGORIES,
    },
    academicYear: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },
    semester: {
      type: Number,
      required: true,
      enum: [1, 2],
    },
    moduleCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    moduleName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    videoPath: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VideoResource", videoResourceSchema);
module.exports.VIDEO_CATEGORIES = VIDEO_CATEGORIES;
