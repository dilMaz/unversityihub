const Note = require("../models/Note");
const User = require("../models/User");

// seed
exports.seedNotes = async (req, res) => {
  await Note.deleteMany();

  const notes = await Note.insertMany([
    { title: "Java Notes", subject: "Programming", downloads: 0 },
    { title: "DB Notes", subject: "Database", downloads: 0 },
  ]);

  res.json(notes);
};

// search
exports.searchNotes = async (req, res) => {
  const keyword = req.query.search || "";

  const notes = await Note.find({
    $or: [
      { title: { $regex: keyword, $options: "i" } },
      { subject: { $regex: keyword, $options: "i" } },
    ],
  });

  res.json(notes);
};

// download
exports.downloadNote = async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) return res.status(404).json({ message: "Note not found" });

  note.downloads += 1;
  await note.save();

  const user = await User.findById(req.user?.id);
  if (user) {
    user.downloads.push(note._id);
    await user.save();
  }

  res.json({ downloads: note.downloads });
};

// top rated
exports.topNotes = async (req, res) => {
  const notes = await Note.find().sort({ downloads: -1 }).limit(5);
  res.json(notes);
};

// recommendation

// 📤 Admin create note
exports.createAdminNote = async (req, res) => {
  try {
    const { title, subject } = req.body;
    const filePath = req.file ? req.file.path : null;

    if (!title || !subject || !filePath) {
      return res.status(400).json({ message: "Title, subject, and file required" });
    }

    const note = new Note({
      title,
      subject,
      filePath,
    });

    await note.save();

    res.status(201).json({ message: "Note uploaded successfully", note });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const { getRecommendations } = require("../utils/recommendationEngine");

// 🤖 RECOMMEND
exports.recommendNotes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("downloads");

    const data = await getRecommendations(user);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
