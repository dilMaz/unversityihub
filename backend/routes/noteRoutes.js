const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const multer = require('multer');
const path = require('path');
const {
  seedNotes,
  searchNotes,
  downloadNote,
  topNotes,
  recommendNotes,
  createAdminNote,
} = require("../controllers/noteController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/notes/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

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

// 📥 Download
router.put("/:id/download", authMiddleware, downloadNote);

module.exports = router;

