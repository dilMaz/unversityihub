const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  createAdminVideo,
  getAllAdminVideos,
  deleteAdminVideo,
} = require("../controllers/videoController");

const router = express.Router();

const uploadsDir = path.join("uploads", "videos");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp4";
    const base = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `video-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      "video/mp4",
      "video/x-matroska",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ];

    if (allowedMime.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error("Only video files are allowed"));
  },
});

router.post(
  "/admin/upload",
  authMiddleware,
  adminMiddleware,
  upload.single("videoFile"),
  createAdminVideo
);

router.get("/admin/all", authMiddleware, adminMiddleware, getAllAdminVideos);
router.delete("/admin/:id", authMiddleware, adminMiddleware, deleteAdminVideo);

module.exports = router;
