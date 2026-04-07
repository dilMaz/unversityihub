const express = require("express");
const router = express.Router();
const {
	register,
	login,
	registerAdmin,
	forgotPassword,
	resetPassword,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/register", register);
router.post("/register-admin", authMiddleware, adminMiddleware, registerAdmin);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;