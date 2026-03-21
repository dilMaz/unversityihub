const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  seedNotes,
  searchNotes,
  downloadNote,
  topNotes,
  recommendNotes,
  createAdminNote,
} = require("../controllers/noteController");

// 🌱 Seed (dev only)
router.get("/seed", seedNotes);

// ⭐ Top rated  — MUST be before /:id routes
router.get("/top", topNotes);

// 🤖 Recommend  — MUST be before /:id routes
router.get("/recommend", authMiddleware, recommendNotes);

// 🔍 Search
router.get("/", searchNotes);

// 📤 Admin upload (admin only)
router.post("/admin-upload", authMiddleware, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}, createAdminNote);

// 📥 Download
router.put("/:id/download", downloadNote);

module.exports = router;

