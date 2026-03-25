const path = require("path");
const fs = require("fs");
const SupportRequest = require("../models/SupportRequest");
const { CATEGORIES } = require("../models/SupportRequest");

const uploadsDir = path.join(__dirname, "..", "uploads", "support");

function ensureUploadsDir() {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

exports.create = async (req, res) => {
  try {
    console.log('🔍 Support request received:', req.body);
    console.log('👤 User ID from token:', req.user.id);
    
    const { title, category, description, priority } = req.body;

    if (!title || !category || !description) {
      console.log('❌ Missing required fields');
      return res
        .status(400)
        .json({ message: "Title, category, and description are required" });
    }

    if (!CATEGORIES.includes(category)) {
      console.log('❌ Invalid category:', category);
      return res.status(400).json({ message: "Invalid category" });
    }

    const allowedPriority = ["low", "medium", "high"];
    const p = (priority || "medium").toLowerCase();
    if (!allowedPriority.includes(p)) {
      console.log('❌ Invalid priority:', p);
      return res.status(400).json({ message: "Invalid priority" });
    }

    let attachment = "";
    if (req.file) {
      attachment = path.join("support", req.file.filename).replace(/\\/g, "/");
    }

    console.log('📝 Creating support request...');
    const doc = await SupportRequest.create({
      title: title.trim(),
      category,
      description: description.trim(),
      priority: p,
      attachment,
      student: req.user.id,
    });

    console.log('✅ Support request created:', doc._id);
    res.status(201).json(doc);
  } catch (err) {
    console.error('❌ Support request creation error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.listMine = async (req, res) => {
  try {
    const list = await SupportRequest.find({ student: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listAllAdmin = async (req, res) => {
  try {
    const list = await SupportRequest.find()
      .populate("student", "name email _id")
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply, status } = req.body;

    const allowed = ["pending", "in_progress", "resolved"];
    const update = {};
    if (adminReply !== undefined) update.adminReply = String(adminReply);
    if (status !== undefined) {
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      update.status = status;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const doc = await SupportRequest.findByIdAndUpdate(id, update, {
      new: true,
    }).populate("student", "name email _id");

    if (!doc) return res.status(404).json({ message: "Request not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.ensureUploadsDir = ensureUploadsDir;
exports.uploadsDir = uploadsDir;
