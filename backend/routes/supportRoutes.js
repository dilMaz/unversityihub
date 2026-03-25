const express = require("express");
const path = require("path");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const supportController = require("../controllers/supportController");

const router = express.Router();

supportController.ensureUploadsDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, supportController.uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, base + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

router.post(
  "/",
  authMiddleware,
  upload.single("attachment"),
  supportController.create
);

router.get("/my", authMiddleware, supportController.listMine);

router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  supportController.listAllAdmin
);

router.patch(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  supportController.updateAdmin
);

module.exports = router;
