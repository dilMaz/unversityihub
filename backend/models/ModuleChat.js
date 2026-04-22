const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  moduleCode: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: ""
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying by module code
chatMessageSchema.index({ moduleCode: 1, createdAt: -1 });

// Update timestamp on save
chatMessageSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("ModuleChat", chatMessageSchema);