const Note = require("../models/Note");
const User = require("../models/User");

// SEED
exports.seedNotes = async (req, res) => {
  try {
    await Note.deleteMany();

    const notes = await Note.insertMany([
      { title: "Java Programming Basics", moduleCode: "IT101", subject: "Programming" },
      { title: "Advanced Java", moduleCode: "IT201", subject: "Programming" },
      { title: "Database Fundamentals", moduleCode: "DB101", subject: "Database" },
      { title: "SQL Advanced", moduleCode: "DB201", subject: "Database" },
      { title: "HTML Basics", moduleCode: "WD101", subject: "Web" },
      { title: "CSS Design", moduleCode: "WD102", subject: "Web" },
      { title: "JavaScript Intro", moduleCode: "JS101", subject: "Programming" },
      { title: "React Guide", moduleCode: "JS201", subject: "Programming" },
      { title: "Networking Basics", moduleCode: "NW101", subject: "Networking" },
      { title: "Cloud Computing", moduleCode: "CL101", subject: "Cloud" },
    ]);

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SEARCH
exports.searchNotes = async (req, res) => {
  try {
    const keyword = req.query.search || "";

    const notes = await Note.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { moduleCode: { $regex: keyword, $options: "i" } },
        { subject: { $regex: keyword, $options: "i" } },
      ],
    });

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DOWNLOAD
exports.downloadNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) return res.status(404).json({ message: "Note not found" });

    note.downloads += 1;
    await note.save();

    res.json({ downloads: note.downloads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// TOP NOTES
exports.topNotes = async (req, res) => {
  try {
    const notes = await Note.find().sort({ downloads: -1 }).limit(5);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// RECOMMEND NOTES
exports.recommendNotes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("downloads");

    if (!user || user.downloads.length === 0) {
      return res.json([]);
    }

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