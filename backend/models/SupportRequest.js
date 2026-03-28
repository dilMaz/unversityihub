const mongoose = require("mongoose");

const CATEGORIES = [
  "Account issue",
  "Wrong note / low quality note",
  "Upload problem",
  "Download problem",
  "Report fake user",
  "Technical bug",
  "Other academic support",
];

const supportRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    /** Relative path under /uploads, e.g. support/abc.png */
    attachment: { type: String, default: "" },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved"],
      default: "pending",
    },
    adminReply: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportRequest", supportRequestSchema);
module.exports.CATEGORIES = CATEGORIES;
