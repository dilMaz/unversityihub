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
exports.recommendNotes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("downloads");

    if (!user.downloads.length) return res.json([]);

    const lastNote = user.downloads[user.downloads.length - 1];

    const recommended = await Note.find({
      subject: lastNote.subject,
      _id: { $ne: lastNote._id },
    }).limit(5);

    res.json(recommended);
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