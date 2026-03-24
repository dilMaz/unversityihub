const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    moduleCode: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "Lecture Notes",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    uploadSource: {
      type: String,
      enum: ["admin", "student"],
      default: "student",
    },
    academicYear: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
      default: 1,
    },
    semester: {
      type: Number,
      enum: [1, 2],
      required: true,
      default: 1,
    },
    filePath: {
      type: String,
      required: false,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    reviewedAt: {
      type: Date,
      required: false,
    },
    reviewComment: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
    // 📚 Quiz Generation Fields
    quizStatus: {
      type: String,
      enum: ["pending", "generating", "completed", "failed"],
      default: "pending",
    },
    quiz: {
      questions: [
        {
          id: Number,
          type: {
            type: String,
            enum: ["mcq", "short_answer"],
          },
          question: String,
          options: [String], // For MCQ only
          correctAnswer: String,
          explanation: String,
        },
      ],
      generatedAt: Date,
      generatedBy: String, // Store which AI generated it
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema)