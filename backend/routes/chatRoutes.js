const express = require("express");
const router = express.Router();
const {
  getModuleChat,
  sendMessage,
  editMessage,
  deleteMessage
} = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Get chat messages for a module
router.get("/:moduleCode", getModuleChat);

// Send a new message to a module chat
router.post("/:moduleCode", sendMessage);

// Edit a message
router.put("/message/:messageId", editMessage);

// Delete a message
router.delete("/message/:messageId", deleteMessage);

module.exports = router;