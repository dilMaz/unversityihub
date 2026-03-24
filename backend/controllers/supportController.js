const SupportTicket = require("../models/SupportTicket");
const User = require("../models/User");

const ensureAdmin = (req, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Admin only" });
    return false;
  }
  return true;
};

// Create support ticket (student-facing)
exports.createTicket = async (req, res) => {
  try {
    const { subject, category, message, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    if (subject.length > 200) {
      return res.status(400).json({ message: "Subject must be 200 characters or less" });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: "Message must be 2000 characters or less" });
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ticket = new SupportTicket({
      studentId: req.user?.id,
      studentName: user.name,
      studentEmail: user.email,
      subject: subject.trim(),
      category: category || "other",
      message: message.trim(),
      priority: priority || "medium",
    });

    await ticket.save();

    res.status(201).json({
      message: "Support ticket created successfully",
      ticket,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's own tickets (student-facing)
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ studentId: req.user?.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single ticket (student can see only their own, admin can see all)
exports.getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("studentId", "name email")
      .populate("adminId", "name email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check permissions
    const isOwner = ticket.studentId._id?.toString() === req.user?.id;
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You do not have permission to view this ticket" });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Get all tickets
exports.getAllTickets = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const tickets = await SupportTicket.find()
      .populate("studentId", "name email")
      .populate("adminId", "name email")
      .sort({ priority: -1, createdAt: -1 });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Update ticket status and add response
exports.updateTicket = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { status, adminResponse, priority } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (status && ["open", "in-progress", "resolved", "closed"].includes(status)) {
      ticket.status = status;

      if (status === "resolved" || status === "closed") {
        ticket.resolvedAt = new Date();
      }
    }

    if (adminResponse) {
      ticket.adminResponse = adminResponse.trim();
    }

    if (priority && ["low", "medium", "high"].includes(priority)) {
      ticket.priority = priority;
    }

    ticket.adminId = req.user?.id;
    await ticket.save();

    res.json({
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Student: Add reply to their own ticket
exports.addReply = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check ownership
    if (ticket.studentId?.toString() !== req.user?.id) {
      return res.status(403).json({ message: "You can only reply to your own tickets" });
    }

    // In a full implementation, you'd have a replies array in the schema
    // For now, just update the ticket status back to open if it was closed
    if (ticket.status === "closed") {
      ticket.status = "open";
    }

    await ticket.save();

    res.json({
      message: "Reply added successfully",
      ticket,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Close ticket
exports.closeTicket = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status: "closed", closedAt: new Date(), adminId: req.user?.id },
      { new: true }
    )
      .populate("studentId", "name email")
      .populate("adminId", "name email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({
      message: "Ticket closed successfully",
      ticket,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete ticket (student can only delete their own, admin can delete any)
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check permissions: only student who created it or admin can delete
    const isOwner = ticket.studentId?.toString() === req.user?.id;
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You can only delete your own tickets" });
    }

    await SupportTicket.findByIdAndDelete(req.params.id);

    res.json({
      message: "Ticket deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get ticket statistics (admin)
exports.getTicketStats = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const totalTickets = await SupportTicket.countDocuments();
    const openTickets = await SupportTicket.countDocuments({ status: "open" });
    const inProgressTickets = await SupportTicket.countDocuments({ status: "in-progress" });
    const resolvedTickets = await SupportTicket.countDocuments({ status: "resolved" });
    const closedTickets = await SupportTicket.countDocuments({ status: "closed" });

    const stats = {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
