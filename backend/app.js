require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// imports
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const Note = require("./models/Note");
const User = require("./models/User");

// ================= TEST =================
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// ================= AUTH =================
app.use("/api/auth", authRoutes);

// ================= DASHBOARD =================
app.get("/api/dashboard", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      message: "Dashboard 🔐",
      userId: user._id,
      name: user.name, // 🔥 ADD THIS
      email: user.email,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= SEED =================
app.get("/api/notes/seed", async (req, res) => {
  await Note.deleteMany();

  const notes = await Note.insertMany([
    { title: "Java Notes", subject: "Programming", downloads: 0 },
    { title: "DB Notes", subject: "Database", downloads: 0 },
  ]);

  res.json(notes);
});

// ================= SEARCH =================
app.get("/api/notes", async (req, res) => {
  const keyword = req.query.search || "";

  const notes = await Note.find({
    $or: [
      { title: { $regex: keyword, $options: "i" } },
      { subject: { $regex: keyword, $options: "i" } },
    ],
  });

  res.json(notes);
});

// ================= DOWNLOAD =================
app.put("/api/notes/:id/download", async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) return res.status(404).json({ message: "Note not found" });

  note.downloads += 1;
  await note.save();

  // 🔥 OPTIONAL: save to user history
  const user = await User.findById(req.user?.id);
  if (user) {
    user.downloads.push(note._id);
    await user.save();
  }

  res.json({ downloads: note.downloads });
});

// ================= TOP RATED =================
app.get("/api/notes/top", async (req, res) => {
  try {
    const notes = await Note.find().sort({ downloads: -1 }).limit(5);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= 🤖 RECOMMENDATION =================
app.get("/api/notes/recommend", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("downloads");

    // ❌ no history
    if (!user || !user.downloads || user.downloads.length === 0) {
      return res.json([]);
    }

    // 🔥 last downloaded note
    const lastNote = user.downloads[user.downloads.length - 1];

    // 🔥 find similar subject notes
    const recommended = await Note.find({
      subject: lastNote.subject,
      _id: { $ne: lastNote._id },
    }).limit(5);

    res.json(recommended);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= DB CONNECT =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected ✅");
    app.listen(process.env.PORT, () =>
      console.log("Server running 🚀")
    );
  })
  .catch((err) => console.log(err));