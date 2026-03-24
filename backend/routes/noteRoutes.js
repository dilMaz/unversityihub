const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const multer = require('multer');
const path = require('path');
const fs = require("fs");
const {
  seedNotes,
  searchNotes,
  downloadNote,
  viewNote,
  topNotes,
  recommendNotes,
  createAdminNote,
  createStudentNote,
  getPendingReviewNotes,
  getReviewedNotes,
  approveNote,
  rejectNote,
  getAllCommentsByNoteForAdmin,
  deleteNoteCommentByAdmin,
  getNoteComments,
  addNoteComment,
  generateQuiz,
  downloadQuizPDF,
  getQuizStatus,
} = require("../controllers/noteController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join("uploads", "notes");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF and Word documents are allowed"));
    }

    cb(null, true);
  },
});

// 🌱 Seed (dev only)
router.get("/seed", seedNotes);

// ⭐ Top rated  — MUST be before /:id routes
router.get("/top", topNotes);

// 🤖 Recommend  — MUST be before /:id routes
router.get("/recommend", authMiddleware, recommendNotes);

// 🔍 Search
router.get("/", searchNotes);

// 📤 Admin upload (admin only)
router.post("/admin-upload", authMiddleware, upload.single('noteFile'), (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}, createAdminNote);

// 📤 Student upload (authenticated users)
router.post("/upload", authMiddleware, upload.single('noteFile'), createStudentNote);

// 🧾 Admin moderation routes
router.get("/review/pending", authMiddleware, getPendingReviewNotes);
router.get("/review/history", authMiddleware, getReviewedNotes);
router.put("/:id/approve", authMiddleware, approveNote);
router.put("/:id/reject", authMiddleware, rejectNote);

// 💬 Admin comments management
router.get("/comments/admin/all", authMiddleware, getAllCommentsByNoteForAdmin);
router.delete("/:noteId/comments/:commentId", authMiddleware, deleteNoteCommentByAdmin);

// 📥 Download
router.put("/:id/download", authMiddleware, downloadNote);

// 👀 View online
router.get("/:id/view", authMiddleware, viewNote);

// 💬 Comments
router.get("/:id/comments", authMiddleware, getNoteComments);
router.post("/:id/comments", authMiddleware, addNoteComment);

// 📝 QUIZ ROUTES
// Get quiz status (check if generated)
router.get("/:id/quiz/status", getQuizStatus);

// Generate quiz (AI-powered)
router.post("/:id/quiz/generate", authMiddleware, generateQuiz);

// Download quiz as PDF
router.get("/:id/quiz/download", authMiddleware, downloadQuizPDF);

module.exports = router;

