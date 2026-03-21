const router         = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  seedNotes,
  searchNotes,
  downloadNote,
  topNotes,
  recommendNotes,
} = require("../controllers/noteController");

// 🌱 Seed (dev only)
router.get("/seed", seedNotes);

// ⭐ Top rated  — MUST be before /:id routes
router.get("/top", topNotes);

// 🤖 Recommend  — MUST be before /:id routes
router.get("/recommend", authMiddleware, recommendNotes);

// 🔍 Search
router.get("/", searchNotes);

// 📥 Download
router.put("/:id/download", downloadNote);

module.exports = router;