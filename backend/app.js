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

// test
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// auth
app.use("/api/auth", authRoutes);

// dashboard
app.get("/api/dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Dashboard 🔐", userId: req.user.id });
});

// seed
app.get("/api/notes/seed", async (req, res) => {
  await Note.deleteMany();

  const notes = await Note.insertMany([
    { title: "Java Notes", subject: "Programming" },
    { title: "DB Notes", subject: "Database" },
  ]);

  res.json(notes);
});

// search
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

// download
app.put("/api/notes/:id/download", async (req, res) => {
  const note = await Note.findById(req.params.id);

  note.downloads += 1;
  await note.save();

  res.json({ downloads: note.downloads });
});
// ⭐ TOP RATED NOTES
app.get("/api/notes/top", async (req, res) => {
  try {
    const notes = await Note.find().sort({ downloads: -1 }).limit(5);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// DB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected ✅");
    app.listen(process.env.PORT, () =>
      console.log("Server running 🚀")
    );
  })
  .catch((err) => console.log(err));