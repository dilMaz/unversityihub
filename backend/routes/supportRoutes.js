const express = require("express");
const supportController = require("../controllers/supportController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all routes with auth middleware
router.use(authMiddleware);

// Student routes
router.post("/", supportController.createTicket);
router.get("/my-tickets", supportController.getMyTickets);
router.get("/:id", supportController.getTicket);
router.post("/:id/reply", supportController.addReply);

// Admin routes
router.get("/admin/all", supportController.getAllTickets);
router.put("/:id", supportController.updateTicket);
router.post("/:id/close", supportController.closeTicket);
router.get("/admin/stats", supportController.getTicketStats);

module.exports = router;
