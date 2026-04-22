const ModuleChat = require("../models/ModuleChat");
const User = require("../models/User");

// Get all messages for a module
const getModuleChat = async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const messages = await ModuleChat.find({ moduleCode })
      .populate("user", "name avatar")
      .sort({ createdAt: 1 })
      .limit(200); // Limit to last 200 messages
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a new message
const sendMessage = async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: "Message is too long (max 2000 characters)" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newMessage = new ModuleChat({
      moduleCode,
      user: userId,
      userName: user.name,
      userAvatar: user.avatar,
      message: message.trim()
    });

    await newMessage.save();
    
    // Return populated message
    const populatedMessage = await ModuleChat.findById(newMessage._id)
      .populate("user", "name avatar");
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit a message (only sender can edit)
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: "Message is too long (max 2000 characters)" });
    }

    const existingMessage = await ModuleChat.findById(messageId);
    
    if (!existingMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if the user is the sender
    if (existingMessage.user.toString() !== userId) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    existingMessage.message = message.trim();
    existingMessage.isEdited = true;
    existingMessage.updatedAt = Date.now();
    
    await existingMessage.save();
    
    const populatedMessage = await ModuleChat.findById(messageId)
      .populate("user", "name avatar");
    
    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a message (only sender can delete)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const existingMessage = await ModuleChat.findById(messageId);
    
    if (!existingMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if the user is the sender
    if (existingMessage.user.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await ModuleChat.findByIdAndDelete(messageId);
    
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getModuleChat,
  sendMessage,
  editMessage,
  deleteMessage
};