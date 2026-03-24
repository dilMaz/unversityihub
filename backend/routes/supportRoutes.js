const express = require("express");
const supportController = require("../controllers/supportController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all routes with auth middleware
router.use(authMiddleware);

// Admin routes (must come before :id routes to avoid conflicts)
router.get("/admin/all", supportController.getAllTickets);
router.get("/admin/stats", supportController.getTicketStats);

// Student routes to create tickets
router.post("/", supportController.createTicket);

// Get user's own tickets
router.get("/my-tickets", supportController.getMyTickets);

// Specific ticket operations (/:id routes at the end)
router.get("/:id", supportController.getTicket);
router.put("/:id", supportController.updateTicket);
router.post("/:id/reply", supportController.addReply);
router.post("/:id/close", supportController.closeTicket);
router.delete("/:id", supportController.deleteTicket);

module.exports = router;
